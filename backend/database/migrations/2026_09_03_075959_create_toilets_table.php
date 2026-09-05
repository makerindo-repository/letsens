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
        Schema::create('toilets', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. T-A1-F
            $table->string('name'); // e.g. Gedung A, Lt 1, Wanita
            $table->string('building')->default('Gedung A');
            $table->integer('floor')->default(1);
            $table->enum('gender', ['Wanita', 'Pria', 'Disabilitas', 'Unisex'])->default('Unisex');
            $table->boolean('occupied')->default(false);
            $table->integer('occupancy_duration_minutes')->default(0);
            $table->enum('door_status', ['Tertutup', 'Terbuka'])->default('Tertutup');
            $table->float('ammonia_ppm')->default(0.0);
            $table->float('temperature_c')->default(0.0);
            $table->float('humidity_percent')->default(0.0);
            $table->float('lux')->default(0.0);
            $table->float('soap_level_percent')->default(100.0);
            $table->float('tissue_level_percent')->default(100.0);
            $table->float('water_flow_lpm')->default(0.0);
            $table->integer('battery_percent')->default(100);
            $table->string('iot_device_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->json('facilities')->nullable();
            $table->enum('status', ['Online', 'Offline', 'Maintenance'])->default('Online');
            $table->timestamp('last_telemetry_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('toilets');
    }
};
