'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Upload, Loader2 } from 'lucide-react';
import { useLocations, useCategories, useGeolocation } from '@/hooks';
import { useMapPersistence } from '@/components/providers';
import { toast } from '@/components/ui';
import type { CreateLocationDto } from '@/types';

export default function NewLocationPage() {
    const router = useRouter();
    const { createLocation } = useLocations();
    const { categories, fetchCategories } = useCategories();
    const { latitude, longitude, getCurrentPosition, isLoading: gpsLoading, error: gpsError } = useGeolocation();
    const { fetchLocations: refreshMapLocations } = useMapPersistence();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateLocationDto>({
        name: '',
        latitude: 0,
        longitude: 0,
        note: '',
        categoryId: undefined,
        isPublic: false,
    });

    useEffect(() => {
        fetchCategories();
        getCurrentPosition();
    }, [fetchCategories, getCurrentPosition]);

    useEffect(() => {
        if (latitude && longitude) {
            setFormData((prev) => ({ ...prev, latitude, longitude }));
        }
    }, [latitude, longitude]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên địa điểm');
            return;
        }
        if (!formData.latitude || !formData.longitude) {
            toast.error('Vui lòng cho phép truy cập vị trí');
            return;
        }

        setIsSubmitting(true);
        try {
            await createLocation(formData, imageFile || undefined);
            await refreshMapLocations(); // Sync global map state
            toast.success('Đã lưu địa điểm thành công!');
            router.push('/locations');
        } catch {
            toast.error('Không thể lưu địa điểm');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-6 pb-24">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Check-in địa điểm mới</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* GPS */}
                <div className="bg-teal-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            {gpsLoading ? (
                                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                            ) : (
                                <MapPin className="w-5 h-5 text-teal-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-teal-900">Tọa độ GPS</p>
                            {gpsError ? (
                                <p className="text-xs text-red-600">{gpsError}</p>
                            ) : formData.latitude && formData.longitude ? (
                                <p className="text-xs text-teal-700">
                                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                </p>
                            ) : (
                                <p className="text-xs text-teal-600">Đang lấy vị trí...</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={getCurrentPosition}
                            disabled={gpsLoading}
                            className="text-sm text-teal-600 font-medium hover:text-teal-700"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                    <div className="relative">
                        {imagePreview ? (
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element -- Preview uses blob URL which Image component doesn't support */}
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-40 sm:h-48 object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">Chọn hoặc chụp ảnh</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên địa điểm <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ví dụ: Quán cà phê ABC"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm sm:text-base"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                    <select
                        value={formData.categoryId || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value || undefined }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none appearance-none text-sm sm:text-base"
                    >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.parent ? `${cat.parent.name} › ` : ''}{cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                    <textarea
                        placeholder="Mô tả về địa điểm này..."
                        value={formData.note || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                        rows={4}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none text-sm sm:text-base"
                    />
                </div>

                {/* Public Toggle */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                    <div>
                        <p className="font-medium text-gray-900">Công khai địa điểm</p>
                        <p className="text-sm text-gray-500">Hiển thị trên timeline của bạn</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
                        className={`relative w-12 h-7 rounded-full transition-colors ${formData.isPublic ? 'bg-teal-500' : 'bg-gray-200'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
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
                        <>
                            <MapPin className="w-5 h-5" />
                            Lưu địa điểm
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
