'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, Globe, Car, BarChart3, Info } from 'lucide-react';

interface RankingData {
    global: {
        rank: number;
        total: number;
    };
    make: {
        rank: number;
        total: number;
        name: string;
    };
}

interface ListingRankingProps {
    carId: string;
}

export default function ListingRanking({ carId }: ListingRankingProps) {
    const [ranking, setRanking] = useState<RankingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const res = await fetch(`http://localhost:3000/cars/${carId}/ranking`);
                if (res.ok) {
                    const data = await res.json();
                    setRanking(data);
                }
            } catch (error) {
                console.error('Error fetching ranking:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, [carId]);

    if (loading) return (
        <div className="animate-pulse space-y-3 p-4 bg-gray-50 border border-gray-100">
            <div className="h-4 bg-gray-200 w-1/2"></div>
            <div className="h-2 bg-gray-200 w-full"></div>
            <div className="h-4 bg-gray-200 w-2/3"></div>
            <div className="h-2 bg-gray-200 w-full"></div>
        </div>
    );

    if (!ranking) return null;

    const calculatePercent = (rank: number, total: number) => {
        return Math.max(0, Math.min(100, (1 - (rank - 1) / total) * 100));
    };

    return (
        <div className="p-4 bg-white border-2 border-dashed border-gray-200 space-y-5">
            <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-[var(--jdm-red)]" />
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 italic">Vị trí trôi bài (Drift)</h4>
                <div className="ml-auto group relative">
                    <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed shadow-xl border border-white/20">
                        Thứ hạng của bạn so với các xe khác đang mở bán nhắm giúp bạn điều chỉnh tin đăng kịp thời.
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Global Ranking */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="flex items-center gap-1.5 text-gray-500">
                            <Globe className="w-3 h-3" /> Trang chủ
                        </span>
                        <span className="text-black">
                            <span className="text-[var(--jdm-red)]">{ranking.global.rank}</span>/{ranking.global.total} xe
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
                        <div
                            className="h-full bg-black transition-all duration-1000 ease-out"
                            style={{ width: `${calculatePercent(ranking.global.rank, ranking.global.total)}%` }}
                        />
                    </div>
                </div>

                {/* Make Ranking */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="flex items-center gap-1.5 text-gray-500">
                            <Car className="w-3 h-3" /> Hãng xe [{ranking.make.name}]
                        </span>
                        <span className="text-black">
                            <span className="text-[var(--jdm-red)]">{ranking.make.rank}</span>/{ranking.make.total} xe
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
                        <div
                            className="h-full bg-[var(--jdm-red)] transition-all duration-1000 delay-300 ease-out"
                            style={{ width: `${calculatePercent(ranking.make.rank, ranking.make.total)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-1.5 text-[9px] font-bold text-gray-400 uppercase italic">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" />
                    Bài đăng của bạn đang ở trang {Math.ceil(ranking.global.rank / 12)} trong trang chủ
                </div>
                <div className="flex items-center gap-2 text-[var(--jdm-red)]">
                    <BarChart3 className="w-3 h-3" />
                    Bài đăng của bạn đang ở trang {Math.ceil(ranking.make.rank / 12)} trong trang hãng
                </div>
            </div>
        </div>
    );
}
