<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fasilitas extends Model
{
    use HasFactory;

    protected $table = 'fasilitas';

    protected $fillable = [
        'nama_fasilitas',
        'toilet_id',
        'toilet_code',
        'location',
        'building',
        'floor',
        'kategori',
        'jumlah',
        'stok_angka',
        'unit',
        'kondisi',
        'status',
        'petugas_jawab',
        'terakhir_diperiksa',
        'catatan',
    ];

    protected $casts = [
        'floor' => 'integer',
        'stok_angka' => 'integer',
    ];

    public function toilet()
    {
        return $this->belongsTo(Toilet::class, 'toilet_code', 'code');
    }
}
