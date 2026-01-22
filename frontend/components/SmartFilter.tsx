'use client';

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface SmartFilterProps {
    isLoading: boolean;
    smartFilters: any;
    selectedFilters: Record<string, string>;
    priceRange: { min: string; max: string };
    onSelectFilter: (category: string, value: string) => void;
    onClearFilters: () => void;
    onPriceChange: (min: string, max: string) => void;
    onSearch: () => void;
}

const FILTER_ORDER = [
    'make',
    'model',
    'trim',
    'year',
    'chassisCode',
    'engineCode',
    'transmission',
    'drivetrain',
    'condition',
    'notableFeatures',
    'paperwork',
    'location',
    'mods_exterior',
    'mods_interior',
    'mods_engine',
    'mods_footwork'
];

const FILTER_LABELS: Record<string, string> = {
    make: 'Hãng xe',
    model: 'Dòng xe',
    trim: 'Phiên bản',
    year: 'Năm sản xuất',
    chassisCode: 'Mã khung gầm',
    engineCode: 'Mã động cơ',
    transmission: 'Hộp số',
    drivetrain: 'Hệ dẫn động',
    condition: 'Tình trạng',
    notableFeatures: 'Ngoại hình chú ý',
    paperwork: 'Loại giấy tờ',
    location: 'Khu vực',
    mods_exterior: 'Mods: Ngoại thất',
    mods_interior: 'Mods: Nội thất',
    mods_engine: 'Mods: Hiệu suất & Máy',
    mods_footwork: 'Mods: Gầm & Bánh',
};

export default function SmartFilter({
    isLoading,
    smartFilters,
    selectedFilters,
    priceRange,
    onSelectFilter,
    onClearFilters,
    onPriceChange,
    onSearch
}: SmartFilterProps) {
    const minPriceRef = useRef<HTMLInputElement>(null);
    const maxPriceRef = useRef<HTMLInputElement>(null);

    // Format price for display
    const formatPrice = (num: number) => new Intl.NumberFormat('vi-VN').format(num);

    // Display formatted price in input
    const displayFormattedPrice = (value: string) => {
        if (!value) return '';
        const num = parseInt(value);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Handle price input with cursor management
    const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'min' | 'max') => {
        const input = e.target;
        const cursorPos = input.selectionStart || 0;
        const oldValue = input.value;
        const dotsBeforeCursor = (oldValue.slice(0, cursorPos).match(/\./g) || []).length;
        const rawValue = oldValue.replace(/\D/g, '');

        // Notify parent of change
        if (field === 'min') {
            onPriceChange(rawValue, priceRange.max);
        } else {
            onPriceChange(priceRange.min, rawValue);
        }

        // Restore cursor position after render
        setTimeout(() => {
            const ref = field === 'min' ? minPriceRef : maxPriceRef;
            if (ref.current) {
                const newFormatted = ref.current.value;
                const newDotsBeforeCursor = (newFormatted.slice(0, cursorPos).match(/\./g) || []).length;
                const adjustment = newDotsBeforeCursor - dotsBeforeCursor;
                const newPos = Math.max(0, cursorPos + adjustment);
                ref.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    return (
        <div className="bg-white">
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-gray-500 uppercase">Bộ lọc thông minh</p>
                {smartFilters && (
                    <span className="text-xs text-[var(--jdm-red)] font-bold">
                        {smartFilters.count} xe phù hợp
                    </span>
                )}
            </div>

            {isLoading && !smartFilters ? (
                <div className="space-y-3 p-1">
                    <div className="h-10 bg-gray-100 animate-pulse w-full"></div>
                    <div className="h-6 bg-gray-100 animate-pulse w-2/3"></div>
                    <div className="h-20 bg-gray-100 animate-pulse w-full"></div>
                </div>
            ) : smartFilters?.options ? (
                <div className="space-y-3">
                    {/* Search Button - Moved to top for better UX */}
                    <button
                        onClick={onSearch}
                        className="w-full bg-black hover:bg-[var(--jdm-red)] text-white py-2.5 text-sm font-bold uppercase tracking-wider transition-colors shadow-md sticky top-0 z-10"
                    >
                        Tìm kiếm {smartFilters?.count ? `(${smartFilters.count} kết quả)` : ''}
                    </button>

                    {/* Selected Filters Summary - Moved to top */}
                    {Object.keys(selectedFilters).length > 0 && (
                        <div className="bg-gray-50 p-2 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                    Đang lọc ({Object.keys(selectedFilters).length})
                                </label>
                                <button
                                    onClick={onClearFilters}
                                    className="text-[10px] font-bold text-[var(--jdm-red)] hover:underline uppercase"
                                >
                                    Xóa hết
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(selectedFilters).map(([category, value]) => (
                                    <span
                                        key={category}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-black text-white"
                                    >
                                        <span className="opacity-60">{FILTER_LABELS[category]}:</span> {value}
                                        <button
                                            onClick={() => onSelectFilter(category, value)}
                                            className="hover:bg-white/20 rounded-full p-0.5"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Price Range */}
                    <div className="bg-gray-50 p-2 border-l-2 border-[var(--jdm-red)]">
                        <label className="text-xs font-bold text-gray-700 uppercase mb-1.5 block">
                            Khoảng giá (VNĐ)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                ref={minPriceRef}
                                type="text"
                                placeholder="Từ"
                                value={displayFormattedPrice(priceRange.min)}
                                onChange={(e) => handlePriceInput(e, 'min')}
                                className="w-full p-1.5 border border-gray-300 text-xs focus:outline-none focus:border-[var(--jdm-red)] text-right"
                            />
                            <span className="text-gray-400 text-xs">—</span>
                            <input
                                ref={maxPriceRef}
                                type="text"
                                placeholder="Đến"
                                value={displayFormattedPrice(priceRange.max)}
                                onChange={(e) => handlePriceInput(e, 'max')}
                                className="w-full p-1.5 border border-gray-300 text-xs focus:outline-none focus:border-[var(--jdm-red)] text-right"
                            />
                        </div>
                        {smartFilters.ranges?.price?.max > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">
                                {formatPrice(smartFilters.ranges.price.min)} — {formatPrice(smartFilters.ranges.price.max)}
                            </p>
                        )}
                    </div>

                    {/* Year Range Info */}
                    {smartFilters.ranges?.year?.max > 0 && (
                        <div className="text-xs text-gray-500 px-1">
                            <span className="font-medium">Năm:</span> {smartFilters.ranges.year.min} - {smartFilters.ranges.year.max}
                        </div>
                    )}

                    {/* Dynamic Filters */}
                    {FILTER_ORDER.map(category => {
                        const options = smartFilters.options[category];
                        if (!options || options.length === 0) return null;

                        return (
                            <div key={category} className="border-t border-gray-100 pt-2">
                                <label className="text-xs font-bold text-[var(--jdm-red)] uppercase flex justify-between items-center">
                                    {FILTER_LABELS[category]}
                                    {selectedFilters[category] && (
                                        <span className="text-white bg-black px-1 text-[10px]">
                                            {selectedFilters[category]}
                                        </span>
                                    )}
                                </label>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {options.map((value: string) => (
                                        <button
                                            key={value}
                                            onClick={() => onSelectFilter(category, value)}
                                            className={`px-2 py-1 text-xs font-bold uppercase transition-colors border ${selectedFilters[category] === value
                                                ? 'bg-[var(--jdm-red)] text-white border-[var(--jdm-red)]'
                                                : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
                                                }`}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center py-4">Không thể tải bộ lọc</p>
            )}
        </div>
    );
}
