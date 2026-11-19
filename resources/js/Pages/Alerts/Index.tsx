import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Alert, AlertSummary, Notification } from '@/types/models';
import { useEffect, useRef, useState } from 'react';

interface Props {
    alerts: Alert[];
    summary: AlertSummary;
    librenmsConnected: boolean;
    notifications?: Notification[];
}

const severityStyles: Record<string, string> = {
    critical: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    ok: 'border-green-200 bg-green-50 text-green-700',
};

const severityDots: Record<string, string> = {
    critical: 'bg-red-500 animate-dot-blink',
    warning: 'bg-amber-500',
    ok: 'bg-green-500',
};

function formatTime(ts?: string | null): string {
    if (!ts) return '-';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function AlertsIndex({ alerts: initialAlerts, summary: initialSummary, librenmsConnected, notifications: initialNotifications }: Props) {
    const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
    const [summary, setSummary] = useState<AlertSummary>(initialSummary);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications ?? []);
    const [filter, setFilter] = useState<'active' | 'all'>('active');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const refresh = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        setIsRefreshing(true);
        try {
            const res = await fetch(route('alerts.data'), { signal: controller.signal });
            if (res.ok) {
                const payload = await res.json();
                setAlerts(payload.alerts ?? []);
                setSummary(payload.summary ?? { active: 0, critical: 0, warning: 0 });
                setNotifications(payload.notifications ?? []);
                setLastUpdated(new Date().toISOString());
            }
        } catch {
            // Transient failure — the next tick will retry.
        } finally {
            clearTimeout(timeoutId);
            setIsRefreshing(false);
        }
    };

    // Auto-refresh every 60 seconds
    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;
    useEffect(() => {
        const interval = setInterval(() => refreshRef.current(), 60000);
        return () => clearInterval(interval);
    }, []);

    const visible = filter === 'active' ? alerts.filter((a) => a.is_active) : alerts;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold tracking-tight text-navy-900">ALERT JARINGAN</h1>
                            {summary.active > 0 && (
                                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-red-600">
                                    {summary.active} AKTIF
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">
                            Peringatan dari mesin alert LibreNMS — device down, port down, dan rule kustom
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline font-mono text-[11px] text-gray-400">
                            {isRefreshing ? 'Memperbarui…' : lastUpdated ? `Diperbarui ${formatTime(lastUpdated)}` : 'Auto-refresh 60 dtk'}
                        </span>
                        <div className="flex rounded-xl border border-gray-200 bg-white p-0.5">
                            <button
                                type="button"
                                onClick={() => setFilter('active')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${filter === 'active' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-navy-900'}`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter('all')}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-navy-900'}`}
                            >
                                Semua
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Alert Jaringan" />

            {!librenmsConnected && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="alert">
                    LibreNMS belum dikonfigurasi. Hubungi admin untuk mengatur koneksi API di halaman Pengaturan.
                </div>
            )}

            {/* Summary chips */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className={`pv-card p-4 ${summary.active > 0 ? 'border-red-100' : ''}`}>
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-500">Alert Aktif</div>
                    <div className={`mt-1 text-2xl font-black ${summary.active > 0 ? 'text-red-500' : 'text-green-600'}`}>{summary.active}</div>
                </div>
                <div className="pv-card p-4">
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-500">Critical</div>
                    <div className="mt-1 text-2xl font-black text-red-500">{summary.critical}</div>
                </div>
                <div className="pv-card p-4">
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-gray-500">Warning</div>
                    <div className="mt-1 text-2xl font-black text-amber-500">{summary.warning}</div>
                </div>
            </div>

            {/* Notifikasi Lokal (Port/Device Up/Down) */}
            <div className="mb-6 pv-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold tracking-wide text-navy-900 uppercase">
                        Notifikasi Lokal
                    </h3>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {notifications.filter((n) => !n.is_read).length} Belum Dibaca
                    </span>
                </div>

                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-500 font-sans">
                        Belum ada notifikasi perubahan status port atau perangkat.
                    </div>
                ) : (
                    <div className="space-y-2 font-mono text-xs">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`flex items-center gap-3 rounded-xl border border-gray-100 p-3 ${n.is_read ? 'bg-white' : 'bg-blue-50/50 border-blue-100'}`}
                            >
                                <span className={`h-2 w-2 rounded-full ${n.type === 'port_down' || n.type === 'device_down' ? 'bg-red-500' : 'bg-green-500'}`} aria-hidden="true" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-navy-900 leading-tight">{n.message}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-gray-400 text-[11px]">{new Date(n.created_at).toLocaleString('id-ID')}</span>
                                        {n.device_id && (
                                            <a
                                                href={route('devices.show', n.device_id)}
                                                className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                                            >
                                                Lihat perangkat →
                                            </a>
                                        )}
                                        {!n.is_read && (
                                            <button
                                                onClick={() => {
                                                    fetch(route('notifications.read', n.id), { method: 'PATCH' }).then(() => {
                                                        setNotifications(notifications.map((item) =>
                                                            item.id === n.id ? { ...item, is_read: true } : item
                                                        ));
                                                    });
                                                }}
                                                className="text-xs font-medium text-primary-600 hover:text-primary-800"
                                            >
                                                Tandai dibaca
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Alert list */}
            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
                    <svg className="mx-auto mb-4 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">
                        {filter === 'active'
                            ? 'Tidak ada alert aktif. Semua sistem normal.'
                            : 'Belum ada alert yang tercatat.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map((alert) => (
                        <div
                            key={alert.id}
                            className={`pv-card flex flex-wrap items-start gap-x-4 gap-y-2 p-4 ${alert.is_active && alert.severity === 'critical' ? 'border-red-100' : ''}`}
                        >
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${severityStyles[alert.severity] ?? severityStyles.warning}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${severityDots[alert.severity] ?? severityDots.warning}`} aria-hidden="true" />
                                {alert.severity}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-navy-900">{alert.hostname}</span>
                                    <span className="text-sm text-gray-500">— {alert.rule}</span>
                                    {!alert.is_active && (
                                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">resolved</span>
                                    )}
                                </div>
                                {alert.info && (
                                    <p className="mt-1 line-clamp-2 font-mono text-xs text-gray-500">{alert.info}</p>
                                )}
                                <div className="mt-1.5 flex items-center gap-3 text-xs">
                                    <span className="text-gray-400">{formatTime(alert.timestamp)}</span>
                                    {alert.device_id && (
                                        <a href={route('devices.show', alert.device_id)} className="font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                                            Lihat perangkat →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
