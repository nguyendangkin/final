'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = [];
    // Simple pagination logic: show all if <= 7, otherwise distinct with dots
    // For now, let's keep it simple or show a window
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            pages.push(i);
        } else if (
            (i === currentPage - 2) ||
            (i === currentPage + 2)
        ) {
            pages.push('...');
        }
    }
    // Remove duplicates from logic if any (e.g. 1 ... ... 5)
    // A Set is easiest but let's just filter carefully
    const uniquePages = Array.from(new Set(pages));

    return (
        <div className="flex items-center justify-center space-x-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-none border border-gray-300 disabled:opacity-50 hover:bg-gray-100 disabled:hover:bg-white transition-colors"
                aria-label="Previous page"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {uniquePages.map((p, index) => (
                <button
                    key={`${p}-${index}`}
                    onClick={() => typeof p === 'number' && onPageChange(p)}
                    disabled={typeof p !== 'number'}
                    className={`min-w-[40px] h-10 flex items-center justify-center border text-sm font-bold uppercase transition-colors rounded-none
                        ${p === currentPage
                            ? 'bg-black text-white border-black'
                            : typeof p === 'number'
                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100' // Clickable numbers
                                : 'bg-transparent text-gray-400 border-transparent cursor-default' // Ellipsis
                        }`}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-none border border-gray-300 disabled:opacity-50 hover:bg-gray-100 disabled:hover:bg-white transition-colors"
                aria-label="Next page"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
