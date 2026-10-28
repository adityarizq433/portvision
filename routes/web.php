<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\PortController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\TopologyController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Authenticated Routes (Viewers & Admins)
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/live', [DashboardController::class, 'liveStats'])->name('dashboard.live');

    // Devices
    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/{device}', [DeviceController::class, 'show'])->name('devices.show');

    // Ports
    Route::get('/api/ports', [PortController::class, 'index'])->name('ports.index');
    Route::get('/api/ports/{port}', [PortController::class, 'show'])->name('ports.show');
    Route::get('/api/devices/{device}/ports/live', [PortController::class, 'live'])->name('devices.ports.live');

    // Locations
    Route::get('/locations', [LocationController::class, 'index'])->name('locations.index');

    // Topology
    Route::get('/topology', [TopologyController::class, 'index'])->name('topology.index');
    Route::get('/api/topology/data', [TopologyController::class, 'data'])->name('topology.data');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin-Only Routes
    Route::middleware('admin')->group(function () {
        // Device Management
        Route::patch('/devices/{device}', [DeviceController::class, 'update'])->name('devices.update');
        Route::post('/devices/sync', [DeviceController::class, 'sync'])->name('devices.sync');

        // Port Management
        Route::patch('/api/ports/{port}', [PortController::class, 'update'])->name('ports.update');
        Route::post('/ports/poll', [PortController::class, 'poll'])->name('ports.poll');

        // Location Management
        Route::post('/locations', [LocationController::class, 'store'])->name('locations.store');
        Route::patch('/locations/{location}', [LocationController::class, 'update'])->name('locations.update');
        Route::delete('/locations/{location}', [LocationController::class, 'destroy'])->name('locations.destroy');

        // Topology Management
        Route::post('/api/topology/positions', [TopologyController::class, 'savePositions'])->name('topology.positions');
        Route::post('/api/topology/links', [TopologyController::class, 'saveLink'])->name('topology.links.save');
        Route::delete('/api/topology/links/{link}', [TopologyController::class, 'deleteLink'])->name('topology.links.delete');
        Route::post('/topology/sync', [TopologyController::class, 'sync'])->name('topology.sync');

        // Settings
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');
        Route::post('/api/settings/test-connection', [SettingController::class, 'testConnection'])->name('settings.test');

        // Users
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__.'/auth.php';
