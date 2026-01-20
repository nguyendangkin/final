'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatsSkeleton from '@/components/StatsSkeleton';

export default function AdminStatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch stats
        fetch('http://localhost:3000/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    router.push('/');
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then(statsData => {
                setStats(statsData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching stats:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Thống kê hệ thống</h1>
                        <p className="text-sm text-gray-500">Tổng quan số liệu user và bài đăng</p>
                    </div>
                    <Link href="/admin" className="text-sm font-bold uppercase hover:text-[var(--jdm-red)] transition-colors">
                        ← Quay lại Dashboard
                    </Link>
                </div>

                <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                        {/* Stats Section */}
                        {loading ? <StatsSkeleton /> : stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Users Stats */}
                                <div className="bg-gray-50 p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-xl text-gray-800 mb-6 uppercase border-b border-gray-300 pb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Người dùng <span className="ml-auto text-2xl text-blue-600">{stats.users.total}</span>
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                                            <p className="text-gray-600">Người bán</p>
                                            <p className="font-bold text-lg">{stats.users.sellers}</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                                            <p className="text-gray-600">Người mua</p>
                                            <p className="font-bold text-lg">{stats.users.nonSellers}</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                                            <p className="text-gray-600">Bị cấm bán</p>
                                            <p className="font-bold text-lg text-[var(--jdm-red)]">{stats.users.banned}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cars Stats */}
                                <div className="bg-gray-50 p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-xl text-gray-800 mb-6 uppercase border-b border-gray-300 pb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19H5V8h14m-3-5v2.206l-1.632 3.264h-8.736L4 10.206V5h12v.001zM7 15a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" />
                                        </svg>
                                        Bài đăng xe <span className="ml-auto text-2xl text-blue-600">{stats.cars.total}</span>
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                                            <p className="text-gray-600">Đang hiển thị</p>
                                            <p className="font-bold text-lg text-green-600">{stats.cars.available}</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-100">
                                            <p className="text-gray-600">Đã bán</p>
                                            <p className="font-bold text-lg text-blue-600">{stats.cars.sold}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
