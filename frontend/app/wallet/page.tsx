'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowLeft, History } from 'lucide-react';

export default function WalletPage() {
    const [balance, setBalance] = useState<number | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('jwt_token');
            if (!token) return;

            try {
                const res = await fetch('http://localhost:3000/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setBalance(Number(data.balance));
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Quay lại trang chủ
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Wallet Card */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <p className="text-gray-400 text-sm font-medium mb-1">Tổng số dư</p>
                                        <h2 className="text-4xl font-bold">
                                            {balance !== null
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance)
                                                : '...'}
                                        </h2>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Link href="/wallet/deposit" className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-lg shadow-green-500/20">
                                        <div className="w-8 h-8 bg-green-400/30 rounded-full flex items-center justify-center">
                                            <ArrowDownLeft className="w-4 h-4" />
                                        </div>
                                        Nạp tiền
                                    </Link>
                                    <Link href="/wallet/withdraw" className="bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition backdrop-blur-sm border border-white/10">
                                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                        Rút tiền
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions Placeholder */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-gray-400" />
                                    Lịch sử giao dịch
                                </h3>
                                <button className="text-sm text-gray-500 hover:text-gray-900 transition">Xem tất cả</button>
                            </div>

                            <div className="text-center py-10 text-gray-400">
                                <p>Chưa có giao dịch nào gần đây</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin tài khoản</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Chủ tài khoản</p>
                                    <p className="font-medium text-gray-900">{user?.name || '...'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                                    <p className="font-medium text-gray-900">{user?.email || '...'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Trạng thái</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                        Đang hoạt động
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Help / Support */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
                            <h3 className="text-lg font-bold mb-2">Cần hỗ trợ?</h3>
                            <p className="text-indigo-100 text-sm mb-4">Nếu bạn gặp vấn đề khi nạp/rút tiền, hãy liên hệ với chúng tôi.</p>
                            <button className="w-full bg-white text-indigo-600 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                                Liên hệ CSKH
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
