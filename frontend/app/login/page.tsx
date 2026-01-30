'use client';

import { Map } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
    const handleGoogleLogin = () => {
        window.location.href = authApi.getGoogleLoginUrl();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-6 sm:mb-8 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                        <Map className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">iCheck</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">Sổ tay bản đồ cá nhân của bạn</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center mb-2">
                        Chào mừng bạn!
                    </h2>
                    <p className="text-gray-500 text-center text-xs sm:text-sm mb-5 sm:mb-6">
                        Đăng nhập để bắt đầu lưu trữ những địa điểm yêu thích
                    </p>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm text-sm sm:text-base"
                    >
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
                </div>

                {/* Footer */}
                <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-400 text-center">
                    &ldquo;Google Maps là bản đồ của mọi người, còn đây là bản đồ của riêng bạn&rdquo;
                </p>
            </div>
        </div>
    );
}


