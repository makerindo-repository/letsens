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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->string('nip')->unique();
            $table->string('name');
            $table->string('phone');
            $table->string('role')->default('Petugas Kebersihan');
            $table->enum('shift', [
                'Pagi (06:00 - 14:00)',
                'Siang (14:00 - 22:00)',
                'Malam (22:00 - 06:00)'
            ])->default('Pagi (06:00 - 14:00)');
            $table->string('assigned_building')->default('Gedung A');
            $table->enum('status', ['Bertugas', 'Istirahat', 'Siaga', 'Izin'])->default('Siaga');
            $table->float('rating')->default(5.0);
            $table->integer('completed_tasks_today')->default(0);
            $table->string('avatar')->nullable();
            $table->string('last_active')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
