'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { Navbar, FAB } from '@/components/layout';
import { ToastContainer, Spinner } from '@/components/ui';

const publicPaths = ['/login', '/auth/callback'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        fetchUser().finally(() => setIsInitialized(true));
    }, [fetchUser]);

    useEffect(() => {
        if (!isInitialized || isLoading) return;

        const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

        if (!isAuthenticated && !isPublicPath) {
            router.replace('/login');
        }
    }, [isAuthenticated, isLoading, isInitialized, pathname, router]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50">
                <Spinner size="lg" />
            </div>
        );
    }

    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
    const showLayout = isAuthenticated && !isPublicPath;

    return (
        <>
            {showLayout && <Navbar />}
            <main className={showLayout ? 'pt-14' : ''}>
                {children}
            </main>
            {showLayout && <FAB />}
            <ToastContainer />
        </>
    );
}

export default AuthProvider;
