'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarSpecs, initialCarSpecs } from './types';
import StepBasics from './components/StepBasics';
import StepSoul from './components/StepSoul';
import StepLegal from './components/StepLegal';
import StepMods from './components/StepMods';
import StepMedia from './components/StepMedia';

import { ChevronRight, ChevronLeft, Save, Trash2, CheckCircle2 } from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Định danh', subtitle: 'Cơ bản' },
    { id: 2, title: 'Thông số', subtitle: 'Kỹ thuật' },
    { id: 3, title: 'Pháp lý', subtitle: 'Giấy tờ' },
    { id: 4, title: 'Đồ chơi', subtitle: 'Nâng cấp' },
    { id: 5, title: 'Thông tin chi tiết', subtitle: 'Media & Liên hệ' },
];

export default function SellPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<CarSpecs>(initialCarSpecs);
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load from LocalStorage
    useEffect(() => {
        const savedData = localStorage.getItem('sell_draft');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // FIX: Remove empty strings from images array to prevent rendering errors
                if (parsed.images && Array.isArray(parsed.images)) {
                    parsed.images = parsed.images.filter((img: string) => img && img.trim() !== '');
                }
                setData({ ...initialCarSpecs, ...parsed }); // Merge to ensure new fields exists
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('sell_draft', JSON.stringify(data));
        }
    }, [data, isLoaded]);

    const updateData = (fields: Partial<CarSpecs>) => {
        setData((prev) => ({ ...prev, ...fields }));
        // Clear errors for fields being updated
        const fieldKeys = Object.keys(fields);
        if (fieldKeys.length > 0) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                fieldKeys.forEach((key) => delete newErrors[key]);
                return newErrors;
            });
        }
    };

    // Auto-fill Logic
    useEffect(() => {
        if (!isLoaded) return;

        // Example Auto-fill logic
        if (data.make === 'Nissan' && data.model === 'Silvia') {
            if (data.year >= 1999 && !data.chassisCode) {
                updateData({ chassisCode: 'S15', engineCode: 'SR20DET', drivetrain: 'RWD', transmission: 'MT' });
            } else if (data.year >= 1993 && data.year <= 1998 && !data.chassisCode) {
                updateData({ chassisCode: 'S14', engineCode: 'SR20DET', drivetrain: 'RWD', transmission: 'MT' });
            }
        }
        if (data.make === 'Honda' && data.model === 'Civic' && !data.chassisCode) {
            if (data.year >= 1996 && data.year <= 2000) {
                updateData({ chassisCode: 'EK9', engineCode: 'B16B', drivetrain: 'FWD', transmission: 'MT' });
            }
        }
    }, [data.make, data.model, data.year]);

    const clearDraft = () => {
        if (confirm('Bạn có chắc muốn xóa bản nháp này không?')) {
            localStorage.removeItem('sell_draft');
            setData(initialCarSpecs);
            setCurrentStep(1);
        }
    };

    const validateStep = (step: number): Record<string, string> => {
        const errs: Record<string, string> = {};
        switch (step) {
            case 1: // Định danh
                if (!data.make) errs.make = 'Vui lòng chọn hãng xe';
                if (!data.model.trim()) errs.model = 'Vui lòng nhập dòng xe';
                if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) errs.year = 'Vui lòng nhập năm sản xuất hợp lệ';
                if (!data.trim.trim()) errs.trim = 'Vui lòng nhập phiên bản (Trim)';
                if (!data.price || data.price <= 0) errs.price = 'Vui lòng nhập mức giá';
                if (!data.location.trim()) errs.location = 'Vui lòng nhập khu vực';
                if (data.odo === undefined || data.odo === null || data.odo <= 0) errs.odo = 'Vui lòng nhập số ODO hợp lệ';
                break;
            case 2: // Thông số
                if (!data.chassisCode.trim()) errs.chassisCode = 'Vui lòng nhập mã khung gầm';
                if (!data.engineCode.trim()) errs.engineCode = 'Vui lòng nhập mã động cơ';
                if (!data.transmission) errs.transmission = 'Vui lòng chọn hộp số';
                if (!data.drivetrain) errs.drivetrain = 'Vui lòng chọn hệ dẫn động';
                if (!data.condition) errs.condition = 'Vui lòng chọn tình trạng xe';
                break;
            case 3: // Pháp lý
                if (!data.paperwork) errs.paperwork = 'Vui lòng chọn loại giấy tờ';
                if (!data.noRegistry && !data.registryExpiry?.trim()) errs.registryExpiry = 'Vui lòng nhập hạn đăng kiểm hoặc chọn "Không đăng kiểm được"';
                break;
            case 5: // Thông tin chi tiết
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

    const handleSubmit = async () => {
        // Validate Step 5 before submitting
        const errs = validateStep(5);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        setLoading(true);

        // FIX: Use correct token key 'jwt_token' matching Header.tsx
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            alert('Vui lòng đăng nhập để đăng bán xe!');
            setLoading(false);
            window.location.href = 'http://localhost:3000/auth/google';
            return;
        }

        const payload = {
            make: data.make,
            model: data.model,
            year: Number(data.year),
            trim: data.trim,
            price: Number(data.price),
            isNegotiable: data.isNegotiable,
            mileage: Number(data.odo), // Mapping 'odo' from frontend to 'mileage' in backend
            location: data.location || 'Vietnam', // Default if empty
            description: data.description || `BÁN XE ${data.year} ${data.make} ${data.model} ${data.trim || ''}`,
            images: data.images,
            thumbnail: data.thumbnail,
            videoLink: data.videoLink,

            // JDM Specs
            chassisCode: data.chassisCode,
            engineCode: data.engineCode,
            transmission: data.transmission,
            drivetrain: data.drivetrain,
            condition: data.condition,

            // Legal
            paperwork: data.paperwork,
            plateNumber: data.hidePlate ? 'Hidden' : data.plateNumber,
            registryExpiry: data.registryExpiry?.toString(), // Ensure string
            noRegistry: data.noRegistry, // Send the noRegistry flag

            // Contact
            phoneNumber: data.phoneNumber,
            facebookLink: data.facebookLink,
            zaloLink: data.zaloLink,
            additionalInfo: data.additionalInfo,

            // Mods
            mods: data.mods, // Sending JSON object directly, backend handles it as jsonb
        };

        try {
            const res = await fetch('http://localhost:3000/cars', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to create listing');
            }

            alert('Đăng bán thành công! Xe của bạn đã lên sàn.');
            localStorage.removeItem('sell_draft');
            router.push('/');
        } catch (error: any) {
            console.error('Error submitting:', error);
            alert(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return null; // Hydration fix

    return (
        <div className="min-h-screen bg-white text-black p-6 pt-24 font-sans selection:bg-red-500/30">
            <div className="max-w-4xl mx-auto flex flex-col gap-8">

                {/* Main Form Area */}
                <div className="space-y-8">

                    {/* Header */}
                    <div className="flex justify-between items-end border-b border-gray-200 pb-6">
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black">
                                Đăng Bán Xe
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">
                                Hãy kể câu chuyện về chiếc xe của bạn. Cộng đồng JDM đang chờ đợi.
                            </p>
                        </div>
                        <button
                            onClick={clearDraft}
                            className="text-gray-500 hover:text-red-600 text-sm flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Xóa nháp
                        </button>
                    </div>

                    {/* Stepper Content */}
                    <div className="bg-white rounded-none p-1 md:p-4 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
                            <div className="flex items-center min-w-max space-x-2">
                                {STEPS.map((step, idx) => {
                                    const isActive = step.id === currentStep;
                                    const isPast = step.id < currentStep;
                                    return (
                                        <div key={step.id} className="flex items-center">
                                            <div
                                                className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all border ${isActive
                                                    ? 'bg-red-50 border-[var(--jdm-red)] text-[var(--jdm-red)]'
                                                    : isPast
                                                        ? 'bg-green-50 border-green-500/30 text-green-700'
                                                        : 'bg-gray-100 border-gray-200 text-gray-400'
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-[var(--jdm-red)] text-white' : isPast ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
                                                    }`}>
                                                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold whitespace-nowrap">{step.title}</span>
                                                    {isActive && <span className="text-[10px] uppercase tracking-wider opacity-70">{step.subtitle}</span>}
                                                </div>
                                            </div>
                                            {idx < STEPS.length - 1 && (
                                                <div className={`w-6 h-0.5 mx-2 rounded-full ${isPast ? 'bg-green-200' : 'bg-gray-200'}`}></div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Step Components */}
                        <div className="bg-white border border-gray-100 rounded-none p-6 md:p-10 min-h-[500px]">
                            {currentStep === 1 && <StepBasics data={data} updateData={updateData} errors={errors} />}
                            {currentStep === 2 && <StepSoul data={data} updateData={updateData} errors={errors} />}
                            {currentStep === 3 && <StepLegal data={data} updateData={updateData} errors={errors} />}
                            {currentStep === 4 && <StepMods data={data} updateData={updateData} />}
                            {currentStep === 5 && <StepMedia data={data} updateData={updateData} errors={errors} />}
                        </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-0 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" /> Quay lại
                        </button>

                        {currentStep < STEPS.length ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-4 bg-black text-white rounded-none font-bold flex items-center gap-2 hover:bg-[var(--jdm-red)] transform hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-900/20"
                            >
                                Tiếp tục <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-4 bg-[var(--jdm-red)] text-white rounded-none font-bold flex items-center gap-3 hover:bg-red-700 transform hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-600/20"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Đăng bán ngay
                            </button>
                        )}
                    </div>
                </div>



            </div>
        </div>
    );
}
