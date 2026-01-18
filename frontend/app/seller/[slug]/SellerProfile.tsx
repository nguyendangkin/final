'use client';

import Link from 'next/link';
import { User, Calendar, ShieldCheck, Car } from 'lucide-react';
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


    const displayName = seller.name || seller.email || 'Người bán ẩn danh';
    const joinYear = new Date(seller.createdAt).getFullYear();

    const activeCarsCount = seller.carsForSale.filter((car: any) => car.status !== 'SOLD').length;
    const soldCarsCount = seller.carsForSale.filter((car: any) => car.status === 'SOLD').length;

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans selection:bg-red-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Seller Header */}
                <div className="bg-white rounded-none shadow-sm border border-gray-100 p-6 mb-6">
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
                                    <Car className="w-3.5 h-3.5" />
                                    {soldCarsCount > 0
                                        ? `${activeCarsCount} xe đang bán • ${soldCarsCount} xe đã bán`
                                        : `${activeCarsCount} xe đang bán`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cars Listings */}
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-wide">Xe đang bán</h2>
                    <CarFeed
                        initialCars={seller.carsForSale.slice(0, 12)}
                        filter={{ sellerId: seller.id }}
                    />
                </div>

            </div>
        </div>
    );
}
