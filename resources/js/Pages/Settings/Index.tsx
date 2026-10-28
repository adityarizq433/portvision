import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { SystemSettings } from '@/types/models';
import React, { useState } from 'react';

interface Props {
    settings: SystemSettings;
}

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
        router.post(
            route('settings.update'),
            {
                librenms_url: url,
                librenms_token: token || undefined,
                port_poll_interval: portPollInterval,
                device_sync_interval: deviceSyncInterval,
                link_sync_interval: linkSyncInterval,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSaving(false);
                    setToken('');
                },
            }
        );
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/settings/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    librenms_url: url,
                    librenms_token: token || undefined,
                }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err: any) {
            setTestResult({
                ok: false,
                message: err?.message || 'Connection failed: Network error',
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                        <span>SYSTEM SETTINGS & INTEGRATIONS</span>
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                        Configure LibreNMS REST API connectivity, encrypted credentials, and polling intervals
                    </p>
                </div>
            }
        >
            <Head title="System Settings" />

            <div className="max-w-4xl space-y-6">
                {/* LibreNMS API Credentials Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                                    LibreNMS REST API Adapter
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Enables switch telemetry and port state polling
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    settings.librenms_connected
                                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                        : 'bg-rose-500'
                                }`}
                            />
                            <span className="text-xs font-mono text-slate-300">
                                {settings.librenms_connected ? 'Connected' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="mt-6 space-y-5">
                        {/* LibreNMS Base URL */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                                LibreNMS Instance Base URL *
                            </label>
                            <input
                                type="url"
                                required
                                placeholder="http://librenms.local or https://noc.example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                Enter the full protocol and domain without trailing slash.
                            </p>
                        </div>

                        {/* LibreNMS API Token */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-300 font-mono">
                                    LibreNMS API Token
                                </label>
                                {settings.librenms_has_token && (
                                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                                        <span>🔒 Encrypted token saved</span>
                                    </span>
                                )}
                            </div>
                            <input
                                type="password"
                                placeholder={
                                    settings.librenms_has_token
                                        ? '•••••••••••••••••••••••• (Leave blank to keep existing)'
                                        : 'Paste 32-character X-Auth-Token'
                                }
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                Token is securely encrypted with AES-256 in the database and never exposed to the frontend.
                            </p>
                        </div>

                        {/* Test Connection Result Box */}
                        {testResult && (
                            <div
                                className={`rounded-lg border p-3.5 text-xs font-mono ${
                                    testResult.ok
                                        ? 'border-emerald-800 bg-emerald-950/70 text-emerald-300'
                                        : 'border-rose-800 bg-rose-950/70 text-rose-300'
                                }`}
                            >
                                <div className="font-bold flex items-center gap-2">
                                    <span>{testResult.ok ? '✓ Connection Verified' : '⚠ Test Failed'}</span>
                                    {testResult.version && <span>(Version: {testResult.version})</span>}
                                </div>
                                <p className="mt-1">{testResult.message}</p>
                            </div>
                        )}

                        {/* Intervals Config */}
                        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                                    Port Poll Frequency (sec)
                                </label>
                                <input
                                    type="number"
                                    min="3"
                                    max="300"
                                    required
                                    value={portPollInterval}
                                    onChange={(e) => setPortPollInterval(Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 mt-0.5 block">Recommended: 5–10s</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                                    Device Sync Interval (sec)
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    max="86400"
                                    required
                                    value={deviceSyncInterval}
                                    onChange={(e) => setDeviceSyncInterval(Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 300s (5m)</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                                    Link Sync Interval (sec)
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    max="86400"
                                    required
                                    value={linkSyncInterval}
                                    onChange={(e) => setLinkSyncInterval(Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 300s (5m)</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-all disabled:opacity-50"
                            >
                                <span className={isTesting ? 'animate-spin' : ''}>⚡</span>
                                <span>{isTesting ? 'Testing Link...' : 'Test LibreNMS Connection'}</span>
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-900/30 hover:bg-cyan-500 transition-all disabled:opacity-50"
                            >
                                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
