<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('librenms_device_id')->unique();
            $table->string('hostname');
            $table->string('ip', 45)->nullable(); // supports IPv6
            $table->string('vendor')->nullable();  // Cisco, TP-Link, Juniper, Dell, etc.
            $table->string('model')->nullable();
            $table->string('os')->nullable();
            $table->string('os_version')->nullable();
            $table->string('hardware')->nullable();
            $table->string('serial')->nullable();
            $table->string('location_string')->nullable(); // raw from LibreNMS
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->enum('tier', ['core', 'distribution', 'access', 'unknown'])->default('unknown');
            $table->enum('status', ['up', 'down', 'unknown'])->default('unknown');
            $table->boolean('is_hidden')->default(false);
            $table->boolean('snmp_disable')->default(false);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('last_polled_at')->nullable();
            $table->unsignedSmallInteger('port_count')->default(0);
            $table->unsignedSmallInteger('port_up_count')->default(0);
            $table->unsignedSmallInteger('port_down_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'location_id']);
            $table->index(['tier']);
            $table->index(['hostname']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
