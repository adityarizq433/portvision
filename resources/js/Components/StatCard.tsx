import React, { ReactNode } from 'react';

interface Props {
    title: string;
    value: number | string;
    subtitle?: string;
    icon?: ReactNode;
    alert?: boolean;
    trend?: {
        label: string;
        isPositive?: boolean;
    };
    accentColor?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'purple';
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon,
    alert = false,
    trend,
    accentColor = 'cyan',
}: Props) {
    const accents = {
        cyan: 'border-cyan-500/20 hover:border-cyan-500/40',
        emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
        rose: 'border-rose-500/30 hover:border-rose-500/50',
        amber: 'border-amber-500/20 hover:border-amber-500/40',
        purple: 'border-purple-500/20 hover:border-purple-500/40',
    }[accentColor];

    return (
        <div
            className={`relative overflow-hidden rounded-xl bg-slate-900/90 border p-5 transition-colors duration-150 ${accents} ${
                alert ? 'ring-1 ring-rose-500/60' : ''
            }`}
        >
            {alert && (
                <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                    Peringatan
                </span>
            )}

            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {title}
                </span>
                {icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50" aria-hidden="true">
                        {icon}
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                    {value}
                </span>
                {trend && (
                    <span
                        className={`text-xs font-medium ${
                            trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                    >
                        {trend.label}
                    </span>
                )}
            </div>

            {subtitle && (
                <p className="mt-2 text-xs text-slate-300 line-clamp-1">{subtitle}</p>
            )}
        </div>
    );
}
