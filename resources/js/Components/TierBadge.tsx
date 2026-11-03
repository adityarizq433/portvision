import React from 'react';
import { DeviceTier } from '@/types/models';

interface Props {
    tier: DeviceTier | string;
    size?: 'sm' | 'md';
}

export default function TierBadge({ tier, size = 'md' }: Props) {
    const t = (tier || 'unknown').toLowerCase();

    let style = 'bg-slate-800/80 text-slate-300 border-slate-700';
    let label = 'Unknown';

    if (t === 'core') {
        style = 'bg-purple-950/70 text-purple-300 border-purple-700/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
        label = 'Core';
    } else if (t === 'distribution') {
        style = 'bg-blue-950/70 text-blue-300 border-blue-700/60';
        label = 'Distribution';
    } else if (t === 'access') {
        style = 'bg-teal-950/70 text-teal-300 border-teal-700/60';
        label = 'Access';
    }

    const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5 font-medium';

    return (
        <span className={`inline-flex items-center uppercase tracking-wider rounded border ${style} ${sizeClass}`}>
            {label}
        </span>
    );
}
