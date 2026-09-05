<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairTicket extends Model
{
    use HasFactory;

    protected $table = 'repair_tickets';

    protected $fillable = [
        'repair_code',
        'damage_ticket_code',
        'damage_report_id',
        'toilet_id',
        'toilet_code',
        'location_name',
        'technician_name',
        'action_taken',
        'parts_replaced',
        'cost_estimate_rp',
        'started_at',
        'completed_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'cost_estimate_rp' => 'integer',
    ];

    public function damageReport(): BelongsTo
    {
        return $this->belongsTo(DamageReport::class, 'damage_report_id');
    }

    public function toilet(): BelongsTo
    {
        return $this->belongsTo(Toilet::class, 'toilet_id');
    }
}
