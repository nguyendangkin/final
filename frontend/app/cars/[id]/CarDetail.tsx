'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Gauge, ShieldCheck, User, Phone, MessageCircle, ChevronRight, Maximize2, CheckCircle2, Box, Hammer, Armchair, Disc, FileText, Youtube, PlayCircle, Facebook, Car, Pencil, History } from 'lucide-react';
import Lightbox from '@/components/Lightbox';

interface CarDetailProps {
    car: any;
}

export default function CarDetail({ car }: CarDetailProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const isOwner = currentUser && car.seller?.id === currentUser.id;

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            fetch('http://localhost:3000/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => setCurrentUser(data))
                .catch(() => setCurrentUser(null));
        }
    }, []);

    // MERGE: Ensure thumbnail is the first image if it exists
    const rawImages = Array.isArray(car.images) && car.images.length > 0 ? car.images : [];

    // Process images with thumbnail priority
    let images = car.thumbnail ? [car.thumbnail, ...rawImages.filter((img: string) => img !== car.thumbnail)] : rawImages;

    // Fallback if no images
    if (images.length === 0) {
        images = ["https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"];
    }

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    // Fix Currency to VND
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

    // Format date for edit history
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Mappings for localization
    const transmissionMap: Record<string, string> = {
        'MT': 'Số sàn',
        'AT': 'Số tự động',
        'CVT': 'Số CVT',
    };

    const drivetrainMap: Record<string, string> = {
        'FWD': 'Cầu trước',
        'RWD': 'Cầu sau',
        'AWD': '4 bánh',
    };

    const conditionMap: Record<string, string> = {
        'Stock': 'Zin',
        'Zin': 'Zin',
        'Lightly Modded': 'Độ nhẹ',
        'Heavily Modded': 'Độ nặng',
        'Track/Drift Build': 'Xe đua/Drift',
        'Restored': 'Đã dọn',
        'Restored Modded': 'Dọn kiểng',
    };

    const paperworkMap: Record<string, string> = {
        'Legal': 'SANG TÊN ĐƯỢC (Hợp pháp - Mua là an toàn)',
        'Illegal': 'KHÔNG SANG TÊN ĐƯỢC (Bất hợp pháp - Mua là ôm rủi ro)',
        'MBC': 'Mẹ bồng con',
        'GTHL': 'Giấy tờ hợp lệ',
        'HQCN': 'Hải quan chính ngạch',
    };

    // Normalize paperwork value if needed or just use direct mapping
    const getPaperworkText = (val: string) => {
        if (!val) return 'Đang cập nhật';
        return paperworkMap[val] || val;
    };


    // Helper to render mod tags
    const renderMods = (mods: any) => {
        if (!mods) return null;
        // Handle both parsed JSON object and legacy raw JSON if needed
        const parsedMods = typeof mods === 'string' ? JSON.parse(mods) : mods;

        const categories = [
            { key: 'engine', label: 'Máy móc & Hiệu suất', icon: Hammer, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            { key: 'footwork', label: 'Gầm & Bánh', icon: Disc, color: 'text-gray-800', bg: 'bg-gray-50', border: 'border-gray-200' },
            { key: 'exterior', label: 'Ngoại thất', icon: Box, color: 'text-black', bg: 'bg-gray-50', border: 'border-gray-200' },
            { key: 'interior', label: 'Nội thất', icon: Armchair, color: 'text-black', bg: 'bg-gray-50', border: 'border-gray-200' },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => {
                    const items = parsedMods[cat.key];
                    if (!items || items.length === 0) return null;
                    return (
                        <div key={cat.key} className={`rounded-none border ${cat.border} ${cat.bg} p-4`}>
                            <h4 className={`font-bold flex items-center gap-2 mb-3 ${cat.color}`}>
                                <cat.icon className="w-5 h-5" /> {cat.label}
                            </h4>
                            <ul className="space-y-2">
                                {items.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans selection:bg-red-500/30">
            <Lightbox
                images={images}
                initialIndex={lightboxIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <span>Trang chủ</span> <ChevronRight className="w-4 h-4" />
                    <span>Marketplace</span> <ChevronRight className="w-4 h-4" />
                    <span className="font-semibold text-gray-900">{car.make} {car.model}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Images & Detail Info */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Image Gallery */}
                        <div className="bg-white rounded-none overflow-hidden shadow-sm border border-gray-100">
                            <div className="relative aspect-[16/9] group cursor-pointer" onClick={() => openLightbox(0)}>
                                <img
                                    src={images[0]}
                                    alt="Main"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="bg-white/90 text-black px-4 py-2 rounded-none font-bold flex items-center gap-2 shadow-lg backdrop-blur transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 uppercase tracking-widest text-xs">
                                        <Maximize2 className="w-5 h-5" /> Xem toàn màn hình
                                    </button>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className="bg-[var(--jdm-red)] backdrop-blur text-white px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider shadow-sm">
                                        {conditionMap[car.condition] || car.condition || 'Đã qua sử dụng'}
                                    </span>
                                </div>
                                {car.status === 'SOLD' && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        <div className="bg-black border-2 border-[var(--jdm-red)] px-8 py-3 shadow-2xl transform -rotate-12">
                                            <span className="text-[var(--jdm-red)] font-black text-3xl uppercase tracking-[0.2em] border-2 border-white px-2 py-1 block">ĐÃ BÁN</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="p-4 grid grid-cols-5 md:grid-cols-6 gap-2">
                                    {images.map((img: string, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={() => openLightbox(idx)}
                                            className={`relative aspect-square rounded-none overflow-hidden cursor-pointer border-2 transition-all ${idx === 0 ? 'border-[var(--jdm-red)] ring-2 ring-red-500/20' : 'border-transparent hover:border-gray-300'}`}
                                        >
                                            <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                            {idx === 5 && images.length > 6 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                                                    +{images.length - 6}
                                                </div>
                                            )}
                                        </div>
                                    )).slice(0, 6)}
                                </div>
                            )}
                        </div>

                        {/* Title & Key Specs Mobile */}
                        <div className="lg:hidden bg-white p-6 rounded-none shadow-sm border border-gray-100">
                            <h1 className="text-2xl font-black text-black mb-2 uppercase italic">{car.year} {car.make} {car.model} {car.trim}</h1>
                            <p className="text-3xl font-black text-[var(--jdm-red)] mb-4">{formatMoney(Number(car.price))}
                                {car.isNegotiable && <span className="text-sm font-medium text-gray-500 ml-2">(Có thương lượng)</span>}
                            </p>
                        </div>

                        {/* Thông số Kỹ thuật */}
                        <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Gauge className="w-6 h-6 text-[var(--jdm-red)]" /> Thông số Kỹ thuật
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Mã khung gầm</p>
                                    <p className="font-bold text-gray-900 text-lg">{car.chassisCode || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Mã động cơ</p>
                                    <p className="font-bold text-gray-900 text-lg">{car.engineCode || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Hộp số</p>
                                    <p className="font-bold text-gray-900 text-lg">{transmissionMap[car.transmission] || car.transmission || 'MT'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Hệ dẫn động</p>
                                    <p className="font-bold text-gray-900 text-lg">{drivetrainMap[car.drivetrain] || car.drivetrain || 'RWD'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Odo</p>
                                    <p className="font-bold text-gray-900 text-lg">{Number(car.mileage).toLocaleString('vi-VN')} km</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Năm sản xuất</p>
                                    <p className="font-bold text-gray-900 text-lg">{car.year}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mod List */}
                        {car.mods && (
                            <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Box className="w-6 h-6 text-[var(--jdm-red)]" /> Danh sách Đồ chơi
                                </h3>
                                {renderMods(car.mods)}
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-[var(--jdm-red)]" /> Mô tả chi tiết
                            </h3>
                            <div className="prose prose-gray max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                                {car.description}
                            </div>
                            {car.additionalInfo && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase">Thông tin thêm</h4>
                                    <p className="text-gray-600 leading-relaxed">{car.additionalInfo}</p>
                                </div>
                            )}
                        </div>

                        {/* Video Link */}
                        {car.videoLink && (
                            <div className="bg-black text-white p-6 md:p-8 rounded-none shadow-lg shadow-gray-200 uppercase tracking-wider relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-90 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 relative z-10">
                                    <Youtube className="w-6 h-6 text-red-500" /> Video xe
                                </h3>
                                <a
                                    href={car.videoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-none font-bold hover:scale-105 transition-transform relative z-10"
                                >
                                    <PlayCircle className="w-5 h-5" /> Xem Video Ngay
                                </a>
                            </div>
                        )}

                        {/* Legal Info */}
                        <div className="bg-gray-50 p-6 md:p-8 rounded-none border border-gray-100">
                            <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-[var(--jdm-red)]" /> Pháp lý & Giấy tờ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-black shadow-sm border border-gray-100">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-black font-bold uppercase">Loại giấy tờ</p>
                                        <p className="font-bold text-gray-900">{getPaperworkText(car.paperwork)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-black shadow-sm border border-gray-100">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-black font-bold uppercase">Hạn đăng kiểm</p>
                                        <p className="font-bold text-gray-900">{car.registryExpiry ? new Date(car.registryExpiry).toLocaleDateString('vi-VN') : '---'}</p>
                                    </div>
                                </div>
                                {car.plateNumber && car.plateNumber !== 'Hidden' && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                            <Car className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 font-bold uppercase">Biển số</p>
                                            <p className="font-bold text-gray-900">{car.plateNumber}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Edit History - Public section */}
                        {car.editHistory && car.editHistory.length > 0 && (
                            <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <History className="w-6 h-6 text-[var(--jdm-red)]" /> Lịch sử chỉnh sửa
                                </h3>
                                <div className="space-y-3">
                                    {[...car.editHistory].reverse().map((date: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm">
                                            <span className="w-2 h-2 rounded-none bg-[var(--jdm-red)] flex-shrink-0" />
                                            <span className="text-gray-600">{formatDate(date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* RIGHT COLUMN: Sidebar (Sticky) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">

                            {/* Price Card */}
                            <div className="bg-white p-6 rounded-none shadow-lg shadow-gray-200/50 border border-gray-100">
                                <div className="border-b border-gray-100 pb-4 mb-4">
                                    <h1 className="text-2xl font-black text-gray-900 leading-tight uppercase italic mb-1">{car.year} {car.make} {car.model}</h1>
                                    <p className="text-gray-500 font-medium">{car.trim}</p>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Giá bán</p>
                                    <p className="text-4xl font-black text-[var(--jdm-red)] tracking-tight">{formatMoney(Number(car.price))}</p>
                                    {car.isNegotiable && (
                                        <div className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-none border border-emerald-100">
                                            <CheckCircle2 className="w-4 h-4" /> Có thương lượng
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {/* Contact Info - Hidden if Sold */}
                                    {car.status !== 'SOLD' ? (
                                        <>
                                            {car.phoneNumber ? (
                                                <a href={`tel:${car.phoneNumber}`} className="w-full bg-black text-white font-bold py-4 rounded-none hover:bg-[var(--jdm-red)] transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide">
                                                    <Phone className="w-5 h-5" /> Liên hệ: {car.phoneNumber}
                                                </a>
                                            ) : (
                                                <button disabled className="w-full bg-gray-300 text-white font-bold py-4 rounded-none cursor-not-allowed flex items-center justify-center gap-2">
                                                    <Phone className="w-5 h-5" /> Không có SĐT
                                                </button>
                                            )}

                                            {car.facebookLink ? (
                                                <a href={car.facebookLink} target="_blank" rel="noopener noreferrer" className="w-full bg-[#1877F2] text-white font-bold py-4 rounded-none hover:bg-[#166fe5] transition-all flex items-center justify-center gap-2">
                                                    <Facebook className="w-5 h-5" /> Nhắn tin Facebook
                                                </a>
                                            ) : (
                                                <button className="w-full bg-white text-gray-900 font-bold py-4 rounded-none border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                                    <MessageCircle className="w-5 h-5" /> Chat ngay
                                                </button>
                                            )}

                                            {car.zaloLink && (
                                                <a href={car.zaloLink} target="_blank" rel="noopener noreferrer" className="w-full bg-[#0068FF] text-white font-bold py-4 rounded-none hover:bg-[#0058D6] transition-all flex items-center justify-center gap-2">
                                                    <MessageCircle className="w-5 h-5" /> Nhắn tin Zalo
                                                </a>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-none cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200">
                                            <ShieldCheck className="w-5 h-5" /> Đã bán - Ngừng giao dịch
                                        </div>
                                    )}

                                    {/* Edit & Mark Sold Buttons - Only visible to owner */}
                                    {isOwner && (
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/cars/${car.id}/edit`}
                                                className="flex-1 bg-black text-white font-bold py-4 rounded-none hover:bg-gray-800 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                                            >
                                                <Pencil className="w-5 h-5" /> Chỉnh sửa
                                            </Link>

                                            <button
                                                onClick={async () => {
                                                    const isSold = car.status === 'SOLD';
                                                    const newStatus = isSold ? 'AVAILABLE' : 'SOLD';
                                                    const confirmMsg = isSold
                                                        ? 'Bạn muốn đăng bán lại xe này?'
                                                        : 'Bạn có chắc chắn muốn đánh dấu xe này là ĐÃ BÁN?';

                                                    if (confirm(confirmMsg)) {
                                                        try {
                                                            const token = localStorage.getItem('jwt_token');
                                                            const res = await fetch(`http://localhost:3000/cars/${car.id}`, {
                                                                method: 'PATCH',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${token}`
                                                                },
                                                                body: JSON.stringify({ status: newStatus })
                                                            });
                                                            if (res.ok) {
                                                                router.refresh();
                                                            } else {
                                                                alert('Có lỗi xảy ra, vui lòng thử lại.');
                                                            }
                                                        } catch (error) {
                                                            console.error(error);
                                                            alert('Có lỗi xảy ra.');
                                                        }
                                                    }
                                                }}
                                                className={`flex-shrink-0 font-bold px-4 rounded-none transition-all flex items-center justify-center gap-2 ${car.status === 'SOLD'
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'bg-red-600 text-white hover:bg-red-700'
                                                    }`}
                                                title={car.status === 'SOLD' ? 'Đăng bán lại' : 'Đánh dấu đã bán'}
                                            >
                                                {car.status === 'SOLD' ? 'Đăng lại' : 'Đã bán'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Seller Info */}
                            <Link href={car.seller?.id ? `/seller/${car.seller.id}` : '#'} className="block bg-white p-6 rounded-none shadow-sm border border-gray-100 hover:border-[var(--jdm-red)] hover:shadow-md transition-all group cursor-pointer">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-none bg-black flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white">
                                        {car.seller?.name?.[0] || car.seller?.email?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-black text-lg group-hover:text-[var(--jdm-red)] transition-colors">{car.seller?.name || car.seller?.email || 'Người bán ẩn danh'}</h4>
                                        <p className="text-gray-500 text-xs flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Xác thực
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--jdm-red)] transition-colors" />
                                </div>
                                <div className="flex items-center justify-between text-sm py-3 border-t border-gray-100">
                                    <span className="text-gray-500">Tham gia</span>
                                    <span className="font-semibold text-gray-900">{car.seller?.createdAt ? new Date(car.seller.createdAt).getFullYear() : '2023'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-3 border-t border-gray-100">
                                    <span className="text-gray-500">Khu vực</span>
                                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-gray-400" /> {car.location || "Toàn quốc"}
                                    </span>
                                </div>
                                <div className="mt-3 text-center text-sm font-medium text-[var(--jdm-red)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    Xem hồ sơ người bán →
                                </div>
                            </Link>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
