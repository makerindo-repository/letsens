<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpMqtt\Client\MqttClient;
use PhpMqtt\Client\ConnectionSettings;
use App\Models\SensorLog;
use App\Models\Toilet;
use App\Models\IotDevice;

class SubscribeMqtt extends Command
{
    protected $signature = 'mqtt:subscribe';
    protected $description = 'Subscribe ke broker MQTT (broker.emqx.io:1883) untuk menerima data sensor dari ESP32 dan menyinkronkan ke Database LetSens';

    public function handle()
    {
        $server = env('MQTT_HOST', 'broker.emqx.io');
        $port = (int) env('MQTT_PORT', 1883);
        $clientId = 'letsens-backend-' . uniqid();

        $username = env('MQTT_USERNAME');
        $password = env('MQTT_PASSWORD');

        $connectionSettings = new ConnectionSettings();

        if (!empty($username)) {
            $connectionSettings->setUsername($username);
        }
        if (!empty($password)) {
            $connectionSettings->setPassword($password);
        }

        if ($port === 8883) {
            $connectionSettings->setUseTls(true)->setTlsVerifyPeer(false);
        } else {
            $connectionSettings->setUseTls(false);
        }

        $connectionSettings->setKeepAliveInterval(60);

        try {
            $mqtt = new MqttClient($server, $port, $clientId, MqttClient::MQTT_3_1_1);
            $mqtt->connect($connectionSettings, true);
            $this->info("Berhasil terhubung ke Broker MQTT! [Host: {$server}:{$port}]");
            $this->info("Menunggu data telemetri dari ESP32 pada topic 'letsens/toilet/#'...");
        } catch (\Exception $e) {
            $this->error("Gagal terhubung ke Broker MQTT: " . $e->getMessage());
            return 1;
        }

        $mqtt->subscribe('letsens/toilet/#', function ($topic, $message) {
            $this->info("\n[{$topic}] Pesan masuk: " . $message);

            if ($topic === 'letsens/toilet/sensordata') {
                $data = json_decode($message, true);
                
                if (!$data) {
                    $this->error("Gagal parse JSON dari payload MQTT.");
                    return;
                }

                $deviceId = $data['kode_perangkat'] ?? $data['id_perangkat'] ?? $data['device_id'] ?? 'ESP32-TK-01A';

                // Auto-resolve toilet_code from device relationship database if not explicitly provided
                $iotDeviceModel = \App\Models\IotDevice::where('node_id', $deviceId)->first();
                if ($iotDeviceModel && !empty($iotDeviceModel->toilet_code)) {
                    $toiletCode = $iotDeviceModel->toilet_code;
                } else {
                    $toiletCode = $data['toilet_code'] ?? $data['kode_toilet'] ?? 'T-A1-M';
                }
                $timestamp = isset($data['timestamp']) ? date('Y-m-d H:i:s', $data['timestamp']) : now();

                $ammoniaPpm = (float) ($data['amonia'] ?? $data['ammonia_ppm'] ?? $data['gas_index'] ?? 0.0);
                $tempC = isset($data['suhu']) ? (float) $data['suhu'] : ($data['temperature_c'] ?? null);
                $hum = isset($data['rh']) ? (float) $data['rh'] : ($data['humidity_percent'] ?? null);
                $pir = isset($data['PIR']) ? (bool) $data['PIR'] : ($data['pir_presence'] ?? false);
                $occupied = isset($data['occupied']) ? (bool) $data['occupied'] : $pir;
                $lux = (float) ($data['cahaya'] ?? $data['light_lux'] ?? $data['lux'] ?? 0.0);
                $rssi = isset($data['RSSI']) ? (int) $data['RSSI'] : ($data['rssi'] ?? -65);
                $battery = isset($data['Baterai']) ? (int) $data['Baterai'] : ($data['battery_percent'] ?? 96);
                $soap = $data['soap_level_percent'] ?? 80.0;
                $tissue = $data['tissue_level_percent'] ?? 85.0;
                $waterFlow = $data['water_flow_lpm'] ?? 0.0;
                $status = $data['status'] ?? 'NORMAL';

                try {
                    // 1. Cari / Buat Bilik Toilet Terkait
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

                    // 2. Update real-time state pada tabel toilets
                    $toilet->update([
                        'ammonia_ppm' => $ammoniaPpm,
                        'temperature_c' => $tempC ?? $toilet->temperature_c,
                        'humidity_percent' => $hum ?? $toilet->humidity_percent,
                        'lux' => $lux,
                        'occupied' => $occupied,
                        'soap_level_percent' => $soap,
                        'tissue_level_percent' => $tissue,
                        'water_flow_lpm' => $waterFlow,
                        'last_telemetry_at' => $timestamp,
                        'status' => 'Online',
                    ]);

                    // 3. Simpan log sensor histori di sensor_logs
                    $log = SensorLog::create([
                        'device_id' => $deviceId,
                        'toilet_id' => $toilet->id,
                        'toilet_code' => $toiletCode,
                        'temperature_c' => $tempC,
                        'humidity_percent' => $hum,
                        'gas_index' => $data['gas_index'] ?? $ammoniaPpm,
                        'ammonia_ppm' => $ammoniaPpm,
                        'pir_presence' => $pir,
                        'occupied' => $occupied,
                        'light_lux' => $lux,
                        'soap_level_percent' => $soap,
                        'tissue_level_percent' => $tissue,
                        'water_flow_lpm' => $waterFlow,
                        'status' => $status,
                        'status_condition' => $ammoniaPpm >= 25 ? 'Bahaya' : ($ammoniaPpm >= 10 ? 'Waspada' : 'Normal'),
                        'recorded_at' => $timestamp,
                    ]);

                    $batteryVolt = isset($data['battery_voltage']) ? (float) $data['battery_voltage'] : round(3.30 + ($battery / 100) * 0.90, 2);

                    // 4. Update status perangkat IoT di iot_devices
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
                            'last_telemetry_at' => $timestamp,
                        ]
                    );

                    $this->info("--> Data telemetri berhasil disinkronkan ke Bilik [{$toiletCode}] & Log ID #{$log->id}!");
                } catch (\Exception $e) {
                    $this->error("Gagal sinkronisasi DB: " . $e->getMessage());
                }
            }
        }, 0);

        $mqtt->loop(true);
    }
}