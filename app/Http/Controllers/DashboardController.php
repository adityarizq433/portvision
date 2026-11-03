<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Location;
use App\Models\Port;
use App\Models\PortEvent;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the main network operations dashboard.
     */
    public function index(): Response
    {
        return Inertia::render('Dashboard', [
            'deviceStats' => fn () => [
                'total' => Device::count(),
                'up' => Device::where('status', 'up')->count(),
                'down' => Device::where('status', 'down')->count(),
                'unknown' => Device::where('status', 'unknown')->count(),
            ],
            'portStats' => fn () => [
                'total' => Port::where('is_physical', true)->count(),
                'up' => Port::where('is_physical', true)->where('oper_status', 'up')->count(),
                'down' => Port::where('is_physical', true)->where('oper_status', 'down')->count(),
                'critical_down' => Port::where('is_critical', true)->where('oper_status', 'down')->count(),
            ],
            'tierStats' => fn () => [
                'core' => Device::where('tier', 'core')->count(),
                'distribution' => Device::where('tier', 'distribution')->count(),
                'access' => Device::where('tier', 'access')->count(),
                'unknown' => Device::where('tier', 'unknown')->count(),
            ],
            'locations' => fn () => Location::withCount([
                'devices',
                'devices as devices_up_count' => fn ($query) => $query->where('status', 'up'),
                'devices as devices_down_count' => fn ($query) => $query->where('status', 'down'),
            ])->get(),
            'recentEvents' => fn () => PortEvent::with(['device:id,hostname,ip,status', 'port:id,if_name,if_alias,is_critical'])
                ->latest('occurred_at')
                ->limit(12)
                ->get(),
            'systemStatus' => fn () => [
                'librenms_url' => Setting::getValue('librenms_url'),
                'librenms_connected' => (bool) Setting::getValue('librenms_connected', false),
                'last_port_poll_at' => Setting::getValue('last_port_poll_at'),
                'last_device_sync_at' => Setting::getValue('last_device_sync_at'),
                'port_poll_interval' => (int) Setting::getValue('port_poll_interval', 7),
            ],
        ]);
    }

    /**
     * Return live status counts for live polling updates without full page reload.
     */
    public function liveStats(): JsonResponse
    {
        return response()->json([
            'deviceStats' => [
                'total' => Device::count(),
                'up' => Device::where('status', 'up')->count(),
                'down' => Device::where('status', 'down')->count(),
                'unknown' => Device::where('status', 'unknown')->count(),
            ],
            'portStats' => [
                'total' => Port::where('is_physical', true)->count(),
                'up' => Port::where('is_physical', true)->where('oper_status', 'up')->count(),
                'down' => Port::where('is_physical', true)->where('oper_status', 'down')->count(),
                'critical_down' => Port::where('is_critical', true)->where('oper_status', 'down')->count(),
            ],
            'last_port_poll_at' => Setting::getValue('last_port_poll_at'),
            'recentEvents' => PortEvent::with(['device:id,hostname,ip,status', 'port:id,if_name,if_alias,is_critical'])
                ->latest('occurred_at')
                ->limit(12)
                ->get(),
        ]);
    }
}
