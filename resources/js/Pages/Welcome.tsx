import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }: { auth: { user: unknown } }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
            <Head title="PortVision NOC" />
            <main className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm" aria-labelledby="pv-title">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500" aria-hidden="true">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 id="pv-title" className="text-xl font-black tracking-widest text-navy-900 font-mono">PORTVISION NOC</h1>
                <p className="mt-2 text-sm text-gray-500">Dasbor pemantauan switch dan port real-time untuk tim operasi jaringan.</p>
                {auth.user ? (
                    <Link href={route('dashboard')} className="pv-btn pv-btn--primary mt-6 w-full justify-center">Buka Dashboard</Link>
                ) : (
                    <div className="mt-6 flex flex-col gap-2">
                        <Link href={route('login')} className="pv-btn pv-btn--primary w-full justify-center">Masuk ke Dashboard</Link>
                    </div>
                )}
                <p className="mt-4 text-[11px] text-gray-500">Data berasal dari LibreNMS. Hanya untuk tim NOC internal.</p>
            </main>
        </div>
    );
}
