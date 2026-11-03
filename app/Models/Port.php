<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Port extends Model
{
    protected $fillable = [
        'device_id', 'librenms_port_id', 'if_name', 'if_descr', 'if_alias',
        'if_type', 'if_speed', 'oper_status', 'admin_status',
        'is_physical', 'is_critical', 'status_changed_at',
    ];

    protected $casts = [
        'is_physical'      => 'boolean',
        'is_critical'      => 'boolean',
        'status_changed_at' => 'datetime',
        'if_speed'         => 'integer',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PortEvent::class);
    }

    public function linksAsSource(): HasMany
    {
        return $this->hasMany(TopologyLink::class, 'source_port_id');
    }

    public function linksAsTarget(): HasMany
    {
        return $this->hasMany(TopologyLink::class, 'target_port_id');
    }

    /**
     * Display name: alias > descr > name
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->if_alias ?: ($this->if_descr ?: $this->if_name);
    }

    /**
     * Speed in human-readable Mbps/Gbps
     */
    public function getSpeedHumanAttribute(): ?string
    {
        if (! $this->if_speed) return null;
        if ($this->if_speed >= 1_000_000_000) {
            return round($this->if_speed / 1_000_000_000, 1) . ' Gbps';
        }
        return round($this->if_speed / 1_000_000, 0) . ' Mbps';
    }
}
