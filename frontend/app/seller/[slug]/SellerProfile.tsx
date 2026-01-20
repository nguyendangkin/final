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
                                <img
                                    src={seller.avatar}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
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
                        // We do NOT pass initialCars anymore. CarFeed will fetch data itself.
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
