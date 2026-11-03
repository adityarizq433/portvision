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

    const navigationIcons: Record<string, ReactNode> = {
        Dashboard: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>,
        Devices: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10m-5-4v4m-5-9h2m4 0h2" /></svg>,
        Topology: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="3" width="6" height="5" rx="1.5" /><rect x="3" y="16" width="6" height="5" rx="1.5" /><rect x="15" y="16" width="6" height="5" rx="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m-6 4v-2h12v2" /></svg>,
        Locations: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></svg>,
        Settings: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6.7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>,
        Users: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20m.5-15a3.5 3.5 0 0 1 0 6.8M18 14a4 4 0 0 1 3 3.9V20" /></svg>,
    };

    return (
        <div className="pv-shell min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
            <aside className="pv-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
                <Link href={route('dashboard')} className="flex items-center gap-3 rounded-xl px-2 py-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </span>
                    <span>
                        <span className="block text-base font-extrabold tracking-tight text-slate-900">Port <span className="text-blue-700">Vision</span></span>
                        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Network operations</span>
                    </span>
                </Link>
                <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
                <nav aria-label="Navigasi utama" className="flex flex-1 flex-col gap-1.5">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`pv-sidebar-link group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
                                item.current
                                    ? 'is-active bg-blue-50 text-blue-800'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${item.current ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 group-hover:text-blue-700'}`}>
                                {navigationIcons[item.name]}
                            </span>
                            <span>{item.name}</span>
                            {item.current && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        </Link>
                    ))}
                </nav>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-800">NOC LIVE</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-emerald-800/70">Pemantauan perangkat dan port jaringan aktif.</p>
                </div>
            </aside>
            {/* Header / Navbar */}
            <header className="pv-topbar sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md lg:ml-64">
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
                            <nav className="pv-top-nav hidden md:flex items-center space-x-1">
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
                        <div className="flex items-center lg:hidden">
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
                    <div className="pv-mobile-nav lg:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                                    item.current
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                    {navigationIcons[item.name]}
                                </span>
                                <span>{item.name}</span>
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
                <div className="pv-flash border-b border-emerald-100 bg-emerald-50 px-4 py-2.5 lg:ml-64">
                    <div className="mx-auto flex max-w-7xl items-center justify-between text-xs font-medium text-emerald-300">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                </div>
            )}
            {flash?.error && (
                <div className="pv-flash border-b border-rose-100 bg-rose-50 px-4 py-2.5 lg:ml-64">
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
                <div className="pv-page-heading border-b border-slate-200/80 bg-white py-5 lg:ml-64">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="pv-content flex-1 py-6 lg:ml-64">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="pv-footer border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 lg:ml-64">
                Portvision NOC Dashboard • LibreNMS Real-time Switch & Port Monitoring
            </footer>
        </div>
    );
}
