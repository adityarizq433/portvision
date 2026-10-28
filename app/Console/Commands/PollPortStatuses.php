<?php

namespace App\Console\Commands;

use App\Services\LibreNMS\LibreNMSClient;
use App\Services\LibreNMS\SyncService;
use Illuminate\Console\Command;

class PollPortStatuses extends Command
{
    protected $signature   = 'portvision:poll-ports';
    protected $description = 'Bulk-poll all port statuses from LibreNMS and update Redis cache';

    public function handle(SyncService $sync): int
    {
        $this->info('Polling port statuses from LibreNMS...');

        $result = $sync->pollPortStatuses();

        if (! $result['ok']) {
            $this->error($result['message'] ?? 'Unknown error');
            return self::FAILURE;
        }

        $this->line("✓ {$result['total']} ports polled, {$result['changed']} status changes detected");

        return self::SUCCESS;
    }
}
