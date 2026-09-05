<?php

use Illuminate\Support\Facades\Route;
use App\Models\SensorLog;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'system' => 'LetSens AIoT REST API Server',
        'institution' => 'Universitas Komputer Indonesia (UNIKOM)',
        'version' => 'v1.0-prod',
        'timestamp' => now()->toISOString(),
    ]);
});

Route::get('/api/latest-sensor-data', function () {
    $latestData = SensorLog::latest('created_at')->first();
    return response()->json([
        'success' => true,
        'data' => $latestData,
    ]);
});