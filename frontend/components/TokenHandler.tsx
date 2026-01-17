'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function TokenLogic() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            localStorage.setItem('jwt_token', tokenParam);
            // Remove token from URL to clean it up
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.toString());

            // Force reload to ensure header picks up the token if needed, 
            // or just rely on state if the app is reactive enough.
            // Based on previous logic, a reload or hard set might be desired,
            // but let's try a cleaner replaceState first. 
            // If the header relies on a window event or polling, we might need dispatchEvent.
            window.dispatchEvent(new Event('storage'));
        }
    }, [searchParams, router]);

    return null;
}

export default function TokenHandler() {
    return (
        <Suspense fallback={null}>
            <TokenLogic />
        </Suspense>
    );
}
