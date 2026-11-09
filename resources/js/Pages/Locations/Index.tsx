import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Location } from '@/types/models';
import { PageProps } from '@/types';
import { useState } from 'react';

interface Props { locations: Location[]; }

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-gray-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition';

export default function LocationsIndex({ locations }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLoc, setEditingLoc] = useState<Location | null>(null);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(route('locations.store'), { name, description: description || null, parent_id: parentId || null }, {
            onSuccess: () => { setName(''); setDescription(''); setParentId(''); setIsCreating(false); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLoc) return;
        setIsSubmitting(true);
        router.patch(route('locations.update', editingLoc.id), {
            name: editingLoc.name, description: editingLoc.description || null, parent_id: editingLoc.parent_id || null,
        }, { onSuccess: () => setEditingLoc(null), onFinish: () => setIsSubmitting(false) });
    };

    const handleDelete = (loc: Location) => {
        if (!confirm(`Hapus wilayah "${loc.name}"? Perangkat yang terkait akan menjadi tanpa wilayah.`)) return;
        router.delete(route('locations.destroy', loc.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold tracking-tight text-navy-900">WILAYAH &amp; AREA</h1>
                            <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600">
                                {locations.length} Wilayah
                            </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">Wilayah dan area jaringan tempat perangkat terpasang</p>
                    </div>
                    {isAdmin && (
                        <button type="button" onClick={() => setIsCreating(!isCreating)} className="pv-btn pv-btn--primary">
                            {isCreating ? 'Batal' : '+ Tambah Wilayah'}
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Wilayah & Area" />

            {/* Create Form */}
            {isCreating && (
                <div className="pv-card mb-6 p-5 border-primary-200 ring-1 ring-primary-100">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-navy-900">Tambah Wilayah Jaringan Baru</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label htmlFor="loc-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Wilayah *</label>
                            <input id="loc-name" type="text" required placeholder="Contoh: Wilayah Juanda - Area Posko" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="loc-desc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Deskripsi</label>
                            <input id="loc-desc" type="text" placeholder="Contoh: Area switch distribusi lantai 2" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="loc-parent" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Wilayah Induk</label>
                            <select id="loc-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputCls}>
                                <option value="">Wilayah Tingkat Teratas</option>
                                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 sm:col-span-3">
                            <button type="button" onClick={() => setIsCreating(false)} className="pv-btn pv-btn--outline">Batal</button>
                            <button type="submit" disabled={isSubmitting} className="pv-btn pv-btn--primary">
                                {isSubmitting ? 'Menyimpan…' : 'Simpan Wilayah'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Modal */}
            {editingLoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Ubah wilayah">
                    <div className="w-full max-w-md pv-card p-6 shadow-2xl">
                        <h3 className="mb-5 text-base font-bold text-navy-900">Ubah Wilayah &amp; Area</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label htmlFor="loc-edit-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Wilayah *</label>
                                <input id="loc-edit-name" type="text" required value={editingLoc.name} onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="loc-edit-desc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Deskripsi</label>
                                <input id="loc-edit-desc" type="text" value={editingLoc.description || ''} onChange={(e) => setEditingLoc({ ...editingLoc, description: e.target.value })} className={inputCls} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditingLoc(null)} className="pv-btn pv-btn--outline">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="pv-btn pv-btn--primary">
                                    {isSubmitting ? 'Memperbarui…' : 'Perbarui Wilayah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Location Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {locations.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
                        <svg className="mx-auto mb-4 h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <p className="text-sm text-gray-500">Belum ada wilayah yang ditambahkan.<br />Sinkronkan perangkat dari LibreNMS atau tambahkan wilayah secara manual.</p>
                    </div>
                ) : locations.map((loc) => {
                    const total = loc.devices_count || 0;
                    const up    = loc.devices_up_count || 0;
                    const down  = loc.devices_down_count || 0;
                    const pct   = total > 0 ? (up / total) * 100 : 0;
                    const healthy = down === 0;

                    return (
                        <div key={loc.id} className={`pv-card group p-5 transition-all hover:shadow-lg ${healthy ? '' : 'border-red-100'}`}>
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-navy-900 group-hover:text-primary-600 transition-colors truncate">
                                        {loc.name}
                                    </h3>
                                    {loc.description && (
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{loc.description}</p>
                                    )}
                                    {loc.parent && (
                                        <span className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500">
                                            Induk: {loc.parent.name}
                                        </span>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="ml-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => setEditingLoc(loc)}
                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-400"
                                            aria-label={`Ubah ${loc.name}`}>
                                            <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button type="button" onClick={() => handleDelete(loc)}
                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                                            aria-label={`Hapus ${loc.name}`}>
                                            <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5">
                                <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                                    <span className="text-gray-500">{total} Switch</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-green-600">{up} UP</span>
                                        {down > 0 && <span className="font-bold text-red-500">{down} DOWN</span>}
                                    </div>
                                </div>
                                <div className="pv-progress">
                                    <div className="pv-progress-fill bg-green-500" style={{ width: `${pct}%` }} />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                                <Link href={route('devices.index', { location_id: loc.id })} className="font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                                    Lihat Perangkat →
                                </Link>
                                <Link href={route('topology.index', { location_id: loc.id })} className="text-gray-500 hover:text-gray-700 transition-colors">
                                    Peta Topologi
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}
