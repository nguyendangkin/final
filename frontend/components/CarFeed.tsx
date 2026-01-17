'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CarCard from './CarCard';
import { Loader2 } from 'lucide-react';

interface CarFeedProps {
    initialCars?: any[];
    filter?: any; // { make, model, sellerId, etc. }
}

export default function CarFeed({ initialCars = [], filter = {} }: CarFeedProps) {
    const [cars, setCars] = useState<any[]>(initialCars);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
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
        q: searchParams.get('q'),
    };

    // Create a stable key for the filters
    const filtersKey = JSON.stringify(urlFilters);

    // Reset and refetch when URL params change
    useEffect(() => {
        setCars([]);
        setPage(1);
        setHasMore(true);
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

            const res = await fetch(`http://localhost:3000/cars?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const newCars = await res.json();

            if (newCars.length < 12) {
                setHasMore(false);
            }

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
            {cars.length === 0 && !loading ? (
                <div className="text-center py-20 bg-white rounded-none shadow-lg border border-gray-200">
                    <p className="text-gray-500 text-lg">Chưa có xe nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cars.map((car, index) => {
                        if (cars.length === index + 1) {
                            return <div ref={lastCarElementRef} key={car.id}><CarCard car={car} /></div>;
                        } else {
                            return <div key={car.id}><CarCard car={car} /></div>;
                        }
                    })}
                </div>
            )}

            {loading && (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--jdm-red)]" />
                </div>
            )}

            {!hasMore && cars.length > 0 && (
                <div className="text-center p-8 text-gray-400 text-sm font-medium uppercase tracking-widest">
                    --- Hết danh sách ---
                </div>
            )}
        </div>
    );
}
