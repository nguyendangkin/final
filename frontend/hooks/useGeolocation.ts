'use client';

import { useState, useCallback, useRef, useMemo } from 'react';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    isLoading: boolean;
    isWatching: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        isLoading: false,
        isWatching: false,
    });

    const watchIdRef = useRef<number | null>(null);

    const handleSuccess = useCallback((position: GeolocationPosition) => {
        setState((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            isLoading: false,
        }));
    }, []);

    const handleError = useCallback((error: GeolocationPositionError) => {
        let errorMessage = 'Không thể lấy vị trí';
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Không thể xác định vị trí';
                break;
            case error.TIMEOUT:
                errorMessage = 'Hết thời gian chờ định vị';
                break;
        }
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }, []);

    const geoOptions: PositionOptions = useMemo(() => ({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Cache for 5s to reduce battery drain
    }), []);

    // One-shot position (for manual "center on me")
    const getCurrentPosition = useCallback(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({ ...prev, error: 'Trình duyệt không hỗ trợ định vị GPS' }));
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    }, [handleSuccess, handleError, geoOptions]);

    // Start continuous tracking
    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({ ...prev, error: 'Trình duyệt không hỗ trợ định vị GPS' }));
            return;
        }

        // Don't start if already watching
        if (watchIdRef.current !== null) return;

        setState((prev) => ({ ...prev, isLoading: true, error: null, isWatching: true }));

        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            geoOptions
        );
    }, [handleSuccess, handleError, geoOptions]);

    // Stop continuous tracking (battery saving)
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setState((prev) => ({ ...prev, isWatching: false }));
        }
    }, []);

    return {
        ...state,
        getCurrentPosition,
        startWatching,
        stopWatching,
    };
}

export default useGeolocation;
