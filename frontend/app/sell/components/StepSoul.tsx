import { CarSpecs } from '../types';
import { Cpu, Settings, Activity, Zap, PenTool } from 'lucide-react';

interface StepSoulProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}

const CHASSIS_SUGGESTIONS = [
    'S13', 'S14', 'S15', 'R32', 'R33', 'R34', 'R35', // Nissan
    'AE86', 'JZA80', 'ZN6', 'SW20', // Toyota
    'EK9', 'EG6', 'DC2', 'DC5', 'NA1', 'NA2', 'FK8', // Honda
    'CN9A', 'CP9A', 'CT9A', 'CZ4A', // Mitsu Evo
    'FD3S', 'FC3S', 'NA6CE', 'NB8C', // Mazda
    'GC8', 'GDB', 'GRB', 'VAB' // Subaru
];

const ENGINE_SUGGESTIONS = [
    'SR20DET', 'RB26DETT', '2JZ-GTE', '1JZ-GTE', '4G63T',
    'B16A', 'B16B', 'B18C', 'K20A', 'F20C', 'C30A',
    '13B-REW', 'EJ20', 'EJ25'
];

export default function StepSoul({ data, updateData, errors = {} }: StepSoulProps) {
    const inputClassWithIcon = (field: string) =>
        `w-full bg-white border ${errors[field] ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 pl-12 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400 placeholder:text-gray-400 uppercase`;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chassis Code */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Mã khung gầm (Chassis Code) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.chassisCode}
                            onChange={(e) => updateData({ chassisCode: e.target.value.toUpperCase() })}
                            placeholder="S15, R34, EK9..."
                            className={inputClassWithIcon('chassisCode')}
                        />
                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.chassisCode && <p className="text-red-500 text-xs mt-1">{errors.chassisCode}</p>}
                </div>

                {/* Engine Code */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Mã động cơ (Engine Code) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.engineCode}
                            onChange={(e) => updateData({ engineCode: e.target.value.toUpperCase() })}
                            placeholder="SR20DET, 2JZ-GTE..."
                            className={inputClassWithIcon('engineCode')}
                        />
                        <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.engineCode && <p className="text-red-500 text-xs mt-1">{errors.engineCode}</p>}
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

        </div >
    );
}
