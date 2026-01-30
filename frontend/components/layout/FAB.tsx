'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export function FAB() {
    return (
        <Link
            href="/locations/new"
            className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
            title="Check-in địa điểm mới"
        >
            <Plus className="w-6 h-6" />
        </Link>
    );
}

export default FAB;
