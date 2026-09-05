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
        Schema::create('sensor_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->default('LETSENS-01');
            $table->foreignId('toilet_id')->nullable()->constrained('toilets')->nullOnDelete();
            $table->string('toilet_code')->nullable();
            $table->float('temperature_c')->nullable();
            $table->float('humidity_percent')->nullable();
            $table->float('gas_index')->nullable();
            $table->float('ammonia_ppm')->nullable();
            $table->boolean('pir_presence')->default(false);
            $table->boolean('occupied')->default(false);
            $table->float('light_lux')->nullable();
            $table->float('soap_level_percent')->nullable();
            $table->float('tissue_level_percent')->nullable();
            $table->float('water_flow_lpm')->nullable();
            $table->string('status')->default('NORMAL');
            $table->enum('status_condition', ['Normal', 'Waspada', 'Bahaya'])->default('Normal');
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sensor_logs');
    }
};
