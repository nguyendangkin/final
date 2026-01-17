'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Loader2, Building, User, Hash } from 'lucide-react';
import Link from 'next/link';

export default function WithdrawPage() {
    const [amount, setAmount] = useState<number>(0);
    const [banks, setBanks] = useState<any[]>([]);
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch('http://localhost:3000/payment/banks');
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        setBanks(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch banks", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchBanks();
    }, []);

    const handleWithdraw = async () => {
        if (!selectedBank || !accountNumber || !accountName || amount <= 0) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                router.push('/');
                return;
            }

            const res = await fetch('http://localhost:3000/payment/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    bankBin: selectedBank,
                    accountNumber,
                    accountName
                })
            });

            const data = await res.json();

            if (res.ok && data.error === 0) {
                setSuccess('Yêu cầu rút tiền đã được tạo thành công!');
                setAmount(0);
                setAccountNumber('');
                setAccountName('');
                setSelectedBank('');
            } else {
                setError(data.message || 'Có lỗi xảy ra khi tạo yêu cầu rút tiền');
            }
        } catch (err) {
            console.error(err);
            setError('Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

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
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-wide">Rút Tiền Về Ngân Hàng</h1>
                        <p className="text-gray-400 mt-1 text-sm">Xử lý trong vòng 24h làm việc</p>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Bank Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngân hàng</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="focus:ring-black focus:border-black block w-full pl-10 py-3 border-gray-300 rounded-none bg-white"
                                >
                                    <option value="">Chọn ngân hàng</option>
                                    {banks.map((bank: any) => (
                                        <option key={bank.bin || bank.id} value={bank.bin}>
                                            {bank.shortName || bank.name} - {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Hash className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="focus:ring-black focus:border-black block w-full pl-10 py-3 border-gray-300 rounded-none"
                                    placeholder="Nhập số tài khoản"
                                />
                            </div>
                        </div>

                        {/* Account Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tên chủ tài khoản</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                                    className="focus:ring-black focus:border-black block w-full pl-10 py-3 border-gray-300 rounded-none uppercase"
                                    placeholder="NGUYEN VAN A"
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền muốn rút</label>
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

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center font-medium">
                                {success}
                            </div>
                        )}

                        <button
                            onClick={handleWithdraw}
                            disabled={loading || amount <= 0}
                            className="w-full bg-[var(--jdm-red)] hover:bg-black text-white font-bold py-3.5 rounded-none shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác Nhận Rút Tiền'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
