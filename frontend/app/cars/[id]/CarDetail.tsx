'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Gauge, ShieldCheck, User, Phone, MessageCircle, ChevronRight, Maximize2, CheckCircle2, Box, Hammer, Armchair, Disc, FileText, Youtube, PlayCircle, Facebook, Car, Pencil, History, Flag, AlertTriangle, Camera, Download } from 'lucide-react';
import Lightbox from '@/components/Lightbox';
import { toast } from 'react-hot-toast';
import { generateCarSlug, generateSellerSlug } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import CarGallery from '@/components/CarGallery';
import CarActionCard from '@/components/CarActionCard';

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

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const posterRef = useRef<HTMLDivElement>(null);
    const hasIncremented = useRef(false);

    useEffect(() => {
        if (hasIncremented.current) return;
        hasIncremented.current = true;

        const token = localStorage.getItem('jwt_token');
        fetch(`http://localhost:3000/cars/${car.id}/view`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        }).catch(err => console.error('Failed to increment view:', err));
    }, [car.id]);

    // MERGE: Ensure thumbnail is the first image if it exists
    const rawImages = Array.isArray(car.images) && car.images.length > 0 ? car.images : [];

    // Process images with thumbnail priority
    let images = car.thumbnail ? [car.thumbnail, ...rawImages.filter((img: string) => img !== car.thumbnail)] : rawImages;

    // Fallback if no images
    if (images.length === 0) {
        images = ["https://placehold.co/600x400/e2e8f0/1e293b?text=No+Image"];
    }

    // Set QR URL on client-side to avoid hydration mismatch
    useEffect(() => {
        setQrUrl(`${window.location.origin}/cars/${generateCarSlug(car)}`);
    }, [car]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    // Generate Poster function
    const generatePoster = async () => {
        if (!posterRef.current) return;

        setIsGeneratingPoster(true);
        const loadingToast = toast.loading('Đang tạo poster...');

        try {
            const dataUrl = await toPng(posterRef.current, {
                quality: 1,
                pixelRatio: 2,
                cacheBust: true,
            });

            const link = document.createElement('a');
            link.download = `poster-${car.make}-${car.model}-${car.year}.png`;
            link.href = dataUrl;
            link.click();

            toast.success('Đã tải xuống poster thành công!', { id: loadingToast });
        } catch (error) {
            console.error('Error generating poster:', error);
            toast.error('Có lỗi xảy ra khi tạo poster.', { id: loadingToast });
        } finally {
            setIsGeneratingPoster(false);
        }
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

    // Mappings are no longer needed since sell page now stores full display text directly.
    // Data from server should be displayed as-is.

    // Helper for registry expiry display
    const getRegistryExpiryText = () => {
        if (car.noRegistry) return 'KHÔNG ĐĂNG KIỂM ĐƯỢC';
        if (car.registryExpiry) return car.registryExpiry;
        return '---';
    };


    // Helper to render mod tags
    const renderMods = (mods: any) => {
        if (!mods) return null;
        // Handle both parsed JSON object and legacy raw JSON if needed
        const parsedMods = typeof mods === 'string' ? JSON.parse(mods) : mods;

        const categories = [
            { key: 'engine', label: 'MÁY MÓC & HIỆU SUẤT', icon: Hammer, color: 'text-black', bg: 'bg-gray-50', border: 'border-gray-200' },
            { key: 'footwork', label: 'GẦM & BÁNH', icon: Disc, color: 'text-gray-800', bg: 'bg-gray-50', border: 'border-gray-200' },
            { key: 'exterior', label: 'NGOẠI THẤT', icon: Box, color: 'text-black', bg: 'bg-gray-50', border: 'border-gray-200' },
            { key: 'interior', label: 'NỘI THẤT', icon: Armchair, color: 'text-black', bg: 'bg-gray-50', border: 'border-gray-200' },
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
        <div className="min-h-screen bg-white pt-20 pb-12 lg:pb-12 font-sans selection:bg-red-500/30">
            <Lightbox
                images={images}
                initialIndex={lightboxIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link href="/" className="hover:text-[var(--jdm-red)] transition-colors">Trang chủ</Link> <ChevronRight className="w-4 h-4" />
                    <span className="font-semibold text-gray-900">{car.make} {car.model}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Images & Detail Info */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* NEW MODERN IMAGE GALLERY */}
                        <div className="mb-8"><CarGallery images={images} status={car.status} onOpenLightbox={openLightbox} /></div>


                        {/* Title & Price Card (Mobile) - Duplicated from Sidebar */}
                        <CarActionCard
                            car={car}
                            currentUser={currentUser}
                            isOwner={isOwner}
                            isGeneratingPoster={isGeneratingPoster}
                            onGeneratePoster={generatePoster}
                            className="lg:hidden mt-4"
                        />

                        {/* Thông số Kỹ thuật */}
                        <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase">
                                <Gauge className="w-6 h-6 text-[var(--jdm-red)]" /> Thông Số Kỹ Thuật
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
                                    <p className="font-bold text-gray-900 text-lg">{car.transmission || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Hệ dẫn động</p>
                                    <p className="font-bold text-gray-900 text-lg">{car.drivetrain || '---'}</p>
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


                        {/* Notable Features Display */}
                        {car.notableFeatures && car.notableFeatures.length > 0 && (
                            <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase">
                                    <CheckCircle2 className="w-6 h-6 text-[var(--jdm-red)]" /> Điểm Nhấn Ngoại Hình
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {car.notableFeatures.map((feature: string) => (
                                        <span key={feature} className="px-4 py-2 bg-red-50 border border-[var(--jdm-red)] text-[var(--jdm-red)] font-bold text-sm uppercase tracking-wide">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Mod List */}
                        {car.mods && (
                            <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase">
                                    <Box className="w-6 h-6 text-[var(--jdm-red)]" /> Danh Sách Đồ Chơi
                                </h3>
                                {renderMods(car.mods)}
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase">
                                <FileText className="w-6 h-6 text-[var(--jdm-red)]" /> Mô Tả Chi Tiết
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

                        {/* Legal Info */}
                        <div className="bg-gray-50 p-6 md:p-8 rounded-none border border-gray-100">
                            <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2 uppercase">
                                <ShieldCheck className="w-6 h-6 text-[var(--jdm-red)]" /> Pháp Lý & Giấy Tờ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-black shadow-sm border border-gray-100">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-black font-bold uppercase">Loại giấy tờ</p>
                                        <p className="font-medium text-gray-900 text-sm">
                                            {{
                                                'SANG TÊN ĐƯỢC': 'CHÍNH CHỦ',
                                                'KHÔNG SANG TÊN ĐƯỢC': 'KHÔNG CHÍNH CHỦ',
                                                'CHÍNH CHỦ': 'CHÍNH CHỦ',
                                                'KHÔNG CHÍNH CHỦ': 'KHÔNG CHÍNH CHỦ'
                                            }[car.paperwork as string] || car.paperwork || 'Đang cập nhật'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-black shadow-sm border border-gray-100">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-black font-bold uppercase">Hạn đăng kiểm</p>
                                        <p className="font-medium text-gray-900 text-sm">{getRegistryExpiryText()}</p>
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

                        {/* Video Link */}
                        {car.videoLink && (
                            <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase">
                                    <Youtube className="w-6 h-6 text-[var(--jdm-red)]" /> Video Xe
                                </h3>
                                <a
                                    href={car.videoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-[var(--jdm-red)] text-white px-6 py-3 rounded-none font-bold hover:bg-black transition-all uppercase tracking-wide"
                                >
                                    <PlayCircle className="w-5 h-5" /> Xem Video Ngay
                                </a>
                            </div>
                        )}

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

                    {/* RIGHT COLUMN: Sidebar (Sticky) - Hidden on Mobile */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            <CarActionCard
                                car={car}
                                currentUser={currentUser}
                                isOwner={isOwner}
                                isGeneratingPoster={isGeneratingPoster}
                                onGeneratePoster={generatePoster}
                            />
                        </div>
                    </div>

                </div>

                {/* Hidden Poster for Screenshot - Website Style */}
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div
                        ref={posterRef}
                        style={{
                            width: '1080px',
                            height: '1350px',
                            background: '#ffffff',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            color: '#111111',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Red Header Bar */}
                        <div style={{
                            background: '#DC2626',
                            padding: '24px 40px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 900,
                                color: 'white',
                                letterSpacing: '4px',
                                textTransform: 'uppercase',
                            }}>
                                CẦN BÁN
                            </div>
                            <div style={{
                                background: 'white',
                                color: '#DC2626',
                                padding: '8px 20px',
                                fontWeight: 900,
                                fontSize: '14px',
                                letterSpacing: '1px',
                            }}>
                                {car.condition || 'ĐÃ QUA SỬ DỤNG'}
                            </div>
                        </div>

                        {/* Main Image - Large */}
                        <div style={{
                            position: 'relative',
                            height: '540px',
                            overflow: 'hidden',
                        }}>
                            <img
                                src={images[0]}
                                alt={`${car.make} ${car.model}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                                crossOrigin="anonymous"
                            />
                            {/* Price Overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '20px',
                                background: '#DC2626',
                                padding: '16px 32px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}>
                                <span style={{ fontSize: '42px', fontWeight: 900, color: 'white' }}>
                                    {formatMoney(Number(car.price))}
                                </span>
                                {car.isNegotiable && (
                                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', marginLeft: '12px', fontWeight: 600 }}>
                                        (Thương lượng)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Car Title Section */}
                        <div style={{
                            background: '#111111',
                            padding: '28px 40px',
                        }}>
                            <h1 style={{
                                fontSize: '48px',
                                fontWeight: 900,
                                fontStyle: 'italic',
                                textTransform: 'uppercase',
                                margin: 0,
                                color: 'white',
                                lineHeight: 1.1,
                            }}>
                                {car.year} {car.make} {car.model}
                            </h1>
                            {car.trim && (
                                <p style={{
                                    fontSize: '24px',
                                    fontWeight: 600,
                                    color: '#DC2626',
                                    margin: '8px 0 0 0',
                                    textTransform: 'uppercase',
                                }}>
                                    {car.trim}
                                </p>
                            )}
                        </div>

                        {/* Specs Grid - 2 rows */}
                        <div style={{
                            padding: '24px 40px',
                            background: '#f3f3f3',
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '16px',
                            }}>
                                {[
                                    { label: 'Mã khung', value: car.chassisCode || '---' },
                                    { label: 'Động cơ', value: car.engineCode || '---' },
                                    { label: 'Hộp số', value: car.transmission || '---' },
                                    { label: 'Dẫn động', value: car.drivetrain || '---' },
                                    { label: 'ODO', value: `${Number(car.mileage).toLocaleString('vi-VN')} km` },
                                    { label: 'Năm SX', value: String(car.year) },
                                    { label: 'Giấy tờ', value: car.paperwork === 'SANG TÊN ĐƯỢC' || car.paperwork === 'CHÍNH CHỦ' ? 'CHÍNH CHỦ' : (car.paperwork ? car.paperwork.toUpperCase() : 'KHÔNG CHÍNH CHỦ') },
                                    { label: 'Khu vực', value: car.location || 'Toàn quốc' },
                                ].map((spec, idx) => (
                                    <div key={idx} style={{
                                        background: 'white',
                                        border: '2px solid #e5e5e5',
                                        padding: '12px 10px',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#666',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            marginBottom: '4px',
                                            fontWeight: 700
                                        }}>
                                            {spec.label}
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 800,
                                            color: '#111'
                                        }}>
                                            {spec.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mods Section - If exists */}
                        {car.mods && (() => {
                            const parsedMods = typeof car.mods === 'string' ? JSON.parse(car.mods) : car.mods;
                            const allMods: string[] = [
                                ...(parsedMods.engine || []),
                                ...(parsedMods.footwork || []),
                                ...(parsedMods.exterior || []),
                                ...(parsedMods.interior || []),
                            ];
                            if (allMods.length === 0) return null;
                            return (
                                <div style={{
                                    padding: '20px 40px',
                                    background: 'white',
                                    borderTop: '2px solid #e5e5e5',
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        color: '#DC2626',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        marginBottom: '12px',
                                    }}>
                                        ĐỒ CHƠI ĐÃ ĐỘ
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                    }}>
                                        {allMods.slice(0, 8).map((mod: string, idx: number) => (
                                            <span key={idx} style={{
                                                background: '#111',
                                                color: 'white',
                                                padding: '6px 14px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                            }}>
                                                {mod}
                                            </span>
                                        ))}
                                        {allMods.length > 8 && (
                                            <span style={{
                                                background: '#DC2626',
                                                color: 'white',
                                                padding: '6px 14px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                            }}>
                                                +{allMods.length - 8} khác
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Footer - Contact & QR */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: '#111111',
                            padding: '24px 40px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div>
                                {/* Seller Name */}
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: 800,
                                    marginBottom: '8px',
                                    color: 'white',
                                }}>
                                    {car.seller?.name || car.seller?.email || 'Người bán'}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    marginBottom: '10px',
                                    color: '#DC2626',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px'
                                }}>
                                    Liên hệ ngay
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {car.phoneNumber && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '24px',
                                            fontWeight: 900,
                                            color: 'white',
                                        }}>
                                            <span style={{
                                                background: '#DC2626',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                            </span>
                                            {car.phoneNumber}
                                        </div>
                                    )}
                                    {car.zaloLink && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#999',
                                        }}>
                                            <span style={{
                                                background: '#0068FF',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </span>
                                            Zalo: {car.zaloLink}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* QR Code Section */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                            }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#666',
                                        marginBottom: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: 600,
                                    }}>
                                        Quét mã QR
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#DC2626',
                                        fontWeight: 700,
                                    }}>
                                        Xem chi tiết xe
                                    </div>
                                </div>
                                <div style={{
                                    background: 'white',
                                    padding: '10px',
                                }}>
                                    {qrUrl && (
                                        <QRCodeSVG
                                            value={qrUrl}
                                            size={90}
                                            level="H"
                                            includeMargin={false}
                                            fgColor="#111111"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
