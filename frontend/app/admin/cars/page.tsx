'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

export default function AdminCars() {
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchLink, setSearchLink] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchCars(page);
    }, [page]);

    const fetchCars = (currentPage: number) => {
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
                // Fetch cars including hidden ones
                return fetch(`http://localhost:3000/cars?page=${currentPage}&limit=12&includeHidden=true`);
            })
            .then(res => res && res.json())
            .then(data => {
                if (data) {
                    setCars(data.data);
                    setTotalPages(data.meta.totalPages);
                }
                setLoading(false);
            })
            .catch(() => {
                router.push('/');
            });
    };

    const handleSearch = async () => {
        setError('');
        if (!searchLink.trim()) {
            fetchCars(1);
            setPage(1);
            return;
        }

        // Extract ID from link
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
        const match = searchLink.match(uuidRegex);

        if (!match) {
            setError('Link không hợp lệ hoặc không tìm thấy ID xe.');
            return;
        }

        const carId = match[0];

        try {
            const res = await fetch(`http://localhost:3000/cars/${carId}`);
            if (!res.ok) {
                setError('Không tìm thấy xe với ID này.');
                return;
            }
            const car = await res.json();
            if (car) {
                setCars([car]);
                setTotalPages(1);
            }
        } catch (e) {
            setError('Lỗi khi tìm kiếm xe.');
        }
    };

    const toggleHide = async (carId: string) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        if (!confirm('Bạn có chắc chắn muốn ẩn/hiện xe này?')) return;

        try {
            const res = await fetch(`http://localhost:3000/cars/${carId}/hide`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Refresh list to show updated status
                fetchCars(page);
            } else {
                alert('Có lỗi xảy ra.');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi kết nối.');
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Quản lý xe</h1>
                        <p className="text-sm text-gray-500">Danh sách tất cả xe đang đăng bán trên hệ thống</p>
                    </div>
                    <Link href="/admin" className="text-sm font-bold uppercase hover:text-[var(--jdm-red)] transition-colors">
                        ← Quay lại Dashboard
                    </Link>
                </div>

                {/* Search Box */}
                <div className="bg-white p-4 shadow-sm border border-gray-200 mb-4 rounded-none">
                    <p className="text-sm font-bold uppercase mb-2">Tìm kiếm xe qua link bài viết</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchLink}
                            onChange={(e) => setSearchLink(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Dán link bài viết xe vào đây và nhấn Enter..."
                            className="flex-1 p-2 border border-gray-300 text-sm focus:outline-none focus:border-[var(--jdm-red)]"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-black text-white px-4 py-2 text-sm font-bold uppercase hover:bg-[var(--jdm-red)] transition-colors"
                        >
                            Tìm kiếm
                        </button>
                        {searchLink && (
                            <button
                                onClick={() => { setSearchLink(''); fetchCars(1); setError(''); }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 text-sm font-bold uppercase hover:bg-gray-300 transition-colors"
                            >
                                Đặt lại
                            </button>
                        )}
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
                </div>

                <div className="bg-white shadow rounded-none overflow-hidden border border-gray-200">
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
                                        Trạng thái
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
                                                {new Date(car.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--jdm-red)] font-bold">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(car.price))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {car.seller?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full uppercase ${car.status === 'SOLD' ? 'bg-blue-100 text-blue-800' :
                                                    car.status === 'HIDDEN' ? 'bg-gray-800 text-white' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {car.status === 'SOLD' ? 'Đã bán' : car.status === 'HIDDEN' ? 'Đã ẩn' : 'Đang bán'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link href={`/cars/${car.id}`} className="text-black hover:text-[var(--jdm-red)] font-bold uppercase transition-colors">
                                                Xem
                                            </Link>
                                            <button
                                                onClick={() => toggleHide(car.id)}
                                                className={`font-bold uppercase transition-colors ${car.status === 'HIDDEN' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                                            >
                                                {car.status === 'HIDDEN' ? 'Hiện' : 'Ẩn'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
