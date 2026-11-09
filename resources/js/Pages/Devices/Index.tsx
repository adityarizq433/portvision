import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Device, Location, Paginated } from '@/types/models';
import { PageProps } from '@/types';
import { useState } from 'react';

interface Props {
    devices: Paginated<Device>;
    locations: Location[];
    filters: { search: string; location_id: string; tier: string; status: string; };
}

function StatusPill({ status }: { status: string }) {
    const up = status?.toLowerCase() === 'up';
    return (
        <span className={`pv-pill ${up ? 'pv-pill--up' : 'pv-pill--down'}`}>
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
    return <span className={`pv-tier ${current.cls}`}>{current.name}</span>;
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-gray-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition';

const isIpAddress = (value?: string | null) =>
    !!value && /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());

export default function DevicesIndex({ devices, locations, filters }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [search, setSearch] = useState(filters.search || '');
    const [locationId, setLocationId] = useState(filters.location_id || '');
    const [tier, setTier] = useState(filters.tier || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleFilter = (newFilters: Partial<typeof filters>) => {
        router.get(route('devices.index'), {
            search: newFilters.search !== undefined ? newFilters.search : search,
            location_id: newFilters.location_id !== undefined ? newFilters.location_id : locationId,
            tier: newFilters.tier !== undefined ? newFilters.tier : tier,
            status: newFilters.status !== undefined ? newFilters.status : status,
        }, { preserveState: true, replace: true });
    };

    const triggerSync = () => {
        setIsSyncing(true);
        router.post(route('devices.sync'), {}, { preserveScroll: true, onFinish: () => setIsSyncing(false) });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold tracking-tight text-navy-900">INVENTARIS PERANGKAT JARINGAN</h1>
                            <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600">
                                {devices.total} Perangkat
                            </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">Switch, Router, dan Node Distribusi yang disinkronkan dari LibreNMS</p>
                    </div>
                    {isAdmin && (
                        <button type="button" onClick={triggerSync} disabled={isSyncing} className="pv-btn pv-btn--primary text-xs">
                            <svg className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isSyncing ? 'Menyinkronkan…' : 'Sinkronkan dari LibreNMS'}
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Inventaris Perangkat" />

            {/* Filter Bar */}
            <div className="pv-card mb-6 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label htmlFor="filter-search" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Cari Perangkat</label>
                        <input id="filter-search" type="text" placeholder="Hostname, IP, Vendor, Model…" value={search}
                            onChange={(e) => { setSearch(e.target.value); handleFilter({ search: e.target.value }); }}
                            className={inputCls} />
                    </div>
                    <div>
                        <label htmlFor="filter-location" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Wilayah &amp; Area</label>
                        <select id="filter-location" value={locationId} onChange={(e) => { setLocationId(e.target.value); handleFilter({ location_id: e.target.value }); }} className={inputCls}>
                            <option value="">Semua Wilayah</option>
                            {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-tier" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Tier Hierarki</label>
                        <select id="filter-tier" value={tier} onChange={(e) => { setTier(e.target.value); handleFilter({ tier: e.target.value }); }} className={inputCls}>
                            <option value="">Semua Tier</option>
                            <option value="core">Core</option>
                            <option value="distribution">Distribusi</option>
                            <option value="access">Akses</option>
                            <option value="unknown">Belum Ditetapkan</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-status" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Status Perangkat</label>
                        <select id="filter-status" value={status} onChange={(e) => { setStatus(e.target.value); handleFilter({ status: e.target.value }); }} className={inputCls}>
                            <option value="">Semua Status</option>
                            <option value="up">Online (UP)</option>
                            <option value="down">Offline (DOWN)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="pv-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="pv-table" aria-label="Inventaris perangkat jaringan">
                        <thead>
                            <tr>
                                <th scope="col">Perangkat</th>
                                <th scope="col">IP Manajemen</th>
                                <th scope="col">Wilayah &amp; Area</th>
                                <th scope="col">Tier</th>
                                <th scope="col">Status</th>
                                <th scope="col">Kesehatan Port</th>
                                <th scope="col" className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-sm text-gray-500">
                                        Tidak ada perangkat yang sesuai kriteria pencarian. Coba ubah filter atau lakukan sinkronisasi dari LibreNMS.
                                    </td>
                                </tr>
                            ) : devices.data.map((device) => {
                                const portTotal = device.port_count || 0;
                                const portUp    = device.port_up_count || 0;
                                const portDown  = device.port_down_count || 0;
                                const pct       = portTotal > 0 ? (portUp / portTotal) * 100 : 0;
                                const modelLabel = [device.vendor, device.hardware || device.model].filter(Boolean).join(' ') || 'Perangkat';
                                const hasRealHostname = !!device.hostname && !isIpAddress(device.hostname);

                                return (
                                    <tr key={device.id}>
                                        <td>
                                            <Link href={route('devices.show', device.id)} className="font-semibold text-navy-900 hover:text-primary-600 transition-colors">
                                                {hasRealHostname ? device.hostname : modelLabel}
                                            </Link>
                                            {hasRealHostname && (
                                                <div className="font-mono text-[11px] text-gray-500 mt-0.5">
                                                    {modelLabel}
                                                </div>
                                            )}
                                        </td>
                                        <td><span className="font-mono text-xs font-bold text-primary-600">{device.ip || '—'}</span></td>
                                        <td className="text-sm text-gray-600">{device.location?.name || device.location_string || 'Belum Ditetapkan'}</td>
                                        <td><TierLabel tier={device.tier} /></td>
                                        <td><StatusPill status={device.status} /></td>
                                        <td className="min-w-[180px] whitespace-nowrap">
                                            <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] gap-2">
                                                <span className="font-semibold text-gray-700">{portUp}/{portTotal} UP</span>
                                                {portDown > 0 && <span className="font-bold text-red-600">{portDown} Down</span>}
                                            </div>
                                            <div className="pv-progress">
                                                <div className="pv-progress-fill bg-green-500" style={{ width: `${pct}%` }}
                                                    role="progressbar" aria-valuenow={portUp} aria-valuemax={portTotal} aria-label={`Kesehatan port ${portUp} dari ${portTotal} UP`} />
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <Link href={route('devices.show', device.id)} className="pv-btn pv-btn--outline text-xs py-1.5">
                                                Periksa →
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {devices.links && devices.links.length > 3 && (
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="font-mono text-xs text-gray-500">
                            Menampilkan {devices.from || 0}–{devices.to || 0} dari {devices.total} perangkat
                        </div>
                        <div className="flex items-center gap-1">
                            {devices.links.map((link, idx) =>
                                link.url ? (
                                    <Link key={idx} href={link.url} preserveScroll
                                        aria-current={link.active ? 'page' : undefined}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                            link.active ? 'bg-primary-500 text-white shadow-sm' :
                                            'text-gray-600 hover:bg-gray-200'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label
                                                .replace('&laquo; Previous', '← Sebelumnya')
                                                .replace('Next &raquo;', 'Berikutnya →')
                                        }}
                                    />
                                ) : (
                                    <span key={idx} aria-disabled="true" className="rounded-lg px-3 py-1.5 text-xs font-medium cursor-not-allowed text-gray-300"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label
                                                .replace('&laquo; Previous', '← Sebelumnya')
                                                .replace('Next &raquo;', 'Berikutnya →')
                                        }}
                                    />
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
