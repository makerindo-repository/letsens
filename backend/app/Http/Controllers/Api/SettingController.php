<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

class SettingController extends Controller
{
    /**
     * Get all settings grouped by their group.
     */
    public function index()
    {
        $settings = Setting::all();
        $grouped = [];
        
        foreach ($settings as $setting) {
            if (!isset($grouped[$setting->group])) {
                $grouped[$setting->group] = [];
            }
            $grouped[$setting->group][$setting->key] = $setting->value;
        }

        return response()->json([
            'success' => true,
            'data' => $grouped
        ], 200);
    }

    /**
     * Get settings for a specific group.
     */
    public function show(string $group)
    {
        $settings = Setting::getByGroup($group);

        return response()->json([
            'success' => true,
            'data' => $settings
        ], 200);
    }

    /**
     * Upsert settings for a specific group.
     */
    public function update(Request $request, string $group)
    {
        $data = $request->all();
        Setting::setByGroup($group, $data);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data' => Setting::getByGroup($group)
        ], 200);
    }

    /**
     * Test MQTT connection configuration.
     */
    public function testMqtt(Request $request)
    {
        $request->validate([
            'host' => 'required|string',
            'port' => 'required|numeric',
        ]);

        // Just validate for now as per instructions
        return response()->json([
            'success' => true,
            'message' => 'MQTT connection settings are valid (simulation).',
            'data' => [
                'host' => $request->host,
                'port' => $request->port
            ]
        ], 200);
    }

    /**
     * Test Google Gemini API Key against Google AI Studio endpoint.
     */
    public function testGeminiKey(Request $request)
    {
        $apiKey = trim($request->input('api_key') ?: Setting::getValue('gemini_api_key'));

        if (empty($apiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Gemini API Key tidak boleh kosong.'
            ], 422);
        }

        try {
            // Call ListModels endpoint (GET) to validate key without model dependency
            $response = \Illuminate\Support\Facades\Http::get("https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}");

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Gemini API Key TERVERIFIKASI VALID & terhubung ke Google AI Studio!',
                    'data' => [
                        'status' => 'valid',
                    ]
                ], 200);
            }

            $errorJson = $response->json();
            $errorMessage = $errorJson['error']['message'] ?? 'API Key ditolak oleh Google AI Studio.';

            return response()->json([
                'success' => false,
                'message' => "Gemini API Key TIDAK VALID: {$errorMessage}",
                'data' => [
                    'status' => 'invalid',
                    'error_code' => $response->status()
                ]
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungi server Google AI Studio: ' . $e->getMessage()
            ], 500);
        }
    }
}
