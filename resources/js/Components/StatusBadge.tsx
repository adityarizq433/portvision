import React from 'react';

interface Props {
    status: 'up' | 'down' | 'unknown' | string;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
}

export default function StatusBadge({ status, size = 'md', pulse = true }: Props) {
    const s = (status || '').toLowerCase();

    let bg = 'bg-gray-100 text-gray-700 border-gray-200';
    let dot = 'bg-gray-500';
    let label = 'Belum Diketahui';

    if (s === 'up' || s === 'active') {
        bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dot = 'bg-emerald-500';
        label = 'UP';
    } else if (s === 'down' || s === 'rejected') {
        bg = 'bg-rose-50 text-rose-700 border-rose-200';
        dot = 'bg-rose-500';
        label = 'DOWN';
    } else if (s === 'suggested' || s === 'testing') {
        bg = 'bg-amber-50 text-amber-700 border-amber-200';
        dot = 'bg-amber-500';
        label = 'TESTING';
    }

    const sizeClasses = {
        sm: 'text-[11px] font-semibold px-2 py-0.5 gap-1.5',
        md: 'text-xs font-semibold px-2.5 py-1 gap-2',
        lg: 'text-sm font-semibold px-3 py-1.5 gap-2.5',
    }[size];

    return (
        <span className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses}`}>
            <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${dot} ${
                    pulse && s === 'down' ? 'animate-dot-blink' : ''
                }`}
            />
            <span>{label}</span>
        </span>
    );
}
