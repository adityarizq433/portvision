import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Location } from '@/types/models';
import { PageProps } from '@/types';
import { useState } from 'react';

interface Props {
    locations: Location[];
}

export default function LocationsIndex({ locations }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Editing modal state
    const [editingLoc, setEditingLoc] = useState<Location | null>(null);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(
            route('locations.store'),
            {
                name,
                description: description || null,
                parent_id: parentId || null,
            },
            {
                onSuccess: () => {
                    setName('');
                    setDescription('');
                    setParentId('');
                    setIsCreating(false);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLoc) return;
        setIsSubmitting(true);
        router.patch(
            route('locations.update', editingLoc.id),
            {
                name: editingLoc.name,
                description: editingLoc.description || null,
                parent_id: editingLoc.parent_id || null,
            },
            {
                onSuccess: () => setEditingLoc(null),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleDelete = (loc: Location) => {
        if (!confirm(`Are you sure you want to delete "${loc.name}"? Devices in this location will become unassigned.`)) {
            return;
        }
        router.delete(route('locations.destroy', loc.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span>CAMPUS & SITE LOCATIONS</span>
                            <span className="text-xs font-mono font-normal rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5">
                                {locations.length} Sites
                            </span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-400 font-mono">
                            Physical campus distribution, data centers, and network closets
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setIsCreating(!isCreating)}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 hover:bg-cyan-500 transition-all"
                        >
                            <span>{isCreating ? 'Cancel' : '+ Add Location Site'}</span>
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Site Locations" />

            {/* Create Location Form */}
            {isCreating && (
                <div className="mb-8 rounded-xl border border-cyan-500/30 bg-slate-900/90 p-5 backdrop-blur-md shadow-2xl">
                    <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono mb-4">
                        Add New Network Site
                    </h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Location Name *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Building A - Data Center"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Description
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Core distribution rack room 201"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Parent Campus
                            </label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">Top-Level Site (No Parent)</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-3 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Location'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Location Modal */}
            {editingLoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-4">Edit Location Site</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Location Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingLoc.name}
                                    onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={editingLoc.description || ''}
                                    onChange={(e) => setEditingLoc({ ...editingLoc, description: e.target.value })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingLoc(null)}
                                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Location'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Locations Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {locations.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-sm text-slate-500">
                        No locations added yet. Synchronize devices from LibreNMS or create one manually above.
                    </div>
                ) : (
                    locations.map((loc) => {
                        const total = loc.devices_count || 0;
                        const up = loc.devices_up_count || 0;
                        const down = loc.devices_down_count || 0;
                        const percentUp = total > 0 ? (up / total) * 100 : 0;

                        return (
                            <div
                                key={loc.id}
                                className="group relative rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md hover:border-slate-700 transition-all shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                                            {loc.name}
                                        </h3>
                                        {loc.description && (
                                            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                                                {loc.description}
                                            </p>
                                        )}
                                        {loc.parent && (
                                            <span className="mt-2 inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                                                Parent: {loc.parent.name}
                                            </span>
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setEditingLoc(loc)}
                                                className="rounded p-1 text-slate-400 hover:text-white"
                                                title="Edit location"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(loc)}
                                                className="rounded p-1 text-rose-400 hover:text-rose-300"
                                                title="Delete location"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Health Bar */}
                                <div className="mt-5">
                                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
                                        <span>{total} Switches</span>
                                        <span className="text-emerald-400 font-bold">{up} UP</span>
                                        {down > 0 && <span className="text-rose-400 font-bold">{down} DOWN</span>}
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
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
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                    <Link
                                        href={route('devices.index', { location_id: loc.id })}
                                        className="font-medium text-cyan-400 hover:text-cyan-300"
                                    >
                                        View Devices →
                                    </Link>
                                    <Link
                                        href={route('topology.index', { location_id: loc.id })}
                                        className="text-slate-400 hover:text-slate-200"
                                    >
                                        Topology View
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </AuthenticatedLayout>
    );
}
