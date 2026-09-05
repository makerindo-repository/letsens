<?php

namespace App\Services;

use App\Models\SensorLog;
use App\Models\Toilet;
use App\Models\IotDevice;
use App\Models\Setting;

class TelemetryService
{
    /**
     * Store incoming sensor telemetry log and update toilet and node states.
     */
    public function storeTelemetry(array $data): SensorLog
    {
        $toiletCode = $data['toilet_code'] ?? $data['kode_perangkat'] ?? 'T-A1-F';
        $toilet = Toilet::where('code', $toiletCode)->first();

        if (!$toilet) {
            $device = IotDevice::where('node_id', $toiletCode)->first();
            if ($device && $device->toilet_code) {
                $toiletCode = $device->toilet_code;
                $toilet = Toilet::where('code', $toiletCode)->first();
            }
        }

        $amoniaPpm = (float) ($data['amonia'] ?? $data['amoniaPPM'] ?? $data['ammonia_ppm'] ?? 0.0);
        $tempC = (float) ($data['suhu'] ?? $data['temperatureC'] ?? $data['temperature_c'] ?? 25.0);
        $humidity = (float) ($data['rh'] ?? $data['humidityPercent'] ?? $data['humidity_percent'] ?? 60.0);
        $occupied = filter_var($data['PIR'] ?? $data['occupied'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $warnThreshold = (float) Setting::getValue('amonia_warning_threshold', 10.0);
        $dangerThreshold = (float) Setting::getValue('amonia_danger_threshold', 25.0);

        $statusCondition = 'Normal';
        if ($amoniaPpm >= $dangerThreshold) {
            $statusCondition = 'Bahaya';
        } elseif ($amoniaPpm >= $warnThreshold) {
            $statusCondition = 'Waspada';
        }

        $nowStr = now()->format('H:i:s') . ' WIB';

        $log = SensorLog::create([
            'device_id' => $data['kode_perangkat'] ?? $toiletCode,
            'node_id' => $data['kode_perangkat'] ?? $toiletCode,
            'device_name' => $data['device_name'] ?? 'Node LetSens ' . $toiletCode,
            'toilet_code' => $toiletCode,
            'toilet_name' => $toilet ? $toilet->name : 'Toilet ' . $toiletCode,
            'building' => $toilet ? $toilet->building : 'Gedung A',
            'timestamp' => $nowStr,
            'amoniaPPM' => $amoniaPpm,
            'temperatureC' => $tempC,
            'humidityPercent' => $humidity,
            'lux' => (float) ($data['cahaya'] ?? $data['lux'] ?? 350.0),
            'occupied' => $occupied,
            'soapLevelPercent' => (int) ($toilet ? $toilet->soap_level_percent : 100),
            'tissueLevelPercent' => (int) ($toilet ? $toilet->tissue_level_percent : 100),
            'waterFlowLpm' => (float) ($data['water_flow_lpm'] ?? $data['waterFlowLpm'] ?? 0.0),
            'battery_percent' => (int) ($data['Baterai'] ?? $data['battery_percent'] ?? 100),
            'rssi' => (int) ($data['RSSI'] ?? $data['rssi'] ?? -55),
            'statusCondition' => $statusCondition,
        ]);

        // Update Toilet real-time state
        if ($toilet) {
            $toilet->update([
                'ammonia_ppm' => $amoniaPpm,
                'temperature_c' => $tempC,
                'humidity_percent' => $humidity,
                'occupied' => $occupied,
                'battery_percent' => (int) ($data['Baterai'] ?? $data['battery_percent'] ?? $toilet->battery_percent),
                'status' => 'Online',
                'last_telemetry_at' => now(),
            ]);
        }

        // Update IoT Device real-time state
        $nodeId = $data['kode_perangkat'] ?? 'ESP32-TK-01A';
        $iotDevice = IotDevice::where('node_id', $nodeId)->orWhere('toilet_code', $toiletCode)->first();
        if ($iotDevice) {
            $iotDevice->update([
                'battery_percent' => (int) ($data['Baterai'] ?? $data['battery_percent'] ?? $iotDevice->battery_percent),
                'rssi' => (int) ($data['RSSI'] ?? $data['rssi'] ?? $iotDevice->rssi),
                'status' => 'Online',
                'last_telemetry_at' => now(),
            ]);
        }

        return $log;
    }
}
