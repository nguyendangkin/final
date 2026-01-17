'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, X, User, LogOut, Wallet } from 'lucide-react';
import { generateSellerSlug } from '@/lib/utils';

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
                        <Link href="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                            <span className="text-black">4Gach</span>
                            <span className="text-[var(--jdm-red)]"> - JDM</span>
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
