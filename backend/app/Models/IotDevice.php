<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class IotDevice extends Model
{
    use HasFactory;

    protected $table = 'iot_devices';

    protected $fillable = [
        'node_id',
        'name',
        'toilet_id',
        'toilet_code',
        'toilet_name',
        'building',
        'floor',
        'battery_percent',
        'battery_voltage',
        'power_source',
        'battery_status',
        'rssi',
        'rssi_quality',
        'wifi_ssid',
        'firmware_version',
        'hardware_version',
        'sensor_shield_version',
        'ota_status',
        'ip_address',
        'mac_address',
        'ping_latency_ms',
        'status',
        'connected_sensors',
        'reboot_count',
        'uptime',
        'last_telemetry_at',
    ];

    protected $casts = [
        'battery_percent' => 'integer',
        'battery_voltage' => 'float',
        'rssi' => 'integer',
        'ping_latency_ms' => 'integer',
        'reboot_count' => 'integer',
        'connected_sensors' => 'array',
        'last_telemetry_at' => 'datetime',
    ];

    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('status', 'Online');
    }

    public function scopeByNodeId(Builder $query, string $nodeId): Builder
    {
        return $query->where('node_id', $nodeId);
    }

    public function toilet(): BelongsTo
    {
        return $this->belongsTo(Toilet::class, 'toilet_id');
    }
}
