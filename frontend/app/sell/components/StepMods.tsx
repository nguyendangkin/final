import React, { useState, useEffect } from 'react';
import { CarSpecs } from '../types';
import { Plus, X, Box, Armchair, Hammer, Disc } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';

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
    placeholder,
    suggestions = []
}: {
    title: string;
    icon: React.ElementType;
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
    suggestions?: string[];
}) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim()) {
                onAdd(input.trim().toUpperCase());
                setInput('');
            }
        }
    };

    const handleAdd = () => {
        if (input.trim()) {
            onAdd(input.trim().toUpperCase());
            setInput('');
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-none p-6 space-y-4 hover:border-[var(--jdm-red)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-black rounded-none group-hover:bg-[var(--jdm-red)] transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-black uppercase tracking-wide">{title}</h4>
            </div>

            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <AutocompleteInput
                        label=""
                        name={`mod-${title}`}
                        value={input}
                        onChange={setInput}
                        suggestions={suggestions}
                        placeholder={placeholder}
                        maxLength={100}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    type="button"
                    className="bg-black hover:bg-[var(--jdm-red)] text-white p-4 h-[58px] rounded-none transition-colors mb-2"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {items.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Chưa có thông tin...</span>
                )}
                {items.map((item, idx) => (
                    <span key={idx} className="bg-gray-100 text-black border border-gray-200 px-3 py-1 rounded-none text-sm flex items-center gap-2 animate-in zoom-in-50 duration-200 font-bold">
                        {item}
                        <button
                            onClick={() => onRemove(idx)}
                            className="hover:text-[var(--jdm-red)] hover:bg-red-50 rounded-full p-0.5 transition-colors"
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
    const [suggestedMods, setSuggestedMods] = useState<string[]>([]);

    useEffect(() => {
        let active = true;
        if (data.make || data.model) {
            let url = 'http://localhost:3000/cars/filters/details?';
            if (data.make) url += `make=${encodeURIComponent(data.make)}&`;
            if (data.model) url += `model=${encodeURIComponent(data.model)}&`;

            fetch(url)
                .then(res => res.json())
                .then(resData => {
                    if (active && Array.isArray(resData.mods)) {
                        setSuggestedMods(resData.mods);
                    }
                })
                .catch(err => console.error('Failed to fetch mods', err));
        }
        return () => { active = false; };
    }, [data.make, data.model]);

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
                *Mẹo: Nhập tên món đồ và nhấn <strong>Enter</strong> (hoặc nút &apos;+&apos;) để thêm nhanh. Chia nhỏ giúp người mua dễ so sánh.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModSection
                    title="Ngoại thất"
                    icon={Box}
                    items={data.mods.exterior}
                    onAdd={(item) => addItem('exterior', item)}
                    onRemove={(idx) => removeItem('exterior', idx)}
                    placeholder="Bodykit..."
                    suggestions={suggestedMods}
                />
                <ModSection
                    title="Nội thất"
                    icon={Armchair}
                    items={data.mods.interior}
                    onAdd={(item) => addItem('interior', item)}
                    onRemove={(idx) => removeItem('interior', idx)}
                    placeholder="Ghế Recaro..."
                    suggestions={suggestedMods}
                />
                <ModSection
                    title="Máy móc & Hiệu suất"
                    icon={Hammer}
                    items={data.mods.engine}
                    onAdd={(item) => addItem('engine', item)}
                    onRemove={(idx) => removeItem('engine', idx)}
                    placeholder="Turbo Garrett..."
                    suggestions={suggestedMods}
                />
                <ModSection
                    title="Gầm & Bánh"
                    icon={Disc}
                    items={data.mods.footwork}
                    onAdd={(item) => addItem('footwork', item)}
                    onRemove={(idx) => removeItem('footwork', idx)}
                    placeholder="Phuộc Tein..."
                    suggestions={suggestedMods}
                />
            </div>
        </div>
    );
}
