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
                <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-white overflow-hidden ring-1 ring-gray-100">
                            {seller.avatar ? (
                                <img src={seller.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                displayName[0]?.toUpperCase() || <User className="w-10 h-10" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-black uppercase tracking-tight">{displayName}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Đã xác thực
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Tham gia {joinYear}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Car className="w-4 h-4" />
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
