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
        Schema::create('repair_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('repair_code')->unique(); // e.g. REP-2026-101
            $table->string('damage_ticket_code')->nullable();
            $table->foreignId('damage_report_id')->nullable()->constrained('damage_reports')->nullOnDelete();
            $table->foreignId('toilet_id')->nullable()->constrained('toilets')->nullOnDelete();
            $table->string('toilet_code');
            $table->string('location_name');
            $table->string('technician_name');
            $table->text('action_taken');
            $table->string('parts_replaced')->nullable();
            $table->bigInteger('cost_estimate_rp')->default(0);
            $table->string('started_at')->nullable();
            $table->string('completed_at')->nullable();
            $table->enum('status', [
                'Dalam Antrian',
                'Proses Pengerjaan',
                'Menunggu Sparepart',
                'Selesai'
            ])->default('Proses Pengerjaan');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repair_tickets');
    }
};
