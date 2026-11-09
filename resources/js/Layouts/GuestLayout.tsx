import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="pv-guest">
            {/* Brand panel: collapse ke atas di mobile */}
            <div className="pv-guest-brand">
                <Link href="/" className="inline-flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-white rounded-2xl" aria-label="PortVision NOC - Beranda">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500 shadow-md sm:h-14 sm:w-14 sm:rounded-2xl">
                        <svg className="h-6 w-6 text-white sm:h-8 sm:w-8" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </span>
                    <span className="flex flex-col items-start">
                        <span className="text-lg font-black tracking-widest text-white font-mono leading-none sm:text-2xl">
                            PORT<span className="text-blue-200">VISION</span>
                        </span>
                        <span className="mt-1 text-[10px] font-semibold tracking-[0.25em] uppercase text-white/90 sm:text-[11px]">
                            Network Operations
                        </span>
                    </span>
                </Link>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/85 hidden sm:block">
                    Pemantauan switch dan port real-time untuk tim operasi jaringan.
                </p>
                <div className="mt-4 hidden sm:inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-dot-blink" aria-hidden="true" />
                    NOC LIVE: telemetri LibreNMS
                </div>
            </div>

            {/* Form panel */}
            <div className="w-full min-w-0 max-w-[26rem] flex-1 sm:flex-none">
                <div className="pv-guest-card">
                    {children}
                </div>
                <p className="mt-4 text-center text-[11px] text-white/80">
                    Hanya untuk tim NOC internal. Data dari LibreNMS.
                </p>
            </div>
        </div>
    );
}
