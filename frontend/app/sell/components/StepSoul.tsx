import { CarSpecs } from '../types';
import { Cpu, Settings, Activity, Zap, PenTool } from 'lucide-react';
import { useState, useEffect } from 'react';
import AutocompleteInput from './AutocompleteInput';

interface StepSoulProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}

// Unused suggestions removed


export default function StepSoul({ data, updateData, errors = {} }: StepSoulProps) {
    const inputClassWithIcon = (field: string) =>
        `w-full bg-white border ${errors[field] ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 pl-12 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400 placeholder:text-gray-400 uppercase`;

    const [suggestions, setSuggestions] = useState<{
        chassisCode: string[];
        engineCode: string[];
    }>({ chassisCode: [], engineCode: [] });

    // Fetch Chassis & Engine suggestions based on Model
    useEffect(() => {
        let active = true;

        if (data.model) {
            const fetchSuggestions = async () => {
                try {
                    // Fetch Chassis Codes
                    const resChassis = await fetch(`http://localhost:3000/tags/suggestions/chassisCode?parent=${encodeURIComponent(data.model)}`);
                    const chassisData = await resChassis.json();

                    // Fetch Engine Codes
                    const resEngine = await fetch(`http://localhost:3000/tags/suggestions/engineCode?parent=${encodeURIComponent(data.model)}`);
                    const engineData = await resEngine.json();

                    if (active) {
                        setSuggestions({
                            chassisCode: Array.isArray(chassisData) ? chassisData : [],
                            engineCode: Array.isArray(engineData) ? engineData : [],
                        });
                    }
                } catch (err) {
                    console.error('Failed to fetch details', err);
                }
            };
            fetchSuggestions();
        } else {
            setSuggestions({ chassisCode: [], engineCode: [] });
        }

        return () => { active = false; };
    }, [data.model]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chassis Code */}
                <div className="space-y-0">
                    <AutocompleteInput
                        label="Mã khung gầm (Chassis Code)"
                        name="chassisCode"
                        value={data.chassisCode}
                        onChange={(val) => updateData({ chassisCode: val })}
                        suggestions={suggestions.chassisCode}
                        placeholder="S15, R34, EK9..."
                        error={errors.chassisCode}
                        required
                        maxLength={50}
                        icon={<Settings className="w-5 h-5" />}
                    />
                </div>

                {/* Engine Code */}
                <div className="space-y-0">
                    <AutocompleteInput
                        label="Mã động cơ (Engine Code)"
                        name="engineCode"
                        value={data.engineCode}
                        onChange={(val) => updateData({ engineCode: val })}
                        suggestions={suggestions.engineCode}
                        placeholder="SR20DET, 2JZ-GTE..."
                        error={errors.engineCode}
                        required
                        maxLength={50}
                        icon={<Cpu className="w-5 h-5" />}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Transmission */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Hộp số <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex bg-gray-100 p-1 rounded-none border ${errors.transmission ? 'border-[var(--jdm-red)]' : 'border-gray-200'}`}>
                        {[
                            { val: 'SỐ SÀN (MT)', label: 'SỐ SÀN (MT)' },
                            { val: 'TỰ ĐỘNG (AT)', label: 'TỰ ĐỘNG (AT)' },
                            { val: 'CVT', label: 'CVT' }
                        ].map((item) => (
                            <button
                                key={item.val}
                                type="button"
                                onClick={() => updateData({ transmission: item.val })}
                                className={`flex-1 py-3 rounded-none text-sm font-bold uppercase tracking-wide transition-all ${data.transmission === item.val
                                    ? 'bg-black text-white shadow-md border border-black'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-200'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {errors.transmission && <p className="text-red-500 text-xs mt-1">{errors.transmission}</p>}
                </div>

                {/* Drivetrain */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Hệ dẫn động <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex bg-gray-100 p-1 rounded-none border ${errors.drivetrain ? 'border-[var(--jdm-red)]' : 'border-gray-200'}`}>
                        {[
                            { val: 'FWD (TRƯỚC)', label: 'FWD (TRƯỚC)' },
                            { val: 'RWD (SAU)', label: 'RWD (SAU)' },
                            { val: 'AWD (2 CẦU)', label: 'AWD (2 CẦU)' }
                        ].map((item) => (
                            <button
                                key={item.val}
                                type="button"
                                onClick={() => updateData({ drivetrain: item.val })}
                                className={`flex-1 py-3 rounded-none text-sm font-bold uppercase tracking-wide transition-all ${data.drivetrain === item.val
                                    ? 'bg-black text-white shadow-md border border-black'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-200'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {errors.drivetrain && <p className="text-red-500 text-xs mt-1">{errors.drivetrain}</p>}
                </div>
            </div>

            {/* Condition */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <PenTool className="w-4 h-4" /> Tình trạng <span className="text-red-500">*</span>
                </label>
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${errors.condition ? 'ring-2 ring-[var(--jdm-red)] rounded-none p-2' : ''}`}>
                    {[
                        { val: 'ZIN', label: 'ZIN' },
                        { val: 'ĐỘ NHẸ', label: 'ĐỘ NHẸ' },
                        { val: 'ĐỘ KHỦNG', label: 'ĐỘ KHỦNG' },
                        { val: 'TRACK/DRIFT', label: 'TRACK/DRIFT' },
                        { val: 'VỪA DỌN VỀ ZIN', label: 'VỪA DỌN VỀ ZIN' },
                        { val: 'VỪA DỌN VÀ ĐỘ', label: 'VỪA DỌN VÀ ĐỘ' }
                    ].map((item) => (
                        <button
                            key={item.val}
                            type="button"
                            onClick={() => updateData({ condition: item.val })}
                            className={`py-3 px-4 rounded-none border text-sm font-bold uppercase tracking-wide transition-all text-center ${data.condition === item.val
                                ? 'bg-[var(--jdm-red)] border-[var(--jdm-red)] text-white'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-black hover:text-black'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
            </div>

            {/* Notable Features */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Ngoại hình chú ý
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['MUI TRẦN', 'ĐÈN MẮT ẾCH', 'CỬA COUPE'].map((feature) => {
                        const isChecked = data.notableFeatures?.includes(feature);
                        return (
                            <label
                                key={feature}
                                className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${isChecked
                                    ? 'border-[var(--jdm-red)] bg-red-50'
                                    : 'border-gray-200 bg-white hover:border-gray-400'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                        const current = data.notableFeatures || [];
                                        if (e.target.checked) {
                                            updateData({ notableFeatures: [...current, feature] });
                                        } else {
                                            updateData({ notableFeatures: current.filter(f => f !== feature) });
                                        }
                                    }}
                                    className="w-5 h-5 text-[var(--jdm-red)] focus:ring-[var(--jdm-red)] border-gray-300 rounded-none"
                                />
                                <span className={`font-bold uppercase text-sm ${isChecked ? 'text-[var(--jdm-red)]' : 'text-gray-600'}`}>
                                    {feature}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
