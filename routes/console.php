<?php

use Illuminate\Support\Facades\Schedule;

// ------------------------------------------------------------------
// Device + location sync — every 5 minutes
// ------------------------------------------------------------------
Schedule::command('portvision:sync-devices')
    ->everyFiveMinutes()
    ->withoutOverlapping();

// ------------------------------------------------------------------
// LLDP/CDP link sync — every 5 minutes (offset by 30 seconds)
// ------------------------------------------------------------------
Schedule::command('portvision:sync-devices --links')
    ->everyFiveMinutes()
    ->withoutOverlapping();
