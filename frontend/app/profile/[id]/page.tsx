'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Heart, Calendar, User as UserIcon, ArrowLeft, LogOut, Loader2, Download, X, CheckCircle, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/stores';
import { locationsApi, usersApi, type PublicUser } from '@/lib/api';
import { Spinner, toast } from '@/components/ui';
import { usePWAInstall } from '@/components/providers';
import type { Location } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const PAGE_LIMIT = 10;

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const { user: currentUser } = useAuthStore();

    const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalLocations, setTotalLocations] = useState(0);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Use global PWA install hook
    const { isInstalled: isAppInstalled, canInstall, triggerInstall } = usePWAInstall();

    const isOwnProfile = currentUser?.id === userId;

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userResponse, locationsResponse] = await Promise.all([
                    usersApi.getPublic(userId),
                    locationsApi.getByUser(userId, { page: 1, limit: PAGE_LIMIT }),
                ]);
                setProfileUser(userResponse);
                setLocations(locationsResponse.data);
                setTotalLocations(locationsResponse.meta.total);
                setHasMore(locationsResponse.meta.page < locationsResponse.meta.totalPages);
            } catch {
                setError('Không tìm thấy người dùng');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    // Load more locations
    useEffect(() => {
        if (page === 1) return;

        const loadMore = async () => {
            setIsLoadingMore(true);
            try {
                const response = await locationsApi.getByUser(userId, { page, limit: PAGE_LIMIT });
                setLocations(prev => [...prev, ...response.data]);
                setHasMore(response.meta.page < response.meta.totalPages);
            } catch {
                toast.error('Không thể tải thêm');
            } finally {
                setIsLoadingMore(false);
            }
        };
        loadMore();
    }, [page, userId]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoading, isLoadingMore]);

    const handleShareProfile = async () => {
        const profileUrl = window.location.href;
        const shareData = {
            title: `Profile của ${profileUser?.displayName}`,
            text: `Xem profile và các địa điểm của ${profileUser?.displayName} trên iCheck!`,
            url: profileUrl,
        };

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(profileUrl);
                toast.success('Đã sao chép link profile!');
            }
        } catch (error) {
            // User cancelled or share failed - try clipboard fallback
            if ((error as Error).name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(profileUrl);
                    toast.success('Đã sao chép link profile!');
                } catch {
                    toast.error('Không thể chia sẻ');
                }
            }
        }
    };

    const handleLike = async (location: Location) => {
        if (!currentUser) {
            toast.error('Vui lòng đăng nhập để thích địa điểm');
            return;
        }

        try {
            if (location.isLiked) {
                await locationsApi.unlike(location.id);
                setLocations((prev) =>
                    prev.map((l) =>
                        l.id === location.id ? { ...l, isLiked: false, likeCount: (l.likeCount || 0) - 1 } : l
                    )
                );
            } else {
                await locationsApi.like(location.id);
                setLocations((prev) =>
                    prev.map((l) =>
                        l.id === location.id ? { ...l, isLiked: true, likeCount: (l.likeCount || 0) + 1 } : l
                    )
                );
            }
        } catch {
            toast.error('Không thể thực hiện');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !profileUser) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy người dùng</h1>
                <p className="text-gray-500 mb-6">Người dùng này không tồn tại hoặc đã bị xóa.</p>
                <Link href="/" className="text-teal-600 hover:text-teal-700 font-medium">
                    ← Quay về trang chủ
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: profileUser.displayName,
                        url: `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profileUser.id}`,
                        image: profileUser.avatar || undefined,
                        memberOf: {
                            '@type': 'Organization',
                            name: 'iCheck',
                            url: typeof window !== 'undefined' ? window.location.origin : 'https://icheck.app',
                        },
                    }),
                }}
            />
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    {/* Download Button */}
                    <button
                        onClick={() => setShowDownloadModal(true)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAppInstalled
                            ? 'bg-teal-100 text-teal-600 hover:bg-teal-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        title="Tải ứng dụng"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    {isOwnProfile && (
                        <button
                            onClick={() => {
                                useAuthStore.getState().logout();
                                router.replace('/login');
                            }}
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors text-gray-500"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Download Modal */}
            {showDownloadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Tải ứng dụng iCheck</h3>
                            <button
                                onClick={() => setShowDownloadModal(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {isAppInstalled ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-teal-600" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">Đã cài đặt ứng dụng</h4>
                                    <p className="text-gray-500 text-sm">
                                        Ứng dụng iCheck đã được cài đặt trên thiết bị của bạn. Bạn có thể mở từ màn hình chính!
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Download className="w-8 h-8 text-white" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">Cài đặt ứng dụng</h4>
                                    <p className="text-gray-500 text-sm mb-6">
                                        Cài đặt iCheck trên thiết bị để truy cập nhanh từ màn hình chính và sử dụng offline.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            const installed = await triggerInstall();
                                            if (installed) {
                                                toast.success('Đang cài đặt ứng dụng...');
                                            } else if (!canInstall) {
                                                // No install prompt available - show fallback
                                                toast.info('Nhấn menu trình duyệt → "Thêm vào màn hình chính"');
                                            }
                                            setShowDownloadModal(false);
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Tải xuống ngay
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 pb-6">
                            <button
                                onClick={() => setShowDownloadModal(false)}
                                className="w-full py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Header */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white mb-6">
                <div className="flex items-center gap-4">
                    {profileUser.avatar ? (
                        <Image
                            src={profileUser.avatar}
                            alt={profileUser.displayName}
                            width={80}
                            height={80}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white/20"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                            <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold truncate">{profileUser.displayName}</h1>
                        {isOwnProfile && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-white/20 rounded-full mt-1">
                                Đây là bạn
                            </span>
                        )}
                        <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Tham gia {format(new Date(profileUser.createdAt), 'MMMM yyyy', { locale: vi })}
                        </p>
                    </div>
                    {/* Share Profile Button */}
                    <button
                        onClick={handleShareProfile}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors shrink-0"
                        title="Chia sẻ profile"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/20">
                    <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold">{totalLocations}</p>
                        <p className="text-white/70 text-sm">Địa điểm</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold">
                            {locations.reduce((sum, l) => sum + (l.likeCount || 0), 0)}
                        </p>
                        <p className="text-white/70 text-sm">Lượt thích</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Timeline công khai</h2>
                <p className="text-sm text-gray-500">
                    {isOwnProfile ? 'Những địa điểm bạn đã chia sẻ' : `Những địa điểm ${profileUser.displayName} đã chia sẻ`}
                </p>
            </div>

            {locations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có địa điểm công khai nào</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {locations.map((location) => (
                        <div
                            key={location.id}
                            className="bg-white rounded-2xl shadow-sm overflow-hidden"
                        >
                            {location.image && (
                                <Image
                                    src={`${API_URL}${location.image}`}
                                    alt={location.name}
                                    width={800}
                                    height={450}
                                    className="w-full aspect-video object-cover"
                                />
                            )}
                            <div className="p-3 sm:p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{location.name}</h3>
                                        {location.category && (
                                            <span
                                                className="inline-block px-2 py-0.5 text-xs rounded-full mt-1"
                                                style={{
                                                    backgroundColor: `${location.category.iconColor}20`,
                                                    color: location.category.iconColor || '#0d9488',
                                                }}
                                            >
                                                {location.category.icon}{' '}
                                                {location.category.parent
                                                    ? `${location.category.parent.name} › ${location.category.name}`
                                                    : location.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {format(new Date(location.createdAt), 'dd/MM/yyyy')}
                                    </span>
                                </div>

                                {location.note && (
                                    <p className="text-sm text-gray-600 mt-2">{location.note}</p>
                                )}

                                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleLike(location)}
                                        disabled={!currentUser}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${!currentUser
                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            : location.isLiked
                                                ? 'bg-red-50 text-red-500'
                                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                            }`}
                                        title={!currentUser ? 'Đăng nhập để thích' : undefined}
                                    >
                                        <Heart className={`w-4 h-4 ${location.isLiked ? 'fill-current' : ''}`} />
                                        <span className="text-sm font-medium">{location.likeCount || 0}</span>
                                    </button>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                                    >
                                        Chỉ đường →
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} className="py-4 flex justify-center">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Đang tải thêm...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
