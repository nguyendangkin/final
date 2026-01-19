'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Calendar, ShieldCheck, Car as CarIcon } from 'lucide-react';
import CarFeed from '@/components/CarFeed';

interface SellerProfileProps {
    seller: {
        id: string;
        name?: string;
        email?: string;
        avatar?: string;
        createdAt: string;
        carsForSale: any[];
    };
}

export default function SellerProfile({ seller }: SellerProfileProps) {
    const [activeTab, setActiveTab] = useState<'selling' | 'sold'>('selling');

    const displayName = seller.name || seller.email || 'Người bán ẩn danh';
    const joinYear = new Date(seller.createdAt).getFullYear();

    const activeCarsCount = seller.carsForSale.filter((car: any) => car.status !== 'SOLD').length;
    const soldCarsCount = seller.carsForSale.filter((car: any) => car.status === 'SOLD').length;

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans selection:bg-red-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Seller Header */}
                <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-none bg-black flex items-center justify-center text-white font-bold text-2xl border border-gray-200 shadow-sm">
                            {displayName[0]?.toUpperCase() || 'U'}
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
                                    {soldCarsCount > 0
                                        ? `${activeCarsCount} xe đang bán • ${soldCarsCount} xe đã bán`
                                        : `${activeCarsCount} xe đang bán`
                                    }
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
                    <CarFeed
                        key={activeTab} // Force remount when tab changes
                        // Pass initialCars only if they match the tab to avoid flash of wrong content?
                        // Actually initialCars from server might be mixed.
                        // Ideally we should filter initialCars too if we want to use them.
                        // But since we force filter via API in CarFeed, passing mismatching initialCars might be confusing if CarFeed uses them immediately.
                        // Let's filter initialCars client-side for the initial render.
                        initialCars={seller.carsForSale.filter((car: any) =>
                            activeTab === 'selling' ? car.status !== 'SOLD' : car.status === 'SOLD'
                        ).slice(0, 12)}
                        filter={{
                            sellerId: seller.id,
                            status: activeTab === 'selling' ? 'AVAILABLE' : 'SOLD'
                        }}
                    />
                </div>

            </div>
        </div>
    );
}
