import React, { useState } from 'react';
import { Port } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import StatusBadge from './StatusBadge';

interface Props {
    ports: Port[];
    deviceId: number;
    canEdit?: boolean;
}

export default function SwitchVisualizer({ ports, deviceId, canEdit = false }: Props) {
    const [selectedPort, setSelectedPort] = useState<Port | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const pageUser = usePage().props.auth.user;
    const isAdmin = canEdit || pageUser?.role === 'admin';

    // Separate physical ethernet ports and other ports
    const physicalPorts = ports.filter((p) => p.is_physical);
    const otherPorts = ports.filter((p) => !p.is_physical);

    // Group physical ports into pairs (odd row 1, even row 2)
    const row1: Port[] = [];
    const row2: Port[] = [];

    physicalPorts.forEach((p, idx) => {
        if (idx % 2 === 0) {
            row1.push(p);
        } else {
            row2.push(p);
        }
    });

    const toggleCritical = async (port: Port) => {
        if (!isAdmin) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/ports/${port.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    is_critical: !port.is_critical,
                    if_alias: port.if_alias,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (selectedPort?.id === port.id) {
                    setSelectedPort(data.port);
                }
                router.reload({ only: ['device'] });
            }
        } catch (err) {
            console.error('Failed to toggle critical status', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const getLedClass = (port: Port) => {
        if (port.admin_status === 'down') {
            return 'bg-slate-700 border-slate-600';
        }
        if (port.oper_status === 'up') {
            return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]';
        }
        if (port.oper_status === 'down') {
            return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-ping';
        }
        return 'bg-amber-400';
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl backdrop-blur-md">
            {/* Switch Chassis Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <div>
                        <h4 className="text-sm font-semibold tracking-wide text-slate-200">
                            PHYSICAL PORT MATRIX
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                            {physicalPorts.length} Ports Configured • Dual-Row Stacking View
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span>Link UP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        <span>Link DOWN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-slate-700" />
                        <span>Admin Down</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-amber-400">★</span>
                        <span>Critical Monitor</span>
                    </div>
                </div>
            </div>

            {/* Switch Faceplate */}
            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-800 bg-[#070b12] p-4 shadow-inner">
                {physicalPorts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                        No physical Ethernet interfaces detected on this device.
                    </div>
                ) : (
                    <div className="min-w-max">
                        {/* Row 1 (Odd ports) */}
                        <div className="flex gap-2 mb-3">
                            {row1.map((port, index) => {
                                const isSelected = selectedPort?.id === port.id;
                                return (
                                    <button
                                        key={port.id}
                                        type="button"
                                        onClick={() => setSelectedPort(port)}
                                        className={`group relative flex h-20 w-14 flex-col items-center justify-between rounded-md border p-1.5 transition-all ${
                                            isSelected
                                                ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                                                : port.oper_status === 'down' && port.admin_status !== 'down'
                                                ? 'border-rose-800/80 bg-rose-950/20 hover:border-rose-500'
                                                : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800/80'
                                        }`}
                                    >
                                        {/* Port LED & Critical Star */}
                                        <div className="flex w-full items-center justify-between px-0.5">
                                            <span
                                                className={`h-2 w-2 rounded-full border border-black/50 ${getLedClass(
                                                    port
                                                )}`}
                                            />
                                            {port.is_critical && (
                                                <span className="text-[10px] text-amber-400 leading-none">
                                                    ★
                                                </span>
                                            )}
                                        </div>

                                        {/* Port Connector Shape */}
                                        <div className="h-7 w-8 rounded-sm border border-slate-700 bg-slate-950 flex items-center justify-center">
                                            <div className="h-3 w-5 border-t border-slate-600 bg-slate-900 rounded-b-sm" />
                                        </div>

                                        {/* Port Label */}
                                        <span className="text-[10px] font-mono font-medium text-slate-300 truncate max-w-full">
                                            {port.if_name.replace(/^(FastEthernet|GigabitEthernet|TenGigabitEthernet|Ethernet)/i, (m) => m[0])}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Row 2 (Even ports) */}
                        <div className="flex gap-2">
                            {row2.map((port, index) => {
                                const isSelected = selectedPort?.id === port.id;
                                return (
                                    <button
                                        key={port.id}
                                        type="button"
                                        onClick={() => setSelectedPort(port)}
                                        className={`group relative flex h-20 w-14 flex-col items-center justify-between rounded-md border p-1.5 transition-all ${
                                            isSelected
                                                ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                                                : port.oper_status === 'down' && port.admin_status !== 'down'
                                                ? 'border-rose-800/80 bg-rose-950/20 hover:border-rose-500'
                                                : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800/80'
                                        }`}
                                    >
                                        {/* Port LED & Critical Star */}
                                        <div className="flex w-full items-center justify-between px-0.5">
                                            <span
                                                className={`h-2 w-2 rounded-full border border-black/50 ${getLedClass(
                                                    port
                                                )}`}
                                            />
                                            {port.is_critical && (
                                                <span className="text-[10px] text-amber-400 leading-none">
                                                    ★
                                                </span>
                                            )}
                                        </div>

                                        {/* Port Connector Shape */}
                                        <div className="h-7 w-8 rounded-sm border border-slate-700 bg-slate-950 flex items-center justify-center">
                                            <div className="h-3 w-5 border-t border-slate-600 bg-slate-900 rounded-b-sm" />
                                        </div>

                                        {/* Port Label */}
                                        <span className="text-[10px] font-mono font-medium text-slate-300 truncate max-w-full">
                                            {port.if_name.replace(/^(FastEthernet|GigabitEthernet|TenGigabitEthernet|Ethernet)/i, (m) => m[0])}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Port Inspector Details Modal / Bar */}
            {selectedPort && (
                <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                            <h5 className="text-base font-bold text-white font-mono">
                                {selectedPort.if_name}
                            </h5>
                            <StatusBadge status={selectedPort.oper_status} size="sm" />
                            {selectedPort.admin_status === 'down' && (
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                                    Admin Down
                                </span>
                            )}
                            {selectedPort.is_critical && (
                                <span className="rounded bg-amber-950/80 border border-amber-800 text-amber-300 px-2 py-0.5 text-xs font-semibold">
                                    ★ Critical Interface
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => toggleCritical(selectedPort)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                        selectedPort.is_critical
                                            ? 'bg-amber-600 text-white hover:bg-amber-500'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                                    }`}
                                >
                                    {selectedPort.is_critical ? 'Remove Critical' : 'Mark as Critical'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedPort(null)}
                                className="rounded p-1 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                        <div>
                            <span className="text-slate-500 block">Alias / Description</span>
                            <span className="text-slate-200 font-semibold truncate block mt-0.5">
                                {selectedPort.if_alias || selectedPort.if_descr || '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Link Speed</span>
                            <span className="text-slate-200 font-semibold block mt-0.5">
                                {selectedPort.speed_human || (selectedPort.if_speed ? `${selectedPort.if_speed} bps` : '—')}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Interface Type</span>
                            <span className="text-slate-200 font-semibold block mt-0.5">
                                {selectedPort.if_type || '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Status Changed</span>
                            <span className="text-slate-200 font-semibold block mt-0.5">
                                {selectedPort.status_changed_at
                                    ? new Date(selectedPort.status_changed_at).toLocaleString()
                                    : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
