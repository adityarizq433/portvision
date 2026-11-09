import React from 'react';
import { DeviceTier } from '@/types/models';

interface Props {
    tier: DeviceTier | string;
    size?: 'sm' | 'md';
}

export default function TierBadge({ tier, size = 'md' }: Props) {
    const t = (tier || 'unknown').toLowerCase();

    let style = 'bg-gray-100 text-gray-700 border-gray-200';
    let label = 'Belum Ditetapkan';

    if (t === 'core') {
        style = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Core';
    } else if (t === 'distribution') {
        style = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Distribusi';
    } else if (t === 'access') {
        style = 'bg-teal-50 text-teal-700 border-teal-200';
        label = 'Akses';
    }

    const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5 font-bold' : 'text-xs px-2.5 py-0.5 font-bold';

    return (
        <span className={`inline-flex items-center uppercase tracking-wider rounded-full border ${style} ${sizeClass}`}>
            {label}
        </span>
    );
}
