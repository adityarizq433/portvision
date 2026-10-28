<?php

namespace App\Services\LibreNMS;

use App\Models\Device;
use App\Models\Location;
use App\Models\Port;
use App\Models\PortEvent;
use App\Models\Setting;
use App\Models\TopologyLink;
use App\Models\TopologyNode;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

/**
 * Orchestrates all synchronization between LibreNMS and local DB/Redis.
 */
class SyncService
{
    public function __construct(private LibreNMSClient $client) {}

    // ------------------------------------------------------------------
    // Device + Port sync (runs every 5 minutes)
    // ------------------------------------------------------------------

    public function syncDevices(): array
    {
        if (! $this->client->isConfigured()) {
            return ['ok' => false, 'message' => 'LibreNMS not configured'];
        }

        $rawDevices = $this->client->getDevices();

        if (empty($rawDevices)) {
            return ['ok' => false, 'message' => 'No devices returned from LibreNMS'];
        }

        $synced = 0;
        $created = 0;

        foreach ($rawDevices as $raw) {
            $libreId = $raw['device_id'] ?? null;
            if (! $libreId) {
                continue;
            }

            $location = $this->resolveLocation($raw['location'] ?? null);

            $device = Device::updateOrCreate(
                ['librenms_device_id' => $libreId],
                [
                    'hostname' => $raw['hostname'] ?? 'unknown',
                    'ip' => $raw['ip'] ?? null,
                    'vendor' => $this->detectVendor($raw),
                    'model' => $raw['hardware'] ?? null,
                    'os' => $raw['os'] ?? null,
                    'os_version' => $raw['version'] ?? null,
                    'hardware' => $raw['hardware'] ?? null,
                    'serial' => $raw['serial'] ?? null,
                    'location_string' => $raw['location'] ?? null,
                    'location_id' => $location?->id,
                    'status' => ($raw['status'] ?? 0) == 1 ? 'up' : 'down',
                    'snmp_disable' => (bool) ($raw['snmp_disable'] ?? false),
                    'last_seen_at' => isset($raw['last_discovered'])
                        ? Carbon::parse($raw['last_discovered'])
                        : null,
                ]
            );

            if ($device->wasRecentlyCreated) {
                $created++;
            }
            $this->ensureTopologyNode($device, $location);

            $synced++;
        }

        Setting::setValue('last_device_sync_at', now()->toIso8601String());

        return [
            'ok' => true,
            'message' => "Synced {$synced} devices ({$created} new)",
            'total' => $synced,
            'created' => $created,
        ];
    }

    // ------------------------------------------------------------------
    // Bulk port status poll (runs every 5-10 seconds via scheduler)
    // ------------------------------------------------------------------

