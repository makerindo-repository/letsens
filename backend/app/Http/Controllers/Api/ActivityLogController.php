<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivityLog;

class ActivityLogController extends Controller
{
    /**
     * Get all activity logs with optional filtering.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::query();

        if ($request->has('module') && $request->module && $request->module !== 'ALL') {
            $query->where('module', $request->module);
        }

        if ($request->has('status') && $request->status && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(user) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(action) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(module) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(ip) LIKE ?', ["%{$search}%"]);
            });
        }

        $logs = $query->orderBy('recorded_at', 'desc')
                      ->orderBy('id', 'desc')
                      ->take($request->get('limit', 500))
                      ->get();

        $mapped = $logs->map(function ($l) {
            return [
                'id' => (string) $l->id,
                'timestamp' => $l->recorded_at ? $l->recorded_at->format('Y-m-d H:i:s') : $l->created_at->format('Y-m-d H:i:s'),
                'user' => $l->user,
                'action' => $l->action,
                'module' => $l->module,
                'status' => $l->status,
                'ip' => $l->ip,
                'details' => $l->details,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mapped->count(),
            'data' => $mapped,
        ], 200);
    }

    /**
     * Store new activity log entry.
     */
    public function store(Request $request)
    {
        $request->validate([
            'action' => 'required|string',
            'module' => 'nullable|string',
            'status' => 'nullable|in:success,warning,error',
            'user' => 'nullable|string',
            'ip' => 'nullable|string',
            'details' => 'nullable|string',
        ]);

        $log = ActivityLog::log(
            $request->action,
            $request->get('module', 'SISTEM'),
            $request->get('status', 'success'),
            $request->get('details'),
            $request->get('user', 'Super Admin'),
            $request->ip() ?? '127.0.0.1'
        );

        return response()->json([
            'success' => true,
            'message' => 'Activity log recorded successfully.',
            'data' => $log,
        ], 201);
    }

    /**
     * Clear all activity logs.
     */
    public function destroy()
    {
        ActivityLog::truncate();
        ActivityLog::log('Seluruh riwayat log aktivitas dibersihkan oleh pengguna', 'SISTEM', 'warning');

        return response()->json([
            'success' => true,
            'message' => 'Seluruh log aktivitas berhasil dibersihkan.',
        ], 200);
    }
}
