<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->unsignedBigInteger('librenms_port_id')->unique();
            $table->string('if_name');       // e.g. fa22, GigabitEthernet0/1
            $table->string('if_descr')->nullable();
            $table->string('if_alias')->nullable();
            $table->string('if_type')->nullable(); // ethernetCsmacd, etc.
            $table->unsignedBigInteger('if_speed')->nullable(); // bps
            $table->enum('oper_status', ['up', 'down', 'unknown'])->default('unknown');
            $table->enum('admin_status', ['up', 'down', 'testing', 'unknown'])->default('unknown');
            $table->boolean('is_physical')->default(false); // ifType = ethernetCsmacd
            $table->boolean('is_critical')->default(false); // admin-marked critical
            $table->timestamp('status_changed_at')->nullable();
            $table->timestamps();

            $table->index(['device_id', 'oper_status']);
            $table->index(['is_physical']);
            $table->index(['status_changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ports');
    }
};
