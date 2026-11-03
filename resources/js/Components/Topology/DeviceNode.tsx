import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import StatusBadge from '../StatusBadge';
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
}

function DeviceNode({ data }: { data: DeviceNodeData }) {
    const isDown = data.status === 'down';

    return (
        <div
            className={`relative min-w-[200px] rounded-xl border bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md transition-all ${
                isDown
                    ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500'
                    : 'border-slate-700/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-cyan-500/80'
            }`}
        >
            {/* Connection Handles (Single bidirectional handle per side) */}
            <Handle
                type="source"
                position={Position.Top}
                id="top"
                className="!h-3 !w-3 !bg-cyan-400 !border-2 !border-slate-900 hover:!scale-150 !cursor-crosshair transition-transform"
                title="Connect cable (Top)"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-slate-900 hover:!scale-150 !cursor-crosshair transition-transform"
                title="Connect cable (Bottom)"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left"
                className="!h-3 !w-3 !bg-cyan-400 !border-2 !border-slate-900 hover:!scale-150 !cursor-crosshair transition-transform"
                title="Connect cable (Left)"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!h-3 !w-3 !bg-indigo-400 !border-2 !border-slate-900 hover:!scale-150 !cursor-crosshair transition-transform"
                title="Connect cable (Right)"
            />

            {/* Header: Status LED & Hostname */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 truncate">
                    <span
                        className={`h-2.5 w-2.5 rounded-full ${
                            isDown
                                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-ping'
                                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        }`}
                    />
                    <span className="text-xs font-bold font-mono text-white truncate" title={data.hostname}>
                        {data.hostname}
                    </span>
                </div>
                <TierBadge tier={data.tier} size="sm" />
            </div>

            {/* Body: IP & Hardware */}
            <div className="mt-2 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                    <span>IP:</span>
                    <span className="text-cyan-300 font-semibold">{data.ip || '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                    <span>Model:</span>
                    <span className="text-slate-300 truncate max-w-[120px]" title={data.model || ''}>
                        {data.vendor || ''} {data.model || 'Switch'}
                    </span>
                </div>
            </div>

            {/* Footer: Ports up/down indicator */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">
                    Ports: <span className="text-emerald-400 font-bold">{data.port_up_count} UP</span>
                </span>
                {data.port_down_count > 0 ? (
                    <span className="text-rose-400 font-bold">{data.port_down_count} DOWN</span>
                ) : (
                    <span className="text-slate-500">0 Down</span>
                )}
            </div>
        </div>
    );
}

export default memo(DeviceNode);
