<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceEvent extends Model
{
    protected $fillable = [
        'device_id', 'from_status', 'to_status', 'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function scopeDown($query)
    {
        return $query->where('to_status', 'down');
    }

    public function scopeUp($query)
    {
        return $query->where('to_status', 'up');
    }
}
