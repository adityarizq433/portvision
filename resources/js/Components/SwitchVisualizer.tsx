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
    const [updateError, setUpdateError] = useState<string | null>(null);
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
        setUpdateError(null);
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
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            setUpdateError('Gagal mengubah status kritis. Silakan coba lagi.');
        } finally {
            setIsUpdating(false);
        }
    };

    const getLedClass = (port: Port) => {
        if (port.admin_status === 'down') {
            return 'bg-gray-300 border-gray-400';
        }
        if (port.oper_status === 'up') {
            return 'bg-emerald-500';
        }
        if (port.oper_status === 'down') {
            return 'bg-rose-500 animate-pulse';
        }
        return 'bg-amber-400';
    };

    return (
        <div className="pv-card p-6">
            {/* Switch Chassis Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <div>
                        <h4 className="text-sm font-bold tracking-wide text-navy-900 uppercase">
                            Matriks Port Fisik
                        </h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {physicalPorts.length} Port Terkonfigurasi • Tampilan Rak Ganda
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-600">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        <span className="font-semibold text-gray-700">Link UP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                        <span className="font-semibold text-gray-700">Link DOWN</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-500" aria-hidden="true" />
                        <span className="font-semibold text-gray-700">Admin Down</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold" aria-hidden="true">★</span>
                        <span className="font-semibold text-gray-700">Monitor Kritis</span>
                    </div>
                </div>
            </div>

            {updateError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700" role="alert">{updateError}</div>
            )}

            {/* Switch Faceplate: flat silver, no decorative gradient (R-01) */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-100 p-4 shadow-inner">
                {physicalPorts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500 font-sans">
                        Tidak ada antarmuka Ethernet fisik yang terdeteksi pada perangkat ini.
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2.5">
                        {/* Row 1 (Odd ports) */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {row1.map((port) => {
                                const isSelected = selectedPort?.id === port.id;
                                return (
                                    <button
                                        key={port.id}
                                        type="button"
                                        onClick={() => setSelectedPort(port)}
                                        className={`group relative flex min-h-[84px] w-[72px] flex-col items-center justify-between rounded-lg border p-1.5 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none ${
                                            isSelected
                                                ? 'border-primary-500 bg-white ring-2 ring-primary-400/40 shadow-md'
                                                : port.oper_status === 'down' && port.admin_status !== 'down'
                                                ? 'border-rose-300 bg-rose-50/70 hover:border-rose-400'
                                                : 'border-gray-300 bg-white hover:border-primary-300 hover:shadow-md'
                                        }`}
                                        aria-label={`Port ${port.if_name}, status ${port.oper_status}${port.is_critical ? ', kritis' : ''}`}
                                        title={port.if_name}
                                    >
                                        {/* Port LED & Critical Star */}
                                        <div className="flex w-full items-center justify-between px-0.5">
                                            <span
                                                className={`h-2 w-2 rounded-full border border-black/10 ${getLedClass(
                                                    port
                                                )}`}
                                            />
                                            {port.is_critical && (
                                                <span className="text-[10px] text-amber-500 leading-none" aria-label="Antarmuka kritis">
                                                    ★
                                                </span>
                                            )}
                                        </div>

                                        {/* Port Connector Shape */}
                                        <div className="h-7 w-8 rounded-sm border border-gray-400 bg-gray-800 flex items-center justify-center shadow-inner" aria-hidden="true">
                                            <div className="h-3 w-5 border-t border-gray-500 bg-gray-900 rounded-b-sm" />
                                        </div>

                                        {/* Port Label: full text centred, no truncation */}
                                        <span className="text-center font-mono text-[9px] font-bold leading-tight text-navy-900 break-words">
                                            {port.if_name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Row 2 (Even ports) */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {row2.map((port) => {
                                const isSelected = selectedPort?.id === port.id;
                                return (
                                    <button
                                        key={port.id}
                                        type="button"
                                        onClick={() => setSelectedPort(port)}
                                        className={`group relative flex min-h-[84px] w-[72px] flex-col items-center justify-between rounded-lg border p-1.5 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none ${
                                            isSelected
                                                ? 'border-primary-500 bg-white ring-2 ring-primary-400/40 shadow-md'
                                                : port.oper_status === 'down' && port.admin_status !== 'down'
                                                ? 'border-rose-300 bg-rose-50/70 hover:border-rose-400'
                                                : 'border-gray-300 bg-white hover:border-primary-300 hover:shadow-md'
                                        }`}
                                        aria-label={`Port ${port.if_name}, status ${port.oper_status}`}
                                        title={port.if_name}
                                    >
                                        {/* Port LED & Critical Star */}
                                        <div className="flex w-full items-center justify-between px-0.5">
                                            <span
                                                className={`h-2 w-2 rounded-full border border-black/10 ${getLedClass(
                                                    port
                                                )}`}
                                            />
                                            {port.is_critical && (
                                                <span className="text-[10px] text-amber-500 leading-none" aria-label="Antarmuka kritis">
                                                    ★
                                                </span>
                                            )}
                                        </div>

                                        {/* Port Connector Shape */}
                                        <div className="h-7 w-8 rounded-sm border border-gray-400 bg-gray-800 flex items-center justify-center shadow-inner" aria-hidden="true">
                                            <div className="h-3 w-5 border-t border-gray-500 bg-gray-900 rounded-b-sm" />
                                        </div>

                                        {/* Port Label: full text centred, no truncation */}
                                        <span className="text-center font-mono text-[9px] font-bold leading-tight text-navy-900 break-words">
                                            {port.if_name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {otherPorts.length > 0 && (
                            <p className="mt-3 font-mono text-[11px] text-gray-500">
                                {otherPorts.length} antarmuka non-fisik (VLAN/loopback) tidak ditampilkan di matriks. Lihat tabel di bawah untuk detail lengkap.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Port Inspector Details Modal / Bar */}
            {selectedPort && (
                <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50/60 p-5 shadow-sm transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary-200/70 pb-3">
                        <div className="flex items-center gap-3">
                            <h5 className="text-base font-bold text-navy-900 font-mono">
                                {selectedPort.if_name}
                            </h5>
                            <StatusBadge status={selectedPort.oper_status} size="sm" />
                            {selectedPort.admin_status === 'down' && (
                                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                    Admin Down
                                </span>
                            )}
                            {selectedPort.is_critical && (
                                <span className="rounded-full bg-amber-100 border border-amber-300 text-amber-800 px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
                                    ★ Antarmuka Kritis
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => toggleCritical(selectedPort)}
                                    className={`pv-btn text-xs py-1.5 ${
                                        selectedPort.is_critical
                                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                                            : 'pv-btn--primary'
                                    }`}
                                >
                                    {isUpdating ? 'Menyimpan…' : (selectedPort.is_critical ? 'Hapus Status Kritis' : 'Tandai sebagai Kritis')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedPort(null)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-700 transition focus-visible:ring-2 focus-visible:ring-primary-400"
                                aria-label="Tutup inspektur port"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                        <div>
                            <dt className="text-gray-500 block uppercase tracking-wider text-[11px]">Alias / Deskripsi</dt>
                            <dd className="text-navy-900 font-bold truncate block mt-0.5">
                                {selectedPort.if_alias || selectedPort.if_descr || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500 block uppercase tracking-wider text-[11px]">Kecepatan Link</dt>
                            <dd className="text-navy-900 font-bold block mt-0.5">
                                {selectedPort.speed_human || (selectedPort.if_speed ? `${selectedPort.if_speed} bps` : '—')}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500 block uppercase tracking-wider text-[11px]">Tipe Antarmuka</dt>
                            <dd className="text-navy-900 font-bold block mt-0.5">
                                {selectedPort.if_type || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500 block uppercase tracking-wider text-[11px]">Perubahan Status</dt>
                            <dd className="text-navy-900 font-semibold block mt-0.5">
                                {selectedPort.status_changed_at
                                    ? new Date(selectedPort.status_changed_at).toLocaleString('id-ID')
                                    : '—'}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </div>
    );
}
