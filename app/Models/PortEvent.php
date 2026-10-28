<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortEvent extends Model
{
    protected $fillable = [
        'port_id', 'device_id', 'from_status', 'to_status', 'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function port(): BelongsTo
    {
        return $this->belongsTo(Port::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Scope: only down events (uplink => down transitions)
     */
    public function scopeDown($query)
    {
        return $query->where('to_status', 'down');
    }

    /**
     * Scope: only up events
     */
    public function scopeUp($query)
    {
        return $query->where('to_status', 'up');
    }
}
