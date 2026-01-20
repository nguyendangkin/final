'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { Flag, XCircle, CheckCircle, Eye, EyeOff, User, AlertTriangle, Ban, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateCarSlug } from '@/lib/utils';

export default function AdminReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const router = useRouter();

    useEffect(() => {
        fetchReports(page);
    }, [page]);

    const fetchReports = (currentPage: number) => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);

        fetch(`http://localhost:3000/reports?page=${currentPage}&limit=10&status=PENDING`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 403) {
                    router.push('/');
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data && data.data) {
                    setReports(data.data);
                    setTotalPages(data.meta.totalPages);
                } else {
                    setReports([]);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                toast.error('Lỗi tải danh sách báo cáo');
            });
    };

    const handleIgnore = async (reportId: string) => {
        const token = localStorage.getItem('jwt_token');
        try {
            const res = await fetch(`http://localhost:3000/reports/${reportId}/ignore`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Đã bỏ qua báo cáo');
                fetchReports(page);
            } else {
                toast.error('Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const handleResolve = async (reportId: string) => {
        const token = localStorage.getItem('jwt_token');
        try {
            const res = await fetch(`http://localhost:3000/reports/${reportId}/resolve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Đã XÓA xe và xử lý báo cáo');
                fetchReports(page);
            } else {
                toast.error('Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const confirmResolve = (reportId: string, carName: string) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col border border-gray-200`}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-12 w-12 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                <Trash2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                Xử lý vi phạm
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                Bạn có chắc chắn muốn <span className="font-bold text-[var(--jdm-red)]">XÓA XE "{carName}"</span>?
                                <br />Hành động này sẽ XÓA VĨNH VIỄN xe và đánh dấu báo cáo là ĐÃ XỬ LÝ.
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
                            handleResolve(reportId);
                        }}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-black hover:bg-[var(--jdm-red)] focus:outline-none uppercase transition-all"
                    >
                        Đồng ý Xóa Xe
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleBanReporter = async (userId: string) => {
        const token = localStorage.getItem('jwt_token');
        try {
            const res = await fetch(`http://localhost:3000/users/${userId}/ban`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Update local state directly to avoid flicker
                setReports(prev => prev.map(report =>
                    report.reporter?.id === userId
                        ? { ...report, reporter: { ...report.reporter, isSellingBanned: true } }
                        : report
                ));
                toast.success('Đã cấm người tố cáo bán xe');
            } else {
                toast.error('Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const confirmBanReporter = (reporterId: string, reporterName: string) => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'hidden'} max-w-md w-full bg-white shadow-2xl rounded-none pointer-events-auto flex flex-col border border-gray-200`}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-12 w-12 rounded-none bg-[var(--jdm-red)] flex items-center justify-center">
                                <Ban className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-black text-black uppercase tracking-wide">
                                Cấm người tố cáo
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                                Bạn có chắc chắn muốn <span className="font-bold text-[var(--jdm-red)]">CẤM "{reporterName}"</span> bán xe?
                                <br />Hành động này áp dụng khi người tố cáo cố tình tố cáo bậy.
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
                            handleBanReporter(reporterId);
                        }}
                        className="w-1/2 p-4 flex items-center justify-center text-sm font-black text-white bg-black hover:bg-[var(--jdm-red)] focus:outline-none uppercase transition-all"
                    >
                        Đồng ý Cấm
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wide">Quản lý Báo cáo</h1>
                        <p className="text-sm text-gray-500">Danh sách các báo cáo vi phạm cần xử lý</p>
                    </div>
                    <Link href="/admin" className="text-sm font-bold uppercase hover:text-[var(--jdm-red)] transition-colors">
                        ← Quay lại Dashboard
                    </Link>
                </div>



                <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-black text-white">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[20%]">Người tố cáo</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[25%]">Xe bị tố cáo</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[20%]">Người bán</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider w-[15%]">Lý do</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider w-[20%]">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                                    {report.reporter?.name?.[0] || <User className="w-5 h-5" />}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{report.reporter?.name || 'Ẩn danh'}</div>
                                                    <div className="text-xs text-gray-500">{report.reporter?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-16 w-24 relative bg-gray-100 border border-gray-200">
                                                    {report.reportedCar?.thumbnail ? (
                                                        <img className="h-full w-full object-cover" src={report.reportedCar.thumbnail} alt="" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-xs text-gray-400 font-bold">NO IMG</div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                                                        {report.reportedCar?.year} {report.reportedCar?.make} {report.reportedCar?.model}
                                                    </div>
                                                    <Link href={`/cars/${generateCarSlug(report.reportedCar)}`} target="_blank" className="text-xs text-[var(--jdm-red)] font-bold hover:underline uppercase flex items-center gap-1 mt-1">
                                                        <Eye className="w-3 h-3" /> Xem xe
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{report.reportedCar?.seller?.name || 'Ẩn danh'}</div>
                                            <div className="text-xs text-gray-500">{report.reportedCar?.seller?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-bold leading-5 rounded-none uppercase ${report.reason === 'SENSITIVE' ? 'bg-red-100 text-red-800' :
                                                report.reason === 'SPAM' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {report.reason}
                                            </span>
                                            <div className="text-xs text-gray-400 mt-1 italic">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                <button
                                                    onClick={() => handleIgnore(report.id)}
                                                    className="text-gray-500 hover:text-black font-bold uppercase text-xs px-3 py-1 border border-gray-300 hover:bg-gray-100 transition-all"
                                                >
                                                    Bỏ qua
                                                </button>
                                                <button
                                                    onClick={() => confirmResolve(report.id, `${report.reportedCar?.year} ${report.reportedCar?.make}`)}
                                                    className="bg-black text-white hover:bg-[var(--jdm-red)] font-bold uppercase text-xs px-3 py-1 transition-all flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Xóa Xe
                                                </button>
                                                {report.reporter && (
                                                    report.reporter.isSellingBanned ? (
                                                        <span className="bg-gray-400 text-white font-bold uppercase text-xs px-3 py-1 flex items-center gap-1 cursor-not-allowed">
                                                            <Ban className="w-3 h-3" /> Đã cấm người tố cáo
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => confirmBanReporter(report.reporter.id, report.reporter.name || 'Ẩn danh')}
                                                            className="bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-xs px-3 py-1 transition-all flex items-center gap-1"
                                                        >
                                                            <Ban className="w-3 h-3" /> Cấm người tố cáo
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Pagination */}
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </div>
        </div>
    );
}
