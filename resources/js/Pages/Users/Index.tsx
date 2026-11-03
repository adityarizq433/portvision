import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { User, Role } from '@/types/models';
import { PageProps } from '@/types';
import React, { useState } from 'react';

interface Props {
    users: User[];
}

export default function UsersIndex({ users }: Props) {
    const { auth } = usePage<PageProps>().props;
    const currentUser = auth.user;

    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('viewer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit modal
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editPassword, setEditPassword] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(
            route('users.store'),
            {
                name,
                email,
                password,
                role,
            },
            {
                onSuccess: () => {
                    setName('');
                    setEmail('');
                    setPassword('');
                    setRole('viewer');
                    setIsCreating(false);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSubmitting(true);

        const payload: any = {
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
        };
        if (editPassword) {
            payload.password = editPassword;
        }

        router.patch(route('users.update', editingUser.id), payload, {
            onSuccess: () => {
                setEditingUser(null);
                setEditPassword('');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDelete = (user: User) => {
        if (user.id === currentUser.id) {
            alert('You cannot delete your own account.');
            return;
        }
        if (!confirm(`Are you sure you want to delete operator "${user.name}"?`)) {
            return;
        }
        router.delete(route('users.destroy', user.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                            <span>OPERATOR ACCESS & ROLES</span>
                            <span className="text-xs font-mono font-normal rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5">
                                {users.length} Operators
                            </span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-400 font-mono">
                            Admin (Read & Write configuration) and Viewer (Read-only monitoring)
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCreating(!isCreating)}
                        className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 hover:bg-cyan-500 transition-all"
                    >
                        <span>{isCreating ? 'Cancel' : '+ Add Operator'}</span>
                    </button>
                </div>
            }
        >
            <Head title="Operator Management" />

            {/* Create Operator Form */}
            {isCreating && (
                <div className="mb-8 rounded-xl border border-cyan-500/30 bg-slate-900/90 p-5 backdrop-blur-md shadow-2xl">
                    <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono mb-4">
                        Add New Network Operator
                    </h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Alice Engineer"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="operator@portvision.local"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Password *
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                System Role *
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="viewer">Viewer (Read-only)</option>
                                <option value="admin">Admin (Full Control)</option>
                            </select>
                        </div>
                        <div className="sm:col-span-4 flex justify-end gap-2 mt-2">
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
                                {isSubmitting ? 'Creating...' : 'Create Operator'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-4">Edit Operator</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    New Password (leave empty to keep current)
                                </label>
                                <input
                                    type="password"
                                    minLength={8}
                                    placeholder="••••••••"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Role
                                </label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="viewer">Viewer (Read-only)</option>
                                    <option value="admin">Admin (Full Control)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Operator'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Operators Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden backdrop-blur-md shadow-lg">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase">
                            <th className="py-3.5 px-4">Operator</th>
                            <th className="py-3.5 px-4">Email Address</th>
                            <th className="py-3.5 px-4">Role Permission</th>
                            <th className="py-3.5 px-4">Joined At</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                        {users.map((user) => {
                            const isSelf = user.id === currentUser.id;
                            const isUserAdmin = user.role === 'admin';

                            return (
                                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user.name}</span>
                                        {isSelf && (
                                            <span className="rounded bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] px-1.5 py-0.2 font-mono">
                                                You
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-300">
                                        {user.email}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span
                                            className={`inline-flex items-center uppercase tracking-wider rounded border px-2.5 py-0.5 text-[10px] font-semibold ${
                                                isUserAdmin
                                                    ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-500">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-sans">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingUser(user)}
                                                className="rounded px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all border border-slate-700"
                                            >
                                                Edit
                                            </button>
                                            {!isSelf && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(user)}
                                                    className="rounded px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all border border-rose-900/60"
                                                >
                                                    Delete
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
        </AuthenticatedLayout>
    );
}
