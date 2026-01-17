import { CarSpecs } from '../types';
import { Image as ImageIcon, Video, Plus, X, Link as LinkIcon, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StepMediaProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}

export default function StepMedia({ data, updateData, errors = {} }: StepMediaProps) {
    const [uploading, setUploading] = useState<number[]>([]); // Track which index is uploading

    // Clean up empty strings from legacy data
    useEffect(() => {
        if (data.images.some(img => img === '')) {
            updateData({ images: data.images.filter(img => img !== '') });
        }
    }, [data.images, updateData]);

    const uploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            return result.url;
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Tải ảnh thất bại. Vui lòng thử lại.');
            return null;
        }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Reuse index -1 for thumbnail loading state
            setUploading(prev => [...prev, -1]);

            const url = await uploadFile(file);
            if (url) {
                updateData({ thumbnail: url });
            }

            setUploading(prev => prev.filter(i => i !== -1));
        }
    };

    const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const currentCount = data.images.length;
            const remainingSlots = 20 - currentCount;

            if (remainingSlots <= 0) {
                alert('Bạn đã đạt giới hạn 20 ảnh chi tiết.');
                return;
            }

            let filesToUpload = files;
            if (files.length > remainingSlots) {
                alert(`Bạn chỉ có thể thêm ${remainingSlots} ảnh nữa. Hệ thống sẽ chỉ tải lên ${remainingSlots} ảnh đầu tiên.`);
                filesToUpload = files.slice(0, remainingSlots);
            }

            const startIdx = data.images.length;

            // Add placeholders or loading state
            const newLoadingIndices = filesToUpload.map((_, i) => startIdx + i);
            setUploading(prev => [...prev, ...newLoadingIndices]);

            const uploadedUrls: string[] = [];
            for (const file of filesToUpload) {
                const url = await uploadFile(file);
                if (url) {
                    uploadedUrls.push(url);
                }
            }

            updateData({ images: [...data.images, ...uploadedUrls] });
            setUploading(prev => prev.filter(i => !newLoadingIndices.includes(i)));
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = data.images.filter((_, i) => i !== index);
        updateData({ images: newImages });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Thumbnail Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Ảnh đại diện (Thumbnail)
                    </label>
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded font-bold">Bắt buộc - 1 tấm</span>
                </div>

                <div className="relative group">
                    {data.thumbnail ? (
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm group-hover:border-violet-300 transition-all">
                            <img src={data.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer px-4 py-2 bg-white/90 text-gray-900 rounded-lg font-bold hover:bg-white transition-all shadow-lg flex items-center gap-2">
                                    <UploadCloud className="w-5 h-5" /> Thay ảnh
                                    <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-violet-50 hover:border-violet-400 transition-all bg-gray-50 group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {uploading.includes(-1) ? (
                                    <Loader2 className="w-10 h-10 mb-3 text-violet-500 animate-spin" />
                                ) : (
                                    <UploadCloud className="w-10 h-10 mb-3 text-gray-400 group-hover:text-violet-500 transition-colors" />
                                )}
                                <p className="mb-2 text-sm text-gray-500 group-hover:text-violet-600 font-medium">
                                    {uploading.includes(-1) ? 'Đang tải lên...' : 'Nhấn để tải ảnh hoặc kéo thả'}
                                </p>
                                <p className="text-xs text-gray-400">SVG, PNG, JPG (Tối đa 5MB)</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading.includes(-1)} />
                        </label>
                    )}
                </div>
                {errors.thumbnail && <p className="text-red-500 text-xs mt-2">{errors.thumbnail}</p>}
            </div>

            {/* Album Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Album ảnh (Gầm, Máy, Nội thất...) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">
                            {data.images.length}/20 ảnh
                        </span>
                        <label className={`cursor-pointer text-sm font-medium flex items-center gap-1 transition-colors ${data.images.length >= 20 ? 'text-gray-400 cursor-not-allowed' : 'text-violet-600 hover:text-violet-700'
                            }`}>
                            <Plus className="w-4 h-4" /> Thêm ảnh
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                accept="image/*"
                                onChange={handleAlbumUpload}
                                disabled={data.images.length >= 20}
                            />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                            {img ? (
                                <img src={img} alt={`Album ${idx}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                                </div>
                            )}
                            <button
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {data.images.length < 20 && (
                        <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-violet-50 hover:border-violet-400 transition-all bg-gray-50 text-gray-400 hover:text-violet-600">
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium">Thêm ảnh</span>
                            <input type="file" multiple className="hidden" accept="image/*" onChange={handleAlbumUpload} />
                        </label>
                    )}
                </div>
                {errors.images && <p className="text-red-500 text-xs mt-2">{errors.images}</p>}
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Thông tin liên hệ & Chi tiết bổ sung</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number - Required */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <span>📞 Số điện thoại</span>
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.phoneNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 10) updateData({ phoneNumber: val });
                            }}
                            placeholder="0912345678"
                            className={`w-full bg-white border ${errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} text-gray-900 rounded-xl p-4 focus:ring-2 focus:ring-violet-500 outline-none transition-all hover:bg-gray-50`}
                        />
                        {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber}</p>}
                    </div>

                    {/* Facebook Link - Optional */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <span>📘 Link Facebook</span>
                        </label>
                        <input
                            type="text"
                            value={data.facebookLink}
                            onChange={(e) => updateData({ facebookLink: e.target.value })}
                            placeholder="https://facebook.com/..."
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl p-4 focus:ring-2 focus:ring-violet-500 outline-none transition-all hover:bg-gray-50"
                        />
                    </div>

                    {/* Zalo Link - Optional */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <span>💬 Link Zalo</span>
                        </label>
                        <input
                            type="text"
                            value={data.zaloLink}
                            onChange={(e) => updateData({ zaloLink: e.target.value })}
                            placeholder="https://zalo.me/..."
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl p-4 focus:ring-2 focus:ring-violet-500 outline-none transition-all hover:bg-gray-50"
                        />
                    </div>
                </div>

                {/* Additional Info / Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <span>📝 Thông tin thêm / Ghi chú</span>
                    </label>
                    <textarea
                        value={data.additionalInfo}
                        onChange={(e) => updateData({ additionalInfo: e.target.value })}
                        placeholder="Ví dụ: Xe chính chủ, cam kết không đâm đụng, bao test hãng, có hỗ trợ vận chuyển..."
                        rows={4}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl p-4 focus:ring-2 focus:ring-violet-500 outline-none transition-all hover:bg-gray-50 resize-none"
                    />
                    <p className="text-xs text-gray-400">Ghi chú thêm về xe mà bạn chưa đề cập ở các bước trước.</p>
                </div>
            </div>

            {/* Video Link */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Video className="w-4 h-4" /> Video Sound Check (Youtube/TikTok)
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={data.videoLink}
                        onChange={(e) => updateData({ videoLink: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl p-4 pl-12 focus:ring-2 focus:ring-violet-500 outline-none transition-all hover:bg-gray-50 hover:border-violet-300 placeholder:text-gray-400"
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 text-orange-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-500" />
                <div className="text-sm">
                    <p className="font-semibold mb-1">Lưu ý quan trọng</p>
                    <ul className="list-disc pl-4 space-y-1 opacity-80 text-orange-700">
                        <li><strong>Tối đa 21 ảnh:</strong> 1 Ảnh đại diện + 20 Ảnh chi tiết.</li>
                        <li>Vui lòng chụp ảnh rõ nét, đầy đủ các góc cạnh.</li>
                        <li>Nên có ảnh Gầm xe và Khoang máy để tăng độ uy tín (JDM Standard).</li>
                        <li>Video Sound Check giúp người mua cảm nhận được "Soul" của xe.</li>
                    </ul>
                </div>
            </div>

        </div>
    );
}
