<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Notification;
use App\Services\LibreNMS\LibreNMSClient;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller
{
    public function __construct(private LibreNMSClient $client) {}

    /**
     * Display the alerts page (active LibreNMS alerts: device down,
     * port down, custom rules, etc).
     */
    public function index(): Response
    {
        [$alerts, $summary] = $this->fetchAndMapAlerts();

        try {
            $notifications = Notification::with(['device:id,hostname,ip', 'port:id,if_name,if_alias,device_id'])
                ->latest('created_at')
                ->limit(50)
                ->get();
        } catch (QueryException $e) {
            $notifications = collect();
        }

        return Inertia::render('Alerts/Index', [
            'alerts' => $alerts,
            'summary' => $summary,
            'librenmsConnected' => $this->client->isConfigured(),
            'notifications' => $notifications,
        ]);
    }

    /**
     * JSON feed for polling: summary counters + active alerts.
     */
    public function data(): JsonResponse
    {
        [$alerts, $summary] = $this->fetchAndMapAlerts();

        try {
            $notifications = Notification::with(['device:id,hostname,ip', 'port:id,if_name,if_alias,device_id'])
                ->latest('created_at')
                ->limit(50)
                ->get();
        } catch (QueryException $e) {
            $notifications = collect();
        }

        return response()->json([
            'summary' => $summary,
            'alerts' => $alerts,
            'notifications' => $notifications,
        ]);
    }

    /**
     * @return array{0: array<int, array<string, mixed>>, 1: array<string, int>}
     */
    private function fetchAndMapAlerts(): array
    {
        $emptySummary = ['active' => 0, 'critical' => 0, 'warning' => 0];

        if (! $this->client->isConfigured()) {
            return [[], $emptySummary];
        }

        $devices = Device::all(['id', 'librenms_device_id', 'hostname', 'ip'])
            ->keyBy('librenms_device_id');

        $mapped = [];
        foreach ($this->client->getAlerts() as $raw) {
            $mapped[] = $this->mapAlert($raw, $devices);
        }

        $active = array_values(array_filter($mapped, fn ($a) => $a['is_active']));

        $summary = [
            'active' => count($active),
            'critical' => count(array_filter($active, fn ($a) => $a['severity'] === 'critical')),
            'warning' => count(array_filter($active, fn ($a) => $a['severity'] === 'warning')),
        ];

        return [$active, $summary];
    }

    /**
     * Normalize a raw LibreNMS alert into the shape the frontend expects.
     *
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    private function mapAlert(array $raw, $devices): array
    {
        $libreDeviceId = Arr::get($raw, 'device_id');
        $device = $devices->get($libreDeviceId);

        $state = (int) Arr::get($raw, 'state', 1);
        $severity = strtolower((string) Arr::get($raw, 'severity', 'warning'));

        return [
            'id' => Arr::get($raw, 'id'),
            'librenms_device_id' => $libreDeviceId,
            'device_id' => $device?->id,
            'hostname' => $device?->hostname ?? Arr::get($raw, 'hostname', 'Unknown'),
            'rule' => Arr::get($raw, 'name', 'Unknown rule'),
            'severity' => in_array($severity, ['ok', 'warning', 'critical'], true) ? $severity : 'warning',
            'state' => $state,
            'is_active' => in_array($state, [1, 3, 4], true),
            'timestamp' => Arr::get($raw, 'timestamp') ?? Arr::get($raw, 'last_updated'),
            'info' => strip_tags((string) Arr::get($raw, 'info', '')),
        ];
    }
}
