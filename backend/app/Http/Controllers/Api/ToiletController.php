<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Toilet;

class ToiletController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Toilet::query();

        if ($request->has('building') && $request->building) {
            $query->where('building', $request->building);
        }

        if ($request->has('gender') && $request->gender) {
            $query->where('gender', $request->gender);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('building', 'like', "%{$search}%");
            });
        }

        $toilets = $query->with('fasilitas')->orderBy('code', 'asc')->get();

        // Map format ke camelCase untuk konsistensi dengan Frontend React (ToiletBilik interface)
        $mappedToilets = $toilets->map(function ($t) {
            $realFasilitas = $t->fasilitas ? $t->fasilitas->pluck('nama_fasilitas')->filter()->values()->toArray() : [];
            $isRecent = $t->last_telemetry_at && $t->last_telemetry_at->diffInSeconds(now()) <= 45;
            $dynamicStatus = $t->status === 'Maintenance' ? 'Maintenance' : ($isRecent ? 'Online' : 'Offline');

            return [
                'id' => (string) $t->id,
                'code' => $t->code,
                'name' => $t->name,
                'building' => $t->building,
                'floor' => $t->floor,
                'gender' => $t->gender,
                'occupied' => (bool) $t->occupied,
                'occupancyDurationMinutes' => $t->occupancy_duration_minutes,
                'doorStatus' => $t->door_status,
                'amoniaPPM' => $t->ammonia_ppm,
                'temperatureC' => $t->temperature_c,
                'humidityPercent' => $t->humidity_percent,
                'lux' => $t->lux,
                'soapLevelPercent' => $t->soap_level_percent,
                'tissueLevelPercent' => $t->tissue_level_percent,
                'waterFlowLpm' => $t->water_flow_lpm,
                'batteryPercent' => $t->battery_percent,
                'iotDeviceId' => $t->iot_device_id ?? 'N/A',
                'ipAddress' => $t->ip_address ?? '192.168.1.100',
                'macAddress' => $t->mac_address ?? 'AA:BB:CC:DD:EE:FF',
                'lastTelemetryTime' => $t->last_telemetry_at ? $t->last_telemetry_at->diffForHumans() : 'Belum ada data',
                'facilities' => array_values(array_unique($realFasilitas)),
                'status' => $dynamicStatus,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mappedToilets->count(),
            'data' => $mappedToilets
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($request->has('amoniaPPM')) $request->merge(['ammonia_ppm' => $request->amoniaPPM]);
        if ($request->has('temperatureC')) $request->merge(['temperature_c' => $request->temperatureC]);
        if ($request->has('humidityPercent')) $request->merge(['humidity_percent' => $request->humidityPercent]);

        $validated = $request->validate([
            'code' => 'required|string|unique:toilets,code',
            'name' => 'required|string',
            'building' => 'nullable|string',
            'floor' => 'nullable|integer',
            'gender' => 'nullable|in:Wanita,Pria,Disabilitas,Unisex',
            'status' => 'nullable|in:Online,Offline,Maintenance',
            'facilities' => 'nullable|array',
        ]);

        $toilet = Toilet::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bilik toilet baru berhasil ditambahkan!',
            'data' => $toilet
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $toilet = Toilet::where('id', $id)
            ->orWhere('code', $id)
            ->with(['iotDevices', 'sensorLogs' => function ($q) {
                $q->latest('recorded_at')->take(20);
            }, 'damageReports' => function ($q) {
                $q->unresolved();
            }])
            ->first();

        if (!$toilet) {
            return response()->json([
                'success' => false,
                'message' => 'Data bilik toilet tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $toilet
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if ($request->has('amoniaPPM')) $request->merge(['ammonia_ppm' => $request->amoniaPPM]);
        if ($request->has('temperatureC')) $request->merge(['temperature_c' => $request->temperatureC]);
        if ($request->has('humidityPercent')) $request->merge(['humidity_percent' => $request->humidityPercent]);

        $toilet = Toilet::where('id', $id)->orWhere('code', $id)->first();

        if (!$toilet) {
            return response()->json([
                'success' => false,
                'message' => 'Data bilik toilet tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'code' => 'nullable|string|unique:toilets,code,' . $toilet->id,
            'name' => 'nullable|string',
            'building' => 'nullable|string',
            'floor' => 'nullable|integer',
            'gender' => 'nullable|in:Wanita,Pria,Disabilitas,Unisex',
            'status' => 'nullable|in:Online,Offline,Maintenance',
            'facilities' => 'nullable|array',
            'ammonia_ppm' => 'nullable|numeric',
            'temperature_c' => 'nullable|numeric',
            'humidity_percent' => 'nullable|numeric',
            'occupied' => 'nullable|boolean',
        ]);

        $toilet->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data bilik toilet berhasil diperbarui!',
            'data' => $toilet
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $toilet = Toilet::where('id', $id)->orWhere('code', $id)->first();

        if (!$toilet) {
            return response()->json([
                'success' => false,
                'message' => 'Data bilik toilet tidak ditemukan.'
            ], 404);
        }

        $toilet->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data bilik toilet berhasil dihapus.'
        ], 200);
    }

    /**
     * Generate & Return QR Code metadata for a toilet booth.
     */
    public function getQrCode(string $id)
    {
        $toilet = Toilet::where('id', $id)->orWhere('code', $id)->first();

        if (!$toilet) {
            return response()->json([
                'success' => false,
                'message' => 'Data bilik toilet tidak ditemukan.'
            ], 404);
        }

        $appUrl = config('app.url', 'http://localhost:3000');
        $targetUrl = "{$appUrl}/bilik-toilet?code=" . urlencode($toilet->code);

        return response()->json([
            'success' => true,
            'data' => [
                'toilet_id' => (string) $toilet->id,
                'toilet_code' => $toilet->code,
                'toilet_name' => $toilet->name,
                'building' => $toilet->building,
                'floor' => $toilet->floor,
                'gender' => $toilet->gender,
                'institution' => 'Universitas Komputer Indonesia',
                'target_url' => $targetUrl,
                'qr_data_string' => "LETSENS:TOILET:{$toilet->code}|INSTITUTION:Universitas Komputer Indonesia|URL:{$targetUrl}",
                'qr_code_svg_url' => "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($targetUrl),
            ]
        ], 200);
    }

    /**
     * Mobile App Endpoint: Check-In (Akses Masuk Bilik Toilet)
     */
    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'toilet_code' => 'required|string',
            'user_id' => 'nullable|string',
        ]);

        $toilet = Toilet::where('code', $validated['toilet_code'])->orWhere('id', $validated['toilet_code'])->first();

        if (!$toilet) {
            return response()->json([
                'success' => false,
                'message' => 'Bilik toilet tidak ditemukan.'
            ], 404);
        }

        if ($toilet->occupied) {
            return response()->json([
                'success' => false,
                'message' => 'Bilik toilet sedang terisi oleh pengguna lain.',
                'data' => [
                    'occupied' => true,
                    'door_status' => $toilet->door_status,
                ]
            ], 400);
        }

        $toilet->update([
            'occupied' => true,
            'door_status' => 'Tertutup',
            'occupancy_duration_minutes' => 1,
            'status' => 'Online',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Akses masuk bilik {$toilet->code} berhasil disetujui! Kunci solenoid unlocked.",
            'data' => [
                'toilet_code' => $toilet->code,
                'name' => $toilet->name,
                'occupied' => true,
                'door_status' => 'Tertutup',
                'solenoid_status' => 'UNLOCKED',
                'check_in_at' => now()->format('Y-m-d H:i:s'),
            ]
        ], 200);
    }

    /**
     * Mobile App Endpoint: Check-Out (Akses Keluar Bilik Toilet)
     */
    public function checkOut(Request $request)
    {
        $validated = $request->validate([
            'toilet_code' => 'required|string',
            'user_id' => 'nullable|string',
        ]);

        $toilet = Toilet::where('code', $validated['toilet_code'])->orWhere('id', $validated['toilet_code'])->first();

        if (!$toilet) {
            return response()->json([
                'success' => false,
                'message' => 'Bilik toilet tidak ditemukan.'
            ], 404);
        }

        $toilet->update([
            'occupied' => false,
            'door_status' => 'Terbuka',
            'occupancy_duration_minutes' => 0,
        ]);

        $needsSanitization = $toilet->ammonia_ppm > 15.0;

        return response()->json([
            'success' => true,
            'message' => "Akses keluar bilik {$toilet->code} selesai. Terima kasih!",
            'data' => [
                'toilet_code' => $toilet->code,
                'occupied' => false,
                'door_status' => 'Terbuka',
                'solenoid_status' => 'LOCKED',
                'ammonia_ppm' => $toilet->ammonia_ppm,
                'sanitization_triggered' => $needsSanitization,
                'check_out_at' => now()->format('Y-m-d H:i:s'),
            ]
        ], 200);
    }
}
