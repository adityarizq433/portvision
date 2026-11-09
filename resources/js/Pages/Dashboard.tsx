import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DashboardStats } from '@/types/models';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';

// ── mini components ───────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
    const up = status?.toLowerCase() === 'up';
    const down = status?.toLowerCase() === 'down';
    return (
        <span className={`pv-pill ${up ? 'pv-pill--up' : down ? 'pv-pill--down' : 'pv-pill--warn'}`}>
            <span className="pv-pill-dot" aria-hidden="true" />
            {status?.toUpperCase() ?? '—'}
        </span>
    );
}

function TierLabel({ tier }: { tier: string }) {
    const map: Record<string, { cls: string; name: string }> = {
        core:         { cls: 'pv-tier--core', name: 'Core' },
        distribution: { cls: 'pv-tier--distribution', name: 'Distribusi' },
        access:       { cls: 'pv-tier--access', name: 'Akses' },
        unknown:      { cls: 'pv-tier--unknown', name: 'Belum Ditetapkan' },
    };
    const current = map[tier?.toLowerCase()] ?? map.unknown;
    return (
        <span className={`pv-tier ${current.cls}`}>
            {current.name}
        </span>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    accent: 'green' | 'blue' | 'red' | 'amber' | 'purple';
    alert?: boolean;
    icon: React.ReactNode;
}

function StatCard({ title, value, subtitle, accent, alert, icon }: StatCardProps) {
    const accentClass = `pv-stat-card--${accent}`;
    return (
        <div className={`pv-stat-card ${accentClass} relative overflow-hidden`}>
            {alert && (
                <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Peringatan
                </span>
            )}
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</span>
                <span className="text-gray-500">{icon}</span>
            </div>
            <div className="font-mono text-3xl font-black tracking-tight text-navy-900 leading-none">
                {value}
            </div>
            <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────

export default function Dashboard(props: DashboardStats) {
    const {
        deviceStats: initialDeviceStats,
        portStats: initialPortStats,
        tierStats,
        locations,
        recentEvents: initialRecentEvents,
        systemStatus,
    } = props;
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deviceStats, setDeviceStats] = useState(initialDeviceStats);
    const [portStats, setPortStats] = useState(initialPortStats);
    const [recentEvents, setRecentEvents] = useState(initialRecentEvents);
    const [lastPollAt, setLastPollAt] = useState(systemStatus?.last_port_poll_at);
    const [pollError, setPollError] = useState<string | null>(null);

    useEffect(() => {
        setDeviceStats(initialDeviceStats);
        setPortStats(initialPortStats);
        setRecentEvents(initialRecentEvents);
        setLastPollAt(systemStatus?.last_port_poll_at);
    }, [initialDeviceStats, initialPortStats, initialRecentEvents, systemStatus?.last_port_poll_at]);

    // Live 5-second polling
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(route('dashboard.live'));
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data.deviceStats)       setDeviceStats(data.deviceStats);
                if (data.portStats)         setPortStats(data.portStats);
                if (data.recentEvents)      setRecentEvents(data.recentEvents);
                if (data.last_port_poll_at) setLastPollAt(data.last_port_poll_at);
                setPollError(null);
            } catch {
                setPollError('Gagal memperbarui telemetri live. Data terakhir ditampilkan.');
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const triggerSyncDevices = () => {
        setIsRefreshing(true);
        router.post(route('devices.sync'), {}, {
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const totalTier = (tierStats.core ?? 0) + (tierStats.distribution ?? 0) + (tierStats.access ?? 0) + (tierStats.unknown ?? 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold tracking-tight text-navy-900">
                                PUSAT OPERASI JARINGAN (NOC)
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-dot-blink" aria-hidden="true" />
                                TELEMETRI LANGSUNG
                            </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">
                            Pembaruan otomatis tiap 5 dtk • Polling terakhir:{' '}
                            <span className="text-gray-700 font-medium">
                                {lastPollAt ? new Date(lastPollAt).toLocaleTimeString('id-ID') : 'Belum pernah'}
                            </span>
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={triggerSyncDevices}
                                disabled={isRefreshing}
                                className="pv-btn pv-btn--secondary text-xs"
                            >
                                <svg className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {isRefreshing ? 'Menyinkronkan…' : 'Sinkronisasi Perangkat'}
                            </button>

                            <Link href={route('topology.index')} className="pv-btn pv-btn--topology text-xs">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Buka Peta Topologi
                            </Link>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard NOC" />
            {pollError && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800" role="alert">{pollError}</div>
            )}

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Perangkat Aktif"
                    value={deviceStats.total}
                    subtitle={`${deviceStats.up} Online • ${deviceStats.down} Offline`}
                    accent={deviceStats.down > 0 ? 'red' : 'green'}
                    alert={deviceStats.down > 0}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                    }
                />

                <StatCard
                    title="Port Fisik"
                    value={portStats.total}
                    subtitle={`${portStats.up} Aktif (UP) • ${portStats.down} Mati (DOWN)`}
                    accent={portStats.down > 0 ? 'amber' : 'blue'}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Alarm Kritis"
                    value={portStats.critical_down}
                    subtitle={portStats.critical_down > 0 ? 'Gangguan uplink kritis terdeteksi!' : 'Semua uplink kritis normal'}
                    accent={portStats.critical_down > 0 ? 'red' : 'green'}
                    alert={portStats.critical_down > 0}
                    icon={
                        <svg className={`h-5 w-5 ${portStats.critical_down > 0 ? 'animate-dot-blink text-red-600' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Status LibreNMS"
                    value={systemStatus.librenms_connected ? 'Terhubung' : 'Terputus'}
                    subtitle={`Interval Polling: ${systemStatus.port_poll_interval} dtk`}
                    accent={systemStatus.librenms_connected ? 'purple' : 'red'}
                    icon={
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />
            </div>

            {/* ── Hierarchy + Locations ── */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Hierarchy Distribution */}
                <div className="pv-card">
                    <div className="pv-card-header">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Distribusi Hierarki</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">TIER</span>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { key: 'core',         label: 'Core',             count: tierStats.core,         barColor: 'bg-purple-500',  textColor: 'text-purple-700' },
                            { key: 'distribution', label: 'Distribusi',       count: tierStats.distribution,  barColor: 'bg-blue-500',    textColor: 'text-blue-700' },
                            { key: 'access',       label: 'Akses',            count: tierStats.access,        barColor: 'bg-teal-500',    textColor: 'text-teal-700' },
                            { key: 'unknown',      label: 'Belum Ditetapkan', count: tierStats.unknown,       barColor: 'bg-gray-400',    textColor: 'text-gray-600' },
                        ].map((tier) => (
                            <div key={tier.key}>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TierLabel tier={tier.key} />
                                    </div>
                                    <span className={`font-mono text-sm font-bold ${tier.textColor}`}>{tier.count}</span>
                                </div>
                                <div className="pv-progress">
                                    <div
                                        className={`pv-progress-fill ${tier.barColor}`}
                                        style={{ width: `${totalTier > 0 ? (tier.count / totalTier) * 100 : 0}%` }}
                                        role="progressbar"
                                        aria-valuenow={tier.count}
                                        aria-valuemax={totalTier}
                                        aria-label={`${tier.label}: ${tier.count} perangkat`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 px-5 py-3">
                        <Link
                            href={route('devices.index')}
                            className="flex items-center justify-between text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                        >
                            <span>Lihat inventaris perangkat lengkap</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>

                {/* Site Locations Health */}
                <div className="pv-card lg:col-span-2">
                    <div className="pv-card-header">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Kesehatan Wilayah &amp; Area</span>
                        <Link
                            href={route('locations.index')}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                        >
                            Kelola Wilayah →
                        </Link>
                    </div>
                    <div className="p-5">
                        {locations.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                                <svg className="mx-auto mb-3 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <p className="text-xs text-gray-500">
                                    Belum ada wilayah terdaftar.<br />Sinkronkan perangkat dari LibreNMS untuk menambahkan wilayah otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
                                {locations.map((loc) => {
                                    const total = loc.devices_count || 0;
                                    const up    = loc.devices_up_count || 0;
                                    const down  = loc.devices_down_count || 0;
                                    const pct   = total > 0 ? Math.round((up / total) * 100) : 0;
                                    const healthy = down === 0;

                                    return (
                                        <Link
                                            key={loc.id}
                                            href={route('devices.index', { location_id: loc.id })}
                                            className={`group rounded-xl border p-4 transition-all hover:shadow-md ${healthy ? 'border-green-100 bg-green-50/50 hover:border-green-200' : 'border-red-100 bg-red-50/40 hover:border-red-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-navy-900 group-hover:text-primary-600 transition-colors truncate max-w-[140px]">
                                                    {loc.name}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-gray-500">
                                                    {up}/{total} Up
                                                </span>
                                            </div>
                                            <div className="mt-2.5 pv-progress">
                                                <div
                                                    className="pv-progress-fill bg-green-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                                                <span className="text-green-600 font-semibold">{up} online</span>
                                                {down > 0 && <span className="text-red-500 font-semibold">{down} offline</span>}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent Port Events ── */}
            <div className="mt-6 pv-card">
                <div className="pv-card-header">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary-500 animate-dot-blink" aria-hidden="true" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Riwayat Status Port Terkini</span>
                    </div>
                    <span className="font-mono text-[11px] text-gray-500">Event Real-Time LibreNMS</span>
                </div>

                <div className="overflow-x-auto">
                    {recentEvents.length === 0 ? (
                        <div className="py-12 text-center text-xs text-gray-500">
                            Belum ada catatan perubahan status port. Polling otomatis akan memantau setiap transisi.
                        </div>
                    ) : (
                        <table className="pv-table" aria-label="Riwayat status port terkini">
                            <thead>
                                <tr>
                                    <th scope="col">Perangkat</th>
                                    <th scope="col">Antarmuka</th>
                                    <th scope="col">Status Awal</th>
                                    <th scope="col">Status Akhir</th>
                                    <th scope="col">Waktu Kejadian</th>
                                    <th scope="col" className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            {event.device ? (
                                                <Link
                                                    href={route('devices.show', event.device.id)}
                                                    className="font-mono text-xs font-semibold text-navy-900 hover:text-primary-600 transition-colors"
                                                >
                                                    {event.device.hostname}
                                                </Link>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span className="font-mono text-xs font-bold text-navy-900">
                                                {event.port?.if_name || 'Port'}
                                            </span>
                                            {event.port?.if_alias && (
                                                <span className="ml-1.5 font-mono text-xs text-gray-500 truncate">
                                                    ({event.port.if_alias})
                                                </span>
                                            )}
                                            {event.port?.is_critical && (
                                                <span className="ml-1.5 text-amber-500 font-bold" title="Antarmuka Kritis" aria-label="Antarmuka kritis">★</span>
                                            )}
                                        </td>
                                        <td>
                                            <StatusPill status={event.from_status} />
                                        </td>
                                        <td>
                                            <StatusPill status={event.to_status} />
                                        </td>
                                        <td className="font-mono text-xs text-gray-500">
                                            {new Date(event.occurred_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-right">
                                            {event.device && (
                                                <Link
                                                    href={route('devices.show', event.device.id)}
                                                    className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap"
                                                >
                                                    Periksa Switch →
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
