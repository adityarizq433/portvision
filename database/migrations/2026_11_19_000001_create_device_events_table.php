<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->enum('from_status', ['up', 'down', 'unknown']);
            $table->enum('to_status', ['up', 'down', 'unknown']);
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['device_id', 'occurred_at']);
            $table->index(['occurred_at']);
            $table->index(['to_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_events');
    }
};
