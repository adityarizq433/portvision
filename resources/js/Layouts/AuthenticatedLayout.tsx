import Dropdown from '@/Components/Dropdown';
import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { PageProps } from '@/types';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user?.role === 'admin';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const triggerQuickPoll = () => {
        setIsPolling(true);
        router.post(
            route('ports.poll'),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsPolling(false),
            }
        );
    };

    const navigation = [
        { name: 'Dashboard', href: route('dashboard'), current: route().current('dashboard') },
        { name: 'Devices', href: route('devices.index'), current: route().current('devices.*') },
        { name: 'Topology', href: route('topology.index'), current: route().current('topology.*') },
        { name: 'Locations', href: route('locations.index'), current: route().current('locations.*') },
        ...(isAdmin
            ? [
                  { name: 'Settings', href: route('settings.index'), current: route().current('settings.*') },
                  { name: 'Users', href: route('users.index'), current: route().current('users.*') },
              ]
            : []),
    ];

    return (
        <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Brand Logo & Title */}
                        <div className="flex items-center gap-8">
                            <Link href={route('dashboard')} className="flex items-center gap-3 group">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-base font-black tracking-wider text-white font-mono flex items-center gap-1.5">
                                        PORT<span className="text-cyan-400">VISION</span>
                                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 tracking-normal">
                                            NOC
                                        </span>
                                    </span>
                                </div>
                            </Link>

                            {/* Desktop Nav */}
                            <nav className="hidden md:flex items-center space-x-1">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                                            item.current
                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                        }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Top Right Utilities */}
                        <div className="hidden sm:flex items-center gap-3">
                            {/* Live Status Indicator */}
                            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                                <span className="font-mono text-slate-300 text-[11px]">NOC LIVE</span>
                            </div>

                            {/* Quick Poll Button (Admin) */}
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={triggerQuickPoll}
                                    disabled={isPolling}
                                    title="Poll port statuses now"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-300 hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    <svg
                                        className={`h-3.5 w-3.5 ${isPolling ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>{isPolling ? 'Polling...' : 'Poll Ports'}</span>
                                </button>
                            )}

                            {/* User Menu */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-all focus:outline-none"
                                    >
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-900/60 border border-cyan-700 text-cyan-300 text-xs font-bold font-mono">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="max-w-[120px] truncate">{user.name}</span>
                                        <span
                                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                                isAdmin
                                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                        <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content contentClasses="py-1 bg-slate-900 border border-slate-800 shadow-xl rounded-lg">
                                    <div className="px-4 py-2 border-b border-slate-800">
                                        <p className="text-xs text-slate-400">Signed in as</p>
                                        <p className="text-xs font-medium text-slate-200 truncate">{user.email}</p>
                                    </div>
                                    <Dropdown.Link
                                        href={route('profile.edit')}
                                        className="text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
                                    >
                                        Profile Settings
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs"
                                    >
                                        Sign Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {mobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="sm:hidden border-b border-slate-800 bg-slate-950 px-4 py-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                                    item.current
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="border-t border-slate-800 pt-3 mt-2">
                            <Link
                                href={route('profile.edit')}
                                className="block rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                Profile Settings
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="block w-full text-left rounded-md px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/40"
                            >
                                Sign Out
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Flash Messages Banner */}
            {flash?.success && (
                <div className="border-b border-emerald-800/80 bg-emerald-950/60 px-4 py-2.5 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between text-xs font-medium text-emerald-300">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="border-b border-rose-800/80 bg-rose-950/60 px-4 py-2.5 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between text-xs font-medium text-rose-300">
                        <div className="flex items-center gap-2">
                            <span className="text-rose-400">⚠</span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Optional Header Title / Actions Bar */}
            {header && (
                <div className="border-b border-slate-800/60 bg-slate-900/30 py-5">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500 font-mono">
                Portvision NOC Dashboard • LibreNMS Real-time Switch & Port Monitoring
            </footer>
        </div>
    );
}
