'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, UploadCloud, X, Plus, Image as ImageIcon, Box, Armchair, Hammer, Disc } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCarIdFromSlug, shouldOptimizeImage, getImgUrl } from '@/lib/utils';
import EditCarSkeleton from '@/components/EditCarSkeleton';

const BRANDS = [
    'TOYOTA', 'HONDA', 'NISSAN', 'MAZDA', 'MITSUBISHI', 'SUBARU',
    'SUZUKI', 'LEXUS', 'ISUZU', 'DAIHATSU', 'ACURA', 'INFINITI'
];

const TRANSMISSION_OPTIONS = [
    { val: 'SỐ SÀN (MT)', label: 'SỐ SÀN (MT)' },
    { val: 'TỰ ĐỘNG (AT)', label: 'TỰ ĐỘNG (AT)' },
    { val: 'CVT', label: 'CVT' }
];

const DRIVETRAIN_OPTIONS = [
    { val: 'FWD (TRƯỚC)', label: 'FWD (TRƯỚC)' },
    { val: 'RWD (SAU)', label: 'RWD (SAU)' },
    { val: 'AWD (2 CẦU)', label: 'AWD (2 CẦU)' }
];

const CONDITION_OPTIONS = [
    { val: 'ZIN', label: 'ZIN' },
    { val: 'ĐỘ NHẸ', label: 'ĐỘ NHẸ' },
    { val: 'ĐỘ KHỦNG', label: 'ĐỘ KHỦNG' },
    { val: 'TRACK/DRIFT', label: 'TRACK/DRIFT' },
    { val: 'VỪA DỌN VỀ ZIN', label: 'VỪA DỌN VỀ ZIN' },
    { val: 'VỪA DỌN VÀ ĐỘ', label: 'VỪA DỌN VÀ ĐỘ' }
];

const PAPERWORK_OPTIONS = [
    { val: 'CHÍNH CHỦ', label: 'CHÍNH CHỦ' },
    { val: 'KHÔNG CHÍNH CHỦ', label: 'KHÔNG CHÍNH CHỦ' }
];

