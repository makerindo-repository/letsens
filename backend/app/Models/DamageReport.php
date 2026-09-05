<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class DamageReport extends Model
{
    use HasFactory;

    protected $table = 'damage_reports';

    protected $fillable = [
        'ticket_code',
        'toilet_id',
        'toilet_code',
        'location_name',
        'category',
        'description',
        'reported_by',
        'reported_at',
        'severity',
        'status',
    ];

    public function scopeUnresolved(Builder $query): Builder
    {
        return $query->whereIn('status', ['Menunggu', 'Diteruskan ke Teknisi', 'Dalam Perbaikan', 'Proses']);
    }

    public function scopeUrgent(Builder $query): Builder
    {
        return $query->whereIn('severity', ['Tinggi', 'Darurat']);
    }

    public function toilet(): BelongsTo
    {
        return $this->belongsTo(Toilet::class, 'toilet_id');
    }

    public function repairTickets(): HasMany
    {
        return $this->hasMany(RepairTicket::class, 'damage_report_id');
    }
}
