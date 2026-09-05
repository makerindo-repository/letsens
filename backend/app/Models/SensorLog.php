<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class SensorLog extends Model
{
    use HasFactory;

    protected $table = 'sensor_logs';

    protected $fillable = [
        'device_id',
        'toilet_id',
        'toilet_code',
        'temperature_c',
        'humidity_percent',
        'gas_index',
        'ammonia_ppm',
        'pir_presence',
        'occupied',
        'light_lux',
        'soap_level_percent',
        'tissue_level_percent',
        'water_flow_lpm',
        'status',
        'status_condition',
        'recorded_at',
    ];

    protected $casts = [
        'temperature_c' => 'float',
        'humidity_percent' => 'float',
        'gas_index' => 'float',
        'ammonia_ppm' => 'float',
        'pir_presence' => 'boolean',
        'occupied' => 'boolean',
        'light_lux' => 'float',
        'soap_level_percent' => 'float',
        'tissue_level_percent' => 'float',
        'water_flow_lpm' => 'float',
        'recorded_at' => 'datetime',
    ];

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderBy('recorded_at', 'desc');
    }

    public function scopeForToilet(Builder $query, string $toiletCode): Builder
    {
        return $query->where('toilet_code', $toiletCode);
    }

    public function toilet(): BelongsTo
    {
        return $this->belongsTo(Toilet::class, 'toilet_id');
    }
}