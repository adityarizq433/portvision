<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'librenms_device_id', 'hostname', 'ip', 'vendor', 'model',
        'os', 'os_version', 'hardware', 'serial', 'location_string',
        'location_id', 'tier', 'status', 'is_hidden', 'snmp_disable',
        'last_seen_at', 'last_polled_at', 'port_count', 'port_up_count', 'port_down_count',
    ];

    protected $casts = [
        'is_hidden'      => 'boolean',
        'snmp_disable'   => 'boolean',
        'last_seen_at'   => 'datetime',
        'last_polled_at' => 'datetime',
        'port_count'     => 'integer',
        'port_up_count'  => 'integer',
        'port_down_count' => 'integer',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function ports(): HasMany
    {
        return $this->hasMany(Port::class);
    }

    public function physicalPorts(): HasMany
    {
        return $this->hasMany(Port::class)->where('is_physical', true);
    }

    public function portEvents(): HasMany
    {
        return $this->hasMany(PortEvent::class);
    }

    public function topologyNode(): HasOne
    {
        return $this->hasOne(TopologyNode::class);
    }

    public function linksAsSource(): HasMany
    {
        return $this->hasMany(TopologyLink::class, 'source_device_id');
    }

    public function linksAsTarget(): HasMany
    {
        return $this->hasMany(TopologyLink::class, 'target_device_id');
    }

    /**
     * Whether this device has any ports down.
     */
    public function getHasPortDownAttribute(): bool
    {
        return $this->port_down_count > 0;
    }

    /**
     * Redis cache key for port statuses.
     */
    public function portCacheKey(): string
    {
        return "device:{$this->id}:ports";
    }
}
