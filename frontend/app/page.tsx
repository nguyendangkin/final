'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, LogIn, Sparkles } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankBin, setBankBin] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(''); // PayOS might need this or just number? PayoutRequest doesn't strict check name often but good to have
  const [banks, setBanks] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Fetch banks
    const fetchBanks = async () => {
      try {
        const res = await fetch('http://localhost:3000/payment/banks');
        const data = await res.json();
        if (data?.data) {
          setBanks(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch banks', e);
      }
    };
    fetchBanks();

    const fetchBalance = async (token: string) => {
      try {
        const res = await fetch('http://localhost:3000/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setBalance(data.balance ? Number(data.balance) : 0);
        }
      } catch (e) {
        console.error('Failed to fetch balance', e);
      }
    };

    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      localStorage.setItem('jwt_token', tokenParam);
      setToken(tokenParam);
      fetchBalance(tokenParam); // Fetch immediately
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    } else {
      const storedToken = localStorage.getItem('jwt_token');
      if (storedToken) {
        setToken(storedToken);
        fetchBalance(storedToken); // Fetch on load
      }
    }
  }, [searchParams]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
  };

  const handleDeposit = async () => {
    if (!amount || parseInt(amount) < 2000) {
      alert('Số tiền tối thiểu là 2000 VNĐ');
      return;
    }
    setLoading(true);
    try {
      // Simple JWT decode to get userId (insecure for real apps but ok for demo)
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub; // Assuming 'sub' is userId. If NestJS JWT strategy uses 'id', check that.
      // Standard NestJS Passport JWT usually puts 'sub' as userId.

      const res = await fetch('http://localhost:3000/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseInt(amount),
        })
      });
      const data = await res.json();
      if (data.error === 0) {
        window.location.href = data.data.checkoutUrl;
      } else {
        alert(data.message);
      }
    } catch (e: any) {
      alert('Có lỗi xảy ra: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseInt(withdrawAmount) < 2000) {
      alert('Số tiền rút tối thiểu là 2000 VNĐ');
      return;
    }
    if (!bankBin || !accountNumber) {
      alert('Vui lòng nhập đầy đủ thông tin ngân hàng');
      return;
    }
    setLoading(true);
    try {
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      const res = await fetch('http://localhost:3000/payment/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseInt(withdrawAmount),
          bankBin,
          accountNumber,
          accountName: accountName || 'NO NAME'
        })
      });
      const data = await res.json();
      if (data.error === 0) {
        alert('Yêu cầu rút tiền thành công!');
        setShowWithdraw(false);
        // Refresh balance
        window.location.reload();
      } else {
        alert(data.message);
      }
    } catch (e: any) {
      alert('Có lỗi xảy ra: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        {showDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Nạp tiền vào tài khoản</h2>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền (min 2000)"
                className="w-full p-3 border rounded-xl mb-2"
              />
              <p className="text-sm text-gray-500 mb-4">Phí giao dịch: 2,000đ. Tổng thanh toán: {amount ? parseInt(amount) + 2000 : 0}đ</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                <button
                  onClick={() => setShowDeposit(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-xl"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Rút tiền về ngân hàng</h2>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Nhập số tiền (min 2000)"
                className="w-full p-3 border rounded-xl mb-2"
              />
              <select
                value={bankBin}
                onChange={(e) => setBankBin(e.target.value)}
                className="w-full p-3 border rounded-xl mb-2 bg-white"
              >
                <option value="">Chọn ngân hàng</option>
                {banks.map((bank) => (
                  <option key={bank.bin} value={bank.bin}>
                    {bank.shortName} - {bank.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Số tài khoản"
                className="w-full p-3 border rounded-xl mb-2"
              />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Tên chủ tài khoản (Optional)"
                className="w-full p-3 border rounded-xl mb-2"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl"
                >
                  {loading ? 'Đang xử lý...' : 'Rút tiền'}
                </button>
                <button
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-xl"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-indigo-100">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng trở lại!</h1>
          <p className="text-gray-500 mb-8">Bạn đã đăng nhập thành công.</p>

          <div className="mb-6">
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-1">Số dư tài khoản</p>
            <h2 className="text-4xl font-extrabold text-indigo-600">
              {balance !== null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance) : '...'}
            </h2>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex-1 py-3 px-6 mb-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Nạp tiền
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 py-3 px-6 mb-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              Rút tiền
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Bắt đầu ngay
          </h1>
          <p className="text-gray-500 mb-8 text-lg">
            Tham gia cộng đồng của chúng tôi ngay hôm nay.
          </p>

          <button
            onClick={handleLogin}
            className="group w-full py-4 px-6 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="group-hover:text-indigo-600 transition-colors">Tiếp tục với Google</span>
          </button>

          <p className="mt-8 text-xs text-gray-400">
            Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}
