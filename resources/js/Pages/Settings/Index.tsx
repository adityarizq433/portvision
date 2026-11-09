import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { SystemSettings } from '@/types/models';
import React, { useState } from 'react';

interface Props { settings: SystemSettings; }

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-mono text-navy-900 placeholder-gray-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition';

export default function SettingsIndex({ settings }: Props) {
    const [url, setUrl] = useState(settings.librenms_url || '');
    const [token, setToken] = useState('');
    const [portPollInterval, setPortPollInterval] = useState(settings.port_poll_interval || 7);
    const [deviceSyncInterval, setDeviceSyncInterval] = useState(settings.device_sync_interval || 300);
    const [linkSyncInterval, setLinkSyncInterval] = useState(settings.link_sync_interval || 300);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string; version?: string } | null>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        router.post(route('settings.update'), {
            librenms_url: url, librenms_token: token || undefined,
            port_poll_interval: portPollInterval, device_sync_interval: deviceSyncInterval, link_sync_interval: linkSyncInterval,
        }, { preserveScroll: true, onFinish: () => { setIsSaving(false); setToken(''); } });
    };

    const handleTestConnection = async () => {
        setIsTesting(true); setTestResult(null);
        try {
            const res = await fetch('/api/settings/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '', 'Accept': 'application/json' },
                body: JSON.stringify({ librenms_url: url, librenms_token: token || undefined }),
            });
            setTestResult(await res.json());
        } catch (err: any) {
            setTestResult({ ok: false, message: err?.message || 'Koneksi gagal: Kesalahan jaringan' });
        } finally { setIsTesting(false); }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-navy-900">PENGATURAN SISTEM &amp; INTEGRASI</h1>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">Konfigurasi konektivitas REST API LibreNMS dan interval polling data</p>
                </div>
            }
        >
            <Head title="Pengaturan Sistem" />

            <div className="max-w-3xl space-y-6">
                {/* LibreNMS API Card */}
                <div className="pv-card">
                    <div className="pv-card-header">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-navy-900">Adapter REST API LibreNMS</div>
                                <div className="text-xs text-gray-500">Mengaktifkan telemetri switch dan pemantauan status port</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${settings.librenms_connected ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
                            <span className={`font-mono text-xs font-semibold ${settings.librenms_connected ? 'text-green-700' : 'text-red-600'}`}>
                                {settings.librenms_connected ? 'Terhubung' : 'Terputus'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-5">
                        {/* URL */}
                        <div>
                            <label htmlFor="set-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                URL Instance LibreNMS *
                            </label>
                            <input id="set-url" type="url" required placeholder="http://librenms.local atau https://noc.perusahaan.com"
                                value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} aria-describedby="set-url-hint" autoComplete="url" />
                            <p id="set-url-hint" className="mt-1.5 text-[11px] text-gray-500">Masukkan protokol dan alamat lengkap tanpa garis miring di akhir.</p>
                        </div>

                        {/* Token */}
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label htmlFor="set-token" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Token API LibreNMS</label>
                                {settings.librenms_has_token && (
                                    <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-green-700">
                                        <svg className="h-3 w-3" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Token terenkripsi tersimpan
                                    </span>
                                )}
                            </div>
                            <input id="set-token" type="password"
                                placeholder={settings.librenms_has_token ? '•••••••••••••••• (Biarkan kosong jika tidak ingin mengubah)' : 'Tempelkan token API (X-Auth-Token)'}
                                value={token} onChange={(e) => setToken(e.target.value)} className={inputCls} aria-describedby="set-token-hint" autoComplete="off" />
                            <p id="set-token-hint" className="mt-1.5 text-[11px] text-gray-500">Token disimpan secara terenkripsi menggunakan algoritma AES-256 di basis data.</p>
                        </div>

                        {/* Test Result */}
                        {testResult && (
                            <div className={`rounded-xl border p-4 font-mono text-sm ${testResult.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`} role="alert">
                                <div className="flex items-center gap-2 font-bold">
                                    {testResult.ok ? (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    )}
                                    <span>{testResult.ok ? 'Koneksi Berhasil Terverifikasi' : 'Uji Koneksi Gagal'}</span>
                                    {testResult.version && <span className="font-normal">(v{testResult.version})</span>}
                                </div>
                                <p className="mt-1 text-xs font-normal">{testResult.message}</p>
                            </div>
                        )}

                        {/* Polling Intervals */}
                        <div className="border-t border-gray-100 pt-5">
                            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Interval Polling &amp; Sinkronisasi</div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {[
                                    { label: 'Frekuensi Poll Port (dtk)', value: portPollInterval, setter: setPortPollInterval, min: 3, max: 300, hint: 'Direkomendasikan: 5–10 dtk' },
                                    { label: 'Interval Sync Perangkat (dtk)', value: deviceSyncInterval, setter: setDeviceSyncInterval, min: 30, max: 86400, hint: 'Default: 300 dtk (5 mnt)' },
                                    { label: 'Interval Sync Tautan (dtk)', value: linkSyncInterval, setter: setLinkSyncInterval, min: 30, max: 86400, hint: 'Default: 300 dtk (5 mnt)' },
                                ].map((field) => (
                                    <div key={field.label}>
                                        <label htmlFor={`set-${field.label.replace(/\s+/g,'-').toLowerCase()}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">{field.label}</label>
                                        <input id={`set-${field.label.replace(/\s+/g,'-').toLowerCase()}`} type="number" min={field.min} max={field.max} required value={field.value}
                                            onChange={(e) => field.setter(Number(e.target.value))}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-navy-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition" />
                                        <span className="mt-1 block text-[11px] text-gray-500">{field.hint}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                            <button type="button" onClick={handleTestConnection} disabled={isTesting} className="pv-btn pv-btn--outline">
                                <svg className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {isTesting ? 'Menguji…' : 'Uji Koneksi LibreNMS'}
                            </button>
                            <button type="submit" disabled={isSaving} className="pv-btn pv-btn--primary">
                                {isSaving ? 'Menyimpan…' : 'Simpan Pengaturan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
