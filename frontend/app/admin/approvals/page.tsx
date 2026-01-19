'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TableSkeleton from '@/components/TableSkeleton';

export default function AdminApprovals() {
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchPendingCars();
    }, []);

    const fetchPendingCars = () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);

        fetch('http://localhost:3000/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.isAdmin) {
                    router.push('/');
                    return;
                }
                return fetch('http://localhost:3000/cars/admin/pending', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            })
            .then(res => res && res.json())
            .then(data => {
                if (data) {
                    setCars(data);
                }
                setLoading(false);
            })
            .catch(() => {
                router.push('/');
            });
    };

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
            } else {
                toast.error('Có lỗi xảy ra khi duyệt bài.');
            }
        } catch (e) {
            console.error(e);
            toast.error('Lỗi kết nối.');
        }
    };

    const handleReject = async (carId: string) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        if (!confirm('Bạn có chắc chắn muốn từ chối bài đăng này? Bài đăng sẽ bị đánh dấu là TỪ CHỐI.')) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/cars/admin/cars/${carId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setCars(prev => prev.filter(c => c.id !== carId));
                toast.success('Đã từ chối bài đăng.');
            } else {
                toast.error('Có lỗi xảy ra khi từ chối bài.');
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
                        <p className="text-sm text-gray-500">Danh sách các bài đăng chờ duyệt (3 bài đầu tiên của thành viên mới)</p>
                    </div>
                    <Link href="/admin" className="text-sm font-bold uppercase hover:text-[var(--jdm-red)] transition-colors">
                        ← Quay lại Dashboard
                    </Link>
                </div>

                {loading ? <TableSkeleton /> : (
                    <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
                        {cars.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Không có bài đăng nào cần duyệt.
                            </div>
                        ) : (
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
                                                <td className="px-6 py-4 whitespace-nowrap">
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="font-bold">{car.seller?.name || 'Unknown'}</div>
                                                    <div className="text-xs">{car.seller?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(car.createdAt).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
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
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
