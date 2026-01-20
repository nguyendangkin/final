'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Eye, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TableSkeleton from '@/components/TableSkeleton';
import Pagination from '@/components/Pagination';

export default function AdminApprovals() {
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const router = useRouter();

    // Limits per fetch
    const LIMIT = 10;

    useEffect(() => {
        fetchPendingCars(page);
    }, [page]);

    const fetchPendingCars = useCallback(async (pageNum: number) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);

        try {
            // First verify admin status (could be optimized to not do this every time if we trust token but good for security)
            const userRes = await fetch('http://localhost:3000/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userRes.json();

            if (!userData.isAdmin) {
                router.push('/');
                return;
            }

            const pendingRes = await fetch(`http://localhost:3000/cars/admin/pending?page=${pageNum}&limit=${LIMIT}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await pendingRes.json();

            if (data && data.data) {
                setCars(data.data);
                if (data.meta) {
                    setTotalPages(data.meta.totalPages);
                }
            }
        } catch (error) {
            console.error("Error fetching approvals:", error);
            toast.error("Lỗi tải danh sách.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleApprove = async (carId: string) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:3000/cars/admin/cars/${carId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setCars(prev => prev.filter(c => c.id !== carId));
                toast.success('Đã duyệt bài đăng.');
                // Refresh if empty to get next page items
                if (cars.length <= 1 && page < totalPages) {
                    fetchPendingCars(page);
                } else if (cars.length <= 1 && page > 1) {
                    setPage(prev => prev - 1);
                }
            } else {
                toast.error('Có lỗi xảy ra khi duyệt bài.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối.');
        }
    };

    const handleReject = (carId: string) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col`}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-12 w-12 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                <X className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                Xác nhận từ chối
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                Bạn có chắc chắn muốn <span className="font-bold text-red-600">TỪ CHỐI</span> bài đăng này?
                                <span className="block mt-1 text-red-600">Hành động này sẽ xóa vĩnh viễn bài đăng và hình ảnh khỏi hệ thống.</span>
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
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeReject(carId);
                        }}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-black hover:bg-[var(--jdm-red)] focus:outline-none uppercase transition-all"
                    >
                        Xóa luôn
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const executeReject = async (carId: string) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:3000/cars/admin/cars/${carId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setCars(prev => prev.filter(c => c.id !== carId));
                toast.success('Đã từ chối và xóa bài đăng.');
                if (cars.length <= 1 && page < totalPages) {
                    fetchPendingCars(page);
                } else if (cars.length <= 1 && page > 1) {
                    setPage(prev => prev - 1);
                }
            } else {
                toast.error('Có lỗi xảy ra khi từ chối bài.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối.');
        }
    };

    const toggleBan = (userId: string, currentStatus: boolean) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col`}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-12 w-12 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                <Ban className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                Xác nhận hành động
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                Bạn có chắc chắn muốn <span className="font-bold">{currentStatus ? 'BỎ CẤM' : 'CẤM'}</span> người dùng này bán xe?
                                {!currentStatus && <span className="block mt-1 text-red-600">Hành động này sẽ xóa tất cả bài đăng của họ.</span>}
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
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeBan(userId, currentStatus, token);
                        }}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-black hover:bg-[var(--jdm-red)] focus:outline-none uppercase transition-all"
                    >
                        Đồng ý
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const executeBan = async (userId: string, currentStatus: boolean, token: string) => {
        try {
            const res = await fetch(`http://localhost:3000/users/${userId}/ban`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                toast.success(`Đã ${!currentStatus ? 'cấm' : 'bỏ cấm'} người dùng thành công.`);
                // Refresh list as banning deletes cars
                fetchPendingCars(page);
            } else {
                toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Duyệt bài đăng</h1>
                        <p className="text-sm text-gray-500">Danh sách các bài đăng chờ duyệt (Ai đăng trước hiện trước)</p>
                    </div>
                    <Link href="/admin" className="text-sm font-bold uppercase hover:text-[var(--jdm-red)] transition-colors">
                        ← Quay lại Dashboard
                    </Link>
                </div>

                {loading ? <TableSkeleton type="cars" /> : (
                    <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
                        {cars.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Không có bài đăng nào cần duyệt.
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Hình ảnh
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Thông tin xe
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Giá bán
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Người bán
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Thời gian
                                                </th>
                                                <th scope="col" className="relative px-6 py-3 text-right">
                                                    <span className="sr-only">Actions</span>
                                                    Hành động
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {cars.map((car) => (
                                                <tr key={car.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-16 w-24 flex-shrink-0">
                                                            <img className="h-16 w-24 object-cover rounded-sm" src={car.images?.[0] || '/placeholder-car.png'} alt="" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 min-w-[200px]">
                                                        <div className="text-sm font-bold text-gray-900 uppercase">
                                                            {car.year} {car.make} {car.model} {car.trim}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {car.location}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--jdm-red)] font-bold">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(car.price))}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="font-bold">{car.seller?.name || 'Unknown'}</div>
                                                        <div className="text-xs">{car.seller?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(car.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2 flex-wrap min-w-[140px]">
                                                            <Link href={`/cars/${car.id}`} target="_blank" className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-800 text-xs font-bold uppercase hover:bg-gray-300 transition-colors">
                                                                <Eye className="w-3 h-3" /> Xem
                                                            </Link>
                                                            <button
                                                                onClick={() => handleApprove(car.id)}
                                                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-700 transition-colors"
                                                            >
                                                                <Check className="w-3 h-3" /> Duyệt
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(car.id)}
                                                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors"
                                                            >
                                                                <X className="w-3 h-3" /> Từ chối
                                                            </button>
                                                            <button
                                                                onClick={() => toggleBan(car.seller.id, car.seller.isSellingBanned)}
                                                                className="flex items-center gap-1 px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
                                                                title="Cấm người dùng và xóa tất cả bài đăng"
                                                            >
                                                                <Ban className="w-3 h-3" /> Cấm
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
