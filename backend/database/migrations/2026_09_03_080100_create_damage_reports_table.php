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
        Schema::create('damage_reports', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_code')->unique(); // e.g. DMG-2026-079
            $table->foreignId('toilet_id')->nullable()->constrained('toilets')->nullOnDelete();
            $table->string('toilet_code');
            $table->string('location_name');
            $table->enum('category', [
                'Plumbing & Air',
                'Sensor & IoT',
                'Sanitasi & Kloset',
                'Elektrikal & Lampu'
            ])->default('Plumbing & Air');
            $table->text('description');
            $table->string('reported_by')->default('LetSens AI Auto-Detection');
            $table->string('reported_at')->nullable();
            $table->enum('severity', ['Rendah', 'Sedang', 'Tinggi', 'Darurat'])->default('Sedang');
            $table->enum('status', [
                'Menunggu',
                'Diteruskan ke Teknisi',
                'Dalam Perbaikan',
                'Proses',
                'Selesai'
            ])->default('Menunggu');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('damage_reports');
    }
};
