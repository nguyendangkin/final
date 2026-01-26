'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowLeft, History } from 'lucide-react';
import WalletSkeleton from '@/components/WalletSkeleton';
import { authFetch } from '@/lib/api';

export default function WalletPage() {
    const [balance, setBalance] = useState<number | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await authFetch('/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setBalance(Number(data.user?.balance || 0));
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchUser();
    }, []);

    if (!user) return <WalletSkeleton />;

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-red-500/30">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/" className="flex items-center text-black hover:text-[var(--jdm-red)] transition font-bold uppercase tracking-wide text-sm">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Quay lại trang chủ
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Wallet Card */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-black rounded-none p-8 text-white shadow-xl relative overflow-hidden border border-gray-900">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
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
                                    <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center backdrop-blur-sm border border-white/20">
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <Link href="/wallet/deposit" className="bg-[var(--jdm-red)] hover:bg-red-700 text-white py-3 px-4 rounded-none flex items-center justify-center gap-2 font-bold transition shadow-lg uppercase tracking-wide">
                                        <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                                            <ArrowDownLeft className="w-4 h-4" />
                                        </div>
                                        Nạp tiền
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions Placeholder */}
                        <div className="bg-white rounded-none p-6 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-black flex items-center gap-2 uppercase tracking-wide">
                                    <History className="w-5 h-5 text-[var(--jdm-red)]" />
                                    Lịch sử giao dịch
                                </h3>
                                <button className="text-sm text-gray-500 hover:text-black transition font-bold uppercase">Xem tất cả</button>
                            </div>

                            <div className="text-center py-10 text-gray-400 font-medium italic">
                                <p>Chưa có giao dịch nào gần đây</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-none p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide">Thông tin tài khoản</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Chủ tài khoản</p>
                                    <p className="font-bold text-black text-lg">{user?.name || '...'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Email</p>
                                    <p className="font-bold text-black">{user?.email || '...'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Trạng thái</p>
                                    <span className="inline-flex items-center px-3 py-1 rounded-none text-xs font-bold bg-green-100 text-green-800 mt-1 uppercase tracking-wider">
                                        Đang hoạt động
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Help / Support */}
                        <div className="bg-black rounded-none p-6 text-white shadow-lg border border-gray-900">
                            <h3 className="text-lg font-bold mb-2 uppercase tracking-wide">Cần hỗ trợ?</h3>
                            <p className="text-gray-400 text-sm mb-4">Nếu bạn gặp vấn đề khi nạp/rút tiền, hãy liên hệ với chúng tôi.</p>
                            <button className="w-full bg-white text-black py-3 rounded-none font-bold text-sm hover:bg-[var(--jdm-red)] hover:text-white transition uppercase tracking-wide">
                                Liên hệ CSKH
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
