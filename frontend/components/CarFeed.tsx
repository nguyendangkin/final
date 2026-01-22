'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CarCard from './CarCard';
import CarCardSkeleton from './CarCardSkeleton';


interface CarFeedProps {
    initialCars?: any[];
    filter?: any; // { make, model, sellerId, etc. }
}

import { Suspense } from 'react';

// ... (keep existing imports, add Suspense if needed but i am importing it above)

function CarFeedContent({ initialCars = [], filter = {} }: CarFeedProps) {
    const [cars, setCars] = useState<any[]>(initialCars);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const searchParams = useSearchParams();

    // Get all filter params from URL
    const urlFilters = {
        make: searchParams.get('make'),
        model: searchParams.get('model'),
        transmission: searchParams.get('transmission'),
        drivetrain: searchParams.get('drivetrain'),
        condition: searchParams.get('condition'),
        paperwork: searchParams.get('paperwork'),
        minPrice: searchParams.get('minPrice'),
        maxPrice: searchParams.get('maxPrice'),
        q: searchParams.get('q'),
        location: searchParams.get('location'),
        chassisCode: searchParams.get('chassisCode'),
        engineCode: searchParams.get('engineCode'),
        trim: searchParams.get('trim'),
        year: searchParams.get('year'),
        mods_exterior: searchParams.get('mods_exterior'),
        mods_interior: searchParams.get('mods_interior'),
        mods_engine: searchParams.get('mods_engine'),
        mods_footwork: searchParams.get('mods_footwork'),
        mods: searchParams.get('mods'),
        notableFeatures: searchParams.get('notableFeatures'),
    };

    // Create a stable key for the filters
    const filtersKey = JSON.stringify(urlFilters);

    // Reset and refetch when URL params change
    useEffect(() => {
        setCars([]);
        setPage(1);
        setHasMore(true);
        setInitialLoading(true); // Set initial loading true when filters change
        fetchCars(1);
    }, [filtersKey]);

    const fetchCars = async (pageToFetch: number) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pageToFetch.toString(),
                limit: '12',
                ...filter
            });

            // Add all URL filters
            Object.entries(urlFilters).forEach(([key, value]) => {
                if (value) queryParams.set(key, value);
            });

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/cars?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            const newCars = data.data || [];

            setHasMore(pageToFetch < data.meta.totalPages);

            if (pageToFetch === 1) {
                setCars(newCars);
                setPage(2);
            } else {
                setCars(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const uniqueNewCars = newCars.filter((c: any) => !existingIds.has(c.id));
                    return [...prev, ...uniqueNewCars];
                });
                setPage(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const lastCarElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchCars(page);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, page, filtersKey]);

    return (
        <div>
            {initialLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {[...Array(6)].map((_, i) => (
                        <CarCardSkeleton key={i} />
                    ))}
                </div>
            ) : cars.length === 0 && !loading ? (
                <div className="text-center py-20 bg-white rounded-none shadow-lg border border-gray-200">
                    <p className="text-gray-500 text-lg">Chưa có xe nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {cars.map((car, index) => {
                        if (cars.length === index + 1) {
                            return <div ref={lastCarElementRef} key={car.id}><CarCard car={car} /></div>;
                        } else {
                            return <div key={car.id}><CarCard car={car} /></div>;
                        }
                    })}
                    {/* Show skeletons at bottom when loading more */}
                    {loading && hasMore && [...Array(3)].map((_, i) => (
                        <CarCardSkeleton key={`loading-${i}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CarFeed(props: CarFeedProps) {
    return (
        <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
                <CarCardSkeleton key={i} />
            ))}
        </div>}>
            <CarFeedContent {...props} />
        </Suspense>
    );
}
