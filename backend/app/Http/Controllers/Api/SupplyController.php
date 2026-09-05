<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supply;

class SupplyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Supply::query();

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $supplies = $query->orderBy('name', 'asc')->get();

        // Map format ke camelCase untuk konsistensi dengan Frontend React (PerlengkapanItem interface)
        $mappedSupplies = $supplies->map(function ($s) {
            return [
                'id' => (string) $s->id,
                'name' => $s->name,
                'category' => $s->category,
                'stock' => $s->stock,
                'unit' => $s->unit,
                'minThreshold' => $s->min_threshold,
                'location' => $s->location,
                'lastRestocked' => $s->last_restocked ?? 'Hari ini',
                'pricePerUnit' => $s->price_per_unit,
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $mappedSupplies->count(),
            'data' => $mappedSupplies
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($request->has('minThreshold')) $request->merge(['min_threshold' => $request->minThreshold]);
        if ($request->has('pricePerUnit')) $request->merge(['price_per_unit' => $request->pricePerUnit]);

        $validated = $request->validate([
            'name' => 'required|string',
            'category' => 'required|in:Cairan & Kimia,Kertas & Tisu,Pewangi & Aerosol,Alat Pembersih,Hardware IoT',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string',
            'min_threshold' => 'nullable|integer|min:0',
            'location' => 'nullable|string',
            'price_per_unit' => 'nullable|numeric|min:0',
        ]);

        $supply = Supply::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Barang perlengkapan baru berhasil ditambahkan!',
            'data' => $supply
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $supply = Supply::find($id);

        if (!$supply) {
            return response()->json([
                'success' => false,
                'message' => 'Barang perlengkapan tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $supply
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if ($request->has('minThreshold')) $request->merge(['min_threshold' => $request->minThreshold]);
        if ($request->has('pricePerUnit')) $request->merge(['price_per_unit' => $request->pricePerUnit]);

        $supply = Supply::find($id);

        if (!$supply) {
            return response()->json([
                'success' => false,
                'message' => 'Barang perlengkapan tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string',
            'category' => 'nullable|in:Cairan & Kimia,Kertas & Tisu,Pewangi & Aerosol,Alat Pembersih,Hardware IoT',
            'stock' => 'nullable|integer|min:0',
            'unit' => 'nullable|string',
            'min_threshold' => 'nullable|integer|min:0',
            'location' => 'nullable|string',
            'price_per_unit' => 'nullable|numeric|min:0',
        ]);

        $supply->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data barang perlengkapan berhasil diperbarui!',
            'data' => $supply
        ], 200);
    }

    /**
     * Adjust stock level & record restock timestamp.
     */
    public function adjustStock(Request $request, string $id)
    {
        $supply = Supply::find($id);

        if (!$supply) {
            return response()->json([
                'success' => false,
                'message' => 'Barang perlengkapan tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $oldStock = $supply->stock;
        $newStock = $validated['stock'];
        $delta = $newStock - $oldStock;

        $supply->update([
            'stock' => $newStock,
            'last_restocked' => $delta > 0 ? 'Hari ini (' . now()->format('H:i') . ' WIB)' : $supply->last_restocked,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Stok {$supply->name} berhasil diperbarui dari {$oldStock} menjadi {$newStock} {$supply->unit}!",
            'data' => $supply
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $supply = Supply::find($id);

        if (!$supply) {
            return response()->json([
                'success' => false,
                'message' => 'Barang perlengkapan tidak ditemukan.'
            ], 404);
        }

        $supply->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang perlengkapan berhasil dihapus dari inventaris.'
        ], 200);
    }
}
