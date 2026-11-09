import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import TierBadge from '@/Components/TierBadge';
import SwitchVisualizer from '@/Components/SwitchVisualizer';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Device, Location, Port } from '@/types/models';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';

interface Props {
    device: Device;
    livePorts: any[] | null;
    allLocations: Location[];
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-gray-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition';

export default function DeviceShow({ device, livePorts, allLocations }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    // Editable state
    const [tier, setTier] = useState(device.tier);
    const [locationId, setLocationId] = useState(device.location_id || '');
    const [isSaving, setIsSaving] = useState(false);
    const [filterPortText, setFilterPortText] = useState('');

    // Active ports (can be overridden by live polling)
    const [ports, setPorts] = useState<Port[]>(device.ports || []);
    const [pollError, setPollError] = useState<string | null>(null);

    // Periodic live polling of Redis port cache
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/devices/${device.id}/ports/live`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setPollError(null);
                if (res.ok) {
                    const data = await res.json();
                    if (data.ports && Array.isArray(data.ports)) {
                        setPorts((prevPorts) =>
                            prevPorts.map((p) => {
                                const found = data.ports.find((lp: any) => lp.port_id === p.id || lp.lnms_port_id === p.librenms_port_id);
                                if (found) {
                                    return {
                                        ...p,
                                        oper_status: found.oper_status,
                                        admin_status: found.admin_status,
                                        is_critical: found.is_critical,
                                    };
                                }
                                return p;
                            })
                        );
                    }
                }
            } catch (err) {
                setPollError('Data port live tidak dapat diperbarui. Menampilkan data terakhir yang tersimpan.');
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [device.id]);

    const handleSaveMetadata = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        router.patch(
            route('devices.update', device.id),
            {
                tier,
                location_id: locationId || null,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            }
        );
    };

    const filteredPorts = ports.filter((p) => {
        if (!filterPortText) return true;
        const q = filterPortText.toLowerCase();
        return (
            p.if_name.toLowerCase().includes(q) ||
            (p.if_alias && p.if_alias.toLowerCase().includes(q)) ||
            (p.if_descr && p.if_descr.toLowerCase().includes(q))
        );
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('devices.index')}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-navy-900 transition-colors shadow-sm"
                            title="Kembali ke inventaris"
                            aria-label="Kembali ke inventaris"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-lg font-bold tracking-tight text-navy-900 font-mono">
                                    {device.hostname}
                                </h1>
                                <StatusBadge status={device.status} size="sm" />
                                <TierBadge tier={device.tier} size="sm" />
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500 font-mono">
                                IP: <span className="text-primary-600 font-bold">{device.ip || '—'}</span> •
                                Wilayah:{' '}
                                <span className="text-gray-700 font-medium">
                                    {device.location?.name || device.location_string || 'Belum Ditetapkan'}
                                </span>{' '}
                                • Perangkat Keras: <span className="text-gray-700">{device.hardware || device.model || '—'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('topology.index', { location_id: device.location_id })}
                            className="pv-btn pv-btn--topology text-xs"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Lihat di Peta Topologi
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${device.hostname} - Detail Switch`} />
            {pollError && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800" role="alert">{pollError}</div>
            )}

            {/* Hardware & Admin Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Switch Hardware Details */}
                <div className="pv-card lg:col-span-2 p-5">
                    <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono border-b border-gray-100 pb-2.5">
                        Spesifikasi Perangkat Keras &amp; Profil SNMP
                    </h3>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Vendor</span>
                            <span className="text-navy-900 font-bold block mt-0.5">{device.vendor || '—'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Sistem Operasi</span>
                            <span className="text-navy-900 font-semibold block mt-0.5">
                                {device.os ? `${device.os} ${device.os_version || ''}` : '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Nomor Seri</span>
                            <span className="text-navy-900 font-semibold block mt-0.5">{device.serial || '—'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">ID LibreNMS</span>
                            <span className="text-primary-600 font-bold block mt-0.5">#{device.librenms_device_id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Port Fisik</span>
                            <span className="text-green-600 font-bold block mt-0.5">
                                {device.port_up_count} UP / {device.port_count} Total
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Port Mati</span>
                            <span className={`font-bold block mt-0.5 ${device.port_down_count > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                {device.port_down_count} Port
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Terakhir Dilihat</span>
                            <span className="text-gray-700 block mt-0.5">
                                {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString('id-ID') : '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-[11px] uppercase tracking-wider">Telemetri SNMP</span>
                            <span className="text-green-600 font-semibold block mt-0.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-dot-blink" />
                                Aktif
                            </span>
                        </div>
                    </div>
                </div>

                {/* Admin Assignment Panel */}
                <div className="pv-card p-5">
                    <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono border-b border-gray-100 pb-2.5">
                        Penetapan Hierarki &amp; Wilayah
                    </h3>

                    <form onSubmit={handleSaveMetadata} className="mt-4 space-y-3.5">
                        <div>
                            <label htmlFor="dev-tier" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                Tier Hierarki
                            </label>
                            <select
                                id="dev-tier"
                                value={tier}
                                disabled={!isAdmin}
                                onChange={(e) => setTier(e.target.value as any)}
                                className={inputCls}
                            >
                                <option value="core">Switch Core</option>
                                <option value="distribution">Switch Distribusi</option>
                                <option value="access">Switch Akses</option>
                                <option value="unknown">Belum Ditetapkan</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="dev-location" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                Wilayah &amp; Area
                            </label>
                            <select
                                id="dev-location"
                                value={locationId}
                                disabled={!isAdmin}
                                onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}
                                className={inputCls}
                            >
                                <option value="">Belum Ada Wilayah</option>
                                {allLocations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isAdmin && (
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="pv-btn pv-btn--primary w-full justify-center text-xs py-2 mt-2"
                            >
                                {isSaving ? 'Menyimpan…' : 'Perbarui Pengaturan Perangkat'}
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Interactive Physical Switch Visualizer */}
            <div className="mt-6">
                <SwitchVisualizer
                    ports={ports}
                    deviceId={device.id}
                    canEdit={isAdmin}
                />
            </div>

            {/* Ports Table & Search */}
            <div className="mt-6 pv-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                        <h3 className="text-sm font-bold tracking-wide text-navy-900 uppercase">
                            Semua Antarmuka Port ({ports.length})
                        </h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                            Ethernet Fisik, VLAN, dan Antarmuka Loopback
                        </p>
                    </div>

                    <div className="w-full sm:w-64">
                        <label htmlFor="port-search" className="sr-only">Cari port berdasarkan nama atau alias</label>
                        <input
                            id="port-search"
                            type="text"
                            placeholder="Cari nama atau alias port…"
                            value={filterPortText}
                            onChange={(e) => setFilterPortText(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="pv-table font-mono" aria-label="Tabel port antarmuka perangkat">
                        <thead>
                            <tr>
                                <th scope="col">Port</th>
                                <th scope="col">Alias / Deskripsi</th>
                                <th scope="col">Kecepatan</th>
                                <th scope="col">Tipe</th>
                                <th scope="col">Status Operasional</th>
                                <th scope="col">Status Admin</th>
                                <th scope="col" className="text-center">Kritis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPorts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-gray-500 font-sans">
                                        Tidak ada antarmuka yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filteredPorts.map((port) => (
                                    <tr key={port.id}>
                                        <td className="font-bold text-navy-900">
                                            {port.if_name}
                                        </td>
                                        <td className="text-gray-500 truncate max-w-[200px]">
                                            {port.if_alias || port.if_descr || '—'}
                                        </td>
                                        <td className="text-gray-700">
                                            {port.speed_human || (port.if_speed ? `${port.if_speed} bps` : '—')}
                                        </td>
                                        <td className="text-gray-500">
                                            {port.if_type || '—'}
                                        </td>
                                        <td>
                                            <StatusBadge status={port.oper_status} size="sm" />
                                        </td>
                                        <td className="text-gray-500 uppercase">
                                            {port.admin_status}
                                        </td>
                                        <td className="text-center">
                                            {port.is_critical ? (
                                                <span className="text-amber-500 font-bold" title="Antarmuka Kritis">
                                                    ★
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Port Events Timeline for this device */}
            <div className="mt-6 pv-card p-6">
                <h3 className="text-sm font-bold tracking-wide text-navy-900 uppercase border-b border-gray-100 pb-3">
                    Log Perubahan Status Terkini ({device.hostname})
                </h3>

                <div className="mt-4">
                    {!device.port_events || device.port_events.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-500 font-sans">
                            Belum ada catatan transisi status port untuk perangkat switch ini.
                        </div>
                    ) : (
                        <div className="space-y-2 font-mono text-xs">
                            {device.port_events.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-navy-900">
                                            {ev.port?.if_name || 'Port'}
                                        </span>
                                        {ev.port?.if_alias && (
                                            <span className="text-gray-500">({ev.port.if_alias})</span>
                                        )}
                                        <span className="text-gray-500">beralih dari</span>
                                        <span className="uppercase text-gray-600 font-semibold">{ev.from_status}</span>
                                        <span className="text-gray-500">ke</span>
                                        <StatusBadge status={ev.to_status} size="sm" />
                                    </div>
                                    <span className="text-gray-500 text-[11px]">
                                        {new Date(ev.occurred_at).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
