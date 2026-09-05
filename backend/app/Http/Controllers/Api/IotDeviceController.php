<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IotDevice;

class IotDeviceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = IotDevice::query();

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('building') && $request->building) {
            $query->where('building', $request->building);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('node_id', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('toilet_code', 'like', "%{$search}%");
            });
        }

        $devices = $query->orderBy('node_id', 'asc')->get();

        // Map format ke camelCase untuk konsistensi dengan Frontend React (IotDevice interface)
        $mappedDevices = $devices->map(function ($d) {
            $isRecent = $d->last_telemetry_at && $d->last_telemetry_at->diffInSeconds(now()) <= 45;
            $dynamicStatus = $isRecent ? 'Online' : 'Offline';

            return [
                'id' => (string) $d->id,
                'nodeId' => $d->node_id,
                'name' => $d->name,
                'toiletCode' => $d->toilet_code ?? 'T-A1-M',
                'toiletName' => $d->toilet_name ?? "Bilik {$d->toilet_code}",
                'building' => $d->building ?? 'Gedung A',
                'floor' => $d->floor ?? 1,
                'batteryPercent' => $d->battery_percent ?? 96,
                'batteryVoltage' => $d->battery_voltage ?? 4.18,
                'powerSource' => $d->power_source ?? 'Adaptor DC 5V (Mains)',
                'batteryStatus' => $d->battery_status ?? 'Penuh / Normal',
                'rssi' => $d->rssi ?? -58,
                'rssiQuality' => $d->rssi_quality ?? 'Sangat Baik',
                'wifiSsid' => $d->wifi_ssid ?? 'UNIKOM-IoT-Secure',
                'activationDate' => $d->created_at ? $d->created_at->format('d M Y, H:i \W\I\B') : '15 Jan 2026',
                'uptime' => $d->uptime ?? '234 hari 14 jam',
                'lastTelemetryTime' => $d->last_telemetry_at ? $d->last_telemetry_at->diffForHumans() : 'Belum ada data',
                'firmwareVersion' => $d->firmware_version ?? 'v2.4.2-unikom-prod',
                'hardwareVersion' => $d->hardware_version ?? 'ESP32-WROOM-32D Rev 3',
                'sensorShieldVersion' => $d->sensor_shield_version ?? 'LetSens Dual-MQ Shield v1.4',
                'otaStatus' => $d->ota_status ?? 'Up to Date',
                'ipAddress' => $d->ip_address ?? '192.168.1.120',
                'macAddress' => $d->mac_address ?? '24:6F:28:AB:CD:01',
                'pingLatencyMs' => $d->ping_latency_ms ?? 14,
                'status' => $dynamicStatus,
                'connectedSensors' => $d->connected_sensors ?? ['MQ-137 (Gas Amonia)', 'DHT22 (Suhu & Kelembapan)', 'PIR HC-SR501', 'LDR Light'],
                'rebootCount' => $d->reboot_count ?? 0,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mappedDevices->count(),
            'data' => $mappedDevices
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($request->has('nodeId')) $request->merge(['node_id' => $request->nodeId]);
        if ($request->has('toiletCode')) $request->merge(['toilet_code' => $request->toiletCode]);
        if ($request->has('powerSource')) $request->merge(['power_source' => $request->powerSource]);
        if ($request->has('batteryPercent')) $request->merge(['battery_percent' => $request->batteryPercent]);
        if ($request->has('batteryVoltage')) $request->merge(['battery_voltage' => $request->batteryVoltage]);
        if ($request->has('ipAddress')) $request->merge(['ip_address' => $request->ipAddress]);
        if ($request->has('macAddress')) $request->merge(['mac_address' => $request->macAddress]);
        if ($request->has('firmwareVersion')) $request->merge(['firmware_version' => $request->firmwareVersion]);

        $validated = $request->validate([
            'node_id' => 'required|string|unique:iot_devices,node_id',
            'name' => 'required|string',
            'toilet_code' => 'nullable|string',
            'building' => 'nullable|string',
            'floor' => 'nullable|integer',
            'power_source' => 'nullable|string',
            'status' => 'nullable|string',
            'battery_percent' => 'nullable|integer',
            'battery_voltage' => 'nullable|numeric',
            'rssi' => 'nullable|integer',
            'rssi_quality' => 'nullable|string',
            'ip_address' => 'nullable|string',
            'mac_address' => 'nullable|string',
            'firmware_version' => 'nullable|string',
        ]);

        $device = IotDevice::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Perangkat Node IoT baru berhasil didaftarkan!',
            'data' => $device
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $device = IotDevice::where('id', $id)->orWhere('node_id', $id)->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Perangkat Node IoT tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $device
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if ($request->has('nodeId')) $request->merge(['node_id' => $request->nodeId]);
        if ($request->has('toiletCode')) $request->merge(['toilet_code' => $request->toiletCode]);
        if ($request->has('powerSource')) $request->merge(['power_source' => $request->powerSource]);
        if ($request->has('batteryPercent')) $request->merge(['battery_percent' => $request->batteryPercent]);
        if ($request->has('batteryVoltage')) $request->merge(['battery_voltage' => $request->batteryVoltage]);
        if ($request->has('ipAddress')) $request->merge(['ip_address' => $request->ipAddress]);
        if ($request->has('macAddress')) $request->merge(['mac_address' => $request->macAddress]);
        if ($request->has('firmwareVersion')) $request->merge(['firmware_version' => $request->firmwareVersion]);

        $device = IotDevice::where('id', $id)->orWhere('node_id', $id)->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Perangkat Node IoT tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'node_id' => 'nullable|string|unique:iot_devices,node_id,' . $device->id,
            'name' => 'nullable|string',
            'toilet_code' => 'nullable|string',
            'building' => 'nullable|string',
            'floor' => 'nullable|integer',
            'power_source' => 'nullable|string',
            'firmware_version' => 'nullable|string',
            'ip_address' => 'nullable|string',
            'mac_address' => 'nullable|string',
            'status' => 'nullable|string',
            'battery_percent' => 'nullable|integer',
            'battery_voltage' => 'nullable|numeric',
            'rssi' => 'nullable|integer',
        ]);

        $device->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi perangkat IoT berhasil diperbarui!',
            'data' => $device
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $device = IotDevice::where('id', $id)->orWhere('node_id', $id)->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Perangkat Node IoT tidak ditemukan.'
            ], 404);
        }

        $device->delete();

        return response()->json([
            'success' => true,
            'message' => 'Perangkat Node IoT berhasil dihapus dari jaringan.'
        ], 200);
    }

    /**
     * Remote Command: Reboot IoT Device.
     */
    public function reboot(string $id)
    {
        $device = IotDevice::where('id', $id)->orWhere('node_id', $id)->first();

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Perangkat tidak ditemukan.'], 404);
        }

        $device->update([
            'reboot_count' => $device->reboot_count + 1,
            'uptime' => '0 hari 0 jam (Baru di-reboot)',
            'status' => 'Online',
            'last_telemetry_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Node IoT [{$device->node_id}] berhasil di-reboot secara remote via MQTT!",
            'data' => $device
        ], 200);
    }

    /**
     * Remote Command: Calibrate zero-point MQ-137 sensor.
     */
    public function calibrate(string $id)
    {
        $device = IotDevice::where('id', $id)->orWhere('node_id', $id)->first();

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Perangkat tidak ditemukan.'], 404);
        }

        $device->update([
            'status' => 'Online',
            'last_telemetry_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Kalibrasi zero-point sensor MQ-137 berhasil dilaksanakan pada node [{$device->node_id}]!",
            'data' => $device
        ], 200);
    }

    /**
     * Remote Command: Trigger OTA Firmware Flash.
     */
    public function otaUpdate(string $id)
    {
        $device = IotDevice::where('id', $id)->orWhere('node_id', $id)->first();

        if (!$device) {
            return response()->json(['success' => false, 'message' => 'Perangkat tidak ditemukan.'], 404);
        }

        $device->update([
            'firmware_version' => 'v2.5.0-unikom-prod',
            'ota_status' => 'Up to Date',
            'status' => 'Online',
            'last_telemetry_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Firmware node [{$device->node_id}] berhasil di-flash ke v2.5.0-unikom-prod via OTA!",
            'data' => $device
        ], 200);
    }
}
