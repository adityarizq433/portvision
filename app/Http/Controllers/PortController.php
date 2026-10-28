<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Port;
use App\Services\LibreNMS\SyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class PortController extends Controller
{
    /**
     * Display a listing of ports with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Port::with('device:id,hostname,ip,status');

        if ($deviceId = $request->input('device_id')) {
            $query->where('device_id', $deviceId);
        }

        if ($operStatus = $request->input('oper_status')) {
            $query->where('oper_status', $operStatus);
        }

        if ($request->has('is_critical')) {
            $query->where('is_critical', $request->boolean('is_critical'));
        }

        if ($request->has('is_physical')) {
            $query->where('is_physical', $request->boolean('is_physical'));
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('if_name', 'like', "%{$search}%")
                    ->orWhere('if_descr', 'like', "%{$search}%")
                    ->orWhere('if_alias', 'like', "%{$search}%");
            });
        }

        $ports = $query->paginate(30)->withQueryString();

        return response()->json($ports);
    }

    /**
     * Display details and event timeline for a single port.
     */
    public function show(Port $port): JsonResponse
    {
        $port->load([
            'device:id,hostname,ip,vendor,model,status',
            'events' => fn ($q) => $q->latest('occurred_at')->limit(30),
            'linksAsSource.targetDevice:id,hostname',
            'linksAsTarget.sourceDevice:id,hostname',
        ]);

        return response()->json($port);
    }

    /**
     * Update port configuration (e.g. toggle critical monitoring status or alias).
     */
    public function update(Request $request, Port $port): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'is_critical' => ['required', 'boolean'],
            'if_alias' => ['nullable', 'string', 'max:255'],
        ]);

        $port->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'port' => $port]);
        }

        return back()->with('success', "Port {$port->display_name} updated successfully.");
    }

    /**
     * Manually trigger an immediate bulk poll of all port statuses.
     */
    public function poll(Request $request, SyncService $syncService): JsonResponse|RedirectResponse
    {
        $result = $syncService->pollPortStatuses();

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        if ($result['ok']) {
            return back()->with('success', "Polled {$result['total']} ports ({$result['changed']} changed status).");
        }

        return back()->with('error', $result['message'] ?? 'Port status poll failed.');
    }

    /**
     * Retrieve live sub-minute port status for a device from Redis cache.
     */
    public function live(Device $device): JsonResponse
    {
        try {
            $raw = Redis::get($device->portCacheKey());
            if ($raw) {
                return response()->json([
                    'source' => 'redis',
                    'ports' => json_decode($raw, true),
                ]);
            }
        } catch (\Throwable) {
            // Fall back to database query if Redis is unreachable
        }

        $ports = $device->ports()
            ->orderBy('is_physical', 'desc')
            ->orderBy('if_name', 'asc')
            ->get([
                'id as port_id',
                'librenms_port_id as lnms_port_id',
                'if_name',
                'if_alias',
                'oper_status',
                'admin_status',
                'is_physical',
                'is_critical',
            ]);

        return response()->json([
            'source' => 'database',
            'ports' => $ports,
        ]);
    }
}
