<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ToiletController;
use App\Http\Controllers\Api\SensorTelemetryController;
use App\Http\Controllers\Api\IotDeviceController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\SupplyController;
use App\Http\Controllers\Api\MaintenanceScheduleController;
use App\Http\Controllers\Api\DamageReportController;
use App\Http\Controllers\Api\RepairTicketController;
use App\Http\Controllers\Api\FasilitasController;
use App\Http\Controllers\Api\LetsensAiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ActivityLogController;

/*
|--------------------------------------------------------------------------
| LetSens V1.0 REST API Routes
|--------------------------------------------------------------------------
*/

// Authentication Routes (Sanctum)
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'updatePassword']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

// Standard REST API Group with Throttle Middleware
Route::middleware('throttle:api')->group(function () {
    // Activity Logs API
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::post('/activity-logs', [ActivityLogController::class, 'store']);
    Route::delete('/activity-logs', [ActivityLogController::class, 'destroy']);
    // Fasilitas Toilet API Resources
    Route::apiResource('fasilitas', FasilitasController::class);

    // Toilet Management & Mobile App Check-In/Check-Out API
    Route::get('/toilets/{id}/qrcode', [ToiletController::class, 'getQrCode']);
    Route::post('/toilets/check-in', [ToiletController::class, 'checkIn']);
    Route::post('/toilets/check-out', [ToiletController::class, 'checkOut']);
    Route::apiResource('toilets', ToiletController::class);

    // Sensor Telemetry History & Latest Reading API
    Route::get('/sensor-logs/latest', [SensorTelemetryController::class, 'latest']);
    Route::get('/sensor-logs/history', [SensorTelemetryController::class, 'history']);
    Route::delete('/sensor-logs', [SensorTelemetryController::class, 'clear']);

    // IoT Device Management & Remote Commands API Resources
    Route::apiResource('iot-devices', IotDeviceController::class);
    Route::post('/iot-devices/{id}/reboot', [IotDeviceController::class, 'reboot']);
    Route::post('/iot-devices/{id}/calibrate', [IotDeviceController::class, 'calibrate']);
    Route::post('/iot-devices/{id}/ota-update', [IotDeviceController::class, 'otaUpdate']);

    // Sanitation Staff API & WhatsApp Dispatch
    Route::apiResource('staff', StaffController::class);
    Route::post('/dispatch/whatsapp', [StaffController::class, 'dispatchWhatsapp']);

    // Inventory Supplies API Resources
    Route::apiResource('supplies', SupplyController::class);
    Route::patch('/supplies/{id}/stock', [SupplyController::class, 'adjustStock']);

    // Maintenance Schedules API
    Route::apiResource('schedules', MaintenanceScheduleController::class);
    Route::patch('/schedules/{id}/checklist', [MaintenanceScheduleController::class, 'toggleChecklist']);
    Route::post('/schedules/{id}/complete', [MaintenanceScheduleController::class, 'complete']);

    // Damage Reports API
    Route::apiResource('damages', DamageReportController::class);
    Route::post('/damages/{id}/dispatch', [DamageReportController::class, 'dispatchToRepair']);

    // Repair Tickets API
    Route::apiResource('repairs', RepairTicketController::class);
    Route::patch('/repairs/{id}/status', [RepairTicketController::class, 'updateStatus']);

    // LetSens AI Proxy Analytics Endpoint
    Route::post('/letsens-ai/analyze', [LetsensAiController::class, 'analyze']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/{group}', [SettingController::class, 'show']);
    Route::put('/settings/{group}', [SettingController::class, 'update']);
    Route::post('/settings/mqtt/test', [SettingController::class, 'testMqtt']);
    Route::post('/settings/gemini/test', [SettingController::class, 'testGeminiKey']);
});

// High-Frequency Ingestion Group (ESP32 HTTP Telemetry)
Route::middleware('throttle:sensor-ingestion')->group(function () {
    Route::post('/sensor-logs', [SensorTelemetryController::class, 'store']);
    Route::post('/sensors/data', [SensorTelemetryController::class, 'store']);
    Route::post('/sensor-telemetry/store', [SensorTelemetryController::class, 'store']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
