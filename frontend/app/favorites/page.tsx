'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CarCard from '@/components/CarCard';
import CarCardSkeleton from '@/components/CarCardSkeleton';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const router = useRouter();
    const observer = useRef<IntersectionObserver | null>(null);

    const lastCarElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    useEffect(() => {
        const fetchFavorites = async () => {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                router.push('/login');
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`http://localhost:3000/favorites?page=${page}&limit=12`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Data comes as object with id, car, etc.
                    const newCars = data.map((item: any) => ({
                        ...item.car,
                        favoritedAt: item.createdAt,
                        seller: item.car.seller
                    }));

                    setFavorites(prev => {
                        // Combine and remove duplicates just in case
                        const combined = [...prev, ...newCars];
                        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                        return unique;
                    });

                    if (newCars.length < 12) {
                        setHasMore(false);
                    }
                } else {
                    toast.error("Lỗi tải danh sách yêu thích");
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi kết nối");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [page, router]);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-red-500/30">
            <Header />

            <main className="pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                        <div className="w-12 h-12 bg-black flex items-center justify-center">
                            <Heart className="w-6 h-6 text-[var(--jdm-red)] fill-current" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Xe Yêu Thích</h1>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Bộ sưu tập của bạn</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favorites.map((car: any, index: number) => {
                            if (favorites.length === index + 1) {
                                return <div ref={lastCarElementRef} key={car.id}><CarCard car={car} /></div>;
                            } else {
                                return <div key={car.id}><CarCard car={car} /></div>;
                            }
                        })}
                    </div>

                    {isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                            {[...Array(4)].map((_, i) => (
                                <CarCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

                    {!isLoading && favorites.length === 0 && (
                        <div className="text-center py-24 bg-gray-50 border border-gray-100 mt-6">
                            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 uppercase">Chưa có xe yêu thích</h3>
                            <p className="text-gray-500 mb-6">Hãy thả tim những chiếc xe bạn quan tâm để lưu lại đây.</p>
                            <Link href="/" className="inline-block bg-black text-white px-8 py-3 font-bold uppercase hover:bg-[var(--jdm-red)] transition-colors">
                                Khám phá ngay
                            </Link>
                        </div>
                    )}

                    {!isLoading && favorites.length > 0 && !hasMore && (
                        <div className="text-center mt-12 mb-8">
                            <span className="inline-block px-4 py-1 bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-full">
                                --- Hết danh sách ---
                            </span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
