<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopologyNode extends Model
{
    protected $fillable = [
        'device_id', 'location_id', 'x', 'y', 'is_locked',
    ];

    protected $casts = [
        'x'         => 'float',
        'y'         => 'float',
        'is_locked' => 'boolean',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
