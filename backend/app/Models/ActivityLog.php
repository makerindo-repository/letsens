<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user',
        'action',
        'module',
        'status',
        'ip',
        'details',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    /**
     * Helper to log system activity
     */
    public static function log(
        string $action,
        string $module = 'SISTEM',
        string $status = 'success',
        ?string $details = null,
        string $user = 'Super Admin',
        string $ip = '127.0.0.1'
    ): self {
        return self::create([
            'user' => $user,
            'action' => $action,
            'module' => $module,
            'status' => $status,
            'ip' => $ip,
            'details' => $details,
            'recorded_at' => now(),
        ]);
    }
}
