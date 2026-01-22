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
                        disableSort={true}
                        placeholder={placeholder}
                        maxLength={100}
                        onKeyDown={handleKeyDown}
                    />

                </div>
                <button
                    onClick={handleAdd}
                    type="button"
                    className="bg-black hover:bg-[var(--jdm-red)] text-white p-4 h-[58px] rounded-none transition-colors"
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
    const [suggestions, setSuggestions] = useState<{
        exterior: string[];
        interior: string[];
        engine: string[];
        footwork: string[];
    }>({ exterior: [], interior: [], engine: [], footwork: [] });

    // Fetch mod suggestions from Tag history (linked to the current Model)
    useEffect(() => {
        let active = true;

        const fetchModSuggestions = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
                const modelParent = data.model ? encodeURIComponent(data.model.toUpperCase()) : '';
                
                // Fetch each category from tag history with model as parent
                const fetchCat = async (cat: string) => {
                    const url = modelParent 
                        ? `${apiUrl}/tags/suggestions/mods_${cat}?parent=${modelParent}`
                        : `${apiUrl}/tags/suggestions/mods_${cat}`;
                    const res = await fetch(url);
                    return res.json();
                };

                const [ext, int, eng, foot] = await Promise.all([
                    fetchCat('exterior'),
                    fetchCat('interior'),
                    fetchCat('engine'),
                    fetchCat('footwork')
                ]);

                if (active) {
                    setSuggestions({
                        exterior: Array.isArray(ext) ? ext : [],
                        interior: Array.isArray(int) ? int : [],
                        engine: Array.isArray(eng) ? eng : [],
                        footwork: Array.isArray(foot) ? foot : [],
                    });
                }
            } catch (err) {
                console.error('Failed to fetch filtered mod suggestions from history', err);
            }
        };

        fetchModSuggestions();

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
                    suggestions={suggestions.exterior}
                />
                <ModSection
                    title="Nội thất"
                    icon={Armchair}
                    items={data.mods.interior}
                    onAdd={(item) => addItem('interior', item)}
                    onRemove={(idx) => removeItem('interior', idx)}
                    placeholder="Ghế Recaro..."
                    suggestions={suggestions.interior}
                />
                <ModSection
                    title="Máy móc & Hiệu suất"
                    icon={Hammer}
                    items={data.mods.engine}
                    onAdd={(item) => addItem('engine', item)}
                    onRemove={(idx) => removeItem('engine', idx)}
                    placeholder="Turbo Garrett..."
                    suggestions={suggestions.engine}
                />
                <ModSection
                    title="Gầm & Bánh"
                    icon={Disc}
                    items={data.mods.footwork}
                    onAdd={(item) => addItem('footwork', item)}
                    onRemove={(idx) => removeItem('footwork', idx)}
                    placeholder="Phuộc Tein..."
                    suggestions={suggestions.footwork}
                />
            </div>
        </div>
    );
}
