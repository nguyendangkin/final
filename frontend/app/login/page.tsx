'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            router.push(redirectTo);
        }
    }, [router, redirectTo]);

    const handleGoogleLogin = () => {
        // Store the redirect URL to use after login
        localStorage.setItem('login_redirect', redirectTo);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        window.location.href = `${apiUrl}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black">
                        4GACH
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Sàn giao dịch xe JDM hàng đầu Việt Nam
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-gray-200 p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-center mb-6 text-black">
                        Đăng nhập
                    </h2>

                    <p className="text-gray-500 text-center mb-8">
                        Đăng nhập để đăng bán xe và quản lý tin đăng của bạn
                    </p>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all font-semibold text-gray-700"
                    >
                        {/* Google Icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                        Đăng nhập với Google
                    </button>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-gray-400 text-sm">hoặc</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Back to Home */}
                    <button
                        onClick={() => router.push('/')}
                        className="w-full px-6 py-3 text-gray-500 hover:text-black transition-colors font-medium"
                    >
                        ← Quay lại trang chủ
                    </button>
                </div>

                {/* Footer text */}
                <p className="text-center text-gray-400 text-sm mt-8">
                    Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng của 4GACH
                </p>
            </div>
        </div>
    );
}
