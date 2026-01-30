'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { FolderTree, Loader2, ArrowLeft } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import { useCategories } from '@/hooks';
import { useMapPersistence } from '@/components/providers';
import { Spinner, toast } from '@/components/ui';
import type { UpdateCategoryDto } from '@/types';

const ICONS = ['🍽️', '☕', '🏖️', '🏔️', '🏛️', '🎭', '🎬', '🛍️', '💼', '🏥', '🏫', '⛪', '🏨', '✈️', '🚗', '🚇', '🏠', '🌳', '🌊', '⭐'];
const COLORS = [
    '#0d9488', '#14b8a6', '#10b981', '#22c55e', '#84cc16',
    '#eab308', '#f59e0b', '#f97316', '#ef4444', '#dc2626',
    '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1',
    '#3b82f6', '#0ea5e9', '#06b6d4', '#6b7280', '#374151',
];

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { categories, fetchCategories, updateCategory } = useCategories();
    const { fetchCategories: refreshMapCategories } = useMapPersistence();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<UpdateCategoryDto>({
        name: '',
        icon: '📍',
        iconColor: '#0d9488',
        parentId: undefined,
    });

    useEffect(() => {
        const loadCategory = async () => {
            try {
                const category = await categoriesApi.getById(id);
                setFormData({
                    name: category.name,
                    icon: category.icon || '📍',
                    iconColor: category.iconColor || '#0d9488',
                    parentId: category.parentId || undefined,
                });
            } catch {
                toast.error('Không tìm thấy danh mục');
                router.push('/categories');
            } finally {
                setIsLoading(false);
            }
        };
        loadCategory();
        fetchCategories();
    }, [id, router, fetchCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateCategory(id, formData);
            await refreshMapCategories(); // Sync global map state
            toast.success('Đã cập nhật danh mục!');
            router.push('/categories');
        } catch {
            toast.error('Không thể cập nhật danh mục');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6 pb-24">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Sửa danh mục</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ví dụ: Ẩm thực"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm sm:text-base"
                    />
                </div>

                {/* Parent Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục cha (tùy chọn)
                    </label>
                    <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value || undefined }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none appearance-none text-sm sm:text-base"
                    >
                        <option value="">Không có (danh mục gốc)</option>
                        {categories.filter(c => !c.parentId && c.id !== id).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Icon Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
                        {ICONS.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-base sm:text-lg rounded-lg transition-all ${formData.icon === icon
                                    ? 'bg-white shadow-md scale-110'
                                    : 'hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, iconColor: color }))}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all ${formData.iconColor === color
                                    ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                    : 'hover:scale-105'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Xem trước</label>
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                            style={{
                                backgroundColor: `${formData.iconColor}20`,
                                color: formData.iconColor,
                            }}
                        >
                            {formData.icon || <FolderTree className="w-6 h-6" />}
                        </div>
                        <span className="font-medium text-gray-900">
                            {formData.name || 'Tên danh mục'}
                        </span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang lưu...
                        </>
                    ) : (
                        'Lưu thay đổi'
                    )}
                </button>
            </form>
        </div>
    );
}
