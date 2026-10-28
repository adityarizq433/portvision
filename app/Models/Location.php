<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'librenms_location_id', 'parent_id', 'description',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function topologyNodes(): HasMany
    {
        return $this->hasMany(TopologyNode::class);
    }

    public function topologyLinks(): HasMany
    {
        return $this->hasMany(TopologyLink::class);
    }

    /**
     * Summary counts for dashboard cards.
     */
    public function getSummaryAttribute(): array
    {
        $devices = $this->devices;
        return [
            'total'    => $devices->count(),
            'up'       => $devices->where('status', 'up')->count(),
            'down'     => $devices->where('status', 'down')->count(),
            'port_up'  => $devices->sum('port_up_count'),
            'port_down' => $devices->sum('port_down_count'),
        ];
    }
}
