'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function TokenLogic() {
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for login success from OAuth callback (now using cookies)
        const loginStatus = searchParams.get('login');
        if (loginStatus === 'success') {
            // Token is now in HTTP-only cookie, just clean up the URL
            const url = new URL(window.location.href);
            url.searchParams.delete('login');
            window.history.replaceState({}, '', url.toString());

            // Trigger a reload to refresh auth state across the app
            window.dispatchEvent(new Event('auth-change'));
        }
    }, [searchParams]);

    return null;
}

export default function TokenHandler() {
    return (
        <Suspense fallback={null}>
            <TokenLogic />
        </Suspense>
    );
}
