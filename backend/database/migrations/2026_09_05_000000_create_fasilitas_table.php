<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fasilitas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_fasilitas');
            $table->string('toilet_id')->nullable();
            $table->string('toilet_code');
            $table->string('location');
            $table->string('building');
            $table->integer('floor')->default(1);
            $table->string('kategori')->default('Sanitasi & Kebersihan');
            $table->string('jumlah')->default('1 unit');
            $table->integer('stok_angka')->default(100);
            $table->string('unit')->default('unit');
            $table->string('kondisi')->default('Baik');
            $table->string('status')->default('Tersedia');
            $table->string('petugas_jawab')->nullable();
            $table->string('terakhir_diperiksa')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fasilitas');
    }
};
