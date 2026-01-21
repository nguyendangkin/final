'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminDashboardSkeleton from '@/components/AdminDashboardSkeleton';

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        fetch(`${apiUrl}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.isAdmin) {
                    router.push('/');
                    return;
                }
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
            });
    }, []);

    if (loading) {
        return <AdminDashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
                    <div className="px-4 py-5 sm:px-6 bg-black text-white">
                        <h3 className="text-lg leading-6 font-bold uppercase tracking-wider">Admin Dashboard</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-300">Quản lý hệ thống sukasuka</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase">Xin chào, {user.name}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Card 1 */}
                            <Link href="/admin/cars" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Quản lý xe</h3>
                                    <p className="text-sm text-gray-500 mt-2">Xem và duyệt các xe đang bán</p>
                                </div>
                            </Link>

                            <Link href="/admin/approvals" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Duyệt bài đăng</h3>
                                    <p className="text-sm text-gray-500 mt-2">Duyệt 3 bài đầu tiên của thành viên mới</p>
                                </div>
                            </Link>

                            {/* Card 2 */}
                            <Link href="/admin/users" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Quản lý người dùng</h3>
                                    <p className="text-sm text-gray-500 mt-2">Xem danh sách người dùng và cấp quyền</p>
                                </div>
                            </Link>

                            {/* Card 3 - Stats */}
                            <Link href="/admin/stats" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Thống kê hệ thống</h3>
                                    <p className="text-sm text-gray-500 mt-2">Xem số liệu người dùng và bài đăng</p>
                                </div>
                            </Link>

                            <Link href="/admin/reports" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Quản lý Báo cáo</h3>
                                    <p className="text-sm text-gray-500 mt-2">Xem và xử lý các bài đăng bị tố cáo</p>
                                </div>
                            </Link>

                            <Link href="/admin/tags" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Quản lý Tags</h3>
                                    <p className="text-sm text-gray-500 mt-2">Xóa tags rác và xử phạt người spam</p>
                                </div>
                            </Link>

                            <Link href="/admin/announcements" className="block">
                                <div className="border border-gray-200 p-4 hover:border-[var(--jdm-red)] transition cursor-pointer group h-full">
                                    <h3 className="font-bold uppercase text-gray-900 group-hover:text-[var(--jdm-red)]">Thông báo hệ thống</h3>
                                    <p className="text-sm text-gray-500 mt-2">Viết và quản lý thông báo cho người dùng</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
