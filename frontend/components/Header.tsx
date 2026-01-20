'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, User, LogOut, Wallet, ChevronDown, Search, SlidersHorizontal, Info, Heart, Bell } from 'lucide-react';
import { generateSellerSlug } from '@/lib/utils';
import SmartFilter from './SmartFilter';

const BRANDS = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi',
    'Subaru', 'Suzuki', 'Daihatsu', 'Lexus', 'Acura', 'Infiniti'
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isBrandsOpen, setIsBrandsOpen] = useState(false);
    const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);


    // Smart filter states
    const [smartFilters, setSmartFilters] = useState<any>(null);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
    const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
    const [debouncedPriceRange, setDebouncedPriceRange] = useState(priceRange);
    const [isLoading, setIsLoading] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentMake = searchParams.get('make');



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
            fetchSmartFilters({}, debouncedPriceRange);
        }
    }, [isSearchOptionsOpen]);

    // Debounce price range
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPriceRange(priceRange);
        }, 500);

        return () => clearTimeout(timer);
    }, [priceRange]);

    // Re-fetch when filters or debounced price range change
    useEffect(() => {
        if (isSearchOptionsOpen || isMobileFilterOpen) {
            fetchSmartFilters(selectedFilters, debouncedPriceRange);
        }
    }, [selectedFilters, debouncedPriceRange]);

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
            } else {
                setIsAuthChecking(false);
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
                // Fetch notification count
                fetchNotificationCount(token);
            } else {
                // Token might be expired
                localStorage.removeItem('jwt_token');
                setUser(null);
            }
        } catch (e) {
            console.error("Failed to fetch user", e);
        } finally {
            setIsAuthChecking(false);
        }
    };

    const handleLogin = () => {
        setIsMenuOpen(false);
        router.push('/login');
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        setUser(null);
        setBalance(null);
        setNotificationCount(0);
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
        router.push('/');
    };

    const fetchNotificationCount = async (token: string) => {
        try {
            const res = await fetch('http://localhost:3000/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotificationCount(data.total || 0);
            }
        } catch (e) {
            console.error('Failed to fetch notification count', e);
        }
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
                    <nav className="hidden xl:flex space-x-8">
                        <div
                            className="relative"
                            onMouseEnter={() => setIsBrandsOpen(true)}
                            onMouseLeave={() => setIsBrandsOpen(false)}
                        >
                            <button
                                onClick={() => setIsBrandsOpen(!isBrandsOpen)}
                                className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider hover:text-[var(--jdm-red)] transition-colors h-16 text-gray-700"
                            >
                                Hãng xe
                                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isBrandsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`absolute top-full left-0 w-48 bg-white border border-gray-200 shadow-xl transition-all duration-200 transform z-50 ${isBrandsOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                                <Link
                                    href="/"
                                    onClick={() => setIsBrandsOpen(false)}
                                    className={`block px-4 py-3 text-sm font-bold uppercase border-b border-gray-100 transition-colors ${!currentMake ? 'text-[var(--jdm-red)]' : 'text-gray-700 hover:text-[var(--jdm-red)]'}`}
                                >
                                    Tất cả
                                </Link>
                                {BRANDS.map(brand => (
                                    <Link
                                        key={brand}
                                        href={`/?make=${brand.toLowerCase()}`}
                                        onClick={() => setIsBrandsOpen(false)}
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
                            Về 4Gach
                        </Link>
                        <Link
                            href="/sell"
                            className="px-4 py-2 bg-[var(--jdm-red)] hover:bg-red-700 text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center"
                        >
                            Đăng bán xe
                        </Link>
                    </nav>

                    {/* Search Bar */}
                    <div className="hidden xl:flex items-center flex-1 max-w-md mx-6 relative">
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
                                    <SmartFilter
                                        isLoading={isLoading}
                                        smartFilters={smartFilters}
                                        selectedFilters={selectedFilters}
                                        priceRange={priceRange}
                                        onSelectFilter={selectFilter}
                                        onClearFilters={clearFilters}
                                        onPriceChange={(min: string, max: string) => setPriceRange({ min, max })}
                                        onSearch={performSearch}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* User / Login */}
                    <div className="flex items-center space-x-4 ml-auto xl:ml-0">
                        {isAuthChecking ? (
                            <div className="flex items-center justify-center p-1">
                                <div className="w-9 h-9 rounded-none bg-gray-200 animate-pulse border border-gray-200" />
                            </div>
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="relative flex items-center justify-center p-1 hover:bg-gray-100 transition focus:outline-none rounded-none"
                                >
                                    <div className="w-9 h-9 rounded-none bg-black flex items-center justify-center text-sm font-bold text-white border border-gray-200">
                                        {user.name?.[0] || 'U'}
                                    </div>
                                    {notificationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-[var(--jdm-red)] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </span>
                                    )}
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

                                            <div className="px-4 py-3 pt-0">
                                                <Link
                                                    href="/favorites"
                                                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-2 rounded-none transition group border border-transparent hover:border-gray-200"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <div className="w-8 h-8 rounded-none bg-black flex items-center justify-center group-hover:bg-[var(--jdm-red)] transition">
                                                        <Heart className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold">Yêu thích</p>
                                                        <p className="text-xs font-bold text-black">
                                                            Xe đã lưu
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>

                                            <div className="px-4 py-3 pt-0">
                                                <Link
                                                    href="/notifications"
                                                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-2 rounded-none transition group border border-transparent hover:border-gray-200"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <div className="relative w-8 h-8 rounded-none bg-black flex items-center justify-center group-hover:bg-[var(--jdm-red)] transition">
                                                        <Bell className="w-4 h-4 text-white" />
                                                        {notificationCount > 0 && (
                                                            <span className="absolute -top-1 -right-1 bg-[var(--jdm-red)] group-hover:bg-black text-white text-[10px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                                                                {notificationCount > 99 ? '99+' : notificationCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold">Thông báo</p>
                                                        <p className="text-xs font-bold text-black">
                                                            {notificationCount > 0 ? `${notificationCount > 99 ? '99+' : notificationCount} tin mới` : 'Không có tin mới'}
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
                                className="hidden xl:block bg-black hover:bg-[var(--jdm-red)] text-white px-6 py-2 rounded-none text-sm font-bold uppercase tracking-wider transition-colors duration-300"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="xl:hidden flex items-center ml-4">
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
            {
                isMenuOpen && (
                    <div className="xl:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {/* Mobile Search & Filter */}
                            <div className="mb-4 px-2">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    router.push(searchQuery ? `/?q=${encodeURIComponent(searchQuery)}` : '/');
                                                    setIsMenuOpen(false);
                                                }
                                            }}
                                            placeholder="Tìm kiếm xe..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-sm font-medium focus:outline-none focus:border-[var(--jdm-red)] transition-colors"
                                        />
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!isMobileFilterOpen && !smartFilters) {
                                                fetchSmartFilters(selectedFilters, priceRange);
                                            }
                                            setIsMobileFilterOpen(!isMobileFilterOpen);
                                        }}
                                        className={`p-2.5 border transition-colors flex items-center justify-center ${isMobileFilterOpen || Object.keys(selectedFilters).length > 0
                                            ? 'bg-[var(--jdm-red)] border-[var(--jdm-red)] text-white'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Mobile Smart Filters */}
                                {isMobileFilterOpen && (
                                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 shadow-inner">
                                        <SmartFilter
                                            isLoading={isLoading}
                                            smartFilters={smartFilters}
                                            selectedFilters={selectedFilters}
                                            priceRange={priceRange}
                                            onSelectFilter={selectFilter}
                                            onClearFilters={clearFilters}
                                            onPriceChange={(min: string, max: string) => setPriceRange({ min, max })}
                                            onSearch={() => {
                                                performSearch();
                                                setIsMenuOpen(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
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

                            {isAuthChecking ? (
                                <div className="px-3 py-4 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-[var(--jdm-red)] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : !user && (
                                <div className="mx-3 mt-3">
                                    <button
                                        onClick={handleLogin}
                                        className="block w-full px-4 py-3 bg-black hover:bg-[var(--jdm-red)] text-white text-sm font-bold uppercase tracking-wide text-center transition-colors"
                                    >
                                        Đăng nhập
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </header >
    );
}
