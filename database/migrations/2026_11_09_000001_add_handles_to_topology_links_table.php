<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('topology_links')) {
            Schema::table('topology_links', function (Blueprint $table) {
                if (!Schema::hasColumn('topology_links', 'source_handle')) {
                    $table->string('source_handle')->nullable()->after('source_type');
                }
                if (!Schema::hasColumn('topology_links', 'target_handle')) {
                    $table->string('target_handle')->nullable()->after('source_handle');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('topology_links')) {
            Schema::table('topology_links', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('topology_links', 'source_handle')) {
                    $cols[] = 'source_handle';
                }
                if (Schema::hasColumn('topology_links', 'target_handle')) {
                    $cols[] = 'target_handle';
                }
                if ($cols) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};
