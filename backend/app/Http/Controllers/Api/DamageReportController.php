<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DamageReport;
use App\Models\RepairTicket;

class DamageReportController extends Controller
{
    public function index(Request $request)
    {
        $query = DamageReport::query();

        if ($request->has('severity') && $request->severity) {
            $query->where('severity', $request->severity);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $damages = $query->orderBy('created_at', 'desc')->get();

        $mapped = $damages->map(function ($d) {
            return [
                'id' => (string) $d->id,
                'ticketCode' => $d->ticket_code,
                'toiletCode' => $d->toilet_code,
                'locationName' => $d->location_name,
                'category' => $d->category,
                'description' => $d->description,
                'reportedBy' => $d->reported_by,
                'reportedAt' => $d->reported_at ?? ($d->created_at ? $d->created_at->diffForHumans() : 'Baru saja'),
                'severity' => $d->severity,
                'status' => $d->status,
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
            'toilet_code' => $request->input('toilet_code', $request->input('toiletCode')),
            'location_name' => $request->input('location_name', $request->input('locationName')),
            'reported_by' => $request->input('reported_by', $request->input('reportedBy')),
            'ticket_code' => $request->input('ticket_code', $request->input('ticketCode')),
        ]);

        $validated = $request->validate([
            'toilet_code' => 'required|string',
            'location_name' => 'required|string',
            'category' => 'required|in:Plumbing & Air,Sensor & IoT,Sanitasi & Kloset,Elektrikal & Lampu',
            'description' => 'required|string',
            'reported_by' => 'nullable|string',
            'severity' => 'required|in:Rendah,Sedang,Tinggi,Darurat',
        ]);

        $ticketCode = $request->input('ticket_code') ?: ('DMG-' . date('Y') . '-' . rand(100, 999));
        $validated['ticket_code'] = $ticketCode;
        $validated['reported_at'] = now()->format('d M Y, H:i') . ' WIB';
        $validated['status'] = 'Dalam Perbaikan';

        $damage = DamageReport::create($validated);

        // Auto-create single linked RepairTicket
        $repairCode = 'REP-' . date('Y') . '-' . rand(100, 999);
        $repair = RepairTicket::create([
            'repair_code' => $repairCode,
            'damage_ticket_code' => $damage->ticket_code,
            'damage_report_id' => $damage->id,
            'toilet_id' => $damage->toilet_id,
            'toilet_code' => $damage->toilet_code,
            'location_name' => $damage->location_name,
            'technician_name' => 'Bambang Sudarmono (Teknisi MEP)',
            'action_taken' => "Tindak lanjut perbaikan: {$damage->description}",
            'parts_replaced' => 'Dalam proses diagnosa',
            'cost_estimate_rp' => 50000,
            'started_at' => 'Baru dimulai (' . now()->format('H:i') . ' WIB)',
            'status' => 'Proses Pengerjaan',
            'notes' => "Tiket perbaikan otomatis dari laporan {$damage->ticket_code}",
        ]);

        return response()->json([
            'success' => true,
            'message' => "Laporan kerusakan [{$ticketCode}] & tiket perbaikan [{$repairCode}] berhasil dicatat!",
            'data' => [
                'damage' => [
                    'id' => (string) $damage->id,
                    'ticketCode' => $damage->ticket_code,
                    'toiletCode' => $damage->toilet_code,
                    'locationName' => $damage->location_name,
                    'category' => $damage->category,
                    'description' => $damage->description,
                    'reportedBy' => $damage->reported_by,
                    'reportedAt' => $damage->reported_at,
                    'severity' => $damage->severity,
                    'status' => $damage->status,
                ],
                'repair' => [
                    'id' => (string) $repair->id,
                    'repairCode' => $repair->repair_code,
                    'damageTicketCode' => $repair->damage_ticket_code,
                    'toiletCode' => $repair->toilet_code,
                    'locationName' => $repair->location_name,
                    'technicianName' => $repair->technician_name,
                    'actionTaken' => $repair->action_taken,
                    'partsReplaced' => $repair->parts_replaced,
                    'costEstimateRp' => $repair->cost_estimate_rp,
                    'startedAt' => $repair->started_at,
                    'status' => $repair->status,
                    'notes' => $repair->notes,
                ],
            ]
        ], 201);
    }

    public function dispatchToRepair(Request $request, string $id)
    {
        $damage = DamageReport::find($id);

        if (!$damage) {
            return response()->json(['success' => false, 'message' => 'Laporan kerusakan tidak ditemukan.'], 404);
        }

        // Prevent duplicate creation: reuse existing repair ticket if already present
        $existingRepair = RepairTicket::where('damage_ticket_code', $damage->ticket_code)->first();
        if ($existingRepair) {
            if ($request->has('technician_name')) {
                $existingRepair->update(['technician_name' => $request->get('technician_name')]);
            }
            return response()->json([
                'success' => true,
                'message' => "Tiket perbaikan [{$existingRepair->repair_code}] sudah ada untuk laporan [{$damage->ticket_code}].",
                'data' => [
                    'damage' => $damage,
                    'repair' => $existingRepair,
                ]
            ], 200);
        }

        $repairCode = 'REP-' . date('Y') . '-' . rand(100, 999);
        $repair = RepairTicket::create([
            'repair_code' => $repairCode,
            'damage_ticket_code' => $damage->ticket_code,
            'damage_report_id' => $damage->id,
            'toilet_id' => $damage->toilet_id,
            'toilet_code' => $damage->toilet_code,
            'location_name' => $damage->location_name,
            'technician_name' => $request->get('technician_name', 'Bambang Sudarmono (Teknisi MEP)'),
            'action_taken' => "Tindak lanjut perbaikan: {$damage->description}",
            'parts_replaced' => 'Dalam proses diagnosa',
            'cost_estimate_rp' => 50000,
            'started_at' => 'Baru dimulai',
            'status' => 'Proses Pengerjaan',
            'notes' => "Eskalasi tiket perbaikan dari laporan {$damage->ticket_code}",
        ]);

        $damage->update(['status' => 'Dalam Perbaikan']);

        return response()->json([
            'success' => true,
            'message' => "Tiket kerusakan [{$damage->ticket_code}] berhasil ditipekan ke Tiket Perbaikan [{$repairCode}]!",
            'data' => [
                'damage' => [
                    'id' => (string) $damage->id,
                    'ticketCode' => $damage->ticket_code,
                    'toiletCode' => $damage->toilet_code,
                    'locationName' => $damage->location_name,
                    'category' => $damage->category,
                    'description' => $damage->description,
                    'reportedBy' => $damage->reported_by,
                    'reportedAt' => $damage->reported_at,
                    'severity' => $damage->severity,
                    'status' => $damage->status,
                ],
                'repair' => [
                    'id' => (string) $repair->id,
                    'repairCode' => $repair->repair_code,
                    'damageTicketCode' => $repair->damage_ticket_code,
                    'toiletCode' => $repair->toilet_code,
                    'locationName' => $repair->location_name,
                    'technicianName' => $repair->technician_name,
                    'actionTaken' => $repair->action_taken,
                    'partsReplaced' => $repair->parts_replaced,
                    'costEstimateRp' => $repair->cost_estimate_rp,
                    'startedAt' => $repair->started_at,
                    'status' => $repair->status,
                    'notes' => $repair->notes,
                ],
            ]
        ], 200);
    }

    public function update(Request $request, string $id)
    {
        $damage = DamageReport::find($id);

        if (!$damage) {
            return response()->json(['success' => false, 'message' => 'Laporan kerusakan tidak ditemukan.'], 404);
        }

        $request->merge([
            'toilet_code' => $request->input('toilet_code', $request->input('toiletCode')),
            'location_name' => $request->input('location_name', $request->input('locationName')),
            'reported_by' => $request->input('reported_by', $request->input('reportedBy')),
        ]);

        $validated = $request->validate([
            'toilet_code' => 'nullable|string',
            'location_name' => 'nullable|string',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'reported_by' => 'nullable|string',
            'severity' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $damage->update(array_filter($validated, fn($v) => !is_null($v)));

        return response()->json([
            'success' => true,
            'message' => "Laporan kerusakan [{$damage->ticket_code}] berhasil diperbarui!",
            'data' => [
                'id' => (string) $damage->id,
                'ticketCode' => $damage->ticket_code,
                'toiletCode' => $damage->toilet_code,
                'locationName' => $damage->location_name,
                'category' => $damage->category,
                'description' => $damage->description,
                'reportedBy' => $damage->reported_by,
                'reportedAt' => $damage->reported_at,
                'severity' => $damage->severity,
                'status' => $damage->status,
            ]
        ], 200);
    }

    public function destroy(string $id)
    {
        $damage = DamageReport::find($id);

        if (!$damage) {
            return response()->json(['success' => false, 'message' => 'Laporan kerusakan tidak ditemukan.'], 404);
        }

        $ticketCode = $damage->ticket_code;
        $damage->delete();

        return response()->json([
            'success' => true,
            'message' => "Laporan kerusakan [{$ticketCode}] telah berhasil dihapus!",
        ], 200);
    }
}
