import React, { useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Star, Move, Loader2, Plus } from 'lucide-react';
import { ManagedImage } from '@/hooks/useImageManager';
import { getImgUrl, shouldOptimizeImage } from '@/lib/utils';

interface Props {
  images: ManagedImage[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onSetThumbnail: (id: string) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

export default function UniversalImageManager({
  images,
  onAddImages,
  onRemoveImage,
  onSetThumbnail,
  onReorder
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddImages(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <ImageItem
            key={img.id}
            index={index}
            image={img}
            onRemove={() => onRemoveImage(img.id)}
            onSetThumbnail={() => onSetThumbnail(img.id)}
            onReorder={onReorder}
          />
        ))}

        {images.length < 20 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[var(--jdm-red)] transition-all text-gray-400"
          >
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-xs font-medium">Thêm ảnh</span>
            <input
              type="file"
              multiple
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        * Kéo thả để đổi thứ tự. Click vào biểu tượng ngôi sao để chọn làm ảnh đại diện.
      </p>
    </div>
  );
}

function ImageItem({ image, index, onRemove, onSetThumbnail, onReorder }: any) {
  const ref = useRef<HTMLDivElement>(null);

  // Simple drag and drop logic (using native HTML5 DnD)
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== index) {
      onReorder(dragIndex, index);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const displayUrl = image.url.startsWith('blob:') ? image.url : getImgUrl(image.url);

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative aspect-square border group transition-all cursor-move w-full h-full ${image.isThumbnail ? 'border-[var(--jdm-red)] ring-2 ring-[var(--jdm-red)]/20' : 'border-gray-200 hover:border-[var(--jdm-red)]'
        }`}
    >
      <Image
        src={displayUrl}
        alt="Preview"
        fill
        className="object-cover"
        unoptimized={!shouldOptimizeImage(displayUrl)}
      />

      {image.uploading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--jdm-red)]" />
        </div>
      )}

      {image.error && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
          <span className="bg-red-600 text-white text-[10px] px-1">{image.error}</span>
        </div>
      )}

      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onSetThumbnail(); }}
          className={`p-1.5 shadow-sm transition-colors ${image.isThumbnail ? 'bg-yellow-400 text-white' : 'bg-white text-gray-400 hover:text-yellow-500'
            }`}
          title="Đặt làm ảnh đại diện"
        >
          <Star className={`w-3.5 h-3.5 ${image.isThumbnail ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 bg-[var(--jdm-red)] text-white shadow-sm hover:bg-red-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {image.isThumbnail && (
        <div className="absolute bottom-0 left-0 right-0 bg-[var(--jdm-red)] text-white text-[10px] font-bold text-center py-0.5">
          ẢNH ĐẠI DIỆN
        </div>
      )}
    </div>
  );
}
