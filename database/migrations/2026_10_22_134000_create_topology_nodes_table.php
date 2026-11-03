<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topology_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->unique()->constrained('devices')->cascadeOnDelete();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->double('x')->default(0);
            $table->double('y')->default(0);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            $table->index(['location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topology_nodes');
    }
};
