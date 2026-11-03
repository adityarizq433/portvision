<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\LibreNMS\LibreNMSClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Display the system settings and LibreNMS integration configurations.
     */
    public function index(): Response
    {
        $hasToken = ! empty(Setting::getValue('librenms_token'));

        $settings = [
            'librenms_url' => Setting::getValue('librenms_url', ''),
            'librenms_has_token' => $hasToken,
            'port_poll_interval' => (int) Setting::getValue('port_poll_interval', 7),
            'device_sync_interval' => (int) Setting::getValue('device_sync_interval', 300),
            'link_sync_interval' => (int) Setting::getValue('link_sync_interval', 300),
            'librenms_connected' => (bool) Setting::getValue('librenms_connected', false),
            'last_port_poll_at' => Setting::getValue('last_port_poll_at'),
            'last_device_sync_at' => Setting::getValue('last_device_sync_at'),
        ];

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'librenms_url' => ['required', 'url'],
            'librenms_token' => ['nullable', 'string', 'max:255'],
            'port_poll_interval' => ['required', 'integer', 'min:3', 'max:300'],
            'device_sync_interval' => ['required', 'integer', 'min:30', 'max:86400'],
            'link_sync_interval' => ['required', 'integer', 'min:30', 'max:86400'],
        ]);

        $cleanUrl = preg_replace('#/(devices|ports|api(/v\d+)?)/?$#i', '', trim($validated['librenms_url']));
        Setting::setValue('librenms_url', rtrim($cleanUrl, '/'));

        if (! empty($validated['librenms_token'])) {
            Setting::setValue('librenms_token', $validated['librenms_token']);
        }

        Setting::setValue('port_poll_interval', (string) $validated['port_poll_interval']);
        Setting::setValue('device_sync_interval', (string) $validated['device_sync_interval']);
        Setting::setValue('link_sync_interval', (string) $validated['link_sync_interval']);

        return back()->with('success', 'Settings updated successfully.');
    }

    /**
     * Test LibreNMS API connectivity with the saved or provided credentials.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $rawUrl = $request->input('librenms_url') ?: Setting::getValue('librenms_url');
        $url = $rawUrl ? rtrim(preg_replace('#/(devices|ports|api(/v\d+)?)/?$#i', '', trim($rawUrl)), '/') : '';
        $token = $request->input('librenms_token') ?: Setting::getValue('librenms_token');

        if (empty($url) || empty($token)) {
            return response()->json([
                'ok' => false,
                'message' => 'LibreNMS URL and API Token are required.',
            ], 422);
        }

        $client = new LibreNMSClient($url, $token);
        $result = $client->testConnection();

        Setting::setValue('librenms_connected', $result['ok'] ? '1' : '0');

        return response()->json($result);
    }
}
