'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, LogIn, Sparkles } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      localStorage.setItem('jwt_token', tokenParam);
      setToken(tokenParam);
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    } else {
      const storedToken = localStorage.getItem('jwt_token');
      if (storedToken) setToken(storedToken);
    }
  }, [searchParams]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
  };

  if (token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-indigo-100">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-500 mb-8">You have successfully logged in.</p>
          <button
            onClick={handleLogout}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            Sign Out
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
            Get Started
          </h1>
          <p className="text-gray-500 mb-8 text-lg">
            Join our community today.
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
            <span className="group-hover:text-indigo-600 transition-colors">Continue with Google</span>
          </button>

          <p className="mt-8 text-xs text-gray-400">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
