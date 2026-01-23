import Link from 'next/link';
import Image from 'next/image';
import { GitFork, FileText, CheckCircle2, AlertTriangle, Calendar, Disc, Eye } from 'lucide-react';
import { generateCarSlug, shouldOptimizeImage, getImgUrl } from '@/lib/utils';
import { memo, useMemo } from 'react';

interface CarCardProps {
    car: any;
}

function CarCard({ car }: CarCardProps) {
    const lastModified = useMemo(() => car.updatedAt ? new Date(car.updatedAt).getTime() : '', [car.updatedAt]);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }), []);

    return (
        <Link href={`/cars/${generateCarSlug(car)}`} className="group block bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-[var(--jdm-red)] h-full flex flex-col">
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {car.thumbnail || (car.images && car.images.length > 0) ? (
                    <Image
                        src={getImgUrl(car.thumbnail || car.images[0], lastModified)}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        unoptimized={!shouldOptimizeImage(getImgUrl(car.thumbnail || car.images[0]))}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                        Chưa có ảnh
                    </div>
                )}

                {/* Status Overlays */}
                {car.status === 'SOLD' && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="border-4 border-[var(--jdm-red)] px-6 py-2 transform -rotate-12 bg-black shadow-2xl pointer-events-auto">
                            <span className="text-[var(--jdm-red)] font-black text-2xl uppercase tracking-[0.2em]">ĐÃ BÁN</span>
                        </div>
                    </div>
                )}

                {/* Price Tag */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12 flex justify-between items-end">
                    <div>
                        {/* Price */}
                        <p className="text-xl font-black text-white leading-none">
                            {currencyFormatter.format(Number(car.price))}
                        </p>
                        {/* Negotiable Indicator */}
                        {car.isNegotiable && (
                            <p className="text-[10px] uppercase font-bold text-emerald-400 mt-1">
                                Có thương lượng
                            </p>
                        )}
                    </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                    {/* Condition Badge */}
                    {car.condition && (
                        <span className="bg-[var(--jdm-red)] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-md">
                            {car.condition}
                        </span>
                    )}
                </div>

                {/* Paperwork Badge */}
                <div className="absolute top-3 right-3">
                    {car.paperwork && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-md">
                            {car.paperwork}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                    <h2 className="text-lg font-black text-black group-hover:text-[var(--jdm-red)] transition-colors uppercase leading-tight line-clamp-1">
                        {car.year} {car.make} {car.model}
                    </h2>
                    <p className="text-gray-500 text-xs font-bold uppercase mt-1">{car.trim || 'Base Model'}</p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-[1.5fr_1fr] gap-y-2 gap-x-4 text-[10px] text-gray-600 mb-4 flex-1">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold truncate">
                            {car.registryExpiry || (car.noRegistry ? 'KHÔNG ĐĂNG KIỂM ĐƯỢC' : '---')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <GitFork className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{car.transmission || 'MT'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Disc className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{car.drivetrain || '---'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{car.year}</span>
                    </div>
                </div>

                {/* Edit History / Posted Date */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        {car.createdAt ? new Date(car.createdAt).toLocaleDateString('vi-VN') : 'Mới đăng'}
                    </span>
                    {/* View Count */}
                    <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-[var(--jdm-red)] transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold tracking-wider">{car.views || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default memo(CarCard);
