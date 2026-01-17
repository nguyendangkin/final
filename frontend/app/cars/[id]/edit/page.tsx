'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const BRANDS = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Subaru',
    'Suzuki', 'Lexus', 'Isuzu', 'Daihatsu', 'Acura', 'Infiniti',
    'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
    'Volvo', 'Ford', 'Chevrolet', 'Khác'
];

export default function EditCarPage() {
    const router = useRouter();
    const params = useParams();
    const carId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [car, setCar] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        trim: '',
        price: 0,
        isNegotiable: true,
        mileage: 0,
        location: '',
        chassisCode: '',
        engineCode: '',
        transmission: '',
        drivetrain: '',
        condition: '',
        paperwork: '',
        registryExpiry: '',
        description: '',
        phoneNumber: '',
        facebookLink: '',
        zaloLink: '',
        videoLink: '',
        additionalInfo: '',
    });

    useEffect(() => {
        fetchCar();
    }, [carId]);

    const fetchCar = async () => {
        try {
            const res = await fetch(`http://localhost:3000/cars/${carId}`);
            if (!res.ok) throw new Error('Không tìm thấy xe');
            const data = await res.json();
            setCar(data);

            // Check if user is the owner
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                router.push(`/cars/${carId}`);
                return;
            }

            const userRes = await fetch('http://localhost:3000/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userRes.ok) {
                const user = await userRes.json();
                if (user.id !== data.seller?.id) {
                    router.push(`/cars/${carId}`);
                    return;
                }
            } else {
                router.push(`/cars/${carId}`);
                return;
            }

            // Populate form with existing data
            setFormData({
                make: data.make || '',
                model: data.model || '',
                year: data.year || new Date().getFullYear(),
                trim: data.trim || '',
                price: Number(data.price) || 0,
                isNegotiable: data.isNegotiable ?? true,
                mileage: data.mileage || 0,
                location: data.location || '',
                chassisCode: data.chassisCode || '',
                engineCode: data.engineCode || '',
                transmission: data.transmission || '',
                drivetrain: data.drivetrain || '',
                condition: data.condition || '',
                paperwork: data.paperwork || '',
                registryExpiry: data.registryExpiry || '',
                description: data.description || '',
                phoneNumber: data.phoneNumber || '',
                facebookLink: data.facebookLink || '',
                zaloLink: data.zaloLink || '',
                videoLink: data.videoLink || '',
                additionalInfo: data.additionalInfo || '',
            });
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const formatPrice = (value: number) => {
        return value.toLocaleString('vi-VN');
    };

    const parsePrice = (value: string) => {
        return parseInt(value.replace(/\D/g, '')) || 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) throw new Error('Vui lòng đăng nhập');

            const res = await fetch(`http://localhost:3000/cars/${carId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Có lỗi xảy ra');
            }

            router.push(`/cars/${carId}`);
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--jdm-red)]" />
            </div>
        );
    }

    if (error && !car) {
        return (
            <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="text-[var(--jdm-red)] hover:underline font-bold"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-20 pb-12 font-sans selection:bg-red-500/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-200 transition"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-black uppercase tracking-tight">Chỉnh sửa bài đăng</h1>
                        <p className="text-gray-500 text-sm">{car?.year} {car?.make} {car?.model}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Thông tin cơ bản */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông tin cơ bản</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hãng xe *</label>
                                <select
                                    value={formData.make}
                                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">Chọn hãng xe</option>
                                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dòng xe *</label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="VD: Civic, Camry..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Năm sản xuất *</label>
                                <input
                                    type="text"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phiên bản</label>
                                <input
                                    type="text"
                                    value={formData.trim}
                                    onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="VD: Type R, RS..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán (VNĐ) *</label>
                                <input
                                    type="text"
                                    value={formatPrice(formData.price)}
                                    onChange={(e) => setFormData({ ...formData, price: parsePrice(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ODO (km) *</label>
                                <input
                                    type="number"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isNegotiable}
                                        onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                                        className="w-5 h-5 rounded-none border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm text-gray-700">Có thể thương lượng giá</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Thông số kỹ thuật */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông số kỹ thuật</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mã khung gầm</label>
                                <input
                                    type="text"
                                    value={formData.chassisCode}
                                    onChange={(e) => setFormData({ ...formData, chassisCode: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="VD: S15, EK9..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mã động cơ</label>
                                <input
                                    type="text"
                                    value={formData.engineCode}
                                    onChange={(e) => setFormData({ ...formData, engineCode: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="VD: SR20DET, B16B..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hộp số</label>
                                <select
                                    value={formData.transmission}
                                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                >
                                    <option value="">Chọn hộp số</option>
                                    <option value="MT">Số sàn (MT)</option>
                                    <option value="AT">Số tự động (AT)</option>
                                    <option value="CVT">Số CVT</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hệ dẫn động</label>
                                <select
                                    value={formData.drivetrain}
                                    onChange={(e) => setFormData({ ...formData, drivetrain: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                >
                                    <option value="">Chọn hệ dẫn động</option>
                                    <option value="FWD">Cầu trước (FWD)</option>
                                    <option value="RWD">Cầu sau (RWD)</option>
                                    <option value="AWD">4 bánh (AWD)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng xe</label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                >
                                    <option value="">Chọn tình trạng</option>
                                    <option value="Stock">Zin</option>
                                    <option value="Lightly Modded">Độ nhẹ</option>
                                    <option value="Heavily Modded">Độ nặng</option>
                                    <option value="Track/Drift Build">Xe đua/Drift</option>
                                    <option value="Restored">Đã dọn</option>
                                    <option value="Restored Modded">Dọn kiểng</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pháp lý */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Pháp lý</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giấy tờ</label>
                                <select
                                    value={formData.paperwork}
                                    onChange={(e) => setFormData({ ...formData, paperwork: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                >
                                    <option value="">Chọn loại giấy tờ</option>
                                    <option value="Legal">SANG TÊN ĐƯỢC</option>
                                    <option value="Illegal">KHÔNG SANG TÊN ĐƯỢC</option>
                                    <option value="MBC">Mẹ bồng con</option>
                                    <option value="GTHL">Giấy tờ hợp lệ</option>
                                    <option value="HQCN">Hải quan chính ngạch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hạn đăng kiểm</label>
                                <input
                                    type="date"
                                    value={formData.registryExpiry}
                                    onChange={(e) => setFormData({ ...formData, registryExpiry: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thông tin liên hệ */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Thông tin liên hệ</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                                <input
                                    type="url"
                                    value={formData.facebookLink}
                                    onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Zalo</label>
                                <input
                                    type="url"
                                    value={formData.zaloLink}
                                    onChange={(e) => setFormData({ ...formData, zaloLink: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="https://zalo.me/..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực *</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="VD: Hồ Chí Minh, Hà Nội..."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mô tả */}
                    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-black mb-6 uppercase tracking-wide">Mô tả chi tiết</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all"
                                    placeholder="Mô tả chi tiết về xe..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link video</label>
                                <input
                                    type="url"
                                    value={formData.videoLink}
                                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Thông tin thêm</label>
                                <textarea
                                    value={formData.additionalInfo}
                                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-none border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-all"
                                    placeholder="Thông tin bổ sung..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-none border border-gray-300 text-black font-bold hover:bg-gray-100 transition uppercase tracking-wide"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-none bg-[var(--jdm-red)] text-white font-bold hover:bg-black transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide transform hover:scale-[1.02] active:scale-95 shadow-lg"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
