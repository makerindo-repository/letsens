<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceSchedule extends Model
{
    use HasFactory;

    protected $table = 'maintenance_schedules';

    protected $fillable = [
        'toilet_id',
        'toilet_code',
        'toilet_name',
        'staff_id',
        'staff_name',
        'shift',
        'time_slot',
        'type',
        'checklist',
        'status',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'checklist' => 'array',
    ];

    public function toilet(): BelongsTo
    {
        return $this->belongsTo(Toilet::class, 'toilet_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
