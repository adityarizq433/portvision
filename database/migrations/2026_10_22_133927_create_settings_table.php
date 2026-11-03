<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        DB::table('settings')->insert([
            ['key' => 'librenms_url', 'value' => null, 'is_encrypted' => false, 'description' => 'LibreNMS base URL', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'librenms_token', 'value' => null, 'is_encrypted' => true, 'description' => 'LibreNMS API token (encrypted)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'port_poll_interval', 'value' => '7', 'is_encrypted' => false, 'description' => 'Port status poll interval in seconds', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'device_sync_interval', 'value' => '300', 'is_encrypted' => false, 'description' => 'Device sync interval in seconds', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'link_sync_interval', 'value' => '300', 'is_encrypted' => false, 'description' => 'LLDP/CDP link sync interval in seconds', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'librenms_connected', 'value' => '0', 'is_encrypted' => false, 'description' => 'LibreNMS connection status', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'last_port_poll_at', 'value' => null, 'is_encrypted' => false, 'description' => 'Timestamp of last successful port poll', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'last_device_sync_at', 'value' => null, 'is_encrypted' => false, 'description' => 'Timestamp of last successful device sync', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
