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

            try {
                $table->dropUnique('topo_links_dev_type_uniq');
            } catch (\Exception $e) {
                // Unique mungkin belum ada, abaikan
            }
            $table->unique(['source_device_id', 'target_device_id', 'source_type', 'unresolved_hostname'], 'topo_links_dev_type_uniq');
        });
    }

    public function down(): void
    {
        Schema::table('topology_links', function (Blueprint $table) {
            try {
                $table->dropUnique('topo_links_dev_type_uniq');
            } catch (\Exception $e) {
                // abaikan
            }

            if (Schema::hasColumn('topology_links', 'unresolved_hostname')) {
                $table->dropColumn('unresolved_hostname');
            }

            if (Schema::hasColumn('topology_links', 'source_device_id')) {
                $table->unsignedBigInteger('source_device_id')->nullable()->change();
            }
            if (Schema::hasColumn('topology_links', 'target_device_id')) {
                $table->unsignedBigInteger('target_device_id')->nullable()->change();
            }

            $table->unique(['source_device_id', 'target_device_id', 'source_type'], 'topo_links_dev_type_uniq');
        });
    }
};
