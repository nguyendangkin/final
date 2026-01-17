import React, { useState } from 'react';
import { CarSpecs } from '../types';
import { Plus, X, Box, Armchair, Hammer, Disc } from 'lucide-react';

interface StepModsProps {
    data: CarSpecs;
    updateData: (fields: Partial<CarSpecs>) => void;
}

const ModSection = ({
    title,
    icon: Icon,
    items,
    onAdd,
    onRemove,
    placeholder
}: {
    title: string;
    icon: React.ElementType;
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
}) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim()) {
                onAdd(input.trim());
                setInput('');
            }
        }
    };

    const handleAdd = () => {
        if (input.trim()) {
            onAdd(input.trim());
            setInput('');
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 hover:border-violet-500/50 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                    <Icon className="w-5 h-5 text-violet-600 group-hover:text-violet-700" />
                </div>
                <h4 className="font-semibold text-gray-900">{title}</h4>
            </div>

            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-400"
                />
                <button
                    onClick={handleAdd}
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {items.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Chưa có thông tin...</span>
                )}
                {items.map((item, idx) => (
                    <span key={idx} className="bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 animate-in zoom-in-50 duration-200 font-medium">
                        {item}
                        <button
                            onClick={() => onRemove(idx)}
                            className="hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default function StepMods({ data, updateData }: StepModsProps) {
    const updateMods = (category: keyof typeof data.mods, newItems: string[]) => {
        updateData({
            mods: {
                ...data.mods,
                [category]: newItems,
            },
        });
    };

    const addItem = (category: keyof typeof data.mods, item: string) => {
        updateMods(category, [...data.mods[category], item]);
    };

    const removeItem = (category: keyof typeof data.mods, index: number) => {
        updateMods(category, data.mods[category].filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-sm text-gray-500 italic mb-4">
                *Mẹo: Nhập tên món đồ và nhấn <strong>Enter</strong> để thêm nhanh. Chia nhỏ giúp người mua dễ so sánh.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModSection
                    title="Ngoại thất"
                    icon={Box}
                    items={data.mods.exterior}
                    onAdd={(item) => addItem('exterior', item)}
                    onRemove={(idx) => removeItem('exterior', idx)}
                    placeholder="Bodykit, Cánh gió, Đèn..."
                />
                <ModSection
                    title="Nội thất"
                    icon={Armchair}
                    items={data.mods.interior}
                    onAdd={(item) => addItem('interior', item)}
                    onRemove={(idx) => removeItem('interior', idx)}
                    placeholder="Ghế Recaro, Volang Nardi..."
                />
                <ModSection
                    title="Máy móc & Hiệu suất"
                    icon={Hammer}
                    items={data.mods.engine}
                    onAdd={(item) => addItem('engine', item)}
                    onRemove={(idx) => removeItem('engine', idx)}
                    placeholder="Turbo Garrett, ECU Haltech, Pô HKS..."
                />
                <ModSection
                    title="Gầm & Bánh"
                    icon={Disc}
                    items={data.mods.footwork}
                    onAdd={(item) => addItem('footwork', item)}
                    onRemove={(idx) => removeItem('footwork', idx)}
                    placeholder="Phuộc Tein, Mâm TE37 18x9.5..."
                />
            </div>
        </div>
    );
}
