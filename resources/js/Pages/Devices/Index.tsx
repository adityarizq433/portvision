import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import TierBadge from '@/Components/TierBadge';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Device, Location, Paginated } from '@/types/models';
import { PageProps } from '@/types';
import { useState } from 'react';

interface Props {
    devices: Paginated<Device>;
    locations: Location[];
    filters: {
        search: string;
        location_id: string;
        tier: string;
        status: string;
    };
}

export default function DevicesIndex({ devices, locations, filters }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [search, setSearch] = useState(filters.search || '');
    const [locationId, setLocationId] = useState(filters.location_id || '');
    const [tier, setTier] = useState(filters.tier || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleFilter = (newFilters: Partial<typeof filters>) => {
        router.get(
            route('devices.index'),
            {
                search: newFilters.search !== undefined ? newFilters.search : search,
                location_id: newFilters.location_id !== undefined ? newFilters.location_id : locationId,
                tier: newFilters.tier !== undefined ? newFilters.tier : tier,
                status: newFilters.status !== undefined ? newFilters.status : status,
            },
            { preserveState: true, replace: true }
        );
    };

    const triggerSync = () => {
        setIsSyncing(true);
        router.post(
            route('devices.sync'),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span>NETWORK DEVICE INVENTORY</span>
                            <span className="text-xs font-mono font-normal rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5">
                                {devices.total} Devices
                            </span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-400 font-mono">
                            Switches, Routers, and Distribution Nodes synchronized from LibreNMS
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={triggerSync}
                            disabled={isSyncing}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 hover:bg-cyan-500 transition-all disabled:opacity-50"
                        >
                            <svg
                                className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{isSyncing ? 'Syncing...' : 'Sync From LibreNMS'}</span>
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Device Inventory" />

            {/* Filter Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Search Device
                        </label>
                        <input
                            type="text"
                            placeholder="Hostname, IP, Vendor, Model..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                handleFilter({ search: e.target.value });
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Location Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Location Site
                        </label>
                        <select
                            value={locationId}
                            onChange={(e) => {
                                setLocationId(e.target.value);
                                handleFilter({ location_id: e.target.value });
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="">All Locations</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tier Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Hierarchy Tier
                        </label>
                        <select
                            value={tier}
                            onChange={(e) => {
                                setTier(e.target.value);
                                handleFilter({ tier: e.target.value });
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="">All Tiers</option>
                            <option value="core">Core</option>
                            <option value="distribution">Distribution</option>
                            <option value="access">Access</option>
                            <option value="unknown">Unknown</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                            Device Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                handleFilter({ status: e.target.value });
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="up">Online (UP)</option>
                            <option value="down">Offline (DOWN)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Devices Inventory Table */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase">
                                <th className="py-3 px-4">Device</th>
                                <th className="py-3 px-4">Management IP</th>
                                <th className="py-3 px-4">Site Location</th>
                                <th className="py-3 px-4">Tier</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Port Health</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {devices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                                        No devices found matching your criteria. Try adjusting filters or syncing from LibreNMS.
                                    </td>
                                </tr>
                            ) : (
                                devices.data.map((device) => {
                                    const portTotal = device.port_count || 0;
                                    const portUp = device.port_up_count || 0;
                                    const portDown = device.port_down_count || 0;
                                    const percentUp = portTotal > 0 ? (portUp / portTotal) * 100 : 0;

                                    return (
                                        <tr key={device.id} className="hover:bg-slate-800/40 transition-colors">
                                            {/* Hostname & Hardware */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-sans font-bold text-slate-100 text-sm">
                                                    <Link
                                                        href={route('devices.show', device.id)}
                                                        className="hover:text-cyan-400 transition-colors"
                                                    >
                                                        {device.hostname}
                                                    </Link>
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {device.vendor || 'Generic'} • {device.hardware || device.model || 'Switch'}
                                                </div>
                                            </td>

                                            {/* IP Address */}
                                            <td className="py-3.5 px-4 font-bold text-cyan-300">
                                                {device.ip || '—'}
                                            </td>

                                            {/* Location */}
                                            <td className="py-3.5 px-4 font-sans text-slate-300">
                                                {device.location?.name || device.location_string || 'Unassigned'}
                                            </td>

                                            {/* Tier */}
                                            <td className="py-3.5 px-4">
                                                <TierBadge tier={device.tier} size="sm" />
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <StatusBadge status={device.status} size="sm" />
                                            </td>

                                            {/* Port Health Progress Bar */}
                                            <td className="py-3.5 px-4 min-w-[140px]">
                                                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                                                    <span>{portUp}/{portTotal} UP</span>
                                                    {portDown > 0 && (
                                                        <span className="text-rose-400 font-bold">{portDown} Down</span>
                                                    )}
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                                                    <div
                                                        className="h-full bg-emerald-500"
                                                        style={{ width: `${percentUp}%` }}
                                                    />
                                                    {portDown > 0 && (
                                                        <div
                                                            className="h-full bg-rose-500"
                                                            style={{ width: `${(portDown / portTotal) * 100}%` }}
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right font-sans">
                                                <Link
                                                    href={route('devices.show', device.id)}
                                                    className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                                                >
                                                    <span>Inspect</span>
                                                    <span>→</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {devices.links && devices.links.length > 3 && (
                    <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-4 py-3">
                        <div className="text-xs text-slate-500 font-mono">
                            Showing {devices.from || 0} to {devices.to || 0} of {devices.total} entries
                        </div>
                        <div className="flex items-center gap-1">
                            {devices.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`rounded px-2.5 py-1 text-xs font-mono transition-all ${
                                        link.active
                                            ? 'bg-cyan-600 text-white font-bold'
                                            : link.url
                                            ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                            : 'text-slate-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
