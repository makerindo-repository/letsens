<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staff';

    protected $fillable = [
        'nip',
        'name',
        'phone',
        'email',
        'role',
        'shift',
        'assigned_building',
        'status',
        'rating',
        'completed_tasks_today',
        'avatar',
        'last_active',
    ];

    protected $casts = [
        'rating' => 'float',
        'completed_tasks_today' => 'integer',
    ];

    public function schedules(): HasMany
    {
        return $this->hasMany(MaintenanceSchedule::class, 'staff_id');
    }
}
