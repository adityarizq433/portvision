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
        cyan: 'border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-cyan-500/40',
        emerald: 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-emerald-500/40',
        rose: 'border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.15)] hover:border-rose-500/50',
        amber: 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:border-amber-500/40',
        purple: 'border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-500/40',
    }[accentColor];

    return (
        <div
            className={`relative overflow-hidden rounded-xl bg-slate-900/90 border p-5 backdrop-blur-md transition-all duration-300 ${accents} ${
                alert ? 'ring-1 ring-rose-500/60' : ''
            }`}
        >
            {alert && (
                <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden">
                    <div className="absolute top-2 right-[-24px] rotate-45 bg-rose-600 px-6 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Alert
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {title}
                </span>
                {icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
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
                <p className="mt-2 text-xs text-slate-400 line-clamp-1">{subtitle}</p>
            )}
        </div>
    );
}
