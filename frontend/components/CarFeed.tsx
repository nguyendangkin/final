'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

    // Initial fetch if no initial cars provided
    useEffect(() => {
        if (initialCars.length === 0) {
            fetchCars(1);
        } else {
            // If initial cars provided, assume it's page 1.
            // Check if we received less than limit (12), if so, no more.
            if (initialCars.length < 12) {
                setHasMore(false);
            }
            setPage(2); // Next fetch will be page 2
        }
    }, []);

    const fetchCars = async (pageToFetch: number) => {
        if (loading) return;
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pageToFetch.toString(),
                limit: '12',
                ...filter
            });
            const res = await fetch(`http://localhost:3000/cars?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const newCars = await res.json();

            if (newCars.length < 12) {
                setHasMore(false);
            }

            if (pageToFetch === 1) {
                setCars(newCars);
            } else {
                setCars(prev => {
                    // Filter duplicates just in case
                    const existingIds = new Set(prev.map(c => c.id));
                    const uniqueNewCars = newCars.filter((c: any) => !existingIds.has(c.id));
                    return [...prev, ...uniqueNewCars];
                });
            }
            setPage(prev => prev + 1);
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
    }, [loading, hasMore, page, filter]); // Added filter dependencies

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
