'use client';

import Link from 'next/link';
import { User, Calendar, MapPin, ShieldCheck, Car } from 'lucide-react';

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
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

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

                    {seller.carsForSale.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                            <p className="text-gray-500 text-lg">Người bán chưa có xe nào đang bán.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {seller.carsForSale.map((car: any) => (
                                <Link key={car.id} href={`/cars/${car.id}`} className="group block bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-[var(--jdm-red)]">
                                    <div className="relative h-64 overflow-hidden">
                                        {car.thumbnail || (car.images && car.images.length > 0) ? (
                                            <img src={car.thumbnail || car.images[0]} alt={car.model} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                Không có hình ảnh
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-[var(--jdm-red)] px-3 py-1 rounded-none text-white font-bold shadow-md">
                                            {formatMoney(Number(car.price))}
                                        </div>
                                        {car.status === 'SOLD' && (
                                            <div className="absolute top-4 left-4 z-20">
                                                <div className="bg-black/90 border-l-4 border-[var(--jdm-red)] px-3 py-1 shadow-md">
                                                    <span className="text-white font-bold text-xs uppercase tracking-wider">ĐÃ BÁN</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-black group-hover:text-[var(--jdm-red)] transition-colors">{car.year} {car.make} {car.model}</h2>
                                        <p className="text-gray-600 mt-3 text-sm line-clamp-2 h-10">{car.description}</p>
                                        <div className="mt-6 flex justify-between items-center text-sm text-gray-500 border-t border-gray-200 pt-4">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                {car.mileage} km
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {car.location}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
