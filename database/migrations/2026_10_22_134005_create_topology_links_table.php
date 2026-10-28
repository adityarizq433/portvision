<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topology_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('target_device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('source_port_id')->nullable()->constrained('ports')->nullOnDelete();
            $table->foreignId('target_port_id')->nullable()->constrained('ports')->nullOnDelete();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            // Source of truth for this link
            $table->enum('source_type', ['lldp', 'cdp', 'fdb_suggested', 'manual'])->default('manual');
            // Administrative status
            $table->enum('status', ['active', 'suggested', 'rejected'])->default('active');
            $table->boolean('is_hidden')->default(false);
            $table->string('local_port_name')->nullable(); // raw port name from LLDP
            $table->string('remote_port_name')->nullable();
            $table->timestamps();

            $table->unique(['source_device_id', 'target_device_id', 'source_type'], 'topo_links_dev_type_uniq');
            $table->index(['location_id', 'status']);
            $table->index(['source_device_id']);
            $table->index(['target_device_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topology_links');
    }
};
