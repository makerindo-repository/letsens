<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Toilet;
use App\Models\IotDevice;
use App\Models\Staff;
use App\Models\Supply;
use App\Models\MaintenanceSchedule;
use App\Models\DamageReport;
use App\Models\RepairTicket;
use App\Models\SensorLog;
use App\Models\Fasilitas;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with STRICTLY 1 REAL IOT NODE & EMPTY SENSOR LOGS.
     */
    public function run(): void
    {
        $this->call(SettingSeeder::class);
        $this->call(ActivityLogSeeder::class);

        // 1. User Accounts & Staff Accounts (At least 1 User for EVERY Role in System)
        $accounts = [
            [
                'email' => 'admin@letsens.id',
                'name' => 'Daffa Jaya Perkasa',
                'nip' => '10126000',
                'phone' => '081234567899',
                'role' => 'Super Admin',
                'shift' => 'Pagi (06:00 - 14:00)',
                'assigned_building' => 'Gedung A',
                'status' => 'Bertugas',
                'rating' => 5.0,
                'completed_tasks_today' => 0,
            ],
            [
                'email' => 'superadmin@letsens.id',
                'name' => 'Super Admin LetSens',
                'nip' => '10126002',
                'phone' => '081234567801',
                'role' => 'Super Admin',
                'shift' => 'Pagi (06:00 - 14:00)',
                'assigned_building' => 'Gedung A',
                'status' => 'Siaga',
                'rating' => 5.0,
                'completed_tasks_today' => 0,
            ],
            [
                'email' => 'admin.fasilitas@letsens.id',
                'name' => 'Siti Rahmawati',
                'nip' => '10126003',
                'phone' => '081234567804',
                'role' => 'Admin Fasilitas',
                'shift' => 'Pagi (06:00 - 14:00)',
                'assigned_building' => 'Gedung A',
                'status' => 'Bertugas',
                'rating' => 5.0,
                'completed_tasks_today' => 0,
            ],
            [
                'email' => 'teknisi@letsens.id',
                'name' => 'Rudi Hermawan',
                'nip' => '10126005',
                'phone' => '6281234567803',
                'role' => 'Teknisi IoT',
                'shift' => 'Pagi (06:00 - 14:00)',
                'assigned_building' => 'Gedung A',
                'status' => 'Bertugas',
                'rating' => 5.0,
                'completed_tasks_today' => 0,
            ],
            [
                'email' => 'petugas@letsens.id',
                'name' => 'Asep Saepulloh',
                'nip' => '10126001',
                'phone' => '081234567890',
                'role' => 'Petugas Kebersihan',
                'shift' => 'Pagi (06:00 - 14:00)',
                'assigned_building' => 'Gedung A',
                'status' => 'Bertugas',
                'rating' => 5.0,
                'completed_tasks_today' => 0,
            ],
            [
                'email' => 'supervisor@letsens.id',
                'name' => 'Pak Agus',
                'nip' => '10126004',
                'phone' => '6281234567802',
                'role' => 'Supervisor / Manajer',
                'shift' => 'Pagi (06:00 - 14:00)',
                'assigned_building' => 'Gedung A',
                'status' => 'Bertugas',
                'rating' => 5.0,
                'completed_tasks_today' => 0,
            ],
        ];

        foreach ($accounts as $acc) {
            User::updateOrCreate(
                ['email' => $acc['email']],
                [
                    'name' => $acc['name'],
                    'role' => $acc['role'],
                    'password' => bcrypt('password123'),
                ]
            );

            Staff::updateOrCreate(
                ['nip' => $acc['nip']],
                [
                    'name' => $acc['name'],
                    'email' => $acc['email'],
                    'phone' => $acc['phone'],
                    'role' => $acc['role'],
                    'shift' => $acc['shift'],
                    'assigned_building' => $acc['assigned_building'],
                    'status' => $acc['status'],
                    'rating' => $acc['rating'],
                    'completed_tasks_today' => $acc['completed_tasks_today'],
                ]
            );
        }

        // 2. Toilets Data — STRICTLY 1 REAL TOILET BILIK (T-A1-F)
        $toiletsData = [
            [
                'code' => 'T-A1-F',
                'name' => 'Gedung A, Lt 1, Wanita',
                'building' => 'Gedung A',
                'floor' => 1,
                'gender' => 'Wanita',
                'occupied' => false,
                'occupancy_duration_minutes' => 0,
                'door_status' => 'Terbuka',
                'ammonia_ppm' => 0.0,
                'temperature_c' => 25.0,
                'humidity_percent' => 60.0,
                'lux' => 350.0,
                'soap_level_percent' => 100,
                'tissue_level_percent' => 100,
                'water_flow_lpm' => 0.0,
                'battery_percent' => 100,
                'iot_device_id' => 'ESP32-TK-01A',
                'status' => 'Offline',
                'last_telemetry_at' => null,
            ],
        ];

        foreach ($toiletsData as $td) {
            Toilet::updateOrCreate(['code' => $td['code']], $td);
        }

        // 3. IoT Devices — STRICTLY 1 REAL IOT DEVICE NODE (ESP32-TK-01A)
        $devicesData = [
            [
                'node_id' => 'ESP32-TK-01A',
                'name' => 'LetSens Node ESP32 Bilik T-A1-F',
                'toilet_code' => 'T-A1-F',
                'toilet_name' => 'Gedung A, Lt 1, Wanita',
                'building' => 'Gedung A',
                'floor' => 1,
                'battery_percent' => 100,
                'battery_voltage' => 4.20,
                'power_source' => 'Adaptor DC 5V (Mains)',
                'battery_status' => 'Penuh / Normal',
                'rssi' => -55,
                'rssi_quality' => 'Baik',
                'firmware_version' => 'v2.4.2-unikom-prod',
                'hardware_version' => 'ESP32-WROOM-32D Rev 3',
                'sensor_shield_version' => 'LetSens Dual-MQ Shield v1.4',
                'ota_status' => 'Up to Date',
                'ip_address' => '192.168.10.45',
                'mac_address' => '24:6F:28:A1:04:12',
                'ping_latency_ms' => 15,
                'status' => 'Offline',
                'reboot_count' => 0,
                'last_telemetry_at' => null,
            ],
        ];

        foreach ($devicesData as $dev) {
            $t = Toilet::where('code', $dev['toilet_code'])->first();
            IotDevice::updateOrCreate(
                ['node_id' => $dev['node_id']],
                array_merge($dev, ['toilet_id' => $t?->id])
            );
        }

        // 4. Supplies Data (Initial Stock for 1 Node)
        $suppliesData = [
            [
                'name' => 'Hand Soap Antiseptik Cair',
                'category' => 'Cairan & Kimia',
                'stock' => 50,
                'unit' => 'Liter (Jerigen 5L)',
                'min_threshold' => 15,
                'location' => 'Gudang Utama Gd. A Lt. Dasar',
                'last_restocked' => now()->format('d M Y'),
                'price_per_unit' => 45000,
            ],
            [
                'name' => 'Tisu Toilet Jumbo Roll (JRT)',
                'category' => 'Kertas & Tisu',
                'stock' => 30,
                'unit' => 'Roll',
                'min_threshold' => 10,
                'location' => 'Pos Perlengkapan Gd. A Lt. 1',
                'last_restocked' => now()->format('d M Y'),
                'price_per_unit' => 32000,
            ],
            [
                'name' => 'Sensor Gas MQ-137 Spare (Amonia)',
                'category' => 'Hardware IoT',
                'stock' => 5,
                'unit' => 'Unit Modul',
                'min_threshold' => 2,
                'location' => 'Lab IoT & Embedded UNIKOM',
                'last_restocked' => now()->format('d M Y'),
                'price_per_unit' => 85000,
            ],
        ];

        foreach ($suppliesData as $sd) {
            Supply::updateOrCreate(['name' => $sd['name']], $sd);
        }

        // 5. Maintenance Schedules (1 Schedule for T-A1-F)
        $schedulesData = [
            [
                'toilet_code' => 'T-A1-F',
                'toilet_name' => 'Gedung A, Lt 1, Wanita',
                'staff_id' => '1',
                'staff_name' => 'Asep Saepulloh',
                'shift' => 'Pagi (06:00 - 14:00)',
                'time_slot' => '08:00 - 08:30 WIB',
                'type' => 'Pembersihan Rutin',
                'checklist' => [
                    ['task' => 'Pengecekan Kebersihan Floor Drain & Wastafel', 'done' => false],
                    ['task' => 'Pembersihan Kloset dengan Desinfektan', 'done' => false],
                    ['task' => 'Pengisian Ulang Sabun Cair & Tisu Roll', 'done' => false],
                    ['task' => 'Pengecekan Fungsi Blower Exhaust & Sensor MQ-137', 'done' => false],
                ],
                'status' => 'Terjadwal',
                'notes' => 'Inspeksi & sanitasi awal bilik T-A1-F.',
            ],
        ];

        foreach ($schedulesData as $sd) {
            MaintenanceSchedule::updateOrCreate(
                ['toilet_code' => $sd['toilet_code'], 'time_slot' => $sd['time_slot']],
                $sd
            );
        }

        // 6. Damage Report & Repair Ticket (1 Initial Baseline Ticket for T-A1-F)
        $t1 = Toilet::where('code', 'T-A1-F')->first();
        $dmg1 = DamageReport::updateOrCreate(
            ['ticket_code' => 'DMG-2026-001'],
            [
                'toilet_id' => $t1?->id,
                'toilet_code' => 'T-A1-F',
                'location_name' => 'Gedung A, Lt 1, Wanita',
                'category' => 'Sensor & IoT',
                'description' => 'Inisialisasi awal node IoT ESP32-TK-01A & kalibrasi baseline sensor.',
                'reported_by' => 'Rudi Hermawan (Teknisi IoT)',
                'severity' => 'Rendah',
                'status' => 'Proses',
            ]
        );

        RepairTicket::updateOrCreate(
            ['repair_code' => 'REP-2026-001'],
            [
                'damage_ticket_code' => 'DMG-2026-001',
                'damage_report_id' => $dmg1->id,
                'toilet_id' => $t1?->id,
                'toilet_code' => 'T-A1-F',
                'location_name' => 'Gedung A, Lt 1, Wanita',
                'technician_name' => 'Rudi Hermawan (Teknisi IoT)',
                'action_taken' => 'Pemasangan casing IP65 & flashing firmware v2.4.2-unikom-prod',
                'parts_replaced' => 'Modul ESP32 + Shield SHT40/MQ137',
                'cost_estimate_rp' => 0,
                'started_at' => now()->format('d M Y, H:i') . ' WIB',
                'status' => 'Proses Pengerjaan',
                'notes' => 'Siap menerima streaming telemetri real-time.',
            ]
        );

        // 7. Fasilitas Items for T-A1-F (1 Node Toilet)
        $fasilitasItems = [
            [
                'nama_fasilitas' => 'Hand Soap Antiseptik Cair',
                'toilet_code' => 'T-A1-F',
                'location' => 'Gedung A, Lt 1, Wanita',
                'building' => 'Gedung A',
                'floor' => 1,
                'kategori' => 'Sanitasi & Kebersihan',
                'jumlah' => '500 mL (Terisi 100%)',
                'stok_angka' => 100,
                'unit' => 'mL',
                'kondisi' => 'Sangat Baik',
                'status' => 'Tersedia',
                'petugas_jawab' => 'Asep Saepulloh',
                'terakhir_diperiksa' => now()->format('Y-m-d H:i:s'),
                'catatan' => 'Dispenser sabun terisi penuh 100%',
            ],
            [
                'nama_fasilitas' => 'Tisu Toilet Jumbo Roll (JRT)',
                'toilet_code' => 'T-A1-F',
                'location' => 'Gedung A, Lt 1, Wanita',
                'building' => 'Gedung A',
                'floor' => 1,
                'kategori' => 'Tisu & Kertas',
                'jumlah' => '1 Roll (Terisi 100%)',
                'stok_angka' => 100,
                'unit' => 'roll',
                'kondisi' => 'Sangat Baik',
                'status' => 'Tersedia',
                'petugas_jawab' => 'Asep Saepulloh',
                'terakhir_diperiksa' => now()->format('Y-m-d H:i:s'),
                'catatan' => 'Roll tisu terpasang penuh 100%',
            ],
            [
                'nama_fasilitas' => 'Node Sensor LetSens ESP32 (MQ137 + PIR)',
                'toilet_code' => 'T-A1-F',
                'location' => 'Gedung A, Lt 1, Wanita',
                'building' => 'Gedung A',
                'floor' => 1,
                'kategori' => 'Hardware IoT',
                'jumlah' => '1 Unit Node (ESP32-TK-01A)',
                'stok_angka' => 100,
                'unit' => 'unit',
                'kondisi' => 'Sangat Baik',
                'status' => 'Tersedia',
                'petugas_jawab' => 'Rudi Hermawan',
                'terakhir_diperiksa' => now()->format('Y-m-d H:i:s'),
                'catatan' => 'Node IoT Standby, IP 192.168.10.45',
            ],
        ];

        foreach ($fasilitasItems as $item) {
            Fasilitas::updateOrCreate(
                [
                    'nama_fasilitas' => $item['nama_fasilitas'],
                    'toilet_code' => $item['toilet_code'],
                ],
                $item
            );
        }

        // 8. Sensor Telemetry Logs — STRICTLY EMPTY (0 ENTRIES) BY DEFAULT
        SensorLog::truncate();
    }
}
