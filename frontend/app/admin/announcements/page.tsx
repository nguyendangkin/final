'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Edit, Trash2, Clock, Save, X, Eye, FileText } from 'lucide-react';
import AnnouncementSkeleton from '@/components/AnnouncementSkeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Announcement {
    id: string;
    title: string;
    content: string;
    isGlobal: boolean;
    isPublished: boolean;
    author: { id: string; name: string } | null;
    createdAt: string;
    updatedAt: string;
}

type TabType = 'write' | 'history';

export default function AdminAnnouncementsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('write');

    // Write form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isGlobal, setIsGlobal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Edit mode
    const [editingId, setEditingId] = useState<string | null>(null);

    // History state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

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
                if (!data.isAdmin) {
                    router.push('/');
                    return;
                }
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
            });
    }, [router]);

    // Fetch announcements
    const fetchAnnouncements = useCallback(async (pageNum: number, reset: boolean = false) => {
        const token = localStorage.getItem('jwt_token');
        if (!token || historyLoading) return;

        setHistoryLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/admin/announcements?page=${pageNum}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(prev => reset ? data.items : [...prev, ...data.items]);
                setHasMore(data.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        }
        setHistoryLoading(false);
    }, [historyLoading]);

    // Load history when tab changes
    useEffect(() => {
        if (!loading && user && activeTab === 'history' && announcements.length === 0) {
            fetchAnnouncements(1, true);
        }
    }, [loading, user, activeTab]);

    // Infinite scroll
    useEffect(() => {
        if (activeTab !== 'history') return;

        if (loadMoreRef.current) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !historyLoading) {
                        fetchAnnouncements(page + 1);
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
    }, [activeTab, hasMore, historyLoading, page]);

    // Create or Update announcement
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        setIsSubmitting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const url = editingId
                ? `${apiUrl}/admin/announcements/${editingId}`
                : `${apiUrl}/admin/announcements`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: title.trim(), content: content.trim(), isGlobal })
            });

            if (res.ok) {
                setTitle('');
                setContent('');
                setIsGlobal(false);
                setEditingId(null);
                // Refresh history
                fetchAnnouncements(1, true);
                setActiveTab('history');
            }
        } catch (error) {
            console.error('Failed to save announcement', error);
        }
        setIsSubmitting(false);
    };

    // Edit announcement
    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setTitle(announcement.title);
        setContent(announcement.content);
        setIsGlobal(announcement.isGlobal);
        setActiveTab('write');
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setIsGlobal(false);
    };

    // Delete announcement
    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;

        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete announcement', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/admin" className="text-gray-600 hover:text-black">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Quản lý thông báo hệ thống</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('write')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm border-b-2 transition-colors ${activeTab === 'write'
                            ? 'border-[var(--jdm-red)] text-[var(--jdm-red)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        {editingId ? 'Sửa bài viết' : 'Viết bài viết'}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-3 font-bold uppercase text-sm border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-[var(--jdm-red)] text-[var(--jdm-red)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Lịch sử
                    </button>
                </div>

                {/* Write Tab */}
                {activeTab === 'write' && (
                    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
                        {editingId && (
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                <p className="text-sm text-gray-600">Đang chỉnh sửa bài viết</p>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
                                >
                                    <X className="w-4 h-4" />
                                    Hủy
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                    Tiêu đề
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Nhập tiêu đề thông báo..."
                                    className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-[var(--jdm-red)] transition-colors"
                                    maxLength={200}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-700 uppercase">
                                        Nội dung (Markdown)
                                    </label>
                                    <div className="flex bg-gray-100 rounded p-1">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode(false)}
                                            className={`px-3 py-1 text-xs font-bold rounded uppercase transition-colors flex items-center gap-1 ${!previewMode ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                        >
                                            <FileText className="w-3 h-3" />
                                            Soạn thảo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode(true)}
                                            className={`px-3 py-1 text-xs font-bold rounded uppercase transition-colors flex items-center gap-1 ${previewMode ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                                        >
                                            <Eye className="w-3 h-3" />
                                            Xem trước
                                        </button>
                                    </div>
                                </div>

                                {previewMode ? (
                                    <div className="w-full px-4 py-3 border border-gray-200 min-h-[300px] bg-gray-50 prose max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {content || '*Chưa có nội dung*'}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Nhập nội dung thông báo (hỗ trợ Markdown)..."
                                            rows={12}
                                            className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:border-[var(--jdm-red)] transition-colors resize-y font-mono text-sm"
                                            maxLength={5000}
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-400">Hỗ trợ Markdown: **Đậm**, *Nghiêng*, [Link](url), - List</p>
                                            <p className="text-xs text-gray-400">{content.length}/5000</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center space-x-3 mb-4 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isGlobal}
                                        onChange={(e) => setIsGlobal(e.target.checked)}
                                        className="w-5 h-5 text-black border-2 border-gray-300 rounded focus:ring-0 cursor-pointer accent-black"
                                    />
                                    <div>
                                        <span className="text-sm font-bold uppercase text-gray-700 block">Gửi toàn cục</span>
                                        <span className="text-xs text-gray-500 block">Nếu tích chọn: Thông báo sẽ gửi cho toàn bộ người dùng (kể cả người mới đăng ký sau này). Nếu không chọn: Chỉ gửi cho người dùng hiện tại (trước thời điểm đăng).</span>
                                    </div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !title.trim() || !content.trim()}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white font-bold uppercase tracking-wide hover:bg-[var(--jdm-red)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Đăng thông báo')}
                            </button>
                        </div>
                    </form>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {historyLoading && announcements.length === 0 ? (
                            <div>
                                {[...Array(3)].map((_, i) => <AnnouncementSkeleton key={i} />)}
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white border border-gray-200">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Chưa có thông báo nào</p>
                            </div>
                        ) : (
                            announcements.map(announcement => (
                                <div key={announcement.id} className="bg-white border border-gray-200 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-black truncate">{announcement.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{announcement.content}</p>
                                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                                <span>{announcement.author?.name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{new Date(announcement.createdAt).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                                {!announcement.isPublished && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                                        Ẩn
                                                    </span>
                                                )}
                                                {announcement.isGlobal && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                        Toàn cục
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(announcement)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Load more trigger */}
                        <div ref={loadMoreRef} className="py-4">
                            {historyLoading && announcements.length > 0 && (
                                <div className="space-y-3">
                                    {[...Array(2)].map((_, i) => <AnnouncementSkeleton key={`loading-${i}`} />)}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
