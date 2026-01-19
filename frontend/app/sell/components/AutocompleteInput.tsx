import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface AutocompleteInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    error?: string;
    icon?: React.ReactNode;
    required?: boolean;
    name: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    maxLength?: number;
}

export default function AutocompleteInput({
    label,
    value,
    onChange,
    suggestions,
    placeholder,
    error,
    icon,
    required,
    name,
    onKeyDown,
    maxLength
}: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter suggestions when value or suggestions change
    const filteredSuggestions = useMemo(() => {
        if (!Array.isArray(suggestions)) return [];
        let result = suggestions;
        if (value) {
            const lowerVal = value.toLowerCase();
            result = suggestions.filter(item => item.toLowerCase().includes(lowerVal));
        }
        return result.sort((a, b) => a.localeCompare(b));
    }, [value, suggestions]);

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const inputClass = `w-full bg-white border ${error ? 'border-[var(--jdm-red)]' : 'border-gray-300'} text-black rounded-none p-4 ${icon ? 'pl-12' : ''} focus:ring-2 focus:ring-black outline-none transition-all hover:bg-gray-50 hover:border-gray-400 placeholder:text-gray-400 uppercase`;

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            <label className="text-sm font-medium text-gray-600 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value.toUpperCase());
                        setIsOpen(true);
                    }}
                    onKeyDown={onKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={inputClass}
                    autoComplete="off"
                />

                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}

                {/* Dropdown */}
                {isOpen && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto rounded-none">
                        {filteredSuggestions.map((item, index) => (
                            <div
                                key={`${item}-${index}`}
                                onClick={() => {
                                    onChange(item);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-gray-100 hover:text-[var(--jdm-red)] cursor-pointer text-sm font-bold uppercase border-b border-gray-50 last:border-0 transition-colors text-black"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
