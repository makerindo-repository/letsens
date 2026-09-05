<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fasilitas;
use App\Models\Toilet;
use Illuminate\Http\Request;

class FasilitasController extends Controller
{
    /**
     * Display a listing of facilities.
     */
    public function index(Request $request)
    {
        $query = Fasilitas::query();

        if ($request->filled('building') && $request->building !== 'ALL') {
            $query->where('building', $request->building);
        }

        if ($request->filled('toilet_code') && $request->toilet_code !== 'ALL') {
            $query->where('toilet_code', $request->toilet_code);
        }

        if ($request->filled('kategori') && $request->kategori !== 'ALL') {
            $query->where('kategori', $request->kategori);
        }

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_fasilitas) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(location) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(kondisi) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(toilet_code) LIKE ?', ["%{$search}%"]);
            });
        }

        $items = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Data fasilitas toilet berhasil dimuat',
            'data' => $items,
        ]);
    }

    /**
     * Store a newly created facility item.
     */
    public function store(Request $request)
    {
        if ($request->has('namaFasilitas')) $request->merge(['nama_fasilitas' => $request->namaFasilitas]);
        if ($request->has('toiletCode')) $request->merge(['toilet_code' => $request->toiletCode]);
        if ($request->has('stokAngka')) $request->merge(['stok_angka' => $request->stokAngka]);
        if ($request->has('petugasJawab')) $request->merge(['petugas_jawab' => $request->petugasJawab]);
        if ($request->has('terakhirDiperiksa')) $request->merge(['terakhir_diperiksa' => $request->terakhirDiperiksa]);

        $validated = $request->validate([
            'nama_fasilitas' => 'required|string|max:255',
            'toilet_code' => 'required|string|max:50',
            'building' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'floor' => 'nullable|integer',
            'kategori' => 'required|string|max:100',
            'jumlah' => 'required|string|max:100',
            'stok_angka' => 'nullable|integer',
            'unit' => 'nullable|string|max:50',
            'kondisi' => 'required|string|max:100',
            'status' => 'required|string|max:50',
            'petugas_jawab' => 'nullable|string|max:255',
            'catatan' => 'nullable|string',
        ]);

        // Auto-fill location/building from toilet table if available
        if (empty($validated['location']) || empty($validated['building'])) {
            $toilet = Toilet::where('code', $validated['toilet_code'])->first();
            if ($toilet) {
                $validated['toilet_id'] = (string) $toilet->id;
                $validated['location'] = $validated['location'] ?? $toilet->name;
                $validated['building'] = $validated['building'] ?? $toilet->building;
                $validated['floor'] = $validated['floor'] ?? $toilet->floor;
            }
        }

        $validated['terakhir_diperiksa'] = now()->format('Y-m-d H:i:s');

        $item = Fasilitas::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fasilitas baru berhasil ditambahkan',
            'data' => $item,
        ], 201);
    }

    /**
     * Display the specified facility item.
     */
    public function show($id)
    {
        $item = Fasilitas::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Data fasilitas tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Update the specified facility item.
     */
    public function update(Request $request, $id)
    {
        if ($request->has('namaFasilitas')) $request->merge(['nama_fasilitas' => $request->namaFasilitas]);
        if ($request->has('toiletCode')) $request->merge(['toilet_code' => $request->toiletCode]);
        if ($request->has('stokAngka')) $request->merge(['stok_angka' => $request->stokAngka]);
        if ($request->has('petugasJawab')) $request->merge(['petugas_jawab' => $request->petugasJawab]);
        if ($request->has('terakhirDiperiksa')) $request->merge(['terakhir_diperiksa' => $request->terakhirDiperiksa]);

        $item = Fasilitas::find($id);

        if (!$item) {
            $numericId = preg_replace('/[^0-9]/', '', (string)$id);
            if (!empty($numericId)) {
                $item = Fasilitas::find($numericId);
            }
        }

        if (!$item && $request->filled('nama_fasilitas')) {
            $item = Fasilitas::where('nama_fasilitas', $request->nama_fasilitas)
                ->when($request->filled('toilet_code'), function ($q) use ($request) {
                    $q->where('toilet_code', $request->toilet_code);
                })
                ->first();
        }

        $validated = $request->validate([
            'nama_fasilitas' => 'sometimes|required|string|max:255',
            'toilet_code' => 'sometimes|required|string|max:50',
            'building' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'floor' => 'nullable|integer',
            'kategori' => 'sometimes|required|string|max:100',
            'jumlah' => 'sometimes|required|string|max:100',
            'stok_angka' => 'nullable|integer',
            'unit' => 'nullable|string|max:50',
            'kondisi' => 'sometimes|required|string|max:100',
            'status' => 'sometimes|required|string|max:50',
            'petugas_jawab' => 'nullable|string|max:255',
            'catatan' => 'nullable|string',
        ]);

        $validated['terakhir_diperiksa'] = now()->format('Y-m-d H:i:s');

        if (!$item) {
            $item = Fasilitas::create($validated);
        } else {
            $item->update($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data fasilitas berhasil diperbarui',
            'data' => $item,
        ]);
    }

    /**
     * Remove the specified facility item from storage.
     */
    public function destroy($id)
    {
        $item = Fasilitas::find($id);

        if (!$item) {
            $numericId = preg_replace('/[^0-9]/', '', (string)$id);
            if (!empty($numericId)) {
                $item = Fasilitas::find($numericId);
            }
        }

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Data fasilitas tidak ditemukan',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data fasilitas berhasil dihapus',
        ]);
    }
}
