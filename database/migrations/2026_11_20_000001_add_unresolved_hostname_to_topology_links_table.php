<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topology_links', function (Blueprint $table) {
            $table->dropUnique('topo_links_dev_type_uniq');
            $table->foreignId('source_device_id')->nullable()->constrained('devices')->nullOnDelete()->change();
            $table->foreignId('target_device_id')->nullable()->constrained('devices')->nullOnDelete()->change();
            $table->string('unresolved_hostname')->nullable()->after('target_device_id');
            $table->unique(['source_device_id', 'target_device_id', 'source_type', 'unresolved_hostname'], 'topo_links_dev_type_uniq');
        });
    }

    public function down(): void
    {
        Schema::table('topology_links', function (Blueprint $table) {
            $table->dropUnique('topo_links_dev_type_uniq');
            $table->dropColumn('unresolved_hostname');
            $table->foreignId('source_device_id')->nullable()->constrained('devices')->nullOnDelete()->change();
            $table->foreignId('target_device_id')->nullable()->constrained('devices')->nullOnDelete()->change();
            $table->unique(['source_device_id', 'target_device_id', 'source_type'], 'topo_links_dev_type_uniq');
        });
    }
};
