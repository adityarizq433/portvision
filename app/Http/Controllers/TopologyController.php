<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Location;
use App\Models\TopologyLink;
use App\Models\TopologyNode;
use App\Services\LibreNMS\SyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TopologyController extends Controller
{
    /**
     * Display the visual network topology page.
     */
    public function index(Request $request): Response
    {
        $locations = Location::orderBy('name')->get(['id', 'name']);
        $selectedLocationId = $request->filled('location_id') ? (int) $request->input('location_id') : null;

        return Inertia::render('Topology/Index', [
            'locations' => $locations,
            'selectedLocationId' => $selectedLocationId,
        ]);
    }

    /**
     * Return React Flow nodes and edges for the specified location or full network.
     */
    public function data(Request $request): JsonResponse
    {
        $locationId = $request->input('location_id');

        $deviceQuery = Device::where('is_hidden', false);
        if ($locationId) {
            $deviceQuery->where('location_id', $locationId);
        }
        $devices = $deviceQuery->with(['topologyNode', 'location:id,name'])->get();

        $deviceIds = $devices->pluck('id')->all();

        $linkQuery = TopologyLink::with(['sourcePort', 'targetPort', 'sourceDevice', 'targetDevice'])
            ->where('is_hidden', false)
            ->whereIn('source_device_id', $deviceIds)
            ->whereIn('target_device_id', $deviceIds);

        $links = $linkQuery->get();

        // Transform into React Flow node objects
        $nodes = $devices->map(function (Device $device, int $index) {
            $node = $device->topologyNode;
            $x = $node?->x ?? (150 + ($index % 5) * 220);
            $y = $node?->y ?? (100 + floor($index / 5) * 180);

            return [
                'id' => "device-{$device->id}",
                'type' => 'deviceNode',
                'position' => ['x' => (float) $x, 'y' => (float) $y],
                'data' => [
                    'id' => $device->id,
                    'hostname' => $device->hostname,
                    'ip' => $device->ip,
                    'vendor' => $device->vendor,
                    'model' => $device->model,
                    'tier' => $device->tier,
                    'status' => $device->status,
                    'location_name' => $device->location?->name,
                    'port_count' => $device->port_count,
                    'port_up_count' => $device->port_up_count,
                    'port_down_count' => $device->port_down_count,
                    'is_locked' => (bool) ($node?->is_locked ?? false),
                ],
            ];
        });

        // Transform into React Flow edge objects
        $edges = $links->map(function (TopologyLink $link) {
            $isDown = ($link->sourceDevice?->status === 'down' || $link->targetDevice?->status === 'down');
            $status = $isDown ? 'down' : ($link->status ?? 'active');

            return [
                'id' => "link-{$link->id}",
                'source' => "device-{$link->source_device_id}",
                'target' => "device-{$link->target_device_id}",
                'type' => 'topologyEdge',
                'animated' => $status === 'active',
                'data' => [
                    'id' => $link->id,
                    'status' => $status,
                    'source_type' => $link->source_type,
                    'source_port' => $link->sourcePort?->display_name ?? $link->local_port_name ?? 'Port',
                    'target_port' => $link->targetPort?->display_name ?? $link->remote_port_name ?? 'Port',
                    'is_confirmed' => $link->is_confirmed,
                ],
            ];
        });

        return response()->json([
            'nodes' => $nodes,
            'edges' => $edges,
        ]);
    }

    /**
     * Save user-dragged node coordinates in the topology canvas.
     */
    public function savePositions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nodes' => ['required', 'array'],
            'nodes.*.device_id' => ['required', 'exists:devices,id'],
            'nodes.*.x' => ['required', 'numeric'],
            'nodes.*.y' => ['required', 'numeric'],
            'nodes.*.is_locked' => ['sometimes', 'boolean'],
        ]);

        foreach ($validated['nodes'] as $item) {
            $device = Device::find($item['device_id']);
            if (! $device) {
                continue;
            }

            TopologyNode::updateOrCreate(
                ['device_id' => $device->id],
                [
                    'location_id' => $device->location_id,
                    'x' => $item['x'],
                    'y' => $item['y'],
                    'is_locked' => $item['is_locked'] ?? false,
                ]
            );
        }

        return response()->json(['ok' => true, 'message' => 'Positions saved successfully.']);
    }

    /**
     * Create or edit a manual network link between two devices.
     */
    public function saveLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_device_id' => ['required', 'exists:devices,id'],
            'target_device_id' => ['required', 'exists:devices,id', 'different:source_device_id'],
            'source_port_id' => ['nullable', 'exists:ports,id'],
            'target_port_id' => ['nullable', 'exists:ports,id'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'status' => ['required', 'in:active,suggested,rejected'],
        ]);

        $sourceDevice = Device::find($validated['source_device_id']);

        // Check if link exists in either direction
        $link = TopologyLink::where(function ($q) use ($validated) {
            $q->where('source_device_id', $validated['source_device_id'])
                ->where('target_device_id', $validated['target_device_id']);
        })->orWhere(function ($q) use ($validated) {
            $q->where('source_device_id', $validated['target_device_id'])
                ->where('target_device_id', $validated['source_device_id']);
        })->first();

        if ($link) {
            $link->update([
                'source_port_id' => $validated['source_port_id'] ?? $link->source_port_id,
                'target_port_id' => $validated['target_port_id'] ?? $link->target_port_id,
                'location_id' => $validated['location_id'] ?? $link->location_id ?? $sourceDevice?->location_id,
                'status' => $validated['status'],
                'source_type' => 'manual',
            ]);
        } else {
            $link = TopologyLink::create([
                'source_device_id' => $validated['source_device_id'],
                'target_device_id' => $validated['target_device_id'],
                'source_port_id' => $validated['source_port_id'] ?? null,
                'target_port_id' => $validated['target_port_id'] ?? null,
                'location_id' => $validated['location_id'] ?? $sourceDevice?->location_id,
                'source_type' => 'manual',
                'status' => $validated['status'],
            ]);
        }

        return response()->json(['ok' => true, 'link' => $link]);
    }

    /**
     * Delete a topology link.
     */
    public function deleteLink(TopologyLink $link): JsonResponse
    {
        $link->delete();

        return response()->json(['ok' => true, 'message' => 'Link deleted successfully.']);
    }

    /**
     * Trigger immediate LLDP/CDP link synchronization.
     */
    public function sync(SyncService $syncService): RedirectResponse
    {
        $result = $syncService->syncLinks();

        if ($result['ok']) {
            return back()->with('success', "Synced {$result['synced']} topology links.");
        }

        return back()->with('error', $result['message'] ?? 'Link synchronization failed.');
    }
}
