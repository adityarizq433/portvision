<?php

namespace App\Console\Commands;

use App\Models\DeviceEvent;
use App\Models\PortEvent;
use Illuminate\Console\Command;

class CleanupLogsCommand extends Command
{
    protected $signature = 'portvision:cleanup-logs {--days=30 : Number of days to retain logs}';
    protected $description = 'Delete port and device event logs older than the specified days';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $portDeleted = PortEvent::where('occurred_at', '<', $cutoff)->delete();
        $deviceDeleted = DeviceEvent::where('occurred_at', '<', $cutoff)->delete();

        $this->info("Deleted {$portDeleted} port events and {$deviceDeleted} device events older than {$days} days.");

        return self::SUCCESS;
    }
}
