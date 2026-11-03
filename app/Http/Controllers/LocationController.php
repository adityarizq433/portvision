<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    /**
     * Display a listing of network locations and their device distribution.
     */
    public function index(): Response
    {
        $locations = Location::with(['parent:id,name'])
            ->withCount([
                'devices',
                'devices as devices_up_count' => fn ($q) => $q->where('status', 'up'),
                'devices as devices_down_count' => fn ($q) => $q->where('status', 'down'),
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('Locations/Index', [
            'locations' => $locations,
        ]);
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:locations,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'exists:locations,id'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        Location::create($validated);

        return back()->with('success', 'Location created successfully.');
    }

    /**
     * Update the specified location.
     */
    public function update(Request $request, Location $location): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:locations,name,'.$location->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'exists:locations,id', 'not_in:'.$location->id],
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $location->update($validated);

        return back()->with('success', 'Location updated successfully.');
    }

    /**
     * Remove the specified location from storage.
     */
    public function destroy(Location $location): RedirectResponse
    {
        // Nullify foreign keys on devices to prevent orphan issues
        $location->devices()->update(['location_id' => null]);
        $location->delete();

        return back()->with('success', 'Location deleted successfully.');
    }
}
