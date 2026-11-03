<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopologyLink extends Model
{
    protected $fillable = [
        'source_device_id', 'target_device_id',
        'source_port_id', 'target_port_id',
        'location_id', 'source_type', 'status',
        'is_hidden', 'local_port_name', 'remote_port_name',
    ];

    protected $casts = [
        'is_hidden' => 'boolean',
    ];

    public function sourceDevice(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'source_device_id');
    }

    public function targetDevice(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'target_device_id');
    }

    public function sourcePort(): BelongsTo
    {
        return $this->belongsTo(Port::class, 'source_port_id');
    }

    public function targetPort(): BelongsTo
    {
        return $this->belongsTo(Port::class, 'target_port_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Is link confirmed (not a suggestion)?
     */
    public function getIsConfirmedAttribute(): bool
    {
        return in_array($this->source_type, ['lldp', 'cdp', 'manual']);
    }
}
