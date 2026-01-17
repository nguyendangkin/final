import Link from 'next/link';
import { MapPin, Gauge, GitFork, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CarCardProps {
    car: any;
}

export default function CarCard({ car }: CarCardProps) {
    // Mappings
    const transmissionMap: Record<string, string> = {
        'MT': 'Số sàn',
        'AT': 'Tự động',
        'CVT': 'CVT',
    };

    const conditionMap: Record<string, string> = {
        'Stock': 'ZIN',
        'Zin': 'ZIN',
        'Lightly Modded': 'ĐỘ NHẸ',
        'Heavily Modded': 'ĐỘ NẶNG',
        'Track/Drift Build': 'XE ĐUA',
        'Restored': 'ĐÃ DỌN',
        'Restored Modded': 'DỌN KIỂNG',
    };

    const paperworkMap: Record<string, string> = {
        'SANG TÊN ĐƯỢC': 'CHÍNH CHỦ',
        'KHÔNG SANG TÊN ĐƯỢC': 'KHÔNG CHÍNH CHỦ',
        'CHÍNH CHỦ': 'CHÍNH CHỦ',
        'KHÔNG CHÍNH CHỦ': 'KHÔNG CHÍNH CHỦ'
    };



    return (
        <Link href={`/cars/${car.id}`} className="group block bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-[var(--jdm-red)] h-full flex flex-col">
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {car.thumbnail || (car.images && car.images.length > 0) ? (
                    <img
                        src={car.thumbnail || car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                        Chưa có ảnh
                    </div>
                )}

                {/* Status Overlays */}
                {car.status === 'SOLD' && (
                    <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="border-4 border-[var(--jdm-red)] px-6 py-2 transform -rotate-12 bg-black shadow-2xl">
                            <span className="text-[var(--jdm-red)] font-black text-2xl uppercase tracking-[0.2em]">ĐÃ BÁN</span>
                        </div>
                    </div>
                )}

                {/* Price Tag */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12 flex justify-between items-end">
                    <div>
                        {/* Price */}
                        <p className="text-xl font-black text-white leading-none">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(car.price))}
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
                            {conditionMap[car.condition] || car.condition}
                        </span>
                    )}
                </div>

                {/* Paperwork Badge */}
                <div className="absolute top-3 right-3">
                    {car.paperwork && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-md">
                            {paperworkMap[car.paperwork] || car.paperwork}
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
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-600 mb-4 flex-1">
                    <div className="flex items-center gap-2">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{Number(car.mileage).toLocaleString('vi-VN')} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <GitFork className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{transmissionMap[car.transmission] || car.transmission || 'MT'}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold truncate">{car.location || "Toàn quốc"}</span>
                    </div>
                    {car.registryExpiry && (
                        <div className="flex items-center gap-2 col-span-2 text-[10px] text-gray-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đăng kiểm: {car.registryExpiry}</span>
                        </div>
                    )}
                </div>

                {/* Edit History / Posted Date */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        {car.createdAt ? new Date(car.createdAt).toLocaleDateString('vi-VN') : 'Mới đăng'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
