'use client';

import { useState, useEffect } from 'react';
import { getTagsStats, deleteTagWithPenalty, editTag } from '@/services/cars.service';
import { Trash2, AlertTriangle, ArrowLeft, Edit2 } from 'lucide-react';
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

    const [editing, setEditing] = useState<{ category: string, tag: string } | null>(null);
    const [newTagVal, setNewTagVal] = useState('');

    const categoryMap: Record<string, string> = {
        'make': '1. Hãng xe',
        'model': '2. Dòng xe',
        'trim': '3. Phiên bản',
        'year': '4. Năm sản xuất',
        'chassisCode': '5. Mã khung gầm',
        'engineCode': '6. Mã động cơ',
        'transmission': '7. Hộp số',
        'drivetrain': '8. Hệ dẫn động',
        'condition': '9. Tình trạng',
        'feature': '10. Ngoại hình chú ý',
        'paperwork': '11. Loại giấy tờ',
        'location': '12. Khu vực',
        'mods_exterior': '13. Mods: Ngoại thất',
        'mods_interior': '13. Mods: Nội thất',
        'mods_engine': '13. Mods: Máy móc và hiệu suất',
        'mods_footwork': '13. Mods: Gầm và bánh',
    };

    const sortOrder = [
        'make', 'model', 'trim', 'year', 'chassisCode', 'engineCode',
        'transmission', 'drivetrain', 'condition', 'feature', 'paperwork',
        'location', 'mods_exterior', 'mods_interior', 'mods_engine', 'mods_footwork'
    ];

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

    const handleDeleteClick = (item: { tag: string; count: number }) => {
        const { tag, count } = item;
        const isCleanup = count === 0;

        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col border-2 border-black`}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className={`h-12 w-12 rounded-none ${isCleanup ? 'bg-black' : 'bg-[var(--jdm-red)]'} flex items-center justify-center`}>
                                <Trash2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                {isCleanup ? 'Dọn dẹp hệ thống' : 'Cảnh báo cực đại'}
                            </h3>
                            <div className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                {isCleanup ? (
                                    <>
                                        Bạn đang xóa tag <span className="font-black text-black">"{tag}"</span>.
                                        <br />
                                        Tag này hiện không có bài viết nào sử dụng. Xóa sẽ giúp làm sạch danh sách gợi ý.
                                    </>
                                ) : (
                                    <>
                                        Bạn đang xóa tag <span className="font-black text-black">"{tag}"</span>.
                                        <br />
                                        <span className="text-red-600 font-bold block mt-1">HẬU QUẢ KHÔNG THỂ HOÀN TÁC:</span>
                                        <ul className="list-disc ml-4 text-xs mt-1 text-gray-500">
                                            <li>Xóa toàn bộ bài viết chứa tag này.</li>
                                            <li>BAN vĩnh viễn người tạo tag.</li>
                                            <li>Xóa sạch xe của người bị ban.</li>
                                        </ul>
                                    </>
                                )}
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
                            executeDelete(tag, isCleanup);
                        }}
                        className={`w-1/2 p-4 flex items-center justify-center text-sm font-black text-white ${isCleanup ? 'bg-black hover:bg-gray-800' : 'bg-[var(--jdm-red)] hover:bg-red-700'} focus:outline-none uppercase transition-all`}
                    >
                        {isCleanup ? 'Xác nhận xóa' : 'Xác nhận trừng phạt'}
                    </button>
                </div>
            </div>
        ), { duration: 8000 });
    };

    const executeDelete = async (tag: string, isCleanup: boolean) => {
        try {
            await deleteTagWithPenalty(tag);
            fetchTags(false);
            const message = isCleanup 
                ? `Đã dọn dẹp tag "${tag}" khỏi hệ thống.`
                : `Đã xóa tag "${tag}" và thi hành án phạt.`;

            toast.success(message, {
                style: {
                    borderRadius: '0px',
                    border: '1px solid black',
                    background: '#000',
                    color: '#fff',
                },
                iconTheme: {
                    primary: isCleanup ? '#fff' : 'var(--jdm-red)',
                    secondary: '#000',
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

    const openEdit = (category: string, tag: string) => {
        setEditing({ category, tag });
        setNewTagVal(tag);
    };

    const saveEdit = async () => {
        if (!editing || !newTagVal.trim()) return;
        if (newTagVal === editing.tag) {
            setEditing(null);
            return; // No change
        }

        try {
            await editTag(editing.category, editing.tag, newTagVal);
            toast.success('Cập nhật tag thành công!');
            setEditing(null);
            fetchTags(false);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi cập nhật tag');
        }
    };

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans text-black relative">
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
                        {categories
                            .filter(cat => sortOrder.includes(cat.category))
                            .sort((a, b) => sortOrder.indexOf(a.category) - sortOrder.indexOf(b.category))
                            .map((cat) => (
                                <div key={cat.category}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h3 className="font-bold uppercase tracking-wide text-sm">
                                            {categoryMap[cat.category] || cat.category}
                                        </h3>
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
                                                <div className="flex items-center ml-2 border-l border-gray-300 pl-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(cat.category, item.tag)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Sửa Tag"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(item)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                        title={item.count === 0 ? "Dọn dẹp Tag" : "Xóa & Phạt"}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white border-2 border-black w-full max-w-md shadow-2xl animate-enter">
                        <div className="bg-black text-white p-4 flex justify-between items-center">
                            <h3 className="font-black uppercase tracking-wider">Chỉnh sửa Tag</h3>
                            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Tag hiện tại
                            </label>
                            <div className="text-lg font-bold mb-4">{editing.tag}</div>

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                Tag mới
                            </label>
                            <input
                                type="text"
                                value={newTagVal}
                                onChange={(e) => setNewTagVal(e.target.value.toUpperCase())}
                                className="w-full border-2 border-gray-200 p-3 font-bold focus:border-black focus:outline-none transition-colors placeholder:normal-case"
                                placeholder="Nhập tên tag mới..."
                                autoFocus
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Lưu ý: Thay đổi sẽ áp dụng cho toàn bộ <span className="font-bold text-black">{categoryMap[editing.category] || editing.category}</span> đang sử dụng tag này.
                            </p>
                        </div>
                        <div className="flex border-t-2 border-gray-100">
                            <button
                                onClick={() => setEditing(null)}
                                className="w-1/2 p-4 font-bold uppercase text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={!newTagVal.trim() || newTagVal === editing.tag}
                                className="w-1/2 p-4 font-bold uppercase text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
