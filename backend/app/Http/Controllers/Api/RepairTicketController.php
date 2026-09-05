<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RepairTicket;
use App\Models\Toilet;
use App\Models\DamageReport;
use App\Models\Fasilitas;

class RepairTicketController extends Controller
{
    public function index(Request $request)
    {
        $query = RepairTicket::query();

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $repairs = $query->orderBy('created_at', 'desc')->get();

        $mapped = $repairs->map(function ($r) {
            return [
                'id' => (string) $r->id,
                'repairCode' => $r->repair_code,
                'damageTicketCode' => $r->damage_ticket_code ?? 'DMG-2026-001',
                'toiletCode' => $r->toilet_code,
                'locationName' => $r->location_name,
                'technicianName' => $r->technician_name,
                'actionTaken' => $r->action_taken,
                'partsReplaced' => $r->parts_replaced ?? 'Tidak ada sparepart diganti',
                'costEstimateRp' => $r->cost_estimate_rp,
                'startedAt' => $r->started_at ?? 'Hari ini',
                'completedAt' => $r->completed_at,
                'status' => $r->status,
                'notes' => $r->notes ?? 'Pengerjaan sesuai SLA perbaikan sanitasi',
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mapped->count(),
            'data' => $mapped
        ], 200);
    }

    public function store(Request $request)
    {
        $request->merge([
            'repair_code' => $request->input('repair_code', $request->input('repairCode')),
            'damage_ticket_code' => $request->input('damage_ticket_code', $request->input('damageTicketCode')),
            'toilet_code' => $request->input('toilet_code', $request->input('toiletCode')),
            'location_name' => $request->input('location_name', $request->input('locationName')),
            'technician_name' => $request->input('technician_name', $request->input('technicianName')),
            'action_taken' => $request->input('action_taken', $request->input('actionTaken')),
            'parts_replaced' => $request->input('parts_replaced', $request->input('partsReplaced')),
            'cost_estimate_rp' => $request->input('cost_estimate_rp', $request->input('costEstimateRp')),
        ]);

        $validated = $request->validate([
            'toilet_code' => 'required|string',
            'location_name' => 'required|string',
            'technician_name' => 'required|string',
            'action_taken' => 'required|string',
            'parts_replaced' => 'nullable|string',
            'cost_estimate_rp' => 'nullable|numeric',
            'status' => 'nullable|in:Dalam Antrian,Proses Pengerjaan,Menunggu Sparepart,Selesai',
            'notes' => 'nullable|string',
        ]);

        $repairCode = $request->input('repair_code') ?: 'REP-' . date('Y') . '-' . rand(100, 999);
        $validated['repair_code'] = $repairCode;
        $validated['damage_ticket_code'] = $request->input('damage_ticket_code') ?: 'DMG-2026-081';
        $validated['started_at'] = 'Hari ini (' . now()->format('H:i') . ' WIB)';
        $status = $validated['status'] ?? 'Proses Pengerjaan';

        $repair = RepairTicket::create($validated);

        // Sync with Toilet, DamageReport, & Fasilitas
        if ($repair->toilet_code) {
            $toiletStatus = ($status === 'Selesai') ? 'Online' : 'Maintenance';
            Toilet::where('code', $repair->toilet_code)->update(['status' => $toiletStatus]);

            $fasilitasStatus = ($status === 'Selesai') ? 'Tersedia' : 'Perlu Perbaikan';
            $fasilitasKondisi = ($status === 'Selesai') ? 'Baik' : 'Perlu Perbaikan';
            Fasilitas::where('toilet_code', $repair->toilet_code)->update([
                'status' => $fasilitasStatus,
                'kondisi' => $fasilitasKondisi
            ]);
        }

        if ($repair->damage_ticket_code) {
            $damageStatus = ($status === 'Selesai') ? 'Selesai' : 'Dalam Perbaikan';
            DamageReport::where('ticket_code', $repair->damage_ticket_code)->update(['status' => $damageStatus]);
        }

        return response()->json([
            'success' => true,
            'message' => "Tiket perbaikan baru [{$repairCode}] berhasil dibuat!",
            'data' => $repair
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $request->merge([
            'repair_code' => $request->input('repair_code', $request->input('repairCode')),
            'damage_ticket_code' => $request->input('damage_ticket_code', $request->input('damageTicketCode')),
            'toilet_code' => $request->input('toilet_code', $request->input('toiletCode')),
            'location_name' => $request->input('location_name', $request->input('locationName')),
            'technician_name' => $request->input('technician_name', $request->input('technicianName')),
            'action_taken' => $request->input('action_taken', $request->input('actionTaken')),
            'parts_replaced' => $request->input('parts_replaced', $request->input('partsReplaced')),
            'cost_estimate_rp' => $request->input('cost_estimate_rp', $request->input('costEstimateRp')),
        ]);

        $repair = RepairTicket::find($id);
        if (!$repair) {
            $numericId = preg_replace('/[^0-9]/', '', $id);
            if (!empty($numericId)) {
                $repair = RepairTicket::find($numericId);
            }
        }

        $validated = array_filter([
            'toilet_code' => $request->input('toilet_code'),
            'location_name' => $request->input('location_name'),
            'technician_name' => $request->input('technician_name'),
            'action_taken' => $request->input('action_taken'),
            'parts_replaced' => $request->input('parts_replaced'),
            'cost_estimate_rp' => $request->input('cost_estimate_rp'),
            'status' => $request->input('status'),
            'notes' => $request->input('notes'),
            'damage_ticket_code' => $request->input('damage_ticket_code'),
        ], fn($v) => !is_null($v));

        if ($request->filled('status') && $request->status === 'Selesai' && !$repair?->completed_at) {
            $validated['completed_at'] = now()->format('H:i') . ' WIB';
        }

        if (!$repair) {
            $repair = RepairTicket::create(array_merge([
                'repair_code' => $request->input('repair_code') ?: 'REP-' . date('Y') . '-' . rand(100, 999),
                'started_at' => 'Hari ini (' . now()->format('H:i') . ' WIB)',
            ], $validated));
        } else {
            $repair->update($validated);
        }

        $newStatus = $repair->status;
        if ($repair->toilet_code) {
            $toiletStatus = ($newStatus === 'Selesai') ? 'Online' : 'Maintenance';
            Toilet::where('code', $repair->toilet_code)->update(['status' => $toiletStatus]);

            $fasilitasStatus = ($newStatus === 'Selesai') ? 'Tersedia' : 'Perlu Perbaikan';
            $fasilitasKondisi = ($newStatus === 'Selesai') ? 'Baik' : 'Perlu Perbaikan';
            Fasilitas::where('toilet_code', $repair->toilet_code)->update([
                'status' => $fasilitasStatus,
                'kondisi' => $fasilitasKondisi
            ]);
        }

        if ($repair->damage_ticket_code) {
            $damageStatus = ($newStatus === 'Selesai') ? 'Selesai' : 'Dalam Perbaikan';
            DamageReport::where('ticket_code', $repair->damage_ticket_code)->update(['status' => $damageStatus]);
        }

        return response()->json([
            'success' => true,
            'message' => "Tiket perbaikan [{$repair->repair_code}] berhasil diperbarui!",
            'data' => $repair
        ], 200);
    }

    public function destroy(string $id)
    {
        $repair = RepairTicket::find($id);
        if (!$repair) {
            $numericId = preg_replace('/[^0-9]/', '', $id);
            if (!empty($numericId)) {
                $repair = RepairTicket::find($numericId);
            }
        }

        if ($repair) {
            $repair->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Tiket perbaikan berhasil dihapus.'
        ], 200);
    }

    public function updateStatus(Request $request, string $id)
    {
        $repair = RepairTicket::find($id);

        if (!$repair) {
            return response()->json(['success' => false, 'message' => 'Tiket perbaikan tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:Dalam Antrian,Proses Pengerjaan,Menunggu Sparepart,Selesai',
        ]);

        $updateData = ['status' => $validated['status']];
        if ($validated['status'] === 'Selesai') {
            $updateData['completed_at'] = now()->format('H:i') . ' WIB';
        }

        $repair->update($updateData);

        // Sync with Toilet, DamageReport, & Fasilitas
        $newStatus = $validated['status'];
        if ($repair->toilet_code) {
            $toiletStatus = ($newStatus === 'Selesai') ? 'Online' : 'Maintenance';
            Toilet::where('code', $repair->toilet_code)->update(['status' => $toiletStatus]);

            $fasilitasStatus = ($newStatus === 'Selesai') ? 'Tersedia' : 'Perlu Perbaikan';
            $fasilitasKondisi = ($newStatus === 'Selesai') ? 'Baik' : 'Perlu Perbaikan';
            Fasilitas::where('toilet_code', $repair->toilet_code)->update([
                'status' => $fasilitasStatus,
                'kondisi' => $fasilitasKondisi
            ]);
        }

        if ($repair->damage_ticket_code) {
            $damageStatus = ($newStatus === 'Selesai') ? 'Selesai' : 'Dalam Perbaikan';
            DamageReport::where('ticket_code', $repair->damage_ticket_code)->update(['status' => $damageStatus]);
        }

        return response()->json([
            'success' => true,
            'message' => "Status tiket perbaikan [{$repair->repair_code}] diubah menjadi {$validated['status']}!",
            'data' => $repair
        ], 200);
    }
}
