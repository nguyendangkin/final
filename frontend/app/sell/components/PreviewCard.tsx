import { CarSpecs } from '../types';
import Image from 'next/image';
import { Fuel, MapPin, Gauge } from 'lucide-react';
import { shouldOptimizeImage, getImgUrl } from '@/lib/utils';

export default function PreviewCard({ data }: { data: CarSpecs }) {
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

    const hasMods = data.mods.exterior.length + data.mods.interior.length + data.mods.engine.length + data.mods.footwork.length > 0;

    return (
        <div className="sticky top-24">
            {/* 
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600 mb-4 uppercase tracking-wider">
        Xem trước
      </h3>
      */}

            <div className="bg-white rounded-none overflow-hidden shadow-2xl shadow-gray-200/50 transform transition-all hover:scale-[1.02] group border border-gray-100">
                <div className="relative aspect-[4/3] bg-gray-100">
                    {data.thumbnail ? (
                        <Image src={getImgUrl(data.thumbnail)} alt="Preview" fill className="object-cover" unoptimized={!shouldOptimizeImage(getImgUrl(data.thumbnail))} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                            <span className="text-4xl font-black opacity-20">JDM</span>
                            <span className="text-sm font-medium">Chưa có ảnh</span>
                        </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {data.condition || 'Stock'}
                    </div>
                    {data.isNegotiable && (
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg shadow-emerald-500/20">
                            Thương lượng
                        </div>
                    )}
                </div>

                <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                {data.year} {data.make} {data.model}
                            </h2>
                            <p className="text-gray-500 text-sm font-medium">{data.trim}</p>
                        </div>
                        <p className="text-[var(--jdm-red)] font-black text-lg">
                            {data.price ? formatMoney(data.price) : 'Liên hệ'}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 my-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase font-semibold">Động cơ</p>
                            <p className="text-sm font-bold text-gray-800">{data.engineCode || '---'}</p>
                        </div>
                        <div className="text-center border-l border-r border-gray-100">
                            <p className="text-xs text-gray-400 uppercase font-semibold">Hộp số</p>
                            <p className="text-sm font-bold text-gray-800">{data.transmission}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase font-semibold">Odo</p>
                            <p className="text-sm font-bold text-gray-800">
                                {data.odo > 0 ? `${data.odo.toLocaleString()} ${data.odoUnit === 'km' ? 'km' : 'mi'}` : '---'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.chassisCode && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">{data.chassisCode}</span>
                        )}
                        {data.drivetrain && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">{data.drivetrain}</span>
                        )}
                        {hasMods && (
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded">+ Modded</span>
                        )}
                    </div>

                    <div className="text-center">
                        <button disabled className="w-full py-3 bg-black text-white font-bold rounded-none opacity-50 cursor-not-allowed text-sm uppercase tracking-wide shadow-lg shadow-gray-200">
                            Xem Chi Tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
