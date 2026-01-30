'use client';

import { useEffect, useState, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, Heart, Globe, Lock, Search, ChevronRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useLocations, useCategories } from '@/hooks';
import { Spinner, toast } from '@/components/ui';
import type { Location, Category } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const PAGE_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

function LocationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { locations, isLoading, hasMore, fetchLocations, togglePublic } = useLocations();
    const { categories, fetchCategories } = useCategories();

    // Initialize state from URL params
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(searchParams.get('locationId'));
    const [expandedParent, setExpandedParent] = useState<string | null>(searchParams.get('expanded'));
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Sync state changes to URL
    const updateURL = useCallback((updates: { category?: string | null; expanded?: string | null; locationId?: string | null; search?: string | null }) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        const newURL = params.toString() ? `?${params.toString()}` : '/locations';
        router.replace(newURL, { scroll: false });
    }, [searchParams, router]);

    // Debounce search input for server-side filtering
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Sync debounced search to URL (separate effect to avoid loop)
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        if (debouncedSearch !== currentSearch) {
            const params = new URLSearchParams(searchParams.toString());
            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            } else {
                params.delete('search');
            }
            const newURL = params.toString() ? `?${params.toString()}` : '/locations';
            router.replace(newURL, { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]); // Only trigger on debouncedSearch change

    // Compute parent categories (those without parentId)
    const parentCategories = useMemo(() =>
        categories.filter(cat => !cat.parentId),
        [categories]
    );

    // Get children for a specific parent
    const getChildren = useMemo(() => {
        const childrenMap = new Map<string, Category[]>();
        categories.forEach(cat => {
            if (cat.parentId) {
                const existing = childrenMap.get(cat.parentId) || [];
                childrenMap.set(cat.parentId, [...existing, cat]);
            }
        });
        return (parentId: string) => childrenMap.get(parentId) || [];
    }, [categories]);

    // Get locations directly attached to a parent category (from current loaded data for badge display)
    const getParentLocations = useMemo(() => {
        return (parentId: string) => locations.filter(loc => loc.categoryId === parentId);
    }, [locations]);

    // Initial fetch
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Fetch locations with server-side filtering (category + search)
    // Always fetch by expandedParent to keep all parent+child locations for badge display
    useEffect(() => {
        const loadLocations = async () => {
            const filters: { page: number; limit: number; categoryId?: string; search?: string } = {
                page,
                limit: PAGE_LIMIT,
            };

            // Server-side filter: use expandedParent to get all parent+child locations
            // This keeps location badges visible when selecting child category
            if (expandedParent) {
                filters.categoryId = expandedParent;
            } else if (selectedCategory) {
                // When no expanded parent, filter directly by selected category
                filters.categoryId = selectedCategory;
            }

            // Add search for server-side filtering
            if (debouncedSearch.trim()) {
                filters.search = debouncedSearch.trim();
            }

            if (page === 1) {
                // Only show full loading spinner on first page/filter change
                setIsInitialLoad(true);
                await fetchLocations(filters);
                setIsInitialLoad(false);
            } else {
                // For pagination, only show small loading indicator (no scroll jump)
                setIsLoadingMore(true);
                await fetchLocations(filters);
                setIsLoadingMore(false);
            }
        };
        loadLocations();
    }, [page, selectedCategory, expandedParent, debouncedSearch, fetchLocations]);

    // Reset page when filters change (category, search, or expanded parent)
    useEffect(() => {
        setPage(1);
    }, [selectedCategory, expandedParent, debouncedSearch]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !isInitialLoad) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoading, isLoadingMore, isInitialLoad]);

    // Client-side filtering for child category selection within expanded parent
    // Server returns all parent+child locations, we filter by selectedCategory for list display
    const displayedLocations = useMemo(() => {
        let result = locations;

        // Filter by selectedCategory (child category within expanded parent)
        if (selectedCategory && expandedParent) {
            result = result.filter(loc => loc.categoryId === selectedCategory);
        }

        // Filter by specific location selection
        if (selectedLocationId) {
            result = result.filter(loc => loc.id === selectedLocationId);
        }

        return result;
    }, [locations, selectedCategory, expandedParent, selectedLocationId]);

    const handleTogglePublic = async (e: React.MouseEvent, location: Location) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await togglePublic(location.id);
            toast.success(location.isPublic ? 'Đã ẩn địa điểm' : 'Đã công khai địa điểm');
        } catch {
            toast.error('Không thể thay đổi trạng thái');
        }
    };

    const handleParentClick = (cat: Category) => {
        const children = getChildren(cat.id);
        const parentLocs = getParentLocations(cat.id);
        if (children.length > 0 || parentLocs.length > 0) {
            // Has children or direct locations: toggle expand
            if (expandedParent === cat.id) {
                setExpandedParent(null);
                updateURL({ expanded: null, category: null, locationId: null });
            } else {
                setExpandedParent(cat.id);
                setSelectedCategory(null);
                setSelectedLocationId(null);
                updateURL({ expanded: cat.id, category: null, locationId: null });
            }
        } else {
            // No children: filter directly
            const newCategory = selectedCategory === cat.id ? null : cat.id;
            setSelectedCategory(newCategory);
            setExpandedParent(null);
            setSelectedLocationId(null);
            updateURL({ category: newCategory, expanded: null, locationId: null });
        }
    };

    const handleChildClick = (cat: Category) => {
        const newCategory = selectedCategory === cat.id ? null : cat.id;
        setSelectedCategory(newCategory);
        setSelectedLocationId(null);
        updateURL({ category: newCategory, locationId: null });
    };

    const handleLocationBadgeClick = (loc: Location) => {
        const newLocationId = selectedLocationId === loc.id ? null : loc.id;
        setSelectedLocationId(newLocationId);
        setSelectedCategory(null);
        updateURL({ locationId: newLocationId, category: null });
    };

    const handleAllClick = () => {
        setSelectedCategory(null);
        setExpandedParent(null);
        setSelectedLocationId(null);
        setSearchQuery('');
        updateURL({ category: null, expanded: null, locationId: null, search: null });
    };

    const expandedChildren = expandedParent ? getChildren(expandedParent) : [];
    const expandedLocations = expandedParent ? getParentLocations(expandedParent) : [];

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm địa điểm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Category Filter - Parent Badges */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={handleAllClick}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory && !expandedParent
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    Tất cả
                </button>
                {parentCategories.map((cat) => {
                    const hasChildren = getChildren(cat.id).length > 0;
                    const hasDirectLocations = getParentLocations(cat.id).length > 0;
                    const isExpandable = hasChildren || hasDirectLocations;
                    const isExpanded = expandedParent === cat.id;
                    const isSelected = selectedCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleParentClick(cat)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 border ${isSelected || isExpanded
                                ? 'text-white border-transparent'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            style={{
                                backgroundColor: isSelected || isExpanded ? (cat.iconColor || '#0d9488') : undefined,
                            }}
                        >
                            {cat.icon && <span>{cat.icon}</span>}
                            {cat.name}
                            {isExpandable && (
                                isExpanded
                                    ? <ChevronUp className="w-4 h-4" />
                                    : <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Child Badges + Location Badges (when parent is expanded) */}
            {(expandedChildren.length > 0 || expandedLocations.length > 0) && (
                <div className="flex gap-2 overflow-x-auto pb-4 mt-2 scrollbar-hide">
                    {/* Child Category Badges */}
                    {expandedChildren.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleChildClick(cat)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isSelected
                                    ? 'text-white border-transparent'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                style={{
                                    backgroundColor: isSelected ? (cat.iconColor || '#0d9488') : undefined,
                                }}
                            >
                                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                                {cat.name}
                            </button>
                        );
                    })}
                    {/* Location Badges */}
                    {expandedLocations.map((loc) => {
                        const isSelected = selectedLocationId === loc.id;
                        return (
                            <button
                                key={loc.id}
                                onClick={() => handleLocationBadgeClick(loc)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${isSelected
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100 border border-amber-200'
                                    }`}
                            >
                                <MapPin className="w-3 h-3" />
                                {loc.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Location List */}
            {isInitialLoad && isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : displayedLocations.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có địa điểm nào</p>
                    <Link href="/locations/new" className="text-teal-600 font-medium mt-2 inline-block">
                        Tạo địa điểm đầu tiên →
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {displayedLocations.map((loc) => (
                            <Link
                                key={loc.id}
                                href={`/locations/${loc.id}`}
                                className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="flex h-24 sm:h-28">
                                    {loc.image && (
                                        <Image
                                            src={`${API_URL}${loc.image}`}
                                            alt={loc.name}
                                            width={128}
                                            height={112}
                                            className="w-20 sm:w-32 h-24 sm:h-28 object-cover flex-shrink-0 block"
                                        />
                                    )}
                                    <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-center relative min-w-0">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 pr-8 sm:pr-10 text-sm sm:text-base truncate">{loc.name}</h3>
                                            {loc.category && (
                                                <span
                                                    className="inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full mt-1"
                                                    style={{
                                                        backgroundColor: `${loc.category.iconColor}20`,
                                                        color: loc.category.iconColor || '#0d9488',
                                                    }}
                                                >
                                                    {loc.category.icon}{' '}
                                                    {loc.category.parent
                                                        ? `${loc.category.parent.name} › ${loc.category.name}`
                                                        : loc.category.name}
                                                </span>
                                            )}
                                            {loc.note && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{loc.note}</p>
                                            )}
                                            {loc.likeCount !== undefined && loc.likeCount > 0 && (
                                                <span className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                                                    <Heart className="w-3 h-3" /> {loc.likeCount}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => handleTogglePublic(e, loc)}
                                            className={`absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-lg transition-colors ${loc.isPublic
                                                ? 'bg-teal-50 text-teal-600'
                                                : 'bg-gray-50 text-gray-400'
                                                }`}
                                            title={loc.isPublic ? 'Công khai' : 'Riêng tư'}
                                        >
                                            {loc.isPublic ? (
                                                <Globe className="w-4 h-4" />
                                            ) : (
                                                <Lock className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center pr-3">
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} className="py-4 flex justify-center">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Đang tải thêm...</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default function LocationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
            <LocationsContent />
        </Suspense>
    );
}
