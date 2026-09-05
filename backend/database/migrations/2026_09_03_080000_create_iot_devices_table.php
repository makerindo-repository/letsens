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
        Schema::create('iot_devices', function (Blueprint $table) {
            $table->id();
            $table->string('node_id')->unique(); // e.g. ESP32-TK-01A
            $table->string('name');
            $table->foreignId('toilet_id')->nullable()->constrained('toilets')->nullOnDelete();
            $table->string('toilet_code')->nullable();
            $table->string('toilet_name')->nullable();
            $table->string('building')->default('Gedung A');
            $table->integer('floor')->default(1);
            $table->integer('battery_percent')->default(100);
            $table->float('battery_voltage')->default(4.2);
            $table->enum('power_source', [
                'Baterai Li-Ion 18650',
                'Adaptor DC 5V (Mains)',
                'Hybrid Baterai & DC'
            ])->default('Adaptor DC 5V (Mains)');
            $table->enum('battery_status', [
                'Penuh / Normal',
                'Sedang Diisi (Charging)',
                'Rendah (Low)',
                'Kritis'
            ])->default('Penuh / Normal');
            $table->integer('rssi')->default(-60);
            $table->enum('rssi_quality', ['Sangat Baik', 'Baik', 'Cukup', 'Lemah'])->default('Baik');
            $table->string('wifi_ssid')->nullable();
            $table->string('firmware_version')->default('v2.4.2-unikom-prod');
            $table->string('hardware_version')->default('ESP32-WROOM-32D Rev 3');
            $table->string('sensor_shield_version')->default('LetSens Dual-MQ Shield v1.4');
            $table->enum('ota_status', [
                'Up to Date',
                'Update Tersedia (v2.5.0)',
                'Sedang Update'
            ])->default('Up to Date');
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->integer('ping_latency_ms')->default(15);
            $table->enum('status', ['Online', 'Warning', 'Offline', 'Kalibrasi'])->default('Online');
            $table->json('connected_sensors')->nullable();
            $table->integer('reboot_count')->default(0);
            $table->string('uptime')->nullable();
            $table->timestamp('last_telemetry_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('iot_devices');
    }
};
