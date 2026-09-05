<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Staff;

use App\Models\User;

class StaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Staff::query();

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('shift') && $request->shift) {
            $query->where('shift', $request->shift);
        }

        if ($request->has('building') && $request->building) {
            $query->where('assigned_building', $request->building);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $staffList = $query->orderBy('name', 'asc')->get();

        // Map format ke camelCase untuk konsistensi dengan Frontend React (PetugasKebersihan interface)
        $mappedStaff = $staffList->map(function ($s) {
            $words = explode(' ', trim($s->name));
            $initials = count($words) >= 2
                ? strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1))
                : strtoupper(substr($s->name, 0, 2));

            return [
                'id' => (string) $s->id,
                'nip' => $s->nip,
                'name' => $s->name,
                'phone' => $s->phone,
                'email' => $s->email ?? (strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $s->nip)) . '@letsens.unikom.ac.id'),
                'role' => $s->role ?? 'Petugas Kebersihan',
                'shift' => $s->shift,
                'assignedBuilding' => $s->assigned_building,
                'status' => $s->status,
                'rating' => $s->rating ?? 4.8,
                'completedTasksToday' => $s->completed_tasks_today ?? 5,
                'avatar' => $s->avatar ?? $initials,
                'lastActive' => $s->last_active ?? 'Baru saja',
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mappedStaff->count(),
            'data' => $mappedStaff
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($request->has('assignedBuilding')) $request->merge(['assigned_building' => $request->assignedBuilding]);

        $validated = $request->validate([
            'nip' => 'required|string|unique:staff,nip',
            'name' => 'required|string',
            'phone' => 'required|string',
            'email' => 'nullable|string',
            'role' => 'nullable|string',
            'shift' => 'nullable|in:Pagi (06:00 - 14:00),Siang (14:00 - 22:00),Malam (22:00 - 06:00)',
            'assigned_building' => 'nullable|string',
            'status' => 'nullable|in:Bertugas,Istirahat,Siaga,Izin',
        ]);

        $staff = Staff::create($validated);

        if (!empty($staff->email)) {
            User::updateOrCreate(
                ['email' => $staff->email],
                [
                    'name' => $staff->name,
                    'role' => $staff->role ?? 'Petugas Kebersihan',
                    'password' => bcrypt('password123'),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengguna baru berhasil didaftarkan!',
            'data' => $staff
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $staff = Staff::where('id', $id)->orWhere('nip', $id)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Data pengguna tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $staff
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if ($request->has('assignedBuilding')) $request->merge(['assigned_building' => $request->assignedBuilding]);

        $staff = Staff::where('id', $id)->orWhere('nip', $id)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Data pengguna tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|string',
            'role' => 'nullable|string',
            'shift' => 'nullable|in:Pagi (06:00 - 14:00),Siang (14:00 - 22:00),Malam (22:00 - 06:00)',
            'assigned_building' => 'nullable|string',
            'status' => 'nullable|in:Bertugas,Istirahat,Siaga,Izin',
        ]);

        $staff->update($validated);

        if (!empty($staff->email)) {
            User::updateOrCreate(
                ['email' => $staff->email],
                [
                    'name' => $staff->name,
                    'role' => $staff->role ?? 'Petugas Kebersihan',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui!',
            'data' => $staff
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $staff = Staff::where('id', $id)->orWhere('nip', $id)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Data petugas tidak ditemukan.'
            ], 404);
        }

        if (!empty($staff->email)) {
            User::where('email', $staff->email)->delete();
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data petugas berhasil dihapus dari sistem.'
        ], 200);
    }

    /**
     * Trigger WhatsApp Dispatch Call for Emergency Sanitization.
     */
    public function dispatchWhatsapp(Request $request)
    {
        $validated = $request->validate([
            'staff_name' => 'required|string',
            'phone' => 'required|string',
            'toilet_code' => 'required|string',
            'issue' => 'nullable|string',
        ]);

        $phoneClean = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (str_starts_with($phoneClean, '0')) {
            $phoneClean = '62' . substr($phoneClean, 1);
        }

        $issueText = $validated['issue'] ?? 'Pembersihan bilik sanitasi & pengecekan amonia';
        $message = "*PANGGILAN TUGAS SANITASI - LETSENS AIoT Universitas Komputer Indonesia*\n\n"
                 . "Halo Rekan {$validated['staff_name']},\n"
                 . "Mohon segera menuju *Bilik {$validated['toilet_code']}*.\n\n"
                 . "*Kendala:* {$issueText}\n"
                 . "*Waktu:* " . now()->format('H:i:s') . "\n\n"
                 . "Terima kasih atas kerja samanya.";

        $encodedText = rawurlencode($message);
        $waUrl = "https://wa.me/{$phoneClean}?text={$encodedText}";

        return response()->json([
            'success' => true,
            'message' => "Instruksi tugas sanitasi siap dikirim ke WhatsApp {$validated['staff_name']}!",
            'data' => [
                'targetPhone' => $phoneClean,
                'toiletCode' => $validated['toilet_code'],
                'messageText' => $message,
                'whatsappUrl' => $waUrl,
            ]
        ], 200);
    }
}
