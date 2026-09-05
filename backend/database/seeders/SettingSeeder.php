<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $systemSettings = [
            'mqtt_broker_host' => 'broker.emqx.io',
            'mqtt_port' => '1883',
            'mqtt_topic_root' => 'letsens/toilet/sensordata',
            'telemetry_interval_seconds' => '10',
            'api_endpoint' => 'http://localhost:8000/api/sensor-logs',
            'amonia_warning_threshold' => '10',
            'amonia_danger_threshold' => '20',
            'low_soap_threshold_percent' => '15',
            'low_tissue_threshold_percent' => '15',
            'max_occupancy_minutes_alert' => '30',
            'auto_trigger_blower' => 'true',
            'gemini_api_key' => '',
        ];

        $appSettings = [
            'app_name' => 'LetSens AIoT',
            'institution' => 'Universitas Komputer Indonesia',
            'campus_location' => 'Jl. Dipati Ukur No. 112-116, Bandung',
            'contact_hotline' => '(022) 2504119',
            'whatsapp_notification_number' => '6281234567890',
            'sound_alarm_enabled' => 'true',
        ];

        foreach ($systemSettings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'group' => 'system']
            );
        }

        foreach ($appSettings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'group' => 'app']
            );
        }
    }
}
