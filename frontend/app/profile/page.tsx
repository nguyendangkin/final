'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores';
import { Spinner } from '@/components/ui';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace(`/profile/${user.id}`);
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Xem Profile</h1>
                <p className="text-gray-500 mb-8">
                    Đăng nhập để xem profile của bạn và chia sẻ với mọi người.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                    <LogIn className="w-5 h-5" />
                    Đăng nhập
                </Link>
            </div>
        );
    }

    // Show loading while redirecting
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Spinner size="lg" />
        </div>
    );
}
