'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { Spinner } from '@/components/ui';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, fetchUser } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token && refreshToken) {
            setTokens(token, refreshToken);
            fetchUser().then(() => {
                router.replace('/');
            });
        } else if (token) {
            // Fallback for backward compatibility (no refresh token)
            setTokens(token, '');
            fetchUser().then(() => {
                router.replace('/');
            });
        } else {
            router.replace('/login');
        }
    }, [searchParams, setTokens, fetchUser, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500">Đang xác thực...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500">Đang xác thực...</p>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}

