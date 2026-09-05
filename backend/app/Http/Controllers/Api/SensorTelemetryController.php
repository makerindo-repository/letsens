<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SensorLog;
use App\Models\Toilet;
use App\Models\IotDevice;

class SensorTelemetryController extends Controller
{
    /**
     * Get latest telemetry readings for all toilets or a specific toilet.
     */
    public function latest(Request $request)
    {
        $query = SensorLog::with('toilet');

        if ($request->has('toilet_code') && $request->toilet_code && $request->toilet_code !== 'ALL') {
            $query->where('toilet_code', $request->toilet_code);
        }

        if ($request->has('device_id') && $request->device_id && $request->device_id !== 'ALL') {
            $query->where('device_id', $request->device_id);
        }

        $latestLogs = $query->recent()->take($request->get('limit', 250))->get();
        $deviceMap = IotDevice::all()->keyBy('node_id');

        $mapped = $latestLogs->map(function ($log) use ($deviceMap) {
            $device = $deviceMap->get($log->device_id);
            $deviceName = $device ? $device->name : ($log->device_id ? "Perangkat {$log->device_id}" : 'Perangkat IoT');
            return [
                'id' => (string) $log->id,
                'timestamp' => $log->recorded_at ? $log->recorded_at->format('Y-m-d H:i:s') : $log->created_at->format('Y-m-d H:i:s'),
                'deviceId' => $log->device_id ?? $log->toilet_code,
                'nodeId' => $log->device_id ?? $log->toilet_code,
                'deviceName' => $deviceName,
                'toiletCode' => $log->toilet_code,
                'amoniaPPM' => (float) ($log->ammonia_ppm ?? $log->gas_index ?? 0.0),
                'temperatureC' => (float) ($log->temperature_c ?? 0.0),
                'humidityPercent' => (float) ($log->humidity_percent ?? 0.0),
                'lux' => (float) ($log->light_lux ?? 0.0),
                'occupied' => (bool) $log->occupied,
                'soapLevelPercent' => (float) ($log->soap_level_percent ?? 0.0),
                'tissueLevelPercent' => (float) ($log->tissue_level_percent ?? 0.0),
                'waterFlowLpm' => (float) ($log->water_flow_lpm ?? 0.0),
                'batteryPercent' => $device ? $device->battery_percent : 100,
                'batteryVoltage' => $device ? $device->battery_voltage : 4.2,
                'rssi' => $device ? $device->rssi : -50,
                'statusCondition' => $log->status_condition ?? 'Normal',
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mapped->count(),
            'data' => $mapped
        ], 200);
    }

    /**
     * Get historical sensor logs with filtering support.
     */
    public function history(Request $request)
    {
        $query = SensorLog::query();

        if ($request->has('toilet_code') && $request->toilet_code) {
            $query->where('toilet_code', $request->toilet_code);
        }

        if ($request->has('status_condition') && $request->status_condition) {
            $query->where('status_condition', $request->status_condition);
        }

        $perPage = (int) $request->get('per_page', 25);
        $logs = $query->recent()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs
        ], 200);
    }

    /**
     * Manual Ingest Telemetry Payload via HTTP API (ESP32 fallback).
     */
    public function store(Request $request)
    {
        $deviceId = $request->input('kode_perangkat') ?? $request->input('id_perangkat') ?? $request->input('device_id') ?? 'ESP32-TK-01A';

        // Auto-resolve toilet_code from device relationship database if not explicitly provided
        $iotDevice = \App\Models\IotDevice::where('node_id', $deviceId)->first();
        if ($iotDevice && !empty($iotDevice->toilet_code)) {
            $toiletCode = $iotDevice->toilet_code;
        } else {
            $toiletCode = $request->input('toilet_code') ?? $request->input('kode_toilet') ?? 'T-A1-M';
        }

        $ammoniaPpm = (float) ($request->input('amonia') ?? $request->input('ammonia_ppm') ?? $request->input('gas_index') ?? 0.0);
        $tempC = (float) ($request->input('suhu') ?? $request->input('temperature_c') ?? 0.0);
        $hum = (float) ($request->input('rh') ?? $request->input('humidity_percent') ?? 0.0);
        $pir = $request->has('PIR') ? (bool) $request->input('PIR') : ($request->input('pir_presence') ?? false);
        $occupied = $request->has('occupied') ? (bool) $request->input('occupied') : $pir;
        $lux = (float) ($request->input('cahaya') ?? $request->input('light_lux') ?? $request->input('lux') ?? 0.0);
        $rssi = (int) ($request->input('RSSI') ?? $request->input('rssi') ?? 0);
        $battery = (int) ($request->input('Baterai') ?? $request->input('battery_percent') ?? 0);
        $soap = (float) ($request->input('soap_level_percent') ?? $toilet?->soap_level_percent ?? 100.0);
        $tissue = (float) ($request->input('tissue_level_percent') ?? $toilet?->tissue_level_percent ?? 100.0);
        $waterFlow = (float) ($request->input('water_flow_lpm') ?? 0.0);
        $status = $request->input('status') ?? 'NORMAL';

        $now = now();

        $batteryVolt = (float) ($request->input('battery_voltage') ?? round(3.30 + ($battery / 100) * 0.90, 2));

        // 1. Find/create toilet record
        $toilet = Toilet::firstOrCreate(
            ['code' => $toiletCode],
            [
                'name' => "Bilik {$toiletCode}",
                'building' => 'Gedung A',
                'floor' => 1,
                'gender' => 'Pria',
                'status' => 'Online',
            ]
        );

        // 2. Update real-time state in toilets
        $toilet->update([
            'ammonia_ppm' => $ammoniaPpm,
            'temperature_c' => $tempC,
            'humidity_percent' => $hum,
            'lux' => $lux,
            'occupied' => $occupied,
            'water_flow_lpm' => $waterFlow,
            'battery_percent' => $battery,
            'last_telemetry_at' => $now,
            'status' => 'Online',
        ]);

        // 3. Create sensor_logs record
        $log = SensorLog::create([
            'device_id' => $deviceId,
            'toilet_id' => $toilet->id,
            'toilet_code' => $toiletCode,
            'temperature_c' => $tempC,
            'humidity_percent' => $hum,
            'gas_index' => $ammoniaPpm,
            'ammonia_ppm' => $ammoniaPpm,
            'pir_presence' => $pir,
            'occupied' => $occupied,
            'light_lux' => $lux,
            'soap_level_percent' => $toilet->soap_level_percent ?? 100.0,
            'tissue_level_percent' => $toilet->tissue_level_percent ?? 100.0,
            'water_flow_lpm' => $waterFlow,
            'status' => $status,
            'status_condition' => $ammoniaPpm >= 25 ? 'Bahaya' : ($ammoniaPpm >= 10 ? 'Waspada' : 'Normal'),
            'recorded_at' => $now,
        ]);

        // 4. Sync iot_devices
        IotDevice::updateOrCreate(
            ['node_id' => $deviceId],
            [
                'name' => "Node LetSens {$toiletCode}",
                'toilet_id' => $toilet->id,
                'toilet_code' => $toiletCode,
                'toilet_name' => $toilet->name,
                'battery_percent' => $battery,
                'battery_voltage' => $batteryVolt,
                'rssi' => $rssi,
                'status' => 'Online',
                'last_telemetry_at' => $now,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Paket data telemetri berhasil diterima dan disinkronkan!',
            'data' => $log
        ], 201);
    }

    /**
     * Clear/Truncate all sensor telemetry logs.
     */
    public function clear()
    {
        SensorLog::truncate();

        Toilet::query()->update([
            'ammonia_ppm' => 0.0,
            'temperature_c' => 25.0,
            'humidity_percent' => 60.0,
            'lux' => 350.0,
            'occupied' => false,
            'soap_level_percent' => 100.0,
            'tissue_level_percent' => 100.0,
            'water_flow_lpm' => 0.0,
            'status' => 'Offline',
            'last_telemetry_at' => null,
        ]);

        \App\Models\IotDevice::query()->update([
            'status' => 'Offline',
            'last_telemetry_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Semua data sensor telemetri berhasil dihapus!'
        ], 200);
    }
}
