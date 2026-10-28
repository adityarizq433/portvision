<?php

namespace App\Console\Commands;

use App\Services\LibreNMS\SyncService;
use Illuminate\Console\Command;

class SyncDevices extends Command
{
    protected $signature   = 'portvision:sync-devices {--links : Also sync LLDP/CDP links}';
    protected $description = 'Synchronize devices and locations from LibreNMS';

    public function handle(SyncService $sync): int
    {
        $this->info('Syncing devices from LibreNMS...');
        $result = $sync->syncDevices();

        if (! $result['ok']) {
            $this->error($result['message'] ?? 'Unknown error');
            return self::FAILURE;
        }

        $this->line("✓ {$result['message']}");

        if ($this->option('links')) {
            $this->info('Syncing LLDP/CDP links...');
            $linkResult = $sync->syncLinks();
            $this->line("✓ {$linkResult['synced']} links synced");
        }

        return self::SUCCESS;
    }
}
