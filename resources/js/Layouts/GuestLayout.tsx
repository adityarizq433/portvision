import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="pv-guest flex min-h-screen flex-col items-center bg-slate-50 px-4 py-10 sm:justify-center">
            <div className="mb-2">
                <Link href="/">
                    <span className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </span>
                        <span>
                            <span className="block text-lg font-extrabold tracking-tight text-slate-900">Port <span className="text-blue-700">Vision</span></span>
                            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Network operations</span>
                        </span>
                    </span>
                </Link>
            </div>

            <div className="pv-guest-card mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-xl shadow-slate-900/5 sm:max-w-md sm:px-8">
                {children}
            </div>
        </div>
    );
}
