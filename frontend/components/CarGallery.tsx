'use client';

import { Camera } from 'lucide-react';

interface CarGalleryProps {
    images: string[];
    status: string;
    onOpenLightbox: (index: number) => void;
}

export default function CarGallery({ images, status, onOpenLightbox }: CarGalleryProps) {
    return (
        <div className="rounded-none overflow-hidden border border-gray-100 bg-white">
            {/* MOBILE: Carousel (Horizontal Scroll) */}
            <div className="lg:hidden relative group">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[4/3] bg-gray-100">
                    {images.map((img: string, idx: number) => (
                        <div key={idx}
                            className="min-w-full snap-center relative cursor-pointer"
                            onClick={() => onOpenLightbox(idx)}
                        >
                            <img
                                src={img}
                                alt={`Car image ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{images.length} Ảnh</span>
                </div>
                {status === 'SOLD' && (
                    <div className="absolute top-4 left-4">
                        <span className="bg-emerald-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">
                            ĐÃ BÁN
                        </span>
                    </div>
                )}
            </div>

            {/* DESKTOP: Masonry Grid */}
            <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-1 h-[400px] xl:h-[450px] cursor-pointer" onClick={() => onOpenLightbox(0)}>
                {images.length === 1 && (
                    <div className="col-span-4 row-span-2 relative group overflow-hidden">
                        <img src={images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car" />
                    </div>
                )}

                {images.length === 2 && (
                    <>
                        <div className="col-span-2 row-span-2 relative group overflow-hidden">
                            <img src={images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 1" />
                        </div>
                        <div className="col-span-2 row-span-2 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(1); }}>
                            <img src={images[1]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 2" />
                        </div>
                    </>
                )}

                {images.length === 3 && (
                    <>
                        <div className="col-span-2 row-span-2 relative group overflow-hidden">
                            <img src={images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 1" />
                        </div>
                        <div className="col-span-2 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(1); }}>
                            <img src={images[1]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 2" />
                        </div>
                        <div className="col-span-2 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(2); }}>
                            <img src={images[2]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 3" />
                        </div>
                    </>
                )}

                {images.length === 4 && (
                    <>
                        <div className="col-span-2 row-span-2 relative group overflow-hidden">
                            <img src={images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 1" />
                        </div>
                        <div className="col-span-2 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(1); }}>
                            <img src={images[1]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 2" />
                        </div>
                        <div className="col-span-1 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(2); }}>
                            <img src={images[2]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 3" />
                        </div>
                        <div className="col-span-1 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(3); }}>
                            <img src={images[3]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 4" />
                        </div>
                    </>
                )}

                {images.length >= 5 && (
                    <>
                        <div className="col-span-2 row-span-2 relative group overflow-hidden">
                            <img src={images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 1" />
                            {status === 'SOLD' && (
                                <div className="absolute top-4 left-4">
                                    <span className="bg-emerald-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded shadow-sm">
                                        ĐÃ BÁN
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="col-span-1 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(1); }}>
                            <img src={images[1]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 2" />
                        </div>
                        <div className="col-span-1 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(2); }}>
                            <img src={images[2]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 3" />
                        </div>
                        <div className="col-span-1 row-span-1 relative group overflow-hidden" onClick={(e) => { e.stopPropagation(); onOpenLightbox(3); }}>
                            <img src={images[3]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 4" />
                        </div>
                        <div className="col-span-1 row-span-1 relative group overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenLightbox(4); }}>
                            <img src={images[4]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Car 5" />
                            {images.length > 5 && (
                                <div className="absolute inset-0 bg-black/50 hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <span className="text-white font-bold text-xl flex items-center gap-1">
                                        +{images.length - 5}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
