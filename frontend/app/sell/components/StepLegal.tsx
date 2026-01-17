import { CarSpecs } from '../types';
import { FileText, CalendarDays, ChevronDown } from 'lucide-react';

interface StepLegalProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
    errors?: Record<string, string>;
}

export default function StepLegal({ data, updateData, errors = {} }: StepLegalProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-black border border-gray-800 rounded-none flex items-start gap-4">
                <FileText className="w-6 h-6 text-white mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-white font-bold mb-1 uppercase tracking-wide">Pháp lý Việt Nam</h3>
                    <p className="text-sm text-gray-400">
                        Vấn đề nhạy cảm nhất ở VN. Hãy điền trung thực để tăng độ uy tín cho bài đăng của bạn.
                        Người mua JDM đặc biệt quan tâm đến vấn đề này.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Paperwork */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Loại giấy tờ <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select
                            value={data.paperwork}
                            onChange={(e) => updateData({ paperwork: e.target.value as any })}
                            className={`w-full bg-white border ${errors.paperwork ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 pl-12 focus:ring-2 focus:ring-black outline-none appearance-none transition-all hover:bg-gray-50 hover:border-gray-400`}
                        >
                            <option value="">-- Chọn loại giấy tờ --</option>
                            <option value="Legal">SANG TÊN ĐƯỢC (Hợp pháp - Mua là an toàn)</option>
                            <option value="Illegal">KHÔNG SANG TÊN ĐƯỢC (Bất hợp pháp - Mua là ôm rủi ro)</option>
                        </select>
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.paperwork && <p className="text-red-500 text-xs mt-1">{errors.paperwork}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registry Expiry */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Hạn đăng kiểm</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={data.registryExpiry || ''}
                                onChange={(e) => updateData({ registryExpiry: e.target.value })}
                                className="w-full bg-white border border-gray-300 text-black rounded-none p-4 pl-12 focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400"
                            />
                            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
