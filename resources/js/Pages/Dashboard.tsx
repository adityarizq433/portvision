import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/StatCard';
import StatusBadge from '@/Components/StatusBadge';
import TierBadge from '@/Components/TierBadge';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DashboardStats } from '@/types/models';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';

export default function Dashboard(props: DashboardStats) {
    const { deviceStats: initialDeviceStats, portStats: initialPortStats, tierStats, locations, recentEvents: initialRecentEvents, systemStatus } = props;
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [deviceStats, setDeviceStats] = useState(initialDeviceStats);
    const [portStats, setPortStats] = useState(initialPortStats);
    const [recentEvents, setRecentEvents] = useState(initialRecentEvents);
    const [lastPollAt, setLastPollAt] = useState(systemStatus?.last_port_poll_at);

    // Sync state if props change (e.g. navigation or manual sync)
    useEffect(() => {
        setDeviceStats(initialDeviceStats);
        setPortStats(initialPortStats);
        setRecentEvents(initialRecentEvents);
        setLastPollAt(systemStatus?.last_port_poll_at);
    }, [initialDeviceStats, initialPortStats, initialRecentEvents, systemStatus?.last_port_poll_at]);

    // Live background telemetry polling via lightweight JSON endpoint
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(route('dashboard.live'));
                if (res.ok) {
                    const data = await res.json();
                    if (data.deviceStats) setDeviceStats(data.deviceStats);
                    if (data.portStats) setPortStats(data.portStats);
                    if (data.recentEvents) setRecentEvents(data.recentEvents);
                    if (data.last_port_poll_at) setLastPollAt(data.last_port_poll_at);
                }
            } catch {
                // Ignore transient network errors during live poll
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span>NETWORK OPERATIONS CENTER</span>
                            <span className="text-xs font-mono font-normal rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 px-2.5 py-0.5">
                                LIVE TELEMETRY
                            </span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-400 font-mono">
                            Auto-refreshing every 5s • Last poll:{' '}
                            <span className="text-slate-300">
                                {lastPollAt
                                    ? new Date(lastPollAt).toLocaleTimeString()
                                    : 'Never'}
                            </span>
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={triggerSyncDevices}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
                            >
                                <svg
                                    className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>{isRefreshing ? 'Syncing...' : 'Sync Devices'}</span>
                            </button>

                            <Link
                                href={route('topology.index')}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 hover:from-cyan-500 hover:to-indigo-500 transition-all"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                <span>Open Topology View</span>
                            </Link>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="NOC Dashboard" />

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Devices"
                    value={deviceStats.total}
                    subtitle={`${deviceStats.up} Online • ${deviceStats.down} Offline`}
                    accentColor={deviceStats.down > 0 ? 'rose' : 'emerald'}
                    alert={deviceStats.down > 0}
                    icon={
                        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                    }
                />

                <StatCard
                    title="Physical Ports"
                    value={portStats.total}
                    subtitle={`${portStats.up} Up • ${portStats.down} Down`}
                    accentColor={portStats.down > 0 ? 'amber' : 'cyan'}
                    icon={
                        <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Critical Alarms"
                    value={portStats.critical_down}
                    subtitle={portStats.critical_down > 0 ? 'Critical link outage detected!' : 'All critical uplinks healthy'}
                    accentColor={portStats.critical_down > 0 ? 'rose' : 'emerald'}
                    alert={portStats.critical_down > 0}
                    icon={
                        <svg className={`h-5 w-5 ${portStats.critical_down > 0 ? 'text-rose-500 animate-bounce' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                />

                <StatCard
                    title="LibreNMS Status"
                    value={systemStatus.librenms_connected ? 'Connected' : 'Disconnected'}
                    subtitle={`Poll Interval: ${systemStatus.port_poll_interval}s`}
                    accentColor={systemStatus.librenms_connected ? 'purple' : 'rose'}
                    icon={
                        <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />
            </div>

            {/* Architecture Tiers & Site Overview */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Network Tier Breakdown */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
                    <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center justify-between">
                        <span>Hierarchy Distribution</span>
                        <span className="text-xs font-mono text-slate-400">Tiers</span>
                    </h3>

                    <div className="mt-5 space-y-4">
                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                <div className="flex items-center gap-2">
                                    <TierBadge tier="core" size="sm" />
                                    <span>Core Switches</span>
                                </div>
                                <span className="font-mono text-purple-300 font-bold">{tierStats.core}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{
                                        width: `${deviceStats.total ? (tierStats.core / deviceStats.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                <div className="flex items-center gap-2">
                                    <TierBadge tier="distribution" size="sm" />
                                    <span>Distribution</span>
                                </div>
                                <span className="font-mono text-blue-300 font-bold">{tierStats.distribution}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                        width: `${deviceStats.total ? (tierStats.distribution / deviceStats.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                <div className="flex items-center gap-2">
                                    <TierBadge tier="access" size="sm" />
                                    <span>Access Layer</span>
                                </div>
                                <span className="font-mono text-teal-300 font-bold">{tierStats.access}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-teal-500 rounded-full"
                                    style={{
                                        width: `${deviceStats.total ? (tierStats.access / deviceStats.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                                <div className="flex items-center gap-2">
                                    <TierBadge tier="unknown" size="sm" />
                                    <span>Unassigned</span>
                                </div>
                                <span className="font-mono text-slate-400 font-bold">{tierStats.unknown}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-slate-600 rounded-full"
                                    style={{
                                        width: `${deviceStats.total ? (tierStats.unknown / deviceStats.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80">
                        <Link
                            href={route('devices.index')}
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center justify-between"
                        >
                            <span>Browse full device inventory</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>

                {/* Locations / Campus Grid */}
                <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                            Site Locations Health
                        </h3>
                        <Link
                            href={route('locations.index')}
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                        >
                            Manage Sites →
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                        {locations.length === 0 ? (
                            <div className="col-span-2 py-8 text-center text-xs text-slate-500">
                                No locations registered yet. Sync devices from LibreNMS to auto-populate sites.
                            </div>
                        ) : (
                            locations.map((loc) => {
                                const total = loc.devices_count || 0;
                                const up = loc.devices_up_count || 0;
                                const down = loc.devices_down_count || 0;
                                const percentUp = total > 0 ? Math.round((up / total) * 100) : 0;

                                return (
                                    <Link
                                        key={loc.id}
                                        href={route('devices.index', { location_id: loc.id })}
                                        className="group rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 hover:border-slate-700 hover:bg-slate-800/50 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors truncate max-w-[150px]">
                                                {loc.name}
                                            </span>
                                            <span className="font-mono text-xs text-slate-400">
                                                {up}/{total} Up
                                            </span>
                                        </div>

                                        <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                                            <div
                                                className="h-full bg-emerald-500"
                                                style={{ width: `${percentUp}%` }}
                                            />
                                            {down > 0 && (
                                                <div
                                                    className="h-full bg-rose-500"
                                                    style={{ width: `${(down / total) * 100}%` }}
                                                />
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Port Events Feed */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                            Recent Port State Events
                        </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">Real-time LibreNMS Events</span>
                </div>

                <div className="mt-4 overflow-x-auto">
                    {recentEvents.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                            No port transition events recorded yet. Polling will track status changes.
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono">
                                    <th className="py-3 px-3">Device</th>
                                    <th className="py-3 px-3">Interface</th>
                                    <th className="py-3 px-3">From</th>
                                    <th className="py-3 px-3">To</th>
                                    <th className="py-3 px-3">Occurred At</th>
                                    <th className="py-3 px-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {recentEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3 px-3 font-semibold text-slate-200">
                                            {event.device ? (
                                                <Link
                                                    href={route('devices.show', event.device.id)}
                                                    className="hover:text-cyan-400 transition-colors"
                                                >
                                                    {event.device.hostname}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-slate-300">
                                            <span className="font-bold text-white">
                                                {event.port?.if_name || 'Port'}
                                            </span>
                                            {event.port?.if_alias && (
                                                <span className="text-slate-500 ml-1.5 truncate">
                                                    ({event.port.if_alias})
                                                </span>
                                            )}
                                            {event.port?.is_critical && (
                                                <span className="text-amber-400 ml-1.5" title="Critical Interface">
                                                    ★
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="uppercase text-slate-400">
                                                {event.from_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <StatusBadge status={event.to_status} size="sm" />
                                        </td>
                                        <td className="py-3 px-3 text-slate-400">
                                            {new Date(event.occurred_at).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            {event.device && (
                                                <Link
                                                    href={route('devices.show', event.device.id)}
                                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-sans"
                                                >
                                                    Inspect Switch →
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
