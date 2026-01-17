import { CarSpecs } from '../types';
import { ChevronDown, DollarSign, Gauge, Calendar, CarFront } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface StepBasicsProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}

const MAKE_MODELS: Record<string, string[]> = {
    'Toyota': ['Supra', 'Celica', 'MR2', 'Chaser', 'AE86', 'GT86', 'GR86', 'Soarer', 'Crown'],
    'Nissan': ['Skyline GT-R', 'Silvia', '180SX', '300ZX', '350Z', '370Z', 'Laurel', 'Cefiro'],
    'Honda': ['Civic', 'Integra', 'S2000', 'NSX', 'Prelude', 'Accord', 'CR-X'],
    'Mitsubishi': ['Lancer Evolution', 'Eclipse', 'GTO', 'FTO', 'Galant VR-4'],
    'Mazda': ['RX-7', 'RX-8', 'MX-5 Miata', 'Mazda3', 'Mazda6'],
    'Subaru': ['Impreza WRX STI', 'Legacy', 'BRZ', 'Forester'],
};

export default function StepBasics({ data, updateData, errors = {} }: StepBasicsProps) {
    const brands = [
        'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi',
        'Subaru', 'Suzuki', 'Daihatsu', 'Lexus', 'Acura', 'Infiniti'
    ];

    const priceInputRef = useRef<HTMLInputElement>(null);
    const cursorPositionRef = useRef<number | null>(null);
    const odoInputRef = useRef<HTMLInputElement>(null);
    const odoCursorPositionRef = useRef<number | null>(null);

    const formatNumber = (value: number) => {
        if (!value) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const cursorPos = input.selectionStart || 0;
        const oldValue = input.value;
        const rawValue = oldValue.replace(/\./g, '');

        if (!isNaN(Number(rawValue))) {
            const dotsBeforeCursor = (oldValue.slice(0, cursorPos).match(/\./g) || []).length;
            const rawCursorPos = cursorPos - dotsBeforeCursor;
            const newFormatted = formatNumber(Number(rawValue));

            let newCursorPos = 0;
            let rawCount = 0;
            for (let i = 0; i < newFormatted.length && rawCount < rawCursorPos; i++) {
                newCursorPos++;
                if (newFormatted[i] !== '.') {
                    rawCount++;
                }
            }

            cursorPositionRef.current = newCursorPos;
            updateData({ price: Number(rawValue) });
        }
    };

    const handleOdoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const cursorPos = input.selectionStart || 0;
        const oldValue = input.value;
        const rawValue = oldValue.replace(/\./g, '');

        if (!isNaN(Number(rawValue))) {
            const dotsBeforeCursor = (oldValue.slice(0, cursorPos).match(/\./g) || []).length;
            const rawCursorPos = cursorPos - dotsBeforeCursor;
            const newFormatted = formatNumber(Number(rawValue));

            let newCursorPos = 0;
            let rawCount = 0;
            for (let i = 0; i < newFormatted.length && rawCount < rawCursorPos; i++) {
                newCursorPos++;
                if (newFormatted[i] !== '.') {
                    rawCount++;
                }
            }

            odoCursorPositionRef.current = newCursorPos;
            updateData({ odo: Number(rawValue) });
        }
    };

    // Restore cursor position for Price
    useEffect(() => {
        if (cursorPositionRef.current !== null && priceInputRef.current) {
            priceInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
            cursorPositionRef.current = null;
        }
    }, [data.price]);

    // Restore cursor position for Odo
    useEffect(() => {
        if (odoCursorPositionRef.current !== null && odoInputRef.current) {
            odoInputRef.current.setSelectionRange(odoCursorPositionRef.current, odoCursorPositionRef.current);
            odoCursorPositionRef.current = null;
        }
    }, [data.odo]);

    const inputClass = (field: string) =>
        `w-full bg-white border ${errors[field] ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400 placeholder:text-gray-400 uppercase`;

    const inputClassWithIcon = (field: string) =>
        `w-full bg-white border ${errors[field] ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 pl-12 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400 placeholder:text-gray-400 uppercase`;

    const inputClassWithIconAndSuffix = (field: string) =>
        `w-full bg-white border ${errors[field] ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 pl-12 pr-16 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none uppercase`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Make */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Hãng xe <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select
                            value={data.make}
                            onChange={(e) => updateData({ make: e.target.value.toUpperCase() })}
                            className={`${inputClassWithIcon('make')} appearance-none`}
                        >
                            <option value="">Chọn hãng xe...</option>
                            {brands.map((make) => (
                                <option key={make} value={make}>{make}</option>
                            ))}
                        </select>
                        <CarFront className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
                </div>

                {/* Model */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Dòng xe <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.model}
                            onChange={(e) => updateData({ model: e.target.value.toUpperCase() })}
                            placeholder="Ví dụ: Civic, Supra..."
                            className={inputClassWithIcon('model')}
                        />
                        <CarFront className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                </div>

                {/* Year */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Năm sản xuất <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="number"
                            value={data.year || ''}
                            onChange={(e) => updateData({ year: parseInt(e.target.value) || 0 })}
                            placeholder="YYYY"
                            className={inputClassWithIcon('year')}
                        />
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                </div>

                {/* Trim */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Phiên bản (Trim) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={data.trim}
                        onChange={(e) => updateData({ trim: e.target.value.toUpperCase() })}
                        placeholder="Ví dụ: Type R, Spec-R..."
                        className={inputClass('trim')}
                    />
                    {errors.trim && <p className="text-red-500 text-xs mt-1">{errors.trim}</p>}
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-600">Mức giá mong muốn <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="negotiable"
                                checked={data.isNegotiable}
                                onChange={(e) => updateData({ isNegotiable: e.target.checked })}
                                className="w-4 h-4 rounded-none border-gray-300 text-black focus:ring-black"
                            />
                            <label htmlFor="negotiable" className="text-xs text-gray-500 cursor-pointer select-none">Thương lượng</label>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            ref={priceInputRef}
                            type="text"
                            value={formatNumber(data.price)}
                            onChange={handlePriceChange}
                            placeholder="Nhập giá bán (VND)"
                            className={inputClassWithIcon('price')}
                        />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">VND</div>
                    </div>
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Khu vực <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={data.location}
                        onChange={(e) => updateData({ location: e.target.value.toUpperCase() })}
                        placeholder="Ví dụ: TP.HCM, Hà Nội..."
                        className={inputClass('location')}
                    />
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>

                {/* Odo */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Số ODO hiện tại (km) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            ref={odoInputRef}
                            type="text"
                            value={formatNumber(data.odo || 0)}
                            onChange={handleOdoChange}
                            placeholder="0"
                            className={inputClassWithIconAndSuffix('odo')}
                        />
                        <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">KM</div>
                    </div>
                    {errors.odo && <p className="text-red-500 text-xs mt-1">{errors.odo}</p>}
                </div>
            </div>
        </div>
    );
}
