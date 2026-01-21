'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User as UserIcon, Megaphone, Check, CheckCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import NotificationSkeleton from '@/components/NotificationSkeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface UserNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

interface SystemAnnouncement {
    id: string;
    title: string;
    content: string;
    author: { id: string; name: string } | null;
    isRead: boolean;
    createdAt: string;
}

type TabType = 'user' | 'system';

export default function NotificationsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('user');

    // User notifications state
    const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
    const [userPage, setUserPage] = useState(1);
    const [userHasMore, setUserHasMore] = useState(true);
    const [userLoading, setUserLoading] = useState(false);

    // System announcements state
    const [systemAnnouncements, setSystemAnnouncements] = useState<SystemAnnouncement[]>([]);
    const [systemPage, setSystemPage] = useState(1);
    const [systemHasMore, setSystemHasMore] = useState(true);
    const [systemLoading, setSystemLoading] = useState(false);

    // Unread counts
    const [unreadCounts, setUnreadCounts] = useState({ user: 0, system: 0, total: 0 });

    // Selected announcement for detail view
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<SystemAnnouncement | null>(null);

    const router = useRouter();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        fetch(`${apiUrl}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
            });
    }, [router]);

    // Fetch unread counts
    const fetchUnreadCounts = useCallback(async () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCounts(data);
            }
        } catch (error) {
            console.error('Failed to fetch unread counts', error);
        }
    }, []);

    // Fetch user notifications
    const fetchUserNotifications = useCallback(async (page: number, reset: boolean = false) => {
        const token = localStorage.getItem('jwt_token');
        if (!token || userLoading) return;

        setUserLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/notifications?type=user&page=${page}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserNotifications(prev => reset ? data.items : [...prev, ...data.items]);
                setUserHasMore(data.hasMore);
                setUserPage(page);
            }
        } catch (error) {
            console.error('Failed to fetch user notifications', error);
        }
        setUserLoading(false);
    }, [userLoading]);

    // Fetch system announcements
    const fetchSystemAnnouncements = useCallback(async (page: number, reset: boolean = false) => {
        const token = localStorage.getItem('jwt_token');
        if (!token || systemLoading) return;

        setSystemLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/notifications?type=system&page=${page}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSystemAnnouncements(prev => reset ? data.items : [...prev, ...data.items]);
                setSystemHasMore(data.hasMore);
                setSystemPage(page);
            }
        } catch (error) {
            console.error('Failed to fetch system announcements', error);
        }
        setSystemLoading(false);
    }, [systemLoading]);

    // Initial data load
    useEffect(() => {
        if (!loading && user) {
            fetchUnreadCounts();
            fetchUserNotifications(1, true);
            fetchSystemAnnouncements(1, true);
        }
    }, [loading, user]);

    // Infinite scroll observer
    useEffect(() => {
        if (loadMoreRef.current) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        if (activeTab === 'user' && userHasMore && !userLoading) {
                            fetchUserNotifications(userPage + 1);
                        } else if (activeTab === 'system' && systemHasMore && !systemLoading) {
                            fetchSystemAnnouncements(systemPage + 1);
                        }
                    }
                },
                { threshold: 0.1 }
            );
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [activeTab, userHasMore, userLoading, systemHasMore, systemLoading, userPage, systemPage]);

    // Mark notification as read
    const markAsRead = async (id: string, type: TabType) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            await fetch(`${apiUrl}/notifications/${id}/read?type=${type}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (type === 'user') {
                setUserNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
            } else {
                setSystemAnnouncements(prev =>
                    prev.map(a => a.id === id ? { ...a, isRead: true } : a)
                );
            }
            fetchUnreadCounts();
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async (type: TabType) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            await fetch(`${apiUrl}/notifications/mark-all-read?type=${type}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (type === 'user') {
                setUserNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } else {
                setSystemAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
            }
            fetchUnreadCounts();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    // View announcement detail
    const viewAnnouncementDetail = async (announcement: SystemAnnouncement) => {
        if (!announcement.isRead) {
            await markAsRead(announcement.id, 'system');
        }
        setSelectedAnnouncement(announcement);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 h-8 w-48 bg-gray-200 animate-pulse" /> {/* Title Skeleton */}
                    <div className="mb-6 h-12 w-full bg-gray-200 animate-pulse border-b" /> {/* Tabs Skeleton */}
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <NotificationSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Announcement detail view
    if (selectedAnnouncement) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => setSelectedAnnouncement(null)}
                        className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 font-bold uppercase text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Quay lại
                    </button>

                    <div className="bg-white border border-gray-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200 bg-black text-white">
                            <h1 className="text-xl font-bold uppercase tracking-wide">{selectedAnnouncement.title}</h1>
                            <p className="text-sm text-gray-300 mt-1">
                                {selectedAnnouncement.author?.name || 'Hệ thống'} • {new Date(selectedAnnouncement.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                        <div className="px-6 py-6">
                            <div className="prose max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedAnnouncement.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-gray-600 hover:text-black">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Thông báo</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm border-b-2 transition-colors ${activeTab === 'user'
                            ? 'border-[var(--jdm-red)] text-[var(--jdm-red)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <UserIcon className="w-4 h-4" />
                        Người dùng
                        {unreadCounts.user > 0 && (
                            <span className="bg-[var(--jdm-red)] text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadCounts.user > 99 ? '99+' : unreadCounts.user}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm border-b-2 transition-colors ${activeTab === 'system'
                            ? 'border-[var(--jdm-red)] text-[var(--jdm-red)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Megaphone className="w-4 h-4" />
                        Hệ thống
                        {unreadCounts.system > 0 && (
                            <span className="bg-[var(--jdm-red)] text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {unreadCounts.system > 99 ? '99+' : unreadCounts.system}
                            </span>
                        )}
                    </button>
                </div>

                {/* Mark all as read button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => markAllAsRead(activeTab)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--jdm-red)] font-medium transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đánh dấu tất cả đã đọc
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {activeTab === 'user' ? (
                        <>
                            {userNotifications.length === 0 && !userLoading ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Không có thông báo nào</p>
                                </div>
                            ) : (
                                userNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id, 'user')}
                                        className={`bg-white border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors ${!notification.isRead ? 'border-l-4 border-l-[var(--jdm-red)]' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className={`font-bold text-sm ${!notification.isRead ? 'text-black' : 'text-gray-600'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {notification.isRead && (
                                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            {systemAnnouncements.length === 0 && !systemLoading ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Không có thông báo hệ thống nào</p>
                                </div>
                            ) : (
                                systemAnnouncements.map(announcement => (
                                    <div
                                        key={announcement.id}
                                        onClick={() => viewAnnouncementDetail(announcement)}
                                        className={`bg-white border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors ${!announcement.isRead ? 'border-l-4 border-l-[var(--jdm-red)]' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className={`font-bold text-sm ${!announcement.isRead ? 'text-black' : 'text-gray-600'}`}>
                                                    {announcement.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {announcement.content}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {announcement.author?.name || 'Hệ thống'} • {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            </div>
                                            {announcement.isRead && (
                                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* Load more trigger */}
                    <div ref={loadMoreRef} className="py-4">
                        {(activeTab === 'user' ? userLoading : systemLoading) && (
                            <div className="space-y-3 mt-3">
                                {[...Array(2)].map((_, i) => (
                                    <NotificationSkeleton key={`loading-${i}`} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
