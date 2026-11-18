import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect, useRef } from 'react';
import { PageProps } from '@/types';

interface NavItem {
    name: string;
    href: string;
    current: boolean;
    icon: ReactNode;
    badge?: number;
}

function NavIcon({ children }: { children: ReactNode }) {
    return <span className="flex h-5 w-5 items-center justify-center flex-shrink-0">{children}</span>;
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user?.role === 'admin';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [alertCount, setAlertCount] = useState<number | null>(null);
    const [alertToast, setAlertToast] = useState<string | null>(null);

    const prevAlertCount = useRef<number | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const savedTheme = (localStorage.getItem('pv-theme') as 'light' | 'dark') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // Poll active alert count every 60s; toast when it increases
    useEffect(() => {
        const controller = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const pollAlerts = () => {
            timeoutId = setTimeout(() => controller.abort(), 15000);
            fetch(route('alerts.data'), { signal: controller.signal })
                .then((res) => (res.ok ? res.json() : null))
                .then((payload) => {
                    if (!payload) return;
                    const active = payload.summary?.active ?? 0;
                    const prev = prevAlertCount.current;
                    prevAlertCount.current = active;
                    setAlertCount(active);
                    if (prev !== null && active > prev) {
                        const critical = payload.summary?.critical ?? 0;
                        setAlertToast(
                            critical > 0
                                ? `Alert baru: ${active} aktif (${critical} critical)`
                                : `Alert baru: ${active} aktif`
                        );
                        if (toastTimer.current) clearTimeout(toastTimer.current);
                        toastTimer.current = setTimeout(() => setAlertToast(null), 5000);
                    }
                })
                .catch(() => {
                    // Transient failure — the next tick will retry.
                })
                .finally(() => {
                    if (timeoutId) clearTimeout(timeoutId);
                });
        };

        pollAlerts();
        const interval = setInterval(pollAlerts, 60000);
        return () => {
            clearInterval(interval);
            controller.abort();
            if (timeoutId) clearTimeout(timeoutId);
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        localStorage.setItem('pv-theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    };

    const triggerQuickPoll = () => {
        setIsPolling(true);
        router.post(route('ports.poll'), {}, {
            preserveScroll: true,
            onFinish: () => setIsPolling(false),
        });
    };

    const navigation: NavItem[] = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            current: route().current('dashboard'),
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Perangkat',
            href: route('devices.index'),
            current: route().current('devices.*'),
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
            ),
        },
        {
            name: 'Topologi',
            href: route('topology.index'),
            current: route().current('topology.*'),
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            ),
        },
        {
            name: 'Alerts',
            href: route('alerts.index'),
            current: route().current('alerts.*'),
            badge: alertCount ?? 0,
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1h6z" />
                </svg>
            ),
        },
        {
            name: 'Wilayah',
            href: route('locations.index'),
            current: route().current('locations.*'),
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        ...(isAdmin ? [
            {
                name: 'Pengaturan',
                href: route('settings.index'),
                current: route().current('settings.*'),
                icon: (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                ),
            },
            {
                name: 'Operator',
                href: route('users.index'),
                current: route().current('users.*'),
                icon: (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ),
            },
        ] : []),
        {
            name: 'Profil',
            href: route('profile.edit'),
            current: route().current('profile.*'),
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
    ];

    const currentTitle = navigation.find(n => n.current)?.name ?? (route().current('profile.*') ? 'Profil' : 'Portal');

    return (
        <div className="pv-shell">
            {/* ── Sidebar ── */}
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-navy-900/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside className={`pv-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Navigasi sidebar">
                {/* Logo */}
                <Link href={route('dashboard')} className="pv-sidebar-logo">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 shadow-md flex-shrink-0">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-sm font-black tracking-wider text-navy-900 font-mono leading-none">
                            PORT<span className="text-primary-500">VISION</span>
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mt-0.5">
                            Operasi Jaringan
                        </div>
                    </div>
                </Link>

                {/* Nav links */}
                <nav className="pv-sidebar-nav" aria-label="Navigasi utama">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`pv-sidebar-link${item.current ? ' is-active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                            aria-current={item.current ? 'page' : undefined}
                        >
                            <NavIcon>{item.icon}</NavIcon>
                            <span>{item.name}</span>
                            {item.name === 'Alerts' && item.badge ? (
                                <span
                                    className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                                    aria-label={`${item.badge} alert aktif`}
                                >
                                    {item.badge}
                                </span>
                            ) : (
                                <span className="pv-nav-dot" aria-hidden="true" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* NOC Live card */}
                <div className="pv-sidebar-noc-card">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-dot-blink flex-shrink-0" aria-hidden="true" />
                        <span className="font-bold tracking-wider text-xs uppercase">NOC LIVE</span>
                    </div>
                    <div className="text-white/80 text-[11px] leading-relaxed">
                        Pemantauan aktif real-time.<br />Pembaruan otomatis tiap 5 dtk.
                    </div>
                </div>
            </aside>

            {/* ── Main area ── */}
            <div className="pv-main">
                {/* Topbar */}
                <header className="pv-topbar">
                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        className="lg:hidden mr-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-400"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Buka menu navigasi"
                    >
                        <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Page breadcrumb / title */}
                    <div className="flex-1 min-w-0 text-sm font-semibold text-navy-900 truncate">
                        {currentTitle}
                    </div>

                    {/* Right utilities */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Dark / Light Mode Toggle */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-navy-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary-400"
                            aria-label={`Beralih ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
                            title={`Beralih ke mode ${theme === 'light' ? 'gelap' : 'terang'}`}
                        >
                            {theme === 'light' ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>

                        {/* NOC Live badge */}
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-dot-blink" aria-hidden="true" />
                            NOC LIVE
                        </span>

                        {/* Poll Ports */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={triggerQuickPoll}
                                disabled={isPolling}
                                className="pv-btn pv-btn--outline text-xs"
                                aria-label="Mulai polling status port"
                            >
                                <svg className={`h-3.5 w-3.5 ${isPolling ? 'animate-spin text-primary-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">{isPolling ? 'Polling…' : 'Poll Port'}</span>
                            </button>
                        )}

                        {/* User menu / Profil Link */}
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5">
                            <Link
                                href={route('profile.edit')}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                title="Buka Pengaturan Profil"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white flex-shrink-0" aria-hidden="true">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden sm:block leading-none">
                                    <div className="text-xs font-semibold text-navy-900 max-w-[100px] truncate">{user.name}</div>
                                </div>
                            </Link>
                            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider rounded-md bg-primary-50 text-primary-600 px-1.5 py-0.5">
                                {user.role === 'admin' ? 'ADMIN' : 'VIEWER'}
                            </span>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="ml-1 text-gray-500 hover:text-rose-600 transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 rounded-lg"
                                aria-label="Keluar dari sistem"
                                title="Keluar"
                            >
                                <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-800" role="alert">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800" role="alert">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {flash.error}
                    </div>
                )}

                {/* Page header */}
                {header && (
                    <div className="border-b border-gray-200 bg-white px-6 py-4">
                        {header}
                    </div>
                )}

                {/* Main content */}
                <main className="pv-content">
                    {children}
                </main>

                {/* Alert toast (bottom-right) */}
                {alertToast && (
                    <div className="fixed bottom-5 right-5 z-50 flex items-start gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-xl" role="alert">
                        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500 animate-dot-blink" aria-hidden="true" />
                        <div>
                            <div className="text-sm font-bold text-navy-900">Alert Jaringan Baru</div>
                            <div className="text-xs text-gray-500">{alertToast}</div>
                        </div>
                        <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            onClick={() => setAlertToast(null)}
                            aria-label="Tutup notifikasi"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Footer */}
                <footer className="border-t border-gray-200 bg-white px-6 py-3 text-center text-xs text-gray-400 font-mono">
                    Portvision NOC Dashboard • Pemantauan Switch &amp; Port Real-Time LibreNMS
                </footer>
            </div>
        </div>
    );
}
