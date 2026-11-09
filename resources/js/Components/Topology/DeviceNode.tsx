import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import TierBadge from '../TierBadge';

interface DeviceNodeData {
    id: number;
    hostname: string;
    ip?: string | null;
    vendor?: string | null;
    model?: string | null;
    tier: string;
    status: 'up' | 'down' | 'unknown';
    location_name?: string | null;
    port_count: number;
    port_up_count: number;
    port_down_count: number;
    is_locked?: boolean;
    show_ip?: boolean;
}

const isIpAddress = (value?: string | null) =>
    !!value && /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());

function DeviceNode({ data }: { data: DeviceNodeData }) {
    const isDown = data.status === 'down';

    const total = data.port_count || 0;
    const up = data.port_up_count || 0;
    const down = data.port_down_count || 0;

    const modelLabel = [data.vendor, data.model].filter(Boolean).join(' ') || 'Switch';
    const displayName = data.hostname && !isIpAddress(data.hostname) ? data.hostname : modelLabel;

    return (
        <div className="relative w-[200px] select-none">
            <Handle type="source" position={Position.Top} id="top-source" className="!h-2.5 !w-2.5 !bg-primary-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Atas" />
            <Handle type="source" position={Position.Bottom} id="bottom-source" className="!h-2.5 !w-2.5 !bg-primary-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Bawah" />
            <Handle type="source" position={Position.Left} id="left-source" className="!h-2.5 !w-2.5 !bg-primary-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Kiri" />
            <Handle type="source" position={Position.Right} id="right-source" className="!h-2.5 !w-2.5 !bg-primary-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Kanan" />
            <Handle type="target" position={Position.Top} id="top-target" className="!h-2.5 !w-2.5 !bg-emerald-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Atas (target)" />
            <Handle type="target" position={Position.Bottom} id="bottom-target" className="!h-2.5 !w-2.5 !bg-emerald-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Bawah (target)" />
            <Handle type="target" position={Position.Left} id="left-target" className="!h-2.5 !w-2.5 !bg-emerald-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Kiri (target)" />
            <Handle type="target" position={Position.Right} id="right-target" className="!h-2.5 !w-2.5 !bg-emerald-500 !border-2 !border-white hover:!scale-150 !cursor-crosshair" title="Kanan (target)" />

            {/* Nama di atas switch */}
            <div className="mb-1 flex items-center justify-center gap-1.5 px-2">
                <span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${isDown ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="max-w-[165px] truncate font-mono text-[12px] font-bold text-navy-900" title={displayName}>
                    {displayName}
                </span>
            </div>

            {/* Ikon switch */}
            <svg viewBox="0 0 200 92" width="200" height="92" aria-hidden="true" className="drop-shadow-md">
                <path d="M10 58 L30 24 L162 24 L182 58 Z" fill={isDown ? '#475569' : '#2563eb'} stroke={isDown ? '#334155' : '#1e40af'} strokeWidth="2" />
                <rect x="10" y="58" width="172" height="16" rx="3" fill={isDown ? '#64748b' : '#1d4ed8'} stroke={isDown ? '#475569' : '#1e40af'} strokeWidth="1.5" />
                <rect x="8" y="74" width="184" height="6" rx="3" fill={isDown ? '#94a3b8' : '#3b82f6'} opacity="0.6" />
                <circle cx="126" cy="42" r="5" fill={isDown ? '#ef4444' : '#22c55e'} stroke="white" strokeWidth="1.5" />
                <rect x="138" y="38" width="30" height="12" rx="2" fill="#0f172a" stroke="white" strokeWidth="1" />
                <circle cx="20" cy="66" r="3" fill={isDown ? '#fca5a5' : '#86efac'} />
                <circle cx="30" cy="66" r="3" fill={isDown ? '#475569' : '#22c55e'} />
            </svg>

            {/* Kiri bawah: UP/DOWN, Kanan bawah: tier */}
            <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
                <span className="font-mono text-[10px] font-bold">
                    <span className="text-emerald-600">{up}/{total} UP</span>
                    {down > 0 && <span className="ml-1 text-red-600">{down} DOWN</span>}
                </span>
                <TierBadge tier={data.tier} size="sm" />
            </div>

            {data.show_ip && (
                <div className="mt-0.5 text-center font-mono text-[10px] text-slate-500">{data.ip || '—'}</div>
            )}
        </div>
    );
}

export default memo(DeviceNode);
