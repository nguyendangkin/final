'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function Lightbox({ images, initialIndex, isOpen, onClose }: LightboxProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Auto-scroll to the initial index
            setTimeout(() => {
                const element = document.getElementById(`lightbox-img-${initialIndex}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
            }, 0);
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, initialIndex]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col animate-in fade-in duration-200 backdrop-blur-sm">

            {/* Close Button - Fixed */}
            <button
                onClick={onClose}
                className="fixed top-4 right-4 p-2 bg-white hover:bg-[var(--jdm-red)] rounded-full text-black hover:text-white transition-all z-[10000] border border-gray-100"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Scrollable Container */}
            <div
                ref={scrollContainerRef}
                className="w-full h-full overflow-y-auto overflow-x-hidden p-0 md:p-8"
                onClick={(e) => {
                    // Close if clicking the background (not the image)
                    if (e.target === scrollContainerRef.current) onClose();
                }}
            >
                <div className="flex flex-col items-center gap-4 min-h-full py-10 md:py-0">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            id={`lightbox-img-${idx}`}
                            className="relative w-full max-w-5xl flex-shrink-0"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                        >
                            <img
                                src={img}
                                alt={`View ${idx + 1}`}
                                className="w-full h-auto object-contain max-h-[90vh] rounded-none"
                                loading={Math.abs(idx - initialIndex) < 2 ? "eager" : "lazy"}
                            />
                            {/* Image Counter Badge for Mobile feeling */}

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
