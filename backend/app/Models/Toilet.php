<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Toilet extends Model
{
    use HasFactory;

    protected $table = 'toilets';

    protected $fillable = [
        'code',
        'name',
        'building',
        'floor',
        'gender',
        'occupied',
        'occupancy_duration_minutes',
        'door_status',
        'ammonia_ppm',
        'temperature_c',
        'humidity_percent',
        'lux',
        'soap_level_percent',
        'tissue_level_percent',
        'water_flow_lpm',
        'battery_percent',
        'iot_device_id',
        'ip_address',
        'mac_address',
        'facilities',
        'status',
        'last_telemetry_at',
    ];

    protected $casts = [
        'occupied' => 'boolean',
        'occupancy_duration_minutes' => 'integer',
        'ammonia_ppm' => 'float',
        'temperature_c' => 'float',
        'humidity_percent' => 'float',
        'lux' => 'float',
        'soap_level_percent' => 'float',
        'tissue_level_percent' => 'float',
        'water_flow_lpm' => 'float',
        'battery_percent' => 'integer',
        'facilities' => 'array',
        'last_telemetry_at' => 'datetime',
    ];

    public function scopeOnline(Builder $query): Builder
    {
        return $query->where('status', 'Online');
    }

    public function scopeWarningOrMaintenance(Builder $query): Builder
    {
        return $query->whereIn('status', ['Offline', 'Maintenance'])
                     ->orWhere('ammonia_ppm', '>=', 10.0);
    }

    public function iotDevices(): HasMany
    {
        return $this->hasMany(IotDevice::class, 'toilet_id');
    }

    public function sensorLogs(): HasMany
    {
        return $this->hasMany(SensorLog::class, 'toilet_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(MaintenanceSchedule::class, 'toilet_id');
    }

    public function damageReports(): HasMany
    {
        return $this->hasMany(DamageReport::class, 'toilet_id');
    }

    public function repairTickets(): HasMany
    {
        return $this->hasMany(RepairTicket::class, 'toilet_id');
    }

    public function fasilitas(): HasMany
    {
        return $this->hasMany(Fasilitas::class, 'toilet_code', 'code');
    }
}