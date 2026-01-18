'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, User, LogOut, Wallet, ChevronDown, Search, SlidersHorizontal, Info } from 'lucide-react';
import { generateSellerSlug } from '@/lib/utils';

const BRANDS = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi',
    'Subaru', 'Suzuki', 'Daihatsu', 'Lexus', 'Acura', 'Infiniti'
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Smart filter states
    const [smartFilters, setSmartFilters] = useState<any>(null);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
    const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
    const [isLoading, setIsLoading] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentMake = searchParams.get('make');

    // Filter category labels in Vietnamese - ordered by importance
    const filterOrder = ['make', 'model', 'location', 'transmission', 'drivetrain', 'condition', 'paperwork', 'chassisCode', 'engineCode', 'mods'];
    const filterLabels: Record<string, string> = {
        make: 'Hãng xe',
        model: 'Dòng xe',
        chassisCode: 'Mã gầm',
        engineCode: 'Mã máy',
        transmission: 'Hộp số',
        drivetrain: 'Dẫn động',
        condition: 'Tình trạng',
        paperwork: 'Giấy tờ',
        location: 'Khu vực',
        mods: 'Mods',
    };

    // Fetch smart filters based on current selections
    const fetchSmartFilters = async (filters: Record<string, string>, price?: { min: string; max: string }) => {
        setIsLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        // Add price range if set
        if (price?.min) params.append('minPrice', price.min);
        if (price?.max) params.append('maxPrice', price.max);

        try {
            const res = await fetch(`http://localhost:3000/cars/filters/smart?${params.toString()}`);
            const data = await res.json();
            setSmartFilters(data);
        } catch {
            setSmartFilters(null);
        }
        setIsLoading(false);
    };

    // Initial load - get all available options
    useEffect(() => {
        if (isSearchOptionsOpen && !smartFilters) {
            fetchSmartFilters({}, priceRange);
        }
    }, [isSearchOptionsOpen]);

    // Re-fetch when filters or price range change
    useEffect(() => {
        if (isSearchOptionsOpen) {
            fetchSmartFilters(selectedFilters, priceRange);
        }
    }, [selectedFilters, priceRange.min, priceRange.max]);

    // Select a filter value
    const selectFilter = (category: string, value: string) => {
        setSelectedFilters(prev => {
            const newFilters = { ...prev };
            if (prev[category] === value) {
                delete newFilters[category];
            } else {
                newFilters[category] = value;
            }
            return newFilters;
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedFilters({});
        setPriceRange({ min: '', max: '' });
    };

    // Perform search - navigate with filter params
    const performSearch = () => {
        const params = new URLSearchParams();
        Object.entries(selectedFilters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        if (priceRange.min) params.append('minPrice', priceRange.min);
        if (priceRange.max) params.append('maxPrice', priceRange.max);
        if (searchQuery) params.append('q', searchQuery);

        setIsSearchOptionsOpen(false);
        router.push(`/?${params.toString()}`);
    };

    // Format price for display
    const formatPrice = (num: number) => new Intl.NumberFormat('vi-VN').format(num);

    // Refs for price inputs to manage cursor
    const minPriceRef = useRef<HTMLInputElement>(null);
    const maxPriceRef = useRef<HTMLInputElement>(null);

    // Format price input with cursor management
    const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'min' | 'max') => {
        const input = e.target;
        const cursorPos = input.selectionStart || 0;
        const oldValue = input.value;

        // Count dots before cursor
        const dotsBeforeCursor = (oldValue.slice(0, cursorPos).match(/\./g) || []).length;

        // Get raw digits only
        const rawValue = oldValue.replace(/\D/g, '');

        // Store raw value
        setPriceRange(prev => ({ ...prev, [field]: rawValue }));

        // Calculate new cursor position after formatting
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

    // Display formatted price in input
    const displayFormattedPrice = (value: string) => {
        if (!value) return '';
        const num = parseInt(value);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    useEffect(() => {
        // Check for token in URL (from Google Auth callback)
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            localStorage.setItem('jwt_token', tokenParam);
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchUser(tokenParam);
        } else {
            const storedToken = localStorage.getItem('jwt_token');
            if (storedToken) {
                fetchUser(storedToken);
            }
        }
    }, [searchParams]);

    const fetchUser = async (token: string) => {
        try {
            const res = await fetch('http://localhost:3000/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setBalance(data.balance ? Number(data.balance) : 0);
            } else {
                // Token might be expired
                localStorage.removeItem('jwt_token');
                setUser(null);
            }
        } catch (e) {
            console.error("Failed to fetch user", e);
        }
    };

    const handleLogin = () => {
        router.push('/login');
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        setUser(null);
        setBalance(null);
        router.push('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-md -z-10" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                            <span className="text-black">4Gach</span>
                            <span className="text-[var(--jdm-red)]"> - JDM</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <div className="relative group">
                            <button className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider hover:text-[var(--jdm-red)] transition-colors h-16 text-gray-700">
                                Hãng xe
                                <ChevronDown className="w-4 h-4 ml-1" />
                            </button>
                            <div className="absolute top-full left-0 w-48 bg-white border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                                <Link
                                    href="/"
                                    className={`block px-4 py-3 text-sm font-bold uppercase border-b border-gray-100 transition-colors ${!currentMake ? 'text-[var(--jdm-red)]' : 'text-gray-700 hover:text-[var(--jdm-red)]'}`}
                                >
                                    Tất cả
                                </Link>
                                {BRANDS.map(brand => (
                                    <Link
                                        key={brand}
                                        href={`/?make=${brand.toLowerCase()}`}
                                        className={`block px-4 py-3 text-sm font-bold uppercase border-b border-gray-100 last:border-0 transition-colors ${currentMake?.toLowerCase() === brand.toLowerCase() ? 'text-[var(--jdm-red)]' : 'text-gray-700 hover:text-[var(--jdm-red)]'}`}
                                    >
                                        {brand}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <Link
                            href="/info"
                            className="text-sm font-bold uppercase tracking-wider hover:text-[var(--jdm-red)] transition-colors h-16 flex items-center text-gray-700"
                        >
                            Thông tin
                        </Link>
                        <Link
                            href="/sell"
                            className="px-4 py-2 bg-[var(--jdm-red)] hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center"
                        >
                            Đăng bán xe
                        </Link>
                    </nav>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center flex-1 max-w-md mx-6 relative">
                        <div className="relative w-full flex items-center">
                            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(searchQuery ? `/?q=${encodeURIComponent(searchQuery)}` : '/');
                                    }
                                }}
                                placeholder="Tìm kiếm xe, dòng xe, mã gầm..."
                                className="w-full pl-10 pr-20 py-2 border border-gray-300 bg-white text-sm focus:outline-none focus:border-[var(--jdm-red)] transition-colors"
                            />
                            <div className="absolute right-1 flex items-center gap-1">
                                <button
                                    onClick={() => setIsSearchOptionsOpen(!isSearchOptionsOpen)}
                                    className="p-1.5 hover:bg-gray-100 transition-colors"
                                    title="Tùy chọn tìm kiếm nâng cao"
                                >
                                    <SlidersHorizontal className="w-4 h-4 text-gray-500 hover:text-[var(--jdm-red)]" />
                                </button>
                                <button
                                    onClick={() => {
                                        router.push(searchQuery ? `/?q=${encodeURIComponent(searchQuery)}` : '/');
                                    }}
                                    className="bg-black hover:bg-[var(--jdm-red)] text-white p-1.5 transition-colors"
                                    title="Tìm kiếm"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Search Options Dropdown */}
                        {isSearchOptionsOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setIsSearchOptionsOpen(false)}
                                />
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl z-40 p-4 max-h-[70vh] overflow-y-auto">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Bộ lọc thông minh</p>
                                        {smartFilters && (
                                            <span className="text-xs text-[var(--jdm-red)] font-bold">
                                                {smartFilters.count} xe phù hợp
                                            </span>
                                        )}
                                    </div>

                                    {isLoading && !smartFilters ? (
                                        <p className="text-xs text-gray-400 text-center py-4">Đang tải bộ lọc...</p>
                                    ) : smartFilters?.options ? (
                                        <div className="space-y-3">
                                            {/* Price Range Filter - Priority First */}
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
                                                <div className="text-xs text-gray-500">
                                                    <span className="font-medium">Năm:</span> {smartFilters.ranges.year.min} - {smartFilters.ranges.year.max}
                                                </div>
                                            )}

                                            {/* Dynamic filter sections - ordered by importance */}
                                            {filterOrder.map(category => {
                                                const options = smartFilters.options[category];
                                                if (!options || options.length === 0) return null;

                                                return (
                                                    <div key={category} className="border-t border-gray-100 pt-2">
                                                        <label className="text-xs font-bold text-[var(--jdm-red)] uppercase">
                                                            {filterLabels[category]}
                                                            {selectedFilters[category] && (
                                                                <span className="ml-2 text-white bg-black px-1">
                                                                    {selectedFilters[category]}
                                                                </span>
                                                            )}
                                                        </label>
                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                            {options.map((value: string) => (
                                                                <button
                                                                    key={value}
                                                                    onClick={() => selectFilter(category, value)}
                                                                    className={`px-2 py-1 text-xs font-bold uppercase transition-colors ${selectedFilters[category] === value
                                                                        ? 'bg-[var(--jdm-red)] text-white'
                                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

                                    {/* Selected Filters Summary */}
                                    {Object.keys(selectedFilters).length > 0 && (
                                        <div className="border-t border-gray-200 mt-3 pt-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-gray-700 uppercase">
                                                    Đã chọn ({Object.keys(selectedFilters).length})
                                                </label>
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-xs text-gray-500 hover:text-[var(--jdm-red)]"
                                                >
                                                    Xóa tất cả
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(selectedFilters).map(([category, value]) => (
                                                    <span
                                                        key={category}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-[var(--jdm-red)] text-white"
                                                    >
                                                        <span className="opacity-70">{filterLabels[category]}:</span> {value}
                                                        <button
                                                            onClick={() => selectFilter(category, value)}
                                                            className="hover:bg-white/20 rounded-full p-0.5"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Loading overlay */}
                                    {isLoading && smartFilters && (
                                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                            <p className="text-xs text-gray-500">Đang cập nhật...</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={performSearch}
                                        className="w-full mt-3 bg-black hover:bg-[var(--jdm-red)] text-white py-2 text-sm font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Tìm kiếm {smartFilters?.count ? `(${smartFilters.count} kết quả)` : ''}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* User / Login */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center justify-center p-1 hover:bg-gray-100 transition focus:outline-none rounded-none"
                                >
                                    <div className="w-9 h-9 rounded-none bg-black flex items-center justify-center text-sm font-bold text-white border border-gray-200">
                                        {user.name?.[0] || 'U'}
                                    </div>
                                </button>

                                {isUserMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30 cursor-default"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsUserMenuOpen(false);
                                            }}
                                        />
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-none shadow-xl border border-gray-200 py-2 z-40 transform origin-top-right transition-all ring-1 ring-black/5">
                                            <Link
                                                href={`/seller/${generateSellerSlug(user)}`}
                                                className="block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition group"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <p className="text-sm font-bold text-black group-hover:text-[var(--jdm-red)] transition-colors uppercase tracking-tight">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                <p className="text-xs text-[var(--jdm-red)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold">XEM HỒ SƠ →</p>
                                            </Link>

                                            {user.isAdmin && (
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <Link
                                                        href="/admin"
                                                        className="flex items-center gap-3 bg-black text-white p-2 hover:bg-[var(--jdm-red)] transition group"
                                                        onClick={() => setIsUserMenuOpen(false)}
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center">
                                                            <SlidersHorizontal className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs uppercase font-bold text-gray-300">Quản trị</p>
                                                            <p className="text-sm font-bold">Admin Dashboard</p>
                                                        </div>
                                                    </Link>
                                                </div>
                                            )}

                                            <div className="px-4 py-3">
                                                <Link
                                                    href="/wallet"
                                                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-2 rounded-none transition group border border-transparent hover:border-gray-200"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <div className="w-8 h-8 rounded-none bg-black flex items-center justify-center group-hover:bg-[var(--jdm-red)] transition">
                                                        <Wallet className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold">Ví của tôi</p>
                                                        <p className="text-sm font-black text-black">
                                                            {balance !== null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance) : '...'}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>

                                            <div className="border-t border-gray-100 mt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-3 text-sm text-black hover:text-[var(--jdm-red)] hover:bg-gray-50 font-bold flex items-center gap-2 transition uppercase tracking-wide"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="bg-black hover:bg-[var(--jdm-red)] text-white px-6 py-2 rounded-none text-sm font-bold uppercase tracking-wider transition-colors duration-300"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-black p-2"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <div className="border-b border-gray-200 pb-2 mb-2">
                            <p className="px-3 py-2 text-sm font-black text-[var(--jdm-red)] uppercase tracking-wider">Hãng xe</p>
                            <div className="grid grid-cols-2 gap-1 px-3">
                                <Link
                                    href="/"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block p-2 text-sm font-bold uppercase ${!currentMake ? 'text-[var(--jdm-red)]' : 'text-gray-800 hover:text-[var(--jdm-red)]'}`}
                                >
                                    Tất cả
                                </Link>
                                {BRANDS.map(brand => (
                                    <Link
                                        key={brand}
                                        href={`/?make=${brand.toLowerCase()}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block p-2 text-sm font-bold uppercase ${currentMake?.toLowerCase() === brand.toLowerCase() ? 'text-[var(--jdm-red)]' : 'text-gray-800 hover:text-[var(--jdm-red)]'}`}
                                    >
                                        {brand}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Info Link */}
                        <Link
                            href="/info"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-3 py-3 text-sm font-bold uppercase text-gray-800 hover:text-[var(--jdm-red)] border-b border-gray-200"
                        >
                            Thông tin
                        </Link>

                        {/* Sell Button */}
                        <Link
                            href="/sell"
                            onClick={() => setIsMenuOpen(false)}
                            className="block mx-3 mt-3 px-4 py-3 bg-[var(--jdm-red)] hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wide text-center transition-colors"
                        >
                            Đăng bán xe
                        </Link>

                        {user ? (
                            <div className="border-t border-gray-200 mt-4 pt-4 px-3">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-none bg-black flex items-center justify-center text-white font-bold border border-gray-200">
                                        {user.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-black font-bold uppercase">{user.name}</p>
                                        <p className="text-[var(--jdm-red)] text-sm font-black">
                                            {balance !== null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance) : '...'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left text-red-500 font-medium py-2"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="w-full text-left text-white bg-black hover:bg-[var(--jdm-red)] px-4 py-3 rounded-none text-base font-bold mt-4 uppercase tracking-wider transition-colors"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
