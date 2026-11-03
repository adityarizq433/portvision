<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Location;
use App\Services\LibreNMS\SyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    /**
     * Display a listing of network devices.
     */
    public function index(Request $request): Response
    {
        $query = Device::with('location')->latest('updated_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('hostname', 'like', "%{$search}%")
                    ->orWhere('ip', 'like', "%{$search}%")
                    ->orWhere('vendor', 'like', "%{$search}%")
                    ->orWhere('hardware', 'like', "%{$search}%");
            });
        }

        if ($locationId = $request->input('location_id')) {
            $query->where('location_id', $locationId);
        }

        if ($tier = $request->input('tier')) {
            $query->where('tier', $tier);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $devices = $query->paginate(15)->withQueryString();
        $locations = Location::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Devices/Index', [
            'devices' => $devices,
            'locations' => $locations,
            'filters' => [
                'search' => $request->input('search', ''),
                'location_id' => $request->input('location_id', ''),
                'tier' => $request->input('tier', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    /**
     * Display detailed status and physical port layout for a device.
     */
    public function show(Device $device): Response
    {
        $device->load([
            'location',
            'ports' => fn ($q) => $q->orderBy('is_physical', 'desc')->orderBy('if_name', 'asc'),
            'portEvents' => fn ($q) => $q->with('port:id,if_name,if_alias')->latest('occurred_at')->limit(30),
        ]);

        // Retrieve real-time port status from Redis cache if available
        $livePorts = null;
        try {
            $raw = Redis::get($device->portCacheKey());
            if ($raw) {
                $livePorts = json_decode($raw, true);
            }
        } catch (\Throwable) {
            $livePorts = null;
        }

        $allLocations = Location::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Devices/Show', [
            'device' => $device,
            'livePorts' => $livePorts,
            'allLocations' => $allLocations,
        ]);
    }

    /**
     * Update administrative attributes of a device.
     */
    public function update(Request $request, Device $device): RedirectResponse
    {
        $validated = $request->validate([
            'tier' => ['required', 'in:core,distribution,access,unknown'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'is_hidden' => ['boolean'],
        ]);

        $device->update($validated);

        return back()->with('success', "Device {$device->hostname} updated successfully.");
    }

    /**
     * Trigger immediate synchronization of devices from LibreNMS.
     */
    public function sync(SyncService $syncService): RedirectResponse
    {
        $result = $syncService->syncDevices();

        if ($result['ok']) {
            $portResult = $syncService->pollPortStatuses();
            $syncService->syncLinks();

            $msg = $result['message'];
            if (! empty($portResult['total'])) {
                $msg .= " and synced {$portResult['total']} ports.";
            }

            return back()->with('success', $msg);
        }

        return back()->with('error', $result['message'] ?? 'Device synchronization failed.');
    }
}
