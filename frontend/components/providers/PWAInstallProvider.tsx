'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

interface PWAInstallContextType {
    isInstalled: boolean;
    canInstall: boolean;
    triggerInstall: () => Promise<boolean>;
}

const PWAInstallContext = createContext<PWAInstallContextType>({
    isInstalled: false,
    canInstall: false,
    triggerInstall: async () => false,
});

export function usePWAInstall() {
    return useContext(PWAInstallContext);
}

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallProvider({ children }: { children: ReactNode }) {
    const [isInstalled, setIsInstalled] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        // Check if already installed (running as standalone PWA)
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
            setIsInstalled(isStandalone);
        };

        checkInstalled();

        // Capture the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            deferredPromptRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful install
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setCanInstall(false);
            deferredPromptRef.current = null;
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = () => checkInstalled();
        mediaQuery.addEventListener('change', handleDisplayModeChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            mediaQuery.removeEventListener('change', handleDisplayModeChange);
        };
    }, []);

    const triggerInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPromptRef.current) {
            return false;
        }

        try {
            // Show the native browser install prompt
            await deferredPromptRef.current.prompt();
            const { outcome } = await deferredPromptRef.current.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
                setCanInstall(false);
            }

            deferredPromptRef.current = null;
            return outcome === 'accepted';
        } catch (error) {
            console.error('[PWA] Install error:', error);
            return false;
        }
    }, []);

    return (
        <PWAInstallContext.Provider value={{ isInstalled, canInstall, triggerInstall }}>
            {children}
        </PWAInstallContext.Provider>
    );
}
