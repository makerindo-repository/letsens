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
        Schema::create('maintenance_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('toilet_id')->nullable()->constrained('toilets')->nullOnDelete();
            $table->string('toilet_code');
            $table->string('toilet_name');
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('staff_name');
            $table->string('shift')->default('Pagi (06:00 - 14:00)');
            $table->string('time_slot')->default('08:00 - 08:30 WIB');
            $table->enum('type', [
                'Pembersihan Rutin',
                'Inspeksi Berkala',
                'Deep Cleaning',
                'Restock Perlengkapan'
            ])->default('Pembersihan Rutin');
            $table->json('checklist')->nullable();
            $table->enum('status', ['Terjadwal', 'Sedang Berjalan', 'Selesai'])->default('Terjadwal');
            $table->text('notes')->nullable();
            $table->string('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_schedules');
    }
};
