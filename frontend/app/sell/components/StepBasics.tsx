import { CarSpecs } from '../types';
import { ChevronDown, DollarSign, Gauge, Calendar, CarFront } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import AutocompleteInput from './AutocompleteInput';

interface StepBasicsProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}



export default function StepBasics({ data, updateData, errors = {} }: StepBasicsProps) {
    const brands = [
        'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi',
        'Subaru', 'Suzuki', 'Daihatsu', 'Lexus', 'Acura', 'Infiniti'
    ];

    const [suggestedModels, setSuggestedModels] = useState<string[]>([]);
    const [suggestedTrims, setSuggestedTrims] = useState<string[]>([]);
    const [suggestedYears, setSuggestedYears] = useState<string[]>([]);
    const [suggestedLocations, setSuggestedLocations] = useState<string[]>([]);

    // Fetch Model suggestions based on Make
    useEffect(() => {
        let active = true;

        if (data.make) {
            const fetchModels = async () => {
                try {
                    const res = await fetch(`http://localhost:3000/tags/suggestions/model?parent=${encodeURIComponent(data.make)}`);
                    const resData = await res.json();
                    if (active && Array.isArray(resData)) {
                        setSuggestedModels(resData);
                    }
                } catch (err) {
                    console.error('Failed to fetch models', err);
                }
            };
            fetchModels();
        } else {
            setSuggestedModels([]);
        }

        return () => { active = false; };
    }, [data.make]);

    // Fetch Trim & Chassis suggestions based on Model (Use chassisCode as trim if trim not available)
    useEffect(() => {
        let active = true;

        if (data.model) {
            const fetchTrims = async () => {
                try {
                    // Try to fetch trims first
                    const res = await fetch(`http://localhost:3000/tags/suggestions/trim?parent=${encodeURIComponent(data.model)}`);
                    let trims = await res.json();

                    // If no explicit trims, try chassisCodes as trims (common in JDM)
                    if (!trims || trims.length === 0) {
                        const resChassis = await fetch(`http://localhost:3000/tags/suggestions/chassisCode?parent=${encodeURIComponent(data.model)}`);
                        trims = await resChassis.json();
                    }

                    if (active && Array.isArray(trims)) {
                        setSuggestedTrims(trims);
                    }
                } catch (err) {
                    console.error('Failed to fetch trims', err);
                }
            };
            fetchTrims();
        } else {
            setSuggestedTrims([]);
        }

        return () => { active = false; };
    }, [data.model]);

    // Fetch filtering options (Location, Year range) from smart filter (still needs active cars for accurate pricing/location availability)


    // Fetch smart suggestions for year range (still needs active cars)
    useEffect(() => {
        let active = true;

        const fetchSmartSuggestions = async () => {
            try {
                const params = new URLSearchParams();
                if (data.make) params.append('make', data.make);
                if (data.model) params.append('model', data.model);

                const res = await fetch(`http://localhost:3000/cars/filters/smart?${params.toString()}`);
                const resData = await res.json();

                if (active) {
                    // Update Year Suggestions from Range (only from active cars)
                    if (resData.ranges && resData.ranges.year) {
                        const { min, max } = resData.ranges.year;
                        if (min > 0 && max > 0 && min !== Infinity) {
                            const years = [];
                            for (let y = max; y >= min; y--) {
                                years.push(y.toString());
                            }
                            setSuggestedYears(years);
                        } else {
                            setSuggestedYears([]);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch smart suggestions', err);
            }
        };

        fetchSmartSuggestions();

        return () => { active = false; };
    }, [data.make, data.model]);

    // Fetch Location suggestions (Global)
    useEffect(() => {
        let active = true;
        const fetchLocations = async () => {
            try {
                const res = await fetch('http://localhost:3000/tags/suggestions/location');
                const data = await res.json();
                if (active && Array.isArray(data)) {
                    setSuggestedLocations(data);
                }
            } catch (err) {
                console.error('Failed to fetch locations', err);
            }
        };
        fetchLocations();
        return () => { active = false; };
    }, []);

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
                                <option key={make} value={make.toUpperCase()}>{make}</option>
                            ))}
                        </select>
                        <CarFront className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
                </div>

                {/* Model */}
                <div className="space-y-0">
                    <AutocompleteInput
                        label="Dòng xe"
                        name="model"
                        value={data.model}
                        onChange={(val) => updateData({ model: val })}
                        suggestions={suggestedModels}
                        placeholder="Ví dụ: Civic, Supra..."
                        error={errors.model}
                        required
                        maxLength={50}
                        icon={<CarFront className="w-5 h-5" />}
                    />
                </div>

                {/* Year */}
                <div className="space-y-0">
                    <AutocompleteInput
                        label="Năm sản xuất"
                        name="year"
                        value={data.year === 0 ? '' : data.year.toString()}
                        onChange={(val) => updateData({ year: parseInt(val) || 0 })}
                        suggestions={suggestedYears}
                        placeholder="YYYY"
                        error={errors.year}
                        required
                        maxLength={4}
                        icon={<Calendar className="w-5 h-5" />}
                    />
                </div>

                {/* Trim */}
                <div className="space-y-0">
                    <AutocompleteInput
                        label="Phiên bản (Trim)"
                        name="trim"
                        value={data.trim}
                        onChange={(val) => updateData({ trim: val })}
                        suggestions={suggestedTrims}
                        placeholder="Ví dụ: Type R, Spec-R..."
                        error={errors.trim}
                        maxLength={50}
                        required
                    />
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
                            maxLength={15}
                            className={inputClassWithIcon('price')}
                        />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">VND</div>
                    </div>
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>

                {/* Location */}
                <div className="space-y-0">
                    <AutocompleteInput
                        label="Khu vực"
                        name="location"
                        value={data.location}
                        onChange={(val) => updateData({ location: val })}
                        suggestions={suggestedLocations}
                        placeholder="Ví dụ: TP.HCM, Hà Nội..."
                        error={errors.location}
                        maxLength={100}
                        required
                    />
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
                            maxLength={9}
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
