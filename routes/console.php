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

// ------------------------------------------------------------------
// Port status poll — every minute (Laravel scheduler minimum)
// Interval tuning via LIBRENMS_PORT_POLL_INTERVAL in .env
// ------------------------------------------------------------------
Schedule::command('portvision:poll-ports')
    ->everyMinute()
    ->withoutOverlapping();

// ------------------------------------------------------------------
// Cleanup old logs — daily, retain 30 days
// ------------------------------------------------------------------
Schedule::command('portvision:cleanup-logs')
    ->daily()
    ->withoutOverlapping();
