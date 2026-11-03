import React from 'react';

interface Props {
    status: 'up' | 'down' | 'unknown' | string;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
}

export default function StatusBadge({ status, size = 'md', pulse = true }: Props) {
    const s = (status || '').toLowerCase();

    let bg = 'bg-slate-800 text-slate-300 border-slate-700';
    let dot = 'bg-slate-400';
    let label = 'Unknown';

    if (s === 'up' || s === 'active') {
        bg = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
        dot = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
        label = 'UP';
    } else if (s === 'down' || s === 'rejected') {
        bg = 'bg-rose-950/80 text-rose-300 border-rose-800/60';
        dot = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
        label = 'DOWN';
    } else if (s === 'suggested' || s === 'testing') {
        bg = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
        dot = 'bg-amber-400';
        label = 'TESTING';
    }

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5 gap-1.5',
        md: 'text-xs font-medium px-2.5 py-1 gap-2',
        lg: 'text-sm font-semibold px-3 py-1.5 gap-2.5',
    }[size];

    return (
        <span className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses}`}>
            <span
                className={`h-2 w-2 rounded-full ${dot} ${
                    pulse && s === 'down' ? 'animate-ping' : ''
                }`}
            />
            <span>{label}</span>
        </span>
    );
}
