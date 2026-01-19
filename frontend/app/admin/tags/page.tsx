'use client';

import { useState, useEffect } from 'react';
import { getTagsStats, deleteTagWithPenalty } from '@/services/cars.service';
import { Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import TagsSkeleton from '@/components/TagsSkeleton';

interface TagCategory {
    category: string;
    items: { tag: string; count: number }[];
}

export default function TagsManagementPage() {
    const [categories, setCategories] = useState<TagCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTags = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getTagsStats();
            setCategories(data);
        } catch (err) {
            setError('Không thể tải danh sách tags');
            console.error(err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleDeleteClick = (tag: string) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col border-2 border-black`}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-12 w-12 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                <Trash2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                Cảnh báo cực đại
                            </h3>
                            <div className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                Bạn đang xóa tag <span className="font-black text-black">"{tag}"</span>.
                                <br />
                                <span className="text-red-600 font-bold block mt-1">HẬU QUẢ KHÔNG THỂ HOÀN TÁC:</span>
                                <ul className="list-disc ml-4 text-xs mt-1 text-gray-500">
                                    <li>Xóa toàn bộ bài viết chứa tag này.</li>
                                    <li>BAN vĩnh viễn người tạo tag.</li>
                                    <li>Xóa sạch xe của người bị ban.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex bg-gray-50 border-t-2 border-black">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none uppercase transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeDelete(tag);
                        }}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-[var(--jdm-red)] hover:bg-red-700 focus:outline-none uppercase transition-all"
                    >
                        Xác nhận trừng phạt
                    </button>
                </div>
            </div>
        ), { duration: 8000 });
    };

    const executeDelete = async (tag: string) => {
        try {
            await deleteTagWithPenalty(tag);
            // Refetch silently (without loading spinner) to get all cascading deletions
            fetchTags(false);
            toast.success(`Đã xóa tag "${tag}" và thi hành án phạt.`, {
                style: {
                    borderRadius: '0px',
                    border: '1px solid black',
                    background: '#000',
                    color: '#fff',
                },
                iconTheme: {
                    primary: 'var(--jdm-red)',
                    secondary: '#fff',
                },
            });
        } catch (err) {
            console.error(err);
            toast.error('Có lỗi xảy ra khi xóa tag.', {
                style: {
                    borderRadius: '0px',
                    border: '1px solid red',
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans text-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/admin" className="inline-flex items-center text-gray-500 hover:text-[var(--jdm-red)] mb-6 transition-colors uppercase font-bold tracking-wider text-sm group">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Quay lại Dashboard
                </Link>

                <div className="border border-black mb-8">
                    <div className="bg-black text-white px-6 py-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Quản lý Tags & Vi Phạm</h1>
                            <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">Hệ thống kiểm soát từ khóa</p>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black text-[var(--jdm-red)] leading-none block">
                                {categories.reduce((acc, cat) => acc + cat.items.length, 0)}
                            </span>
                            <span className="text-xs text-gray-400 uppercase">Tổng Tags</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="border border-red-600 bg-red-50 p-4 mb-8 flex items-center text-red-700">
                        <AlertTriangle className="mr-3" />
                        <span className="font-bold uppercase">{error}</span>
                    </div>
                )}

                {loading ? (
                    <TagsSkeleton />
                ) : (
                    <div className="space-y-8">
                        {categories.map((cat) => (
                            <div key={cat.category}>
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="font-bold uppercase tracking-wide text-sm">{cat.category}</h3>
                                    <span className="bg-black text-white text-xs px-2 py-0.5 font-mono">
                                        {cat.items.length}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cat.items.map((item) => (
                                        <div
                                            key={item.tag}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 hover:border-black transition-colors group"
                                        >
                                            <span className="font-bold text-sm group-hover:text-[var(--jdm-red)] transition-colors">
                                                {item.tag}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">
                                                x{item.count}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteClick(item.tag)}
                                                className="text-gray-300 hover:text-red-600 transition-colors ml-1"
                                                title="Xóa & Phạt"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
