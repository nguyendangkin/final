'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Calendar, ShieldCheck, Car as CarIcon } from 'lucide-react';
import CarFeed from '@/components/CarFeed';
import { shouldOptimizeImage } from '@/lib/utils';

interface SellerProfileProps {
    seller: {
        id: string;
        name?: string;
        email?: string;
        avatar?: string;
        createdAt: string;
        isSellingBanned?: boolean;
        stats: {
            selling: number;
            sold: number;
        };
    };
}

export default function SellerProfile({ seller }: SellerProfileProps) {
    const [activeTab, setActiveTab] = useState<'selling' | 'sold'>('selling');

    const displayName = seller.name || seller.email || 'Người bán ẩn danh';
    const joinYear = new Date(seller.createdAt).getFullYear();

    // Use stats from backend
    const activeCarsCount = seller.stats?.selling || 0;
    const soldCarsCount = seller.stats?.sold || 0;

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans selection:bg-red-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Seller Header */}
                <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-none bg-black flex items-center justify-center text-white font-bold text-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {seller.avatar ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={seller.avatar}
                                        alt={displayName}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        referrerPolicy="no-referrer"
                                        unoptimized={!shouldOptimizeImage(seller.avatar)}
                                    />
                                </div>
                            ) : (
                                displayName[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-black text-black uppercase tracking-tight">{displayName}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 font-medium">
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Đã xác thực
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Tham gia {joinYear}
                                </span>
                                <span className="flex items-center gap-1">
                                    <CarIcon className="w-3.5 h-3.5" />
                                    {activeCarsCount} xe đang bán • {soldCarsCount} xe đã bán
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('selling')}
                        className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${activeTab === 'selling'
                            ? 'text-black'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Xe đang bán
                        {activeTab === 'selling' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sold')}
                        className={`pb-3 text-sm font-bold uppercase tracking-wide transition-colors relative ${activeTab === 'sold'
                            ? 'text-black'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Xe đã bán
                        {activeTab === 'sold' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></span>
                        )}
                    </button>
                </div>

                {/* Cars Listings */}
                <div className="mb-6">
                    {activeTab === 'selling' ? (
                        <CarFeed
                            key="selling"
                            filter={{
                                sellerId: seller.id,
                                status: 'AVAILABLE'
                            }}
                        />
                    ) : (
                        <SoldCarsList sellerId={seller.id} />
                    )}
                </div>
            </div>
        </div>
    );
}

function SoldCarsList({ sellerId }: { sellerId: string }) {
    const [soldCars, setSoldCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:3000/sold-cars/seller/${sellerId}`)
            .then(res => res.json())
            .then(data => {
                setSoldCars(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [sellerId]);

    const formatTimeDistance = (date1: string, date2: string) => {
        const d1 = new Date(date1).getTime();
        const d2 = new Date(date2).getTime();
        const diff = Math.abs(d1 - d2);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} ngày ${hours > 0 ? `${hours} giờ` : ''}`;
        return `${hours} giờ`;
    };

    if (loading) return <div className="text-center py-12">Đang tải lịch sử bán xe...</div>;
    if (soldCars.length === 0) return <div className="text-center py-12 text-gray-500">Người bán này chưa bán được xe nào.</div>;

    return (
        <div className="flex flex-col">
            {soldCars.map((car, index) => {
                const nextCar = soldCars[index + 1];
                const timeGap = nextCar ? formatTimeDistance(car.soldAt, nextCar.soldAt) : null;

                return (
                    <div key={car.id} className="relative group">
                        <div className="flex flex-col md:flex-row bg-white border border-gray-200 hover:border-[var(--jdm-red)] transition-all relative overflow-hidden">
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-black group-hover:bg-[var(--jdm-red)] transition-colors"></div>

                            <div className="p-4 md:p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 ml-1">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-2 px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                        LƯU TRỮ: {new Date(car.soldAt).toLocaleDateString('vi-VN')}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-black uppercase italic tracking-tight leading-none">
                                        {car.year} {car.make} {car.model}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        Bán lúc {new Date(car.soldAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="flex flex-col md:items-end gap-1">
                                    <p className="text-[var(--jdm-red)] font-black text-2xl md:text-3xl tracking-tighter italic">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(car.price))}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-[0.2em]">
                                            ĐÃ BÁN
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Connector */}
                        {timeGap ? (
                            <div className="flex items-center justify-center py-6 relative">
                                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px border-r border-dashed border-gray-200 -z-10"></div>
                                <div className="bg-white text-gray-400 text-[9px] font-black px-3 py-1 rounded-none border border-gray-100 uppercase tracking-[0.1em]">
                                    + {timeGap} TRƯỚC ĐÓ
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6"></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
