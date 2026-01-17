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
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Seller Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-white overflow-hidden">
                            {seller.avatar ? (
                                <img src={seller.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                displayName[0]?.toUpperCase() || <User className="w-10 h-10" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-gray-900">{displayName}</h1>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Xe đang bán</h2>

                    {seller.carsForSale.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                            <p className="text-gray-500 text-lg">Người bán chưa có xe nào đang bán.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {seller.carsForSale.map((car: any) => (
                                <Link key={car.id} href={`/cars/${car.id}`} className="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-blue-500">
                                    <div className="relative h-64 overflow-hidden">
                                        {car.thumbnail || (car.images && car.images.length > 0) ? (
                                            <img src={car.thumbnail || car.images[0]} alt={car.model} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                Không có hình ảnh
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg text-white font-bold border border-white/20">
                                            {formatMoney(Number(car.price))}
                                        </div>
                                        {car.status === 'SOLD' && (
                                            <div className="absolute bottom-0 left-0">
                                                <div className="relative">
                                                    <div className="absolute bottom-0 left-0 w-0 h-0 border-b-[60px] border-r-[60px] border-b-red-600 border-r-transparent z-10"></div>
                                                    <span className="absolute bottom-2 left-1 z-20 rotate-45 text-white font-bold text-xs select-none">ĐÃ BÁN</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">{car.year} {car.make} {car.model}</h2>
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
