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
        `w-full bg-white border ${errors[field] ? 'border-red-500' : 'border-gray-300'} text-gray-900 rounded-xl p-4 pl-12 focus:ring-2 focus:ring-violet-500 outline-none transition-all hover:bg-gray-50 hover:border-violet-300 placeholder:text-gray-400`;

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
                    <div className={`flex bg-gray-100 p-1 rounded-xl border ${errors.transmission ? 'border-red-500' : 'border-gray-200'}`}>
                        {['MT', 'AT', 'CVT'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => updateData({ transmission: type as any })}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${data.transmission === type
                                    ? 'bg-white text-violet-600 shadow-md border border-gray-100'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {type === 'MT' ? 'Số sàn (MT)' : type === 'AT' ? 'Tự động (AT)' : 'CVT'}
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
                    <div className={`flex bg-gray-100 p-1 rounded-xl border ${errors.drivetrain ? 'border-red-500' : 'border-gray-200'}`}>
                        {['FWD', 'RWD', 'AWD'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => updateData({ drivetrain: type as any })}
                                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${data.drivetrain === type
                                    ? 'bg-white text-blue-600 shadow-md border border-gray-100'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {type}
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
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${errors.condition ? 'ring-2 ring-red-500 rounded-xl p-2' : ''}`}>
                    {[
                        { val: 'Zin', label: 'Zin' },
                        { val: 'Lightly Modded', label: 'Độ nhẹ' },
                        { val: 'Heavily Modded', label: 'Độ khủng' },
                        { val: 'Track/Drift Build', label: 'Track/Drift' },
                        { val: 'Restored', label: 'Đã dọn zin' },
                        { val: 'Restored Modded', label: 'Đã dọn độ' }
                    ].map((item) => (
                        <button
                            key={item.val}
                            type="button"
                            onClick={() => updateData({ condition: item.val as any })}
                            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-center ${data.condition === item.val
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800'
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
