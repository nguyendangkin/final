'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, Facebook, ShieldCheck, Pencil, CheckCircle2, Camera, Flag, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateCarSlug, generateSellerSlug } from '@/lib/utils';
import { MapPin, User } from 'lucide-react';

interface CarActionCardProps {
    car: any;
    currentUser: any;
    isOwner: boolean;
    isGeneratingPoster: boolean;
    onGeneratePoster: () => void;
    className?: string;
}

export default function CarActionCard({
    car,
    currentUser,
    isOwner,
    isGeneratingPoster,
    onGeneratePoster,
    className = ""
}: CarActionCardProps) {
    const router = useRouter();

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

    // Report Logic
    const submitReport = async (reason: string, carId: string) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        const toastId = toast.loading('Đang gửi báo cáo...');

        try {
            const res = await fetch('http://localhost:3000/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ carId, reason })
            });

            if (res.ok) {
                toast.success('Đã gửi báo cáo thành công. Cảm ơn bạn đã đóng góp!', { id: toastId });
            } else {
                toast.error('Có lỗi xảy ra khi gửi báo cáo.', { id: toastId });
            }
        } catch (e) {
            toast.error('Lỗi kết nối server.', { id: toastId });
        }
    };

    const confirmReport = (reason: string, reasonLabel: string, carId: string) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col border-2 border-[var(--jdm-red)]`}>
                <div className="p-6 bg-[var(--jdm-red)]">
                    <div className="flex items-center gap-3 text-white">
                        <AlertTriangle className="w-8 h-8 fill-yellow-400 text-[var(--jdm-red)]" />
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-wide">Cảnh báo nghiêm trọng</h3>
                            <p className="text-xs font-medium text-white/90">Hành động này không thể hoàn tác</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-sm text-black font-bold mb-2 uppercase">Bạn đang tố cáo bài viết về:</p>
                    <div className="bg-gray-100 p-3 mb-4 font-mono text-xs font-bold border-l-4 border-black">
                        {reasonLabel}
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        Chúng tôi sẽ xem xét báo cáo này. Tuy nhiên, nếu phát hiện bạn <span className="text-[var(--jdm-red)] font-black">CỐ TÌNH BÁO CÁO SAI SỰ THẬT</span>, tài khoản của bạn sẽ bị <span className="text-black font-black bg-yellow-300 px-1">KHÓA VĨNH VIỄN</span> ngay lập tức.
                    </p>
                </div>
                <div className="flex border-t border-gray-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none uppercase transition-all"
                    >
                        Suy nghĩ lại
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            submitReport(reason, carId);
                        }}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-black hover:bg-[var(--jdm-red)] focus:outline-none uppercase transition-all"
                    >
                        Xác nhận tố cáo
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    return (
        <div className={`space-y-6 ${className}`}>
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

                            {car.zaloLink && (
                                <a href={`https://zalo.me/${car.zaloLink.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#0068FF] text-white font-bold py-4 rounded-none hover:bg-[#0058D6] transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <MessageCircle className="w-5 h-5" /> Zalo: {car.zaloLink}
                                </a>
                            )}

                            {car.facebookLink && (
                                <a href={car.facebookLink} target="_blank" rel="noopener noreferrer" className="w-full bg-[#1877F2] text-white font-bold py-4 rounded-none hover:bg-[#166fe5] transition-all flex items-center justify-center gap-2">
                                    <Facebook className="w-5 h-5" /> Nhắn tin Facebook
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
                        <>
                            <div className="flex gap-2">
                                {car.status !== 'SOLD' && (
                                    <Link
                                        href={`/cars/${generateCarSlug(car)}/edit`}
                                        className="flex-1 bg-black text-white font-bold py-4 rounded-none hover:bg-gray-800 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                                    >
                                        <Pencil className="w-5 h-5" /> Chỉnh sửa
                                    </Link>
                                )}

                                <button
                                    onClick={async () => {
                                        const isSold = car.status === 'SOLD';
                                        const newStatus = isSold ? 'AVAILABLE' : 'SOLD';
                                        const confirmMsg = isSold
                                            ? 'Bạn muốn đăng bán lại xe này?'
                                            : 'Bạn có chắc chắn muốn đánh dấu xe này là ĐÃ BÁN?';

                                        toast.custom((t) => (
                                            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col`}>
                                                <div className="p-6">
                                                    <div className="flex items-start">
                                                        <div className="flex-shrink-0 pt-0.5">
                                                            <div className="h-12 w-12 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                                                <ShieldCheck className="h-6 w-6 text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 flex-1">
                                                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                                                Xác nhận trạng thái
                                                            </h3>
                                                            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                                                {confirmMsg}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex bg-gray-50 mt-4">
                                                    <button
                                                        onClick={() => toast.dismiss(t.id)}
                                                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none uppercase transition-all"
                                                    >
                                                        Hủy
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            toast.dismiss(t.id);
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
                                                                    toast.success(`Đã đánh dấu xe là ${newStatus === 'SOLD' ? 'ĐÃ BÁN' : 'CÓ SẴN'}`);
                                                                    router.refresh();
                                                                } else {
                                                                    toast.error('Có lỗi xảy ra, vui lòng thử lại.');
                                                                }
                                                            } catch (error) {
                                                                console.error(error);
                                                                toast.error('Có lỗi xảy ra.');
                                                            }
                                                        }}
                                                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-black hover:bg-[var(--jdm-red)] focus:outline-none uppercase transition-all"
                                                    >
                                                        Đồng ý
                                                    </button>
                                                </div>
                                            </div>
                                        ), { duration: 5000 });
                                    }}
                                    className={`${car.status === 'SOLD' ? 'w-full' : 'flex-shrink-0'} font-bold px-4 py-4 rounded-none transition-all flex items-center justify-center gap-2 ${car.status === 'SOLD'
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    title={car.status === 'SOLD' ? 'Đăng bán lại' : 'Đánh dấu đã bán'}
                                >
                                    {car.status === 'SOLD' ? 'Đăng lại' : 'Đã bán'}
                                </button>
                            </div>

                            {/* Generate Poster Button - Hidden if Sold */}
                            {car.status !== 'SOLD' && (
                                <button
                                    onClick={onGeneratePoster}
                                    disabled={isGeneratingPoster}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-none hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera className="w-5 h-5" />
                                    {isGeneratingPoster ? 'Đang tạo...' : 'Tạo Poster Bán Xe'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Seller Info */}
            <Link href={car.seller?.id ? `/seller/${generateSellerSlug(car.seller)}` : '#'} className="block bg-white p-6 rounded-none shadow-sm border border-gray-100 hover:border-[var(--jdm-red)] hover:shadow-md transition-all group cursor-pointer">
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

            {/* Report Button */}
            {!isOwner && (
                <div className="text-center">
                    <button
                        onClick={() => {
                            if (!currentUser) {
                                router.push('/login');
                                return;
                            }
                            // Open Report Logic
                            toast.custom((t) => (
                                <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col border border-gray-200`}>
                                    <div className="p-6">
                                        <div className="flex items-start mb-4">
                                            <div className="flex-shrink-0 pt-0.5">
                                                <div className="h-10 w-10 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                                    <Flag className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                                    Tố cáo vi phạm
                                                </h3>
                                                <p className="mt-1 text-xs text-gray-500 font-medium">
                                                    Vui lòng chọn lý do tố cáo bài viết này.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {[
                                                { id: 'SENSITIVE', label: 'Nội dung nhạy cảm / Đồi trụy' },
                                                { id: 'IRRELEVANT', label: 'Nội dung không liên quan JDM' },
                                                { id: 'SPAM', label: 'Spam / Tin rác / Lừa đảo' },
                                            ].map((reason) => (
                                                <button
                                                    key={reason.id}
                                                    onClick={() => {
                                                        toast.dismiss(t.id);
                                                        confirmReport(reason.id, reason.label, car.id);
                                                    }}
                                                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-800 uppercase border border-transparent hover:border-gray-300 transition-all flex items-center justify-between group"
                                                >
                                                    {reason.label}
                                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                                        <button
                                            onClick={() => toast.dismiss(t.id)}
                                            className="w-full text-center text-xs font-bold text-gray-400 hover:text-black uppercase transition-colors"
                                        >
                                            Hủy bỏ
                                        </button>
                                    </div>
                                </div>
                            ), { duration: Infinity, id: 'report-modal' });
                        }}
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[var(--jdm-red)] transition-colors uppercase tracking-wider group"
                    >
                        <Flag className="w-4 h-4 group-hover:fill-current" />
                        Báo cáo bài viết này
                    </button>
                </div>
            )}
        </div>
    );
}