    public function pollPortStatuses(): array
    {
        if (! $this->client->isConfigured()) {
            return ['ok' => false, 'message' => 'LibreNMS not configured'];
        }

        $rawPorts = $this->client->getAllPorts();

        if (empty($rawPorts)) {
            return ['ok' => false, 'message' => 'No ports returned'];
        }

        // Build lookup: librenms_port_id => Port model
        $portMap = Port::all()->keyBy('librenms_port_id');

        // Build lookup: librenms_device_id => Device model
        $deviceMap = Device::all()->keyBy('librenms_device_id');

        $changed = 0;
        $events = [];

        // Group ports by device for Redis cache
        $portsByDevice = [];

        foreach ($rawPorts as $raw) {
            $portId = $raw['port_id'] ?? null;
            if (! $portId) {
                continue;
            }

            $newOperStatus = strtolower($raw['ifOperStatus'] ?? 'unknown');
            $newAdminStatus = strtolower($raw['ifAdminStatus'] ?? 'unknown');
            $ifType = $raw['ifType'] ?? '';
            $isPhysical = $ifType === 'ethernetCsmacd';

            $libreDeviceId = $raw['device_id'] ?? null;
            $device = $libreDeviceId ? $deviceMap->get($libreDeviceId) : null;
            if (! $device) {
                continue;
            }

            $port = $portMap->get($portId);

            $attributes = [
                'device_id' => $device->id,
                'if_name' => $raw['ifName'] ?? '',
                'if_descr' => $raw['ifDescr'] ?? null,
                'if_alias' => $raw['ifAlias'] ?? null,
                'if_type' => $ifType,
                'if_speed' => $raw['ifSpeed'] ?? null,
                'admin_status' => $newAdminStatus,
                'is_physical' => $isPhysical,
            ];

            if (! $port) {
                $port = Port::create(array_merge(['librenms_port_id' => $portId, 'oper_status' => $newOperStatus], $attributes));
            } else {
                $prevStatus = $port->oper_status;
                $port->fill($attributes);

                if ($prevStatus !== $newOperStatus) {
                    $port->oper_status = $newOperStatus;
                    $port->status_changed_at = now();

                    $events[] = [
                        'port_id' => $port->id,
                        'device_id' => $device->id,
                        'from_status' => $prevStatus,
                        'to_status' => $newOperStatus,
                        'occurred_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $changed++;
                }

                if ($port->isDirty()) {
                    $port->save();
                }
            }

            // Accumulate for Redis
            $portsByDevice[$device->id][$port->id] = [
                'port_id' => $port->id,
                'lnms_port_id' => $portId,
                'if_name' => $port->if_name,
                'if_alias' => $port->if_alias,
                'oper_status' => $newOperStatus,
                'admin_status' => $newAdminStatus,
                'is_physical' => $isPhysical,
                'is_critical' => $port->is_critical,
            ];
        }

        // Bulk insert events
        if (! empty($events)) {
            PortEvent::insert($events);
        }

        // Write to Redis (expire after poll_interval * 3 for safety)
        $ttl = (int) Setting::getValue('port_poll_interval', 7) * 3;
        Redis::pipeline(function ($pipe) use ($portsByDevice, $ttl) {
            foreach ($portsByDevice as $deviceId => $ports) {
                $pipe->setex("device:{$deviceId}:ports", $ttl, json_encode(array_values($ports)));
            }
            $pipe->set('portvision:last_port_poll', now()->toIso8601String());
        });

        // Update device port counters
        $this->updateDevicePortCounts($portsByDevice);

        Setting::setValue('last_port_poll_at', now()->toIso8601String());

        return [
            'ok' => true,
            'total' => count($rawPorts),
            'changed' => $changed,
        ];
    }

    // ------------------------------------------------------------------
    // LLDP/CDP link sync (runs every 5 minutes)
    // ------------------------------------------------------------------

    public function syncLinks(): array
    {
        if (! $this->client->isConfigured()) {
            return ['ok' => false, 'message' => 'LibreNMS not configured'];
        }

        $rawLinks = $this->client->getLinks();
        $deviceMap = Device::all()->keyBy('librenms_device_id');
        $portMap = Port::all()->keyBy('librenms_port_id');

        $synced = 0;
        foreach ($rawLinks as $raw) {
            $sourceDevice = $deviceMap->get($raw['local_device_id'] ?? null);
            $targetDevice = $deviceMap->get($raw['remote_device_id'] ?? null);

            if (! $sourceDevice || ! $targetDevice || $sourceDevice->id === $targetDevice->id) {
                continue;
            }

            $sourcePort = isset($raw['local_port_id']) ? $portMap->get($raw['local_port_id']) : null;
            $targetPort = isset($raw['remote_port_id']) ? $portMap->get($raw['remote_port_id']) : null;
            $localPortName = $raw['local_port_name'] ?? $raw['local_port'] ?? $sourcePort?->if_name ?? null;
            $remotePortName = $raw['remote_port_name'] ?? $raw['remote_port'] ?? $targetPort?->if_name ?? null;

            // If target port is not matched by ID, try resolving by remote port name
            if (! $targetPort && $remotePortName) {
                $targetPort = Port::where('device_id', $targetDevice->id)
                    ->where(function ($q) use ($remotePortName) {
                        $q->where('if_name', $remotePortName)
                            ->orWhere('if_descr', $remotePortName)
                            ->orWhere('if_alias', $remotePortName);
                    })->first();
            }

            // LibreNMS stores each link once per direction. Canonicalize the
            // pair so the same physical link is not drawn twice.
            if ($sourceDevice->id > $targetDevice->id) {
                [$sourceDevice, $targetDevice] = [$targetDevice, $sourceDevice];
                [$sourcePort, $targetPort] = [$targetPort, $sourcePort];
                [$localPortName, $remotePortName] = [$remotePortName, $localPortName];
            }

            $sourceType = strtolower((string) ($raw['protocol'] ?? 'lldp'));
            if (! in_array($sourceType, ['lldp', 'cdp', 'fdb_suggested', 'manual'], true)) {
                $sourceType = 'lldp';
            }

            $locationId = $sourceDevice->location_id ?? $targetDevice->location_id;

            // Remove any manual duplicate link between the same pair
            TopologyLink::where('source_type', 'manual')
                ->where(function ($q) use ($sourceDevice, $targetDevice) {
                    $q->where(function ($sub) use ($sourceDevice, $targetDevice) {
                        $sub->where('source_device_id', $sourceDevice->id)
                            ->where('target_device_id', $targetDevice->id);
                    })->orWhere(function ($sub) use ($sourceDevice, $targetDevice) {
                        $sub->where('source_device_id', $targetDevice->id)
                            ->where('target_device_id', $sourceDevice->id);
                    });
                })->delete();

            TopologyLink::updateOrCreate(
                [
                    'source_device_id' => $sourceDevice->id,
                    'target_device_id' => $targetDevice->id,
                    'source_type' => $sourceType,
                ],
                [
                    'source_port_id' => $sourcePort?->id,
                    'target_port_id' => $targetPort?->id,
                    'location_id' => $locationId,
                    'status' => 'active',
                    'local_port_name' => $localPortName,
                    'remote_port_name' => $remotePortName,
                ]
            );
            $synced++;
        }

        return ['ok' => true, 'synced' => $synced];
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private function resolveLocation(?string $locationName): ?Location
    {
        if (! $locationName) {
            return null;
        }

        return Location::firstOrCreate(
            ['name' => $locationName],
            ['slug' => Str::slug($locationName)]
        );
    }

    private function ensureTopologyNode(Device $device, ?Location $location = null): void
    {
        TopologyNode::firstOrCreate(
            ['device_id' => $device->id],
            [
                'location_id' => $location?->id,
                'x' => rand(50, 800),
                'y' => rand(50, 600),
                'is_locked' => false,
            ]
        );
    }

    private function detectVendor(array $raw): ?string
    {
        $os = strtolower($raw['os'] ?? '');
        $hardware = strtolower($raw['hardware'] ?? '');
        $sysDescr = strtolower($raw['sysDescr'] ?? '');

        if (str_contains($os, 'ios') || str_contains($hardware, 'cisco')) {
            return 'Cisco';
        }
        if (str_contains($os, 'junos') || str_contains($hardware, 'juniper')) {
            return 'Juniper';
        }
        if (str_contains($os, 'tplink') || str_contains($sysDescr, 'tp-link')) {
            return 'TP-Link';
        }
        if (str_contains($hardware, 'dell') || str_contains($os, 'ftos')) {
            return 'Dell';
        }

        return $raw['vendor'] ?? null;
    }

    private function updateDevicePortCounts(array $portsByDevice): void
    {
        foreach ($portsByDevice as $deviceId => $ports) {
            $physical = array_filter($ports, fn ($p) => $p['is_physical']);
            $up = array_filter($physical, fn ($p) => $p['oper_status'] === 'up');
            $down = array_filter($physical, fn ($p) => $p['oper_status'] === 'down');

            Device::where('id', $deviceId)->update([
                'port_count' => count($physical),
                'port_up_count' => count($up),
                'port_down_count' => count($down),
            ]);
        }
    }
}
