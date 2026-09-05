<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supply extends Model
{
    use HasFactory;

    protected $table = 'supplies';

    protected $fillable = [
        'name',
        'category',
        'stock',
        'unit',
        'min_threshold',
        'location',
        'last_restocked',
        'price_per_unit',
    ];

    protected $casts = [
        'stock' => 'integer',
        'min_threshold' => 'integer',
        'price_per_unit' => 'integer',
    ];
}
