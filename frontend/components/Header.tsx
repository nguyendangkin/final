'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, User, LogOut, Wallet } from 'lucide-react';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

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
        window.location.href = 'http://localhost:3000/auth/google';
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
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                            FinaJDM
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">

                    </nav>

                    {/* User / Login */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-white">
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
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 transform origin-top-right transition-all">
                                            <Link
                                                href={`/seller/${user.id}`}
                                                className="block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition group"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                <p className="text-xs text-violet-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Xem hồ sơ của tôi →</p>
                                            </Link>

                                            <div className="px-4 py-3">
                                                <Link
                                                    href="/wallet"
                                                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition group"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition">
                                                        <Wallet className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ví của tôi</p>
                                                        <p className="text-sm font-bold text-green-600">
                                                            {balance !== null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance) : '...'}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>

                                            <div className="border-t border-gray-100 mt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 font-medium flex items-center gap-2 transition"
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
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold transition shadow-lg shadow-blue-500/30"
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

                        {user ? (
                            <div className="border-t border-gray-200 mt-4 pt-4 px-3">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                        {user.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-medium">{user.name}</p>
                                        <p className="text-green-600 text-sm font-bold">
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
                                className="w-full text-left text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-base font-bold mt-4"
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
