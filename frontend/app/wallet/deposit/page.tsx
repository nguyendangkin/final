'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DepositPage() {
    const [amount, setAmount] = useState<number>(50000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const quickAmounts = [20000, 50000, 100000, 200000, 500000, 1000000];

    const handleDeposit = async () => {
        if (amount < 2000) {
            setError('Số tiền nạp tối thiểu là 2,000đ');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                router.push('/');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/payment/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await res.json();

            if (res.ok && data.error === 0 && data.data?.checkoutUrl) {
                window.location.href = data.data.checkoutUrl;
            } else {
                setError(data.message || 'Có lỗi xảy ra khi tạo giao dịch');
            }
        } catch (err) {
            console.error(err);
            setError('Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-red-500/30">
            <div className="max-w-md mx-auto">
                <div className="mb-6">
                    <Link href="/" className="flex items-center text-black hover:text-[var(--jdm-red)] transition font-bold uppercase tracking-wide text-sm">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Quay lại
                    </Link>
                </div>

                <div className="bg-white rounded-none shadow-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 bg-black text-white text-center border-b border-gray-800">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-wide">Nạp Tiền Vào Ví</h1>
                        <p className="text-gray-400 mt-1 text-sm">An toàn - Nhanh chóng - Tiện lợi</p>
                    </div>

                    <div className="p-8">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nhập số tiền muốn nạp</label>
                            <div className="relative rounded-md shadow-sm">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="focus:ring-black focus:border-black block w-full pl-4 pr-12 py-3 text-lg border-gray-300 rounded-none font-bold"
                                    placeholder="0"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm font-bold">VND</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {quickAmounts.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val)}
                                    className={`py-2 px-2 text-sm font-bold rounded-none transition border ${amount === val
                                        ? 'bg-black border-black text-white ring-1 ring-black'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--jdm-red)] hover:text-[var(--jdm-red)] hover:bg-red-50'
                                        }`}
                                >
                                    {new Intl.NumberFormat('vi-VN', { style: 'decimal' }).format(val)}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center justify-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleDeposit}
                            disabled={loading || amount <= 0}
                            className="w-full bg-[var(--jdm-red)] hover:bg-red-700 text-white font-bold py-3.5 rounded-none shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Nạp Ngay qua PayOS'
                            )}
                        </button>

                        <div className="mt-6 text-center text-xs text-gray-400">
                            Bằng việc tiếp tục, bạn đồng ý với các điều khoản giao dịch của chúng tôi.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
