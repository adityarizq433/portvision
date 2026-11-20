<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topology_links', function (Blueprint $table) {
            if (! Schema::hasColumn('topology_links', 'source_device_id')) {
                $table->foreignId('source_device_id')->constrained('devices')->cascadeOnDelete();
            } else {
                $table->unsignedBigInteger('source_device_id')->nullable()->change();
            }

            if (! Schema::hasColumn('topology_links', 'target_device_id')) {
                $table->foreignId('target_device_id')->constrained('devices')->cascadeOnDelete();
            } else {
                $table->unsignedBigInteger('target_device_id')->nullable()->change();
            }

            if (! Schema::hasColumn('topology_links', 'unresolved_hostname')) {
                $table->string('unresolved_hostname')->nullable()->after('target_device_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('topology_links', function (Blueprint $table) {
            if (Schema::hasColumn('topology_links', 'unresolved_hostname')) {
                $table->dropColumn('unresolved_hostname');
            }

            if (Schema::hasColumn('topology_links', 'source_device_id')) {
                $table->unsignedBigInteger('source_device_id')->nullable()->change();
            }
            if (Schema::hasColumn('topology_links', 'target_device_id')) {
                $table->unsignedBigInteger('target_device_id')->nullable()->change();
            }
        });
    }
};
