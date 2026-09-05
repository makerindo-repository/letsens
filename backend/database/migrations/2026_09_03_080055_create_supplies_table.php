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
        Schema::create('supplies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', [
                'Cairan & Kimia',
                'Kertas & Tisu',
                'Pewangi & Aerosol',
                'Alat Pembersih',
                'Hardware IoT'
            ])->default('Cairan & Kimia');
            $table->integer('stock')->default(0);
            $table->string('unit')->default('Pcs');
            $table->integer('min_threshold')->default(10);
            $table->string('location')->default('Gudang Utama');
            $table->string('last_restocked')->nullable();
            $table->bigInteger('price_per_unit')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplies');
    }
};
