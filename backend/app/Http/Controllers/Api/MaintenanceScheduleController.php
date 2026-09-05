<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MaintenanceSchedule;
use App\Models\Toilet;
use App\Models\Staff;

class MaintenanceScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = MaintenanceSchedule::query();

        if ($request->has('status') && $request->status && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->has('type') && $request->type && $request->type !== 'ALL') {
            $query->where('type', $request->type);
        }

        if ($request->has('search') && $request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(toilet_code) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(toilet_name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(staff_name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(type) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(notes) LIKE ?', ["%{$search}%"]);
            });
        }

        $schedules = $query->orderBy('created_at', 'desc')->get();

        $mapped = $schedules->map(function ($s) {
            return [
                'id' => (string) $s->id,
                'toiletCode' => $s->toilet_code,
                'toiletName' => $s->toilet_name,
                'staffId' => (string) ($s->staff_id ?? '1'),
                'staffName' => $s->staff_name,
                'shift' => $s->shift,
                'timeSlot' => $s->time_slot,
                'type' => $s->type,
                'checklist' => $s->checklist ?? [
                    ['task' => 'Pengecekan Kebersihan Floor Drain & Wastafel', 'done' => true],
                    ['task' => 'Pembersihan Kloset dengan Desinfektan', 'done' => true],
                    ['task' => 'Pengisian Ulang Sabun Cair & Tisu Roll', 'done' => false],
                    ['task' => 'Pengecekan Fungsi Blower Exhaust & Sensor MQ-137', 'done' => false],
                ],
                'status' => $s->status,
                'notes' => $s->notes ?? 'Jadwal rutin harian sanitasi kampus',
                'completedAt' => $s->completed_at,
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
        if ($request->has('toiletCode')) $request->merge(['toilet_code' => $request->toiletCode]);
        if ($request->has('toiletName')) $request->merge(['toilet_name' => $request->toiletName]);
        if ($request->has('staffId')) $request->merge(['staff_id' => $request->staffId]);
        if ($request->has('staffName')) $request->merge(['staff_name' => $request->staffName]);
        if ($request->has('timeSlot')) $request->merge(['time_slot' => $request->timeSlot]);

        $validated = $request->validate([
            'toilet_code' => 'required|string',
            'toilet_name' => 'required|string',
            'staff_id' => 'nullable|string',
            'staff_name' => 'required|string',
            'shift' => 'nullable|string',
            'time_slot' => 'nullable|string',
            'type' => 'required|in:Pembersihan Rutin,Inspeksi Berkala,Deep Cleaning,Restock Perlengkapan',
            'checklist' => 'nullable|array',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['status'])) {
            $validated['status'] = 'Terjadwal';
        }

        $schedule = MaintenanceSchedule::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pemeliharaan baru berhasil dibuat!',
            'data' => $schedule
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        if ($request->has('toiletCode')) $request->merge(['toilet_code' => $request->toiletCode]);
        if ($request->has('toiletName')) $request->merge(['toilet_name' => $request->toiletName]);
        if ($request->has('staffId')) $request->merge(['staff_id' => $request->staffId]);
        if ($request->has('staffName')) $request->merge(['staff_name' => $request->staffName]);
        if ($request->has('timeSlot')) $request->merge(['time_slot' => $request->timeSlot]);

        $schedule = MaintenanceSchedule::find($id);
        if (!$schedule) {
            $numericId = preg_replace('/[^0-9]/', '', (string)$id);
            if (!empty($numericId)) {
                $schedule = MaintenanceSchedule::find($numericId);
            }
        }

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Jadwal tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'toilet_code' => 'sometimes|required|string',
            'toilet_name' => 'sometimes|required|string',
            'staff_id' => 'nullable|string',
            'staff_name' => 'sometimes|required|string',
            'shift' => 'nullable|string',
            'time_slot' => 'nullable|string',
            'type' => 'sometimes|required|in:Pembersihan Rutin,Inspeksi Berkala,Deep Cleaning,Restock Perlengkapan',
            'checklist' => 'nullable|array',
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $schedule->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pemeliharaan berhasil diperbarui!',
            'data' => $schedule
        ], 200);
    }

    public function destroy(string $id)
    {
        $schedule = MaintenanceSchedule::find($id);
        if (!$schedule) {
            $numericId = preg_replace('/[^0-9]/', '', (string)$id);
            if (!empty($numericId)) {
                $schedule = MaintenanceSchedule::find($numericId);
            }
        }

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Jadwal tidak ditemukan.'], 404);
        }

        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal pemeliharaan berhasil dihapus.'
        ], 200);
    }

    public function toggleChecklist(Request $request, string $id)
    {
        if ($request->has('taskIndex')) $request->merge(['task_index' => $request->taskIndex]);

        $schedule = MaintenanceSchedule::find($id);
        if (!$schedule) {
            $numericId = preg_replace('/[^0-9]/', '', (string)$id);
            if (!empty($numericId)) {
                $schedule = MaintenanceSchedule::find($numericId);
            }
        }

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Jadwal tidak ditemukan.'], 404);
        }

        $taskIndex = $request->validate(['task_index' => 'required|integer'])['task_index'];

        $checklist = $schedule->checklist ?? [];
        if (isset($checklist[$taskIndex])) {
            $checklist[$taskIndex]['done'] = !$checklist[$taskIndex]['done'];

            // Calculate status based on checklist completion
            $allDone = count($checklist) > 0 && array_reduce($checklist, fn($carry, $item) => $carry && !empty($item['done']), true);
            $anyDone = array_reduce($checklist, fn($carry, $item) => $carry || !empty($item['done']), false);

            $status = $allDone ? 'Selesai' : ($anyDone ? 'Sedang Berjalan' : 'Terjadwal');

            $updateData = [
                'checklist' => $checklist,
                'status' => $status,
                'completed_at' => $allDone ? now()->format('H:i') . ' WIB' : null,
            ];
            $schedule->update($updateData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status checklist tugas berhasil diperbarui!',
            'data' => $schedule
        ], 200);
    }

    public function complete(string $id)
    {
        $schedule = MaintenanceSchedule::find($id);
        if (!$schedule) {
            $numericId = preg_replace('/[^0-9]/', '', (string)$id);
            if (!empty($numericId)) {
                $schedule = MaintenanceSchedule::find($numericId);
            }
        }

        if (!$schedule) {
            return response()->json(['success' => false, 'message' => 'Jadwal tidak ditemukan.'], 404);
        }

        $checklist = array_map(function ($item) {
            $item['done'] = true;
            return $item;
        }, $schedule->checklist ?? []);

        $schedule->update([
            'status' => 'Selesai',
            'checklist' => $checklist,
            'completed_at' => now()->format('H:i') . ' WIB',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Jadwal pemeliharaan [{$schedule->toilet_code}] berhasil diselesaikan!",
            'data' => $schedule
        ], 200);
    }
}
