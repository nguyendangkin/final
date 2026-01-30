'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Map, List, FolderTree, User } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';

export function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuthStore();

    const navItems = [
        { href: '/', icon: Map, label: 'Bản đồ' },
        { href: '/locations', icon: List, label: 'Địa điểm' },
        { href: '/categories', icon: FolderTree, label: 'Danh mục' },
    ];

    if (!isAuthenticated) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Map className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 hidden sm:block">iCheck</span>
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        {navItems.map(({ href, icon: Icon, label }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors min-w-0 ${isActive
                                        ? 'bg-teal-50 text-teal-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="hidden sm:block truncate">{label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            {user?.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt={user.displayName}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                {user?.displayName}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
