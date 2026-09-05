<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ActivityLog;

class ActivityLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sampleLogs = [
            [
                'user' => 'Super Admin',
                'action' => 'Mengubah ambang batas amonia bahaya menjadi 20.0 PPM dan mengaktifkan otomasi exhaust blower',
                'module' => 'Pengaturan',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Sistem IoT Engine',
                'action' => 'Menerima telemetri gas amonia 18.5 PPM dari Node Bilik T-B1-M',
                'module' => 'Data Sensor',
                'status' => 'warning',
                'ip' => '192.168.1.105',
            ],
            [
                'user' => 'Budi Santoso',
                'action' => 'Menambahkan jadwal pemeliharaan berkala kebersihan Kloset & Exhaust Bilik T-A1-M',
                'module' => 'Jadwal Pemeliharaan',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Siti Rahmawati',
                'action' => 'Membuat tiket laporan kerusakan: Kran air bilik T-A2-F bocor dan air meluap',
                'module' => 'Rekap Kerusakan',
                'status' => 'warning',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Ahmad Hidayat',
                'action' => 'Menyelesaikan perbaikan pipa dispenser sabun dan mengganti valve Bilik T-B1-M',
                'module' => 'Rekap Perbaikan',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Super Admin',
                'action' => 'Menambahkan unit Fasilitas Toilet Gedung Akademik Lt. 2 (Bilik T-A3-M)',
                'module' => 'Fasilitas',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Super Admin',
                'action' => 'Memperbarui status bilik toilet T-B2-F menjadi Operational',
                'module' => 'Bilik Toilet',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Sistem IoT Engine',
                'action' => 'Melakukan OTA Firmware update pada perangkat Node LETSENS-02 ke v2.4.1',
                'module' => 'Perangkat',
                'status' => 'success',
                'ip' => '192.168.1.110',
            ],
            [
                'user' => 'Super Admin',
                'action' => 'Menambahkan petugas sanitasi baru: Dewi Lestari (NIP: USR-LETSENS-0504)',
                'module' => 'Pengguna',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Budi Santoso',
                'action' => 'Menambahkan stok Sabun Cair Antiseptik sejumlah +50 Liter',
                'module' => 'Stok Perlengkapan',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
            [
                'user' => 'Super Admin',
                'action' => 'Mengunduh laporan rekapitulasi kebersihan dan perbaikan bulanan PDF',
                'module' => 'Laporan',
                'status' => 'success',
                'ip' => '127.0.0.1',
            ],
        ];

        foreach ($sampleLogs as $log) {
            ActivityLog::create($log);
        }
    }
}
