'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

const colors = {
    success: 'bg-teal-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);
    const Icon = icons[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white transition-all duration-300 ${colors[type]} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-80">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Toast container for managing multiple toasts
interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

let toastId = 0;
const toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toastsState: ToastItem[] = [];

function notifyListeners() {
    toastListeners.forEach((listener) => listener([...toastsState]));
}

export const toast = {
    success: (message: string) => {
        const id = String(++toastId);
        toastsState.push({ id, message, type: 'success' });
        notifyListeners();
        return id;
    },
    error: (message: string) => {
        const id = String(++toastId);
        toastsState.push({ id, message, type: 'error' });
        notifyListeners();
        return id;
    },
    info: (message: string) => {
        const id = String(++toastId);
        toastsState.push({ id, message, type: 'info' });
        notifyListeners();
        return id;
    },
    remove: (id: string) => {
        toastsState = toastsState.filter((t) => t.id !== id);
        notifyListeners();
    },
    subscribe: (listener: (toasts: ToastItem[]) => void) => {
        toastListeners.push(listener);
        return () => {
            const index = toastListeners.indexOf(listener);
            if (index > -1) toastListeners.splice(index, 1);
        };
    },
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        return toast.subscribe(setToasts);
    }, []);

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((t) => (
                <Toast
                    key={t.id}
                    message={t.message}
                    type={t.type}
                    onClose={() => toast.remove(t.id)}
                />
            ))}
        </div>
    );
}

export default Toast;
