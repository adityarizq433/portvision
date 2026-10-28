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

    // Periodic live polling of Redis port cache
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/devices/${device.id}/ports/live`);
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
                // Ignore transient live poll error
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
                            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                            title="Back to inventory"
                        >
                            ←
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                                    {device.hostname}
                                </h1>
                                <StatusBadge status={device.status} size="sm" />
                                <TierBadge tier={device.tier} size="sm" />
                            </div>
                            <p className="mt-1 text-xs text-slate-400 font-mono">
                                IP: <span className="text-cyan-300 font-semibold">{device.ip || '—'}</span> •
                                Site:{' '}
                                <span className="text-slate-300">
                                    {device.location?.name || device.location_string || 'Unassigned'}
                                </span>{' '}
                                • Hardware: <span className="text-slate-300">{device.hardware || device.model || '—'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('topology.index', { location_id: device.location_id })}
                            className="rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-all"
                        >
                            Locate in Topology Map
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${device.hostname} - Switch Detail`} />

            {/* Hardware & Admin Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Switch Hardware Details */}
                <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
                    <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono border-b border-slate-800 pb-2">
                        Hardware Specifications & SNMP Profile
                    </h3>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                        <div>
                            <span className="text-slate-500 block">Vendor</span>
                            <span className="text-white font-semibold block mt-0.5">{device.vendor || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Operating System</span>
                            <span className="text-white font-semibold block mt-0.5">
                                {device.os ? `${device.os} ${device.os_version || ''}` : '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Serial Number</span>
                            <span className="text-white font-semibold block mt-0.5">{device.serial || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">LibreNMS Device ID</span>
                            <span className="text-cyan-400 font-bold block mt-0.5">#{device.librenms_device_id}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Physical Ports</span>
                            <span className="text-emerald-400 font-bold block mt-0.5">
                                {device.port_up_count} UP / {device.port_count} Total
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Ports Down</span>
                            <span className={`font-bold block mt-0.5 ${device.port_down_count > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {device.port_down_count} Ports
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Last Seen</span>
                            <span className="text-slate-300 block mt-0.5">
                                {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString() : '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">SNMP Telemetry</span>
                            <span className="text-emerald-400 font-semibold block mt-0.5">Enabled</span>
                        </div>
                    </div>
                </div>

                {/* Admin Assignment Panel */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
                    <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono border-b border-slate-800 pb-2">
                        Hierarchy & Site Assignment
                    </h3>

                    <form onSubmit={handleSaveMetadata} className="mt-4 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Hierarchy Tier
                            </label>
                            <select
                                value={tier}
                                disabled={!isAdmin}
                                onChange={(e) => setTier(e.target.value as any)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="core">Core Switch</option>
                                <option value="distribution">Distribution Switch</option>
                                <option value="access">Access Switch</option>
                                <option value="unknown">Unknown</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Site Location
                            </label>
                            <select
                                value={locationId}
                                disabled={!isAdmin}
                                onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">No Location Assigned</option>
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
                                className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all disabled:opacity-50 mt-2"
                            >
                                {isSaving ? 'Saving...' : 'Update Device Settings'}
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Interactive Physical Switch Visualizer */}
            <div className="mt-8">
                <SwitchVisualizer
                    ports={ports}
                    deviceId={device.id}
                    canEdit={isAdmin}
                />
            </div>

            {/* Ports Table & Search */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                            All Port Interfaces ({ports.length})
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                            Ethernet, VLANs, and Loopbacks
                        </p>
                    </div>

                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Filter interface name or alias..."
                            value={filterPortText}
                            onChange={(e) => setFilterPortText(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500 uppercase">
                                <th className="py-2.5 px-3">Port</th>
                                <th className="py-2.5 px-3">Alias / Description</th>
                                <th className="py-2.5 px-3">Speed</th>
                                <th className="py-2.5 px-3">Type</th>
                                <th className="py-2.5 px-3">Oper Status</th>
                                <th className="py-2.5 px-3">Admin Status</th>
                                <th className="py-2.5 px-3 text-center">Critical</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {filteredPorts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                                        No interfaces match your filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredPorts.map((port) => (
                                    <tr key={port.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-2.5 px-3 font-bold text-slate-200">
                                            {port.if_name}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[200px]">
                                            {port.if_alias || port.if_descr || '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-300">
                                            {port.speed_human || (port.if_speed ? `${port.if_speed} bps` : '—')}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-400">
                                            {port.if_type || '—'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <StatusBadge status={port.oper_status} size="sm" />
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-400 uppercase">
                                            {port.admin_status}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            {port.is_critical ? (
                                                <span className="text-amber-400 font-bold" title="Critical Interface">
                                                    ★
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">—</span>
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
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
                <h3 className="text-sm font-semibold tracking-wide text-white uppercase border-b border-slate-800 pb-3">
                    Recent State Change Log ({device.hostname})
                </h3>

                <div className="mt-4">
                    {!device.port_events || device.port_events.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 font-sans">
                            No recent port state transitions recorded for this device.
                        </div>
                    ) : (
                        <div className="space-y-2 font-mono text-xs">
                            {device.port_events.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/50 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-white">
                                            {ev.port?.if_name || 'Port'}
                                        </span>
                                        {ev.port?.if_alias && (
                                            <span className="text-slate-400">({ev.port.if_alias})</span>
                                        )}
                                        <span className="text-slate-500">transitioned from</span>
                                        <span className="uppercase text-slate-400">{ev.from_status}</span>
                                        <span className="text-slate-500">to</span>
                                        <StatusBadge status={ev.to_status} size="sm" />
                                    </div>
                                    <span className="text-slate-500">
                                        {new Date(ev.occurred_at).toLocaleString()}
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