// Mod Section Component
const ModSection = ({
    title,
    icon: Icon,
    items,
    onAdd,
    onRemove,
    placeholder
}: {
    title: string;
    icon: React.ElementType;
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
}) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim()) {
                onAdd(input.trim().toUpperCase());
                setInput('');
            }
        }
    };

    const handleAdd = () => {
        if (input.trim()) {
            onAdd(input.trim().toUpperCase());
            setInput('');
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-none p-4 sm:p-6 space-y-4 hover:border-[var(--jdm-red)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-black rounded-none group-hover:bg-[var(--jdm-red)] transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-black uppercase tracking-wide">{title}</h4>
            </div>

            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 min-w-0 bg-gray-50 border border-gray-200 text-black rounded-none px-4 py-3 text-sm focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 uppercase"
                />
                <button
                    onClick={handleAdd}
                    type="button"
                    className="bg-black hover:bg-[var(--jdm-red)] text-white p-3 rounded-none transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {items.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Chưa có thông tin...</span>
                )}
                {items.map((item, idx) => (
                    <span key={idx} className="bg-gray-100 text-black border border-gray-200 px-3 py-1 rounded-none text-sm flex items-center gap-2 font-bold">
                        {item}
                        <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="hover:text-[var(--jdm-red)] hover:bg-red-50 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default function EditCarPage() {
    const router = useRouter();
    const params = useParams();
    const carId = getCarIdFromSlug(params.id as string);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [car, setCar] = useState<any>(null);
    const [uploading, setUploading] = useState<number[]>([]);
    const [errors, setErrors] = useState<{ thumbnail?: string; images?: string }>({});

    // Form state
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        trim: '',
        price: 0,
        isNegotiable: true,
        mileage: 0,
        location: '',
        chassisCode: '',
        engineCode: '',
        transmission: '',
        drivetrain: '',
        condition: '',
        paperwork: '',
        registryExpiry: '',
        noRegistry: false,
        phoneNumber: '',
        facebookLink: '',
        zaloLink: '',
        videoLink: '',
        additionalInfo: '',
        thumbnail: '',
        images: [] as string[],
        mods: {
            exterior: [] as string[],
            interior: [] as string[],
            engine: [] as string[],
            footwork: [] as string[],
        },
        notableFeatures: [] as string[],
    });

    useEffect(() => {
        fetchCar();
    }, [carId]);

    const fetchCar = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/cars/${carId}`);
            if (!res.ok) throw new Error('Không tìm thấy xe');
            const data = await res.json();
            setCar(data);

            // Check if user is the owner
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                router.push(`/cars/${carId}`);
                return;
            }

            const userRes = await fetch(`${apiUrl}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const user = await userRes.json();
                if (user.id !== data.seller?.id) {
                    router.push(`/cars/${carId}`);
                    return;
                }
            } else {
                router.push(`/cars/${carId}`);
                return;
            }

            // Parse mods from server (could be JSON string or object)
            let parsedMods = { exterior: [], interior: [], engine: [], footwork: [] };
            if (data.mods) {
                try {
                    parsedMods = typeof data.mods === 'string' ? JSON.parse(data.mods) : data.mods;
                } catch (e) {
                    console.error('Failed to parse mods', e);
                }
            }

            // Populate form with existing data
            setFormData({
                make: data.make || '',
                model: data.model || '',
                year: data.year || new Date().getFullYear(),
                trim: data.trim || '',
                price: Number(data.price) || 0,
                isNegotiable: data.isNegotiable ?? true,
                mileage: data.mileage || 0,
                location: data.location || '',
                chassisCode: data.chassisCode || '',
                engineCode: data.engineCode || '',
                transmission: data.transmission || '',
                drivetrain: data.drivetrain || '',
                condition: data.condition || '',
                paperwork: data.paperwork || '',
                registryExpiry: data.registryExpiry || '',
                noRegistry: data.noRegistry || false,
                phoneNumber: data.phoneNumber || '',
                facebookLink: data.facebookLink || '',
                zaloLink: data.zaloLink || '',
                videoLink: data.videoLink || '',
                additionalInfo: data.additionalInfo || '',
                thumbnail: data.thumbnail || '',
                images: data.images?.filter((img: string) => img && img.trim() !== '') || [],
                mods: parsedMods,
                notableFeatures: data.notableFeatures || [],
            });
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Price input ref for cursor management
    const priceRef = useRef<HTMLInputElement>(null);

    const formatPrice = (value: number) => {
        if (!value) return '';
        return value.toLocaleString('vi-VN');
    };

    const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const cursorPos = input.selectionStart || 0;
        const oldValue = input.value;

        // Count dots before cursor
        const dotsBeforeCursor = (oldValue.slice(0, cursorPos).match(/\./g) || []).length;

        // Get raw digits only
        const rawValue = oldValue.replace(/\D/g, '');
        const newPrice = parseInt(rawValue) || 0;

        setFormData({ ...formData, price: newPrice });

        // Calculate new cursor position after formatting
        setTimeout(() => {
            if (priceRef.current) {
                const newFormatted = priceRef.current.value;
                const newDotsBeforeCursor = (newFormatted.slice(0, cursorPos).match(/\./g) || []).length;
                const adjustment = newDotsBeforeCursor - dotsBeforeCursor;
                const newPos = Math.max(0, cursorPos + adjustment);
                priceRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const uploadFile = async (file: File): Promise<string | null> => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                body: formDataUpload,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            return result.url;
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Tải ảnh thất bại. Vui lòng thử lại.');
            return null;
        }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploading(prev => [...prev, -1]);

            const url = await uploadFile(file);
            if (url) {
                setFormData(prev => ({ ...prev, thumbnail: url }));
            }

            setUploading(prev => prev.filter(i => i !== -1));
        }
    };

    const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const currentCount = formData.images.length;
            const remainingSlots = 20 - currentCount;

            if (remainingSlots <= 0) {
                toast.error('Bạn đã đạt giới hạn 20 ảnh chi tiết.');
                return;
            }

            let filesToUpload = files;
            if (files.length > remainingSlots) {
                toast.error(`Bạn chỉ có thể thêm ${remainingSlots} ảnh nữa.`);
                filesToUpload = files.slice(0, remainingSlots);
            }

            const startIdx = formData.images.length;
            const newLoadingIndices = filesToUpload.map((_, i) => startIdx + i);
            setUploading(prev => [...prev, ...newLoadingIndices]);

            const uploadedUrls: string[] = [];
            for (const file of filesToUpload) {
                const url = await uploadFile(file);
                if (url) {
                    uploadedUrls.push(url);
                }
            }

            setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
            setUploading(prev => prev.filter(i => !newLoadingIndices.includes(i)));
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Mods helpers
    const updateMods = (category: keyof typeof formData.mods, newItems: string[]) => {
        setFormData(prev => ({
            ...prev,
            mods: { ...prev.mods, [category]: newItems }
        }));
    };

    const addModItem = (category: keyof typeof formData.mods, item: string) => {
        updateMods(category, [...formData.mods[category], item]);
    };

    const removeModItem = (category: keyof typeof formData.mods, index: number) => {
        updateMods(category, formData.mods[category].filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate images
        const newErrors: { thumbnail?: string; images?: string } = {};
        if (!formData.thumbnail) {
            newErrors.thumbnail = 'Vui lòng tải lên ảnh đại diện';
        }
        if (formData.images.length === 0) {
            newErrors.images = 'Vui lòng tải lên ít nhất 1 ảnh trong album';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) throw new Error('Vui lòng đăng nhập');

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/cars/${carId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Có lỗi xảy ra');
            }

            router.push(`/cars/${carId}`);
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    const inputClassBase = "w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all uppercase";
    const inputClassNormal = "w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all";

    if (loading) {
        return <EditCarSkeleton />;
    }

    if (error && !car) {
        return (
            <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="text-[var(--jdm-red)] hover:underline font-bold"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans selection:bg-red-500/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-200 transition"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-black uppercase tracking-tight">Chỉnh sửa bài đăng</h1>
                        <p className="text-gray-500 text-sm">{car?.year} {car?.make} {car?.model}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Ảnh */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Hình ảnh</h2>

                        {/* Thumbnail */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Ảnh đại diện (Thumbnail) <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className="relative group">
                                {formData.thumbnail ? (
                                    <div className="relative w-full h-64 rounded-none overflow-hidden border border-gray-200 bg-gray-50 shadow-sm group-hover:border-[var(--jdm-red)] transition-all">
                                        <Image src={getImgUrl(formData.thumbnail)} alt="Thumbnail Preview" fill className="object-cover" unoptimized={!shouldOptimizeImage(getImgUrl(formData.thumbnail))} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <label className="cursor-pointer px-4 py-2 bg-[var(--jdm-red)] text-white rounded-none font-bold hover:bg-red-700 transition-all shadow-lg flex items-center gap-2">
                                                <UploadCloud className="w-5 h-5" /> Thay ảnh
                                                <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-none cursor-pointer hover:bg-gray-50 hover:border-[var(--jdm-red)] transition-all bg-gray-50 group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {uploading.includes(-1) ? (
                                                <Loader2 className="w-10 h-10 mb-3 text-[var(--jdm-red)] animate-spin" />
                                            ) : (
                                                <UploadCloud className="w-10 h-10 mb-3 text-gray-400 group-hover:text-[var(--jdm-red)] transition-colors" />
                                            )}
                                            <p className="mb-2 text-sm text-gray-500 group-hover:text-[var(--jdm-red)] font-medium">
                                                {uploading.includes(-1) ? 'Đang tải lên...' : 'Nhấn để tải ảnh'}
                                            </p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading.includes(-1)} />
                                    </label>
                                )}
                            </div>
                            {errors.thumbnail && <p className="text-red-500 text-xs mt-2">{errors.thumbnail}</p>}
                        </div>

                        {/* Album */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Album ảnh <span className="text-red-500">*</span>
                                </label>
                                <span className="text-xs text-gray-400 font-medium">{formData.images.length}/20 ảnh</span>
                            </div>
                            {errors.images && <p className="text-red-500 text-xs mb-2">{errors.images}</p>}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative aspect-square rounded-none overflow-hidden border border-gray-200 group hover:border-[var(--jdm-red)] transition-all bg-white"
                                    >
                                        <Image src={getImgUrl(img)} alt={`Album ${idx}`} fill className="object-cover" unoptimized={!shouldOptimizeImage(getImgUrl(img))} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute top-2 right-2 p-1.5 bg-[var(--jdm-red)] text-white rounded-none transition-all hover:bg-red-700 shadow-sm cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {formData.images.length < 20 && (
                                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[var(--jdm-red)] transition-all bg-gray-50 text-gray-400 hover:text-[var(--jdm-red)]">
                                        <Plus className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-medium">Thêm ảnh</span>
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={handleAlbumUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Thông tin cơ bản */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông tin cơ bản</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hãng xe <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.make}
                                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                    className={inputClassBase}
                                    required
                                >
                                    <option value="">CHỌN HÃNG XE</option>
                                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dòng xe <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value.toUpperCase() })}
                                    className={inputClassBase}
                                    placeholder="VÍ DỤ: CIVIC, CAMRY..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Năm sản xuất <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                                    className={inputClassBase}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phiên bản <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.trim}
                                    onChange={(e) => setFormData({ ...formData, trim: e.target.value.toUpperCase() })}
                                    className={inputClassBase}
                                    placeholder="VÍ DỤ: TYPE R, RS..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                <input
                                    ref={priceRef}
                                    type="text"
                                    value={formatPrice(formData.price)}
                                    onChange={handlePriceInput}
                                    className={`${inputClassBase} font-bold text-right`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ODO (km) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                                    className={inputClassBase}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                                    className={inputClassBase}
                                    placeholder="VÍ DỤ: HỒ CHÍ MINH, HÀ NỘI..."
                                    required
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isNegotiable}
                                        onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                                        className="w-5 h-5 rounded-none border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm text-gray-700">Có thể thương lượng giá</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Thông số kỹ thuật */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông số kỹ thuật</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mã khung gầm <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.chassisCode}
                                    onChange={(e) => setFormData({ ...formData, chassisCode: e.target.value.toUpperCase() })}
                                    className={inputClassBase}
                                    placeholder="VÍ DỤ: S15, EK9..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mã động cơ <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.engineCode}
                                    onChange={(e) => setFormData({ ...formData, engineCode: e.target.value.toUpperCase() })}
                                    className={inputClassBase}
                                    placeholder="VÍ DỤ: SR20DET, B16B..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hộp số <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.transmission}
                                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                                    className={inputClassBase}
                                    required
                                >
                                    <option value="">-- CHỌN HỘP SỐ --</option>
                                    {TRANSMISSION_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hệ dẫn động <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.drivetrain}
                                    onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value })}
                                    className={inputClassBase}
                                    required
                                >
                                    <option value="">-- CHỌN HỆ DẪN ĐỘNG --</option>
                                    {DRIVETRAIN_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng xe <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className={inputClassBase}
                                    required
                                >
                                    <option value="">-- CHỌN TÌNH TRẠNG --</option>
                                    {CONDITION_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Ngoại hình chú ý */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Ngoại hình chú ý</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['MUI TRẦN', 'ĐÈN MẮT ẾCH', 'CỬA COUPE'].map((feature) => {
                                const isChecked = formData.notableFeatures?.includes(feature);
                                return (
                                    <label
                                        key={feature}
                                        className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${isChecked
                                            ? 'border-[var(--jdm-red)] bg-red-50'
                                            : 'border-gray-200 bg-white hover:border-gray-400'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const current = formData.notableFeatures || [];
                                                if (e.target.checked) {
                                                    setFormData(prev => ({ ...prev, notableFeatures: [...current, feature] }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, notableFeatures: current.filter(f => f !== feature) }));
                                                }
                                            }}
                                            className="w-5 h-5 text-[var(--jdm-red)] focus:ring-[var(--jdm-red)] border-gray-300 rounded-none"
                                        />
                                        <span className={`font-bold uppercase text-sm ${isChecked ? 'text-[var(--jdm-red)]' : 'text-gray-600'}`}>
                                            {feature}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Đồ chơi (Mods) */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-2 uppercase tracking-wide">Đồ chơi / Nâng cấp</h2>
                        <p className="text-sm text-gray-500 mb-6 italic">*Mẹo: Nhập tên món đồ và nhấn <strong>Enter</strong> để thêm nhanh.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ModSection
                                title="Ngoại thất"
                                icon={Box}
                                items={formData.mods.exterior}
                                onAdd={(item) => addModItem('exterior', item)}
                                onRemove={(idx) => removeModItem('exterior', idx)}
                                placeholder="Bodykit, Cánh gió, Đèn..."
                            />
                            <ModSection
                                title="Nội thất"
                                icon={Armchair}
                                items={formData.mods.interior}
                                onAdd={(item) => addModItem('interior', item)}
                                onRemove={(idx) => removeModItem('interior', idx)}
                                placeholder="Ghế Recaro, Volang Nardi..."
                            />
                            <ModSection
                                title="Máy móc & Hiệu suất"
                                icon={Hammer}
                                items={formData.mods.engine}
                                onAdd={(item) => addModItem('engine', item)}
                                onRemove={(idx) => removeModItem('engine', idx)}
                                placeholder="Turbo Garrett, ECU Haltech, Pô HKS..."
                            />
                            <ModSection
                                title="Gầm & Bánh"
                                icon={Disc}
                                items={formData.mods.footwork}
                                onAdd={(item) => addModItem('footwork', item)}
                                onRemove={(idx) => removeModItem('footwork', idx)}
                                placeholder="Phuộc Tein, Mâm TE37 18x9.5..."
                            />
                        </div>
                    </div>

                    {/* Pháp lý */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Pháp lý</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giấy tờ <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.paperwork}
                                    onChange={(e) => setFormData({ ...formData, paperwork: e.target.value })}
                                    className={inputClassBase}
                                    required
                                >
                                    <option value="">-- CHỌN LOẠI GIẤY TỜ --</option>
                                    {PAPERWORK_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Hạn đăng kiểm <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="noRegistry"
                                            checked={formData.noRegistry}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setFormData({
                                                    ...formData,
                                                    noRegistry: isChecked,
                                                    registryExpiry: isChecked ? '' : formData.registryExpiry
                                                });
                                            }}
                                            className="w-4 h-4 rounded-none border-gray-300 text-black focus:ring-black"
                                        />
                                        <label htmlFor="noRegistry" className="text-xs text-gray-500 cursor-pointer select-none">
                                            Không đăng kiểm được
                                        </label>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    disabled={formData.noRegistry}
                                    value={formData.registryExpiry}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        const digitsOnly = value.replace(/[^\d]/g, '');
                                        if (digitsOnly.length <= 2) {
                                            value = digitsOnly;
                                        } else {
                                            value = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 6);
                                        }
                                        setFormData({ ...formData, registryExpiry: value });
                                    }}
                                    placeholder={formData.noRegistry ? "XE KHÔNG CÓ ĐĂNG KIỂM" : "MM/YYYY"}
                                    className={`${inputClassBase} disabled:bg-gray-100 disabled:text-gray-400`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thông tin liên hệ */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông tin liên hệ</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val.length <= 10) setFormData({ ...formData, phoneNumber: val });
                                    }}
                                    className={inputClassNormal}
                                    placeholder="0912345678"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                                <input
                                    type="text"
                                    value={formData.facebookLink}
                                    onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                                    className={inputClassNormal}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại Zalo</label>
                                <input
                                    type="text"
                                    value={formData.zaloLink}
                                    onChange={(e) => setFormData({ ...formData, zaloLink: e.target.value })}
                                    className={inputClassNormal}
                                    placeholder="0912345678"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thông tin thêm */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông tin thêm</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link video</label>
                                <input
                                    type="text"
                                    value={formData.videoLink}
                                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                                    className={inputClassNormal}
                                    placeholder="Đường dẫn tới video"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thông tin thêm / Ghi chú</label>
                                <textarea
                                    value={formData.additionalInfo}
                                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                    rows={4}
                                    maxLength={3000}
                                    className={`${inputClassNormal} resize-none`}
                                    placeholder="Thông tin bổ sung..."
                                />
                                <div className="flex justify-end text-xs text-gray-400 mt-1">
                                    <span>{formData.additionalInfo.length}/3000</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-none border border-gray-300 text-black font-bold hover:bg-gray-100 transition uppercase tracking-wide"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-none bg-[var(--jdm-red)] text-white font-bold hover:bg-black transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide transform hover:scale-[1.02] active:scale-95 shadow-lg"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
