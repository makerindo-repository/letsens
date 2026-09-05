<?php

namespace App\Services;

use App\Models\DamageReport;
use App\Models\RepairTicket;
use App\Models\Toilet;
use App\Models\Fasilitas;

class MaintenanceService
{
    /**
     * Dispatch a damage report to a new repair ticket.
     */
    public function dispatchDamageToRepair(DamageReport $damage): RepairTicket
    {
        $damage->update(['status' => 'Dalam Perbaikan']);

        $toilet = Toilet::where('code', $damage->toilet_code)->first();
        if ($toilet) {
            $toilet->update(['status' => 'Maintenance']);
        }

        Fasilitas::where('toilet_code', $damage->toilet_code)->update([
            'status' => 'Perlu Perbaikan',
            'kondisi' => 'Perlu Perbaikan',
        ]);

        $repairCode = 'REP-2026-' . rand(100, 999);

        return RepairTicket::create([
            'repair_code' => $repairCode,
            'damage_ticket_code' => $damage->ticket_code,
            'damage_report_id' => $damage->id,
            'toilet_id' => $damage->toilet_id,
            'toilet_code' => $damage->toilet_code,
            'location_name' => $damage->location_name,
            'technician_name' => 'Bambang Sudarmono (Teknisi MEP)',
            'action_taken' => 'Tindak lanjut atas keluhan: ' . $damage->description,
            'parts_replaced' => 'Dalam proses diagnosa',
            'cost_estimate_rp' => 50000,
            'started_at' => now()->format('d M Y, H:i') . ' WIB',
            'status' => 'Proses Pengerjaan',
            'notes' => 'Eskalasi perbaikan dari tiket kerusakan ' . $damage->ticket_code,
        ]);
    }

    /**
     * Cascade status update from a repair ticket to toilet, damage report, and fasilitas.
     */
    public function syncRepairStatusCascade(RepairTicket $repair, string $newStatus): void
    {
        $isDone = ($newStatus === 'Selesai');

        if ($repair->toilet_code) {
            Toilet::where('code', $repair->toilet_code)->update([
                'status' => $isDone ? 'Online' : 'Maintenance',
            ]);

            Fasilitas::where('toilet_code', $repair->toilet_code)->update([
                'status' => $isDone ? 'Tersedia' : 'Perlu Perbaikan',
                'kondisi' => $isDone ? 'Sangat Baik' : 'Perlu Perbaikan',
            ]);
        }

        if ($repair->damage_ticket_code) {
            DamageReport::where('ticket_code', $repair->damage_ticket_code)->update([
                'status' => $isDone ? 'Selesai' : 'Dalam Perbaikan',
            ]);
        }
    }
}
