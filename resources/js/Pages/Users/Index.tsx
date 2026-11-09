import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { User, Role } from '@/types/models';
import { PageProps } from '@/types';
import React, { useState } from 'react';

interface Props { users: User[]; }

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-navy-900 placeholder-gray-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition';

export default function UsersIndex({ users }: Props) {
    const { auth } = usePage<PageProps>().props;
    const currentUser = auth.user;

    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('viewer');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editPassword, setEditPassword] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(route('users.store'), { name, email, password, role }, {
            onSuccess: () => { setName(''); setEmail(''); setPassword(''); setRole('viewer'); setIsCreating(false); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSubmitting(true);
        const payload: any = { name: editingUser.name, email: editingUser.email, role: editingUser.role };
        if (editPassword) payload.password = editPassword;
        router.patch(route('users.update', editingUser.id), payload, {
            onSuccess: () => { setEditingUser(null); setEditPassword(''); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDelete = (user: User) => {
        if (user.id === currentUser.id) { alert('Anda tidak dapat menghapus akun Anda sendiri.'); return; }
        if (!confirm(`Hapus operator "${user.name}"?`)) return;
        router.delete(route('users.destroy', user.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold tracking-tight text-navy-900">HAK AKSES &amp; PERAN OPERATOR</h1>
                            <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600">
                                {users.length} Operator
                            </span>
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-gray-500">Admin (Kontrol Penuh) dan Viewer (Pemantauan Saja)</p>
                    </div>
                    <button type="button" onClick={() => setIsCreating(!isCreating)} className="pv-btn pv-btn--primary">
                        {isCreating ? 'Batal' : '+ Tambah Operator'}
                    </button>
                </div>
            }
        >
            <Head title="Manajemen Operator" />

            {/* Create Form */}
            {isCreating && (
                <div className="pv-card mb-6 p-5 border-primary-200 ring-1 ring-primary-100">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-navy-900">Tambah Operator Jaringan Baru</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <label htmlFor="user-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Lengkap *</label>
                            <input id="user-name" type="text" required placeholder="Contoh: Budi Teknisi" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="user-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Alamat Email *</label>
                            <input id="user-email" type="email" required placeholder="operator@portvision.local" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="user-pass" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Kata Sandi *</label>
                            <input id="user-pass" type="password" required minLength={8} placeholder="Minimal 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="user-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Peran *</label>
                            <select id="user-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputCls}>
                                <option value="viewer">Viewer (Hanya Lihat)</option>
                                <option value="admin">Admin (Kontrol Penuh)</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 sm:col-span-4">
                            <button type="button" onClick={() => setIsCreating(false)} className="pv-btn pv-btn--outline">Batal</button>
                            <button type="submit" disabled={isSubmitting} className="pv-btn pv-btn--primary">
                                {isSubmitting ? 'Membuat…' : 'Buat Operator'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Ubah operator">
                    <div className="w-full max-w-md pv-card p-6 shadow-2xl">
                        <h3 className="mb-5 text-base font-bold text-navy-900">Ubah Data Operator</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label htmlFor="user-edit-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Nama Lengkap *</label>
                                <input id="user-edit-name" type="text" required value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="user-edit-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Alamat Email *</label>
                                <input id="user-edit-email" type="email" required value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="user-edit-pass" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Kata Sandi Baru (kosongkan jika tidak diubah)</label>
                                <input id="user-edit-pass" type="password" minLength={8} placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label htmlFor="user-edit-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Peran</label>
                                <select id="user-edit-role" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })} className={inputCls}>
                                <option value="viewer">Viewer (Hanya Lihat)</option>
                                <option value="admin">Admin (Kontrol Penuh)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="pv-btn pv-btn--outline">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="pv-btn pv-btn--primary">
                                    {isSubmitting ? 'Memperbarui…' : 'Perbarui Operator'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="pv-card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="pv-table" aria-label="Daftar operator sistem">
                    <thead>
                        <tr>
                            <th scope="col">Operator</th>
                            <th scope="col">Alamat Email</th>
                            <th scope="col">Peran</th>
                            <th scope="col">Bergabung</th>
                            <th scope="col" className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={5} className="py-16 text-center text-sm text-gray-500">Belum ada operator terdaftar. Tambahkan operator pertama dengan tombol di atas.</td></tr>
                        ) : users.map((user) => {
                            const isSelf = user.id === currentUser.id;
                            const isUserAdmin = user.role === 'admin';
                            return (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-navy-900">{user.name}</span>
                                            {isSelf && (
                                                <span className="rounded-md bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-600">ANDA</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="font-mono text-xs text-gray-600">{user.email}</td>
                                    <td>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${isUserAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.role === 'admin' ? 'ADMIN' : 'VIEWER'}
                                        </span>
                                    </td>
                                    <td className="font-mono text-xs text-gray-500">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '—'}
                                    </td>
                                    <td className="text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button type="button" onClick={() => setEditingUser(user)} className="pv-btn pv-btn--outline text-xs py-1.5">
                                                Ubah
                                            </button>
                                            {!isSelf && (
                                                <button type="button" onClick={() => handleDelete(user)} className="pv-btn pv-btn--danger text-xs py-1.5">
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
