'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function Lightbox({ images, initialIndex, isOpen, onClose }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
    }, [onClose, handleNext, handlePrev]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">

            {/* Controls */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 backdrop-blur"
            >
                <X className="w-6 h-6" />
            </button>

            <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 hidden md:block backdrop-blur hover:scale-110 active:scale-95"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>

            <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-50 hidden md:block backdrop-blur hover:scale-110 active:scale-95"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {/* Main Image */}
            <div className="relative w-full h-[80vh] flex items-center justify-center">
                <img
                    src={images[currentIndex]}
                    alt={`View ${currentIndex}`}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none drop-shadow-2xl"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur rounded-full text-white text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnails Strip */}
            <div className="absolute bottom-0 w-full p-4 overflow-x-auto scrollbar-hide flex gap-2 justify-center bg-gradient-to-t from-black/80 to-transparent">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-violet-500 scale-110 ring-2 ring-violet-500/50' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                            }`}
                    >
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}
