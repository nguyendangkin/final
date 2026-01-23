import { CarSpecs } from '../types';
import { ImageIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useImageManager } from '@/hooks/useImageManager';
import UniversalImageManager from '@/components/UniversalImageManager';

interface StepMediaProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}

export default function StepMedia({ data, updateData, errors = {} }: StepMediaProps) {
    const {
        images,
        addImages,
        removeImage,
        setThumbnail,
        reorderImages,
        getFinalData,
        isUploading
    } = useImageManager(data.images, data.thumbnail);

    // Sync back to parent state whenever images change
    useEffect(() => {
        const { thumbnail, images: album } = getFinalData();
        // Only update if data actually changed to avoid infinite loops
        if (thumbnail !== data.thumbnail || JSON.stringify(album) !== JSON.stringify(data.images)) {
            updateData({ thumbnail, images: album });
        }
    }, [images, getFinalData, updateData, data.thumbnail, data.images]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Hình ảnh xe
                    </label>
                    <span className="text-xs text-gray-400 font-medium">
                        {images.length}/20 ảnh (Ảnh đầu tiên hoặc ảnh được đánh dấu sao sẽ làm ảnh đại diện)
                    </span>
                </div>

                <UniversalImageManager
                    images={images}
                    onAddImages={addImages}
                    onRemoveImage={removeImage}
                    onSetThumbnail={setThumbnail}
                    onReorder={reorderImages}
                />
                
                {(errors.thumbnail || errors.images) && (
                    <p className="text-red-500 text-xs mt-2">{errors.thumbnail || errors.images}</p>
                )}
                
                {isUploading && (
                    <p className="text-blue-500 text-xs animate-pulse">Đang tải ảnh lên máy chủ, vui lòng đợi...</p>
                )}
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
                            maxLength={15}
                            className={`w-full bg-white border ${errors.phoneNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} text-gray-900 rounded-none p-4 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50`}
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
                            maxLength={255}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-none p-4 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50"
                        />
                    </div>

                    {/* Zalo Link - Optional */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <span>💬 Số điện thoại Zalo</span>
                        </label>
                        <input
                            type="text"
                            value={data.zaloLink}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 10) updateData({ zaloLink: val });
                            }}
                            placeholder="0912345678"
                            maxLength={10}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-none p-4 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50"
                        />
                    </div>

                    {/* Video Link - Optional */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <span>🎬 Link video</span>
                        </label>
                        <input
                            type="text"
                            value={data.videoLink}
                            onChange={(e) => updateData({ videoLink: e.target.value })}
                            placeholder="Đường dẫn tới video"
                            maxLength={255}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-none p-4 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50"
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
                        maxLength={3000}
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-none p-4 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 resize-none"
                    />
                    <div className="flex justify-between items-center text-xs text-gray-400">
                        <p>Ghi chú thêm về xe mà bạn chưa đề cập ở các bước trước.</p>
                        <span>{data.additionalInfo.length}/3000</span>
                    </div>
                </div>
            </div>





        </div>
    );
}
