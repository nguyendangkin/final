'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { FolderTree, Plus, Pencil, Trash2, ChevronDown, ChevronUp, MapPin, ExternalLink } from 'lucide-react';
import { useCategories, useLocations } from '@/hooks';
import { useMapPersistence } from '@/components/providers';
import { Spinner, toast } from '@/components/ui';
import type { Category, Location } from '@/types';

function CategoriesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { tree, isLoading, fetchTree, fetchCounts, deleteCategory, getCount } = useCategories();
    const { locations, fetchLocations, isLoading: locationsLoading } = useLocations();
    const { fetchCategories: refreshMapCategories } = useMapPersistence();

    // Initialize from URL params
    const [expandedCategory, setExpandedCategory] = useState<string | null>(searchParams.get('expanded'));

    useEffect(() => {
        fetchTree();
        fetchCounts();
    }, [fetchTree, fetchCounts]);

    // Fetch locations when category is expanded
    useEffect(() => {
        if (expandedCategory) {
            void fetchLocations({ categoryId: expandedCategory });
        }
    }, [expandedCategory, fetchLocations]);

    // Compute categoryLocations from locations (derived state, no useEffect needed)
    const categoryLocations = useMemo(() => {
        if (expandedCategory) {
            return locations.filter(loc => loc.categoryId === expandedCategory);
        }
        return [];
    }, [locations, expandedCategory]);

    const handleDelete = async (e: React.MouseEvent, category: Category) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Xóa danh mục "${category.name}"?`)) return;

        try {
            await deleteCategory(category.id);
            await refreshMapCategories(); // Sync global map state
            toast.success('Đã xóa danh mục');
            fetchTree();
        } catch {
            toast.error('Không thể xóa danh mục');
        }
    };

    const handleCategoryClick = (categoryId: string) => {
        const newExpanded = expandedCategory === categoryId ? null : categoryId;
        setExpandedCategory(newExpanded);

        // Sync to URL
        const params = new URLSearchParams(searchParams.toString());
        if (newExpanded) {
            params.set('expanded', newExpanded);
        } else {
            params.delete('expanded');
        }
        const newURL = params.toString() ? `?${params.toString()}` : '/categories';
        router.replace(newURL, { scroll: false });
    };

    const renderLocationItem = (location: Location) => (
        <Link
            key={location.id}
            href={`/locations/${location.id}?from=categories`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors group"
        >
            <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{location.name}</p>
                {location.note && (
                    <p className="text-xs text-gray-500 truncate">{location.note}</p>
                )}
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
    );

    const renderCategory = (category: Category, level = 0) => {
        const isExpanded = expandedCategory === category.id;
        const locationCount = getCount(category.id);
        const hasLocations = locationCount > 0;

        return (
            <div key={category.id}>
                <div
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer ${level > 0 ? 'ml-4 sm:ml-6' : ''}`}
                    onClick={() => hasLocations && handleCategoryClick(category.id)}
                >
                    {/* Icon */}
                    <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg flex-shrink-0"
                        style={{
                            backgroundColor: `${category.iconColor || '#0d9488'}20`,
                            color: category.iconColor || '#0d9488',
                        }}
                    >
                        {category.icon || <FolderTree className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{category.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {locationCount} địa điểm
                        </p>
                    </div>

                    {/* Expand indicator */}
                    {hasLocations && (
                        <div className="text-gray-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link
                            href={`/categories/${category.id}/edit`}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Sửa"
                        >
                            <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={(e) => handleDelete(e, category)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Expanded Locations */}
                {isExpanded && (
                    <div className={`bg-gray-50 rounded-xl mr-2 sm:mr-3 mb-2 overflow-hidden ${level > 0 ? 'ml-4 sm:ml-6' : ''}`}>
                        {locationsLoading ? (
                            <div className="flex justify-center py-4">
                                <Spinner size="sm" />
                            </div>
                        ) : categoryLocations.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {categoryLocations.map(renderLocationItem)}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Không có địa điểm</p>
                        )}
                    </div>
                )}

                {/* Children */}
                {category.children && category.children.length > 0 && (
                    <div className="relative ml-3 sm:ml-5 pl-0.5">
                        {/* Vertical line - adjusted to fit children only */}
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-gray-100 rounded-full" />
                        {category.children.map((child) => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
                <Link
                    href="/categories/new"
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tạo mới
                </Link>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : tree.length === 0 ? (
                <div className="text-center py-12">
                    <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có danh mục nào</p>
                    <Link href="/categories/new" className="text-teal-600 font-medium mt-2 inline-block">
                        Tạo danh mục đầu tiên →
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {tree.map((cat) => renderCategory(cat))}
                </div>
            )}
        </div>
    );
}

export default function CategoriesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
            <CategoriesContent />
        </Suspense>
    );
}
