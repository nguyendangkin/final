'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CarSpecs, initialCarSpecs } from '../../../sell/types';
import { ArrowLeft, Save, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCarIdFromSlug } from '@/lib/utils';

import StepBasics from '../../../sell/components/StepBasics';
import StepSoul from '../../../sell/components/StepSoul';
import StepLegal from '../../../sell/components/StepLegal';
import StepMods from '../../../sell/components/StepMods';
import StepMedia from '../../../sell/components/StepMedia';

const STEPS = [
    { id: 1, title: 'Định danh', subtitle: 'Cơ bản' },
    { id: 2, title: 'Thông số', subtitle: 'Kỹ thuật' },
    { id: 3, title: 'Pháp lý', subtitle: 'Giấy tờ' },
    { id: 4, title: 'Đồ chơi', subtitle: 'Nâng cấp' },
    { id: 5, title: 'Thông tin chi tiết', subtitle: 'Media & Liên hệ' },
];

export default function EditCarPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.id as string;
    const id = getCarIdFromSlug(slug);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<CarSpecs>(initialCarSpecs);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateData = useCallback((fields: Partial<CarSpecs>) => {
        setData((prev) => ({ ...prev, ...fields }));
    }, []);

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
                const res = await fetch(`${apiUrl}/cars/${id}`);
                if (!res.ok) throw new Error('Không tìm thấy thông tin xe');
                const carData = await res.json();

                // Map backend mileage to frontend odo
                setData({
                    ...initialCarSpecs,
                    ...carData,
                    price: parseInt(carData.price) || 0,
                    odo: carData.mileage || 0,
                    mods: typeof carData.mods === 'string' ? JSON.parse(carData.mods) : (carData.mods || initialCarSpecs.mods)
                });
                setLoading(false);
            } catch (err: any) {
                toast.error(err.message);
                setLoading(false);
            }
        };

        if (id) fetchCar();
    }, [id]);

    const validateStep = (step: number): Record<string, string> => {
        const errs: Record<string, string> = {};
        switch (step) {
            case 1:
                if (!data.make) errs.make = 'Vui lòng chọn hãng xe';
                if (!data.model.trim()) errs.model = 'Vui lòng nhập dòng xe';
                if (!data.year || data.year > new Date().getFullYear() + 1) errs.year = 'Vui lòng nhập năm sản xuất hợp lệ';
                if (!data.trim.trim()) errs.trim = 'Vui lòng nhập phiên bản (Trim)';
                if (!data.price || data.price <= 0) errs.price = 'Vui lòng nhập mức giá';
                if (!data.location.trim()) errs.location = 'Vui lòng nhập khu vực';
                if (data.odo === undefined || data.odo === null || data.odo < 0) errs.odo = 'Vui lòng nhập số ODO hợp lệ';
                break;
            case 2:
                if (!data.chassisCode.trim()) errs.chassisCode = 'Vui lòng nhập mã khung gầm';
                if (!data.engineCode.trim()) errs.engineCode = 'Vui lòng nhập mã động cơ';
                if (!data.transmission) errs.transmission = 'Vui lòng chọn hộp số';
                if (!data.drivetrain) errs.drivetrain = 'Vui lòng chọn hệ dẫn động';
                if (!data.condition) errs.condition = 'Vui lòng chọn tình trạng xe';
                break;
            case 3:
                if (!data.paperwork) errs.paperwork = 'Vui lòng chọn loại giấy tờ';
                if (!data.noRegistry && !data.registryExpiry?.trim()) errs.registryExpiry = 'Vui lòng nhập hạn đăng kiểm hoặc chọn "Không đăng kiểm được"';
                break;
            case 5:
                if (!data.thumbnail) errs.thumbnail = 'Vui lòng tải lên ảnh đại diện';
                if (!data.images || data.images.length === 0) errs.images = 'Vui lòng tải lên ít nhất 1 ảnh trong album';
                if (!data.phoneNumber || !/^[0-9]{10}$/.test(data.phoneNumber)) errs.phoneNumber = 'Vui lòng nhập số điện thoại hợp lệ (10 số)';
                break;
        }
        return errs;
    };

    const handleNext = () => {
        const errs = validateStep(currentStep);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});
        if (currentStep < STEPS.length) {
            setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSave = async () => {
        const errs = validateStep(5);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setCurrentStep(5);
            return;
        }
        setSaving(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const token = localStorage.getItem('jwt_token');

            // Define allowed fields based on UpdateCarDto
            const allowedFields = [
                'make', 'model', 'year', 'trim', 'price', 'isNegotiable',
                'description', 'images', 'thumbnail', 'videoLink', 'mileage',
                'location', 'chassisCode', 'engineCode', 'transmission',
                'drivetrain', 'condition', 'paperwork', 'registryExpiry',
                'noRegistry', 'plateNumber', 'mods', 'notableFeatures',
                'phoneNumber', 'facebookLink', 'zaloLink', 'additionalInfo',
                'status'
            ];

            const payload: any = {};
            allowedFields.forEach(field => {
                const val = data[field as keyof CarSpecs];
                if (val !== undefined && val !== null) {
                    payload[field] = val;
                }
            });

            // Ensure numeric values are correct
            payload.mileage = Number(data.odo);
            payload.price = Number(data.price);
            payload.year = Number(data.year);

            // Special handling for mods: ensure it's an object, not a string
            if (typeof payload.mods === 'string') {
                try {
                    payload.mods = JSON.parse(payload.mods);
                } catch (e) {
                    console.error("Failed to parse mods", e);
                }
            }

            const res = await fetch(`${apiUrl}/cars/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Lỗi khi cập nhật');
            }

            toast.success('Cập nhật thành công!');
            // Revalidate cache
            await fetch('/api/revalidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `/cars/${slug}` })
            });
            // Also revalidate home page
            await fetch('/api/revalidate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: '/' })
            });
            router.push(`/cars/${slug}`);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-white text-black p-6 pt-24 font-sans">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
                <div className="space-y-8">
                    <div className="border-b border-gray-200 pb-6 flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-black">Chỉnh Sửa Bài Đăng</h1>
                            <p className="text-gray-500 font-medium text-sm">Cập nhật thông tin chi tiết cho chiếc xe của bạn.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-none p-1 md:p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
                            <div className="flex items-center min-w-max space-x-2">
                                {STEPS.map((step, idx) => {
                                    const isActive = step.id === currentStep;
                                    const isPast = step.id < currentStep;
                                    return (
                                        <div key={step.id} className="flex items-center">
                                            <div
                                                onClick={() => {
                                                    if (isPast || isActive) setCurrentStep(step.id);
                                                    else if (Object.keys(validateStep(currentStep)).length === 0) setCurrentStep(step.id);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all border cursor-pointer ${isActive ? 'bg-red-50 border-[var(--jdm-red)] text-[var(--jdm-red)]' : isPast ? 'bg-green-50 border-green-500/30 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                                            >
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-[var(--jdm-red)] text-white' : isPast ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'}`}>{isPast ? <CheckCircle2 className="w-4 h-4" /> : step.id}</span>
                                                <div className="flex flex-col"><span className="text-sm font-bold whitespace-nowrap">{step.title}</span>{isActive && <span className="text-[10px] uppercase tracking-wider opacity-70">{step.subtitle}</span>}</div>
                                            </div>
                                            {idx < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-2 rounded-full ${isPast ? 'bg-green-200' : 'bg-gray-200'}`}></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-none p-6 md:p-10 min-h-[500px]">
                            {currentStep === 1 && <StepBasics data={data} updateData={updateData} errors={errors} />}
                            {currentStep === 2 && <StepSoul data={data} updateData={updateData} errors={errors} />}
                            {currentStep === 3 && <StepLegal data={data} updateData={updateData} errors={errors} />}
                            {currentStep === 4 && <StepMods data={data} updateData={updateData} />}
                            {currentStep === 5 && <StepMedia data={data} updateData={updateData} errors={errors} />}
                        </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-gray-200">
                        <button onClick={handleBack} disabled={currentStep === 1} className="px-8 py-4 rounded-none font-bold uppercase flex items-center gap-2 text-gray-600 bg-gray-100 hover:text-black hover:bg-gray-200 disabled:opacity-0 disabled:cursor-not-allowed transition-all tracking-wide"><ChevronLeft className="w-5 h-5" /> Quay lại</button>
                        {currentStep < STEPS.length ? (
                            <button onClick={handleNext} className="px-8 py-4 bg-black text-white rounded-none font-bold flex items-center gap-2 hover:bg-[var(--jdm-red)] transform hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-900/20">Tiếp tục <ChevronRight className="w-5 h-5" /></button>
                        ) : (
                            <button onClick={handleSave} disabled={saving} className="px-8 py-4 bg-[var(--jdm-red)] text-white rounded-none font-bold flex items-center gap-3 hover:bg-red-700 transform hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-600/20">{saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} Lưu thay đổi</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
