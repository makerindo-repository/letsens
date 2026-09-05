import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Search,
  RefreshCw,
  Table,
  LayoutGrid,
  Edit3,
  Trash2,
  DollarSign,
  Layers,
  Sparkles,
  ArrowUpRight,
  Box,
  Tag,
  Clock,
  Send,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PerlengkapanItem, FasilitasItem } from '../../types';

interface ManajemenPerlengkapanViewProps {
  supplies: PerlengkapanItem[];
  fasilitasList?: FasilitasItem[];
  onAddSupply?: (item: PerlengkapanItem) => void;
  onUpdateStock?: (id: string, newStock: number) => void;
  onDeleteSupply?: (id: string) => void;
  onUpdateSupply?: (item: PerlengkapanItem) => void;
}

export const ManajemenPerlengkapanView: React.FC<ManajemenPerlengkapanViewProps> = ({
  supplies: initialPropSupplies = [],
  fasilitasList = [],
  onAddSupply,
  onUpdateStock,
  onDeleteSupply,
  onUpdateSupply,
}) => {
  const [items, setItems] = useState<PerlengkapanItem[]>(initialPropSupplies);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PerlengkapanItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<PerlengkapanItem | null>(null);

  // Refill / Distribution Modal State
  const [distributeModalItem, setDistributeModalItem] = useState<PerlengkapanItem | null>(null);
  const [targetFacilityId, setTargetFacilityId] = useState<string>('');
  const [distributeQty, setDistributeQty] = useState<number>(1);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<PerlengkapanItem['category']>('Cairan & Kimia');
  const [formStock, setFormStock] = useState<number>(20);
  const [formUnit, setFormUnit] = useState<string>('Liter');
  const [formThreshold, setFormThreshold] = useState<number>(10);
  const [formLocation, setFormLocation] = useState<string>('Gudang Utama Gd. A');
  const [formPrice, setFormPrice] = useState<number>(25000);

  // Sync props with local state
  useEffect(() => {
    if (initialPropSupplies && initialPropSupplies.length > 0) {
      setItems(initialPropSupplies);
    }
  }, [initialPropSupplies]);

  // Fetch REST API Backend
  const fetchSupplies = async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/supplies');
      let isJson = res.ok && (res.headers.get('content-type') || '').includes('application/json');

      if (!isJson) {
        try {
          const directRes = await fetch('http://127.0.0.1:8000/api/supplies');
          if (directRes.ok && (directRes.headers.get('content-type') || '').includes('application/json')) {
            res = directRes;
            isJson = true;
          }
        } catch (_) {}
      }

      if (isJson) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setItems(json.data);
        }
      }
    } catch (err) {
      console.warn('API error fetching supplies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  // Category Color Helper (Synchronized with FasilitasView)
  const getCategoryBadgeStyle = (category?: string) => {
    const k = (category || '').toLowerCase();
    if (k.includes('cairan') || k.includes('kimia') || k.includes('sabun') || k.includes('sanitasi')) {
      return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
    if (k.includes('tisu') || k.includes('kertas')) {
      return 'bg-amber-50 text-amber-800 border-amber-200/80';
    }
    if (k.includes('pewangi') || k.includes('aerosol')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    }
    if (k.includes('pembersih') || k.includes('alat')) {
      return 'bg-teal-50 text-teal-700 border-teal-200/80';
    }
    if (k.includes('iot') || k.includes('hardware') || k.includes('sensor')) {
      return 'bg-purple-50 text-purple-700 border-purple-200/80';
    }
    if (k.includes('plumbing') || k.includes('air') || k.includes('katup')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/80';
    }
    if (k.includes('elektrikal') || k.includes('lampu') || k.includes('kipas')) {
      return 'bg-orange-50 text-orange-700 border-orange-200/80';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Compute relation with Fasilitas items dynamically
  const getRelatedFasilitas = (supplyName: string, category: string) => {
    if (!fasilitasList || fasilitasList.length === 0) return [];

    const lowerName = supplyName.toLowerCase();
    const lowerCat = category.toLowerCase();

    return fasilitasList.filter((f) => {
      const fName = (f.namaFasilitas || f.utilitasName || '').toLowerCase();
      const fCat = (f.kategori || '').toLowerCase();

      if (lowerName.includes('sabun') && fName.includes('sabun')) return true;
      if (lowerName.includes('tisu') && fName.includes('tisu')) return true;
      if (lowerName.includes('pewangi') || lowerName.includes('aerosol') || fName.includes('pewangi')) return true;
      if (lowerName.includes('sensor') || lowerCat.includes('hardware')) return fCat.includes('hardware') || fName.includes('sensor');
      if (lowerCat.includes('cairan') && fCat.includes('sanitasi')) return true;
      return false;
    });
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Cairan & Kimia');
    setFormStock(30);
    setFormUnit('Liter');
    setFormThreshold(10);
    setFormLocation('Gudang Utama Gd. A');
    setFormPrice(35000);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: PerlengkapanItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormStock(item.stock);
    setFormUnit(item.unit);
    setFormThreshold(item.minThreshold);
    setFormLocation(item.location);
    setFormPrice(item.pricePerUnit);
    setIsFormModalOpen(true);
  };

  const handleOpenDistributeModal = (item: PerlengkapanItem) => {
    setDistributeModalItem(item);
    setDistributeQty(1);
    const related = getRelatedFasilitas(item.name, item.category);
    setTargetFacilityId(related.length > 0 ? String(related[0].id) : fasilitasList[0] ? String(fasilitasList[0].id) : '1');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormModalOpen(false);

    const payload = {
      name: formName,
      category: formCategory,
      stock: Number(formStock),
      unit: formUnit,
      min_threshold: Number(formThreshold),
      location: formLocation,
      price_per_unit: Number(formPrice),
    };

    if (editingItem) {
      const updatedObj: PerlengkapanItem = {
        ...editingItem,
        name: formName,
        category: formCategory,
        stock: Number(formStock),
        unit: formUnit,
        minThreshold: Number(formThreshold),
        location: formLocation,
        pricePerUnit: Number(formPrice),
        lastRestocked: 'Hari ini (Diperbarui)',
      };

      setItems((prev) => prev.map((s) => (s.id === editingItem.id ? updatedObj : s)));
      setToastMsg(`Barang logistik "${formName}" berhasil diperbarui!`);

      try {
        let res = await fetch(`/api/supplies/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch(`http://127.0.0.1:8000/api/supplies/${editingItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error updating supply:', err);
      }

      if (onUpdateSupply) onUpdateSupply(updatedObj);
    } else {
      const newObj: PerlengkapanItem = {
        id: `sup-${Date.now()}`,
        name: formName,
        category: formCategory,
        stock: Number(formStock),
        unit: formUnit,
        minThreshold: Number(formThreshold),
        location: formLocation,
        lastRestocked: 'Hari ini',
        pricePerUnit: Number(formPrice),
      };

      setItems((prev) => [newObj, ...prev]);
      setToastMsg(`Barang logistik baru "${formName}" berhasil ditambahkan ke inventaris!`);

      try {
        let res = await fetch('/api/supplies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch('http://127.0.0.1:8000/api/supplies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error creating supply:', err);
      }

      if (onAddSupply) onAddSupply(newObj);
    }

    setTimeout(() => {
      setToastMsg(null);
    }, 5000);

    setTimeout(() => {
      fetchSupplies();
    }, 400);
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    const target = items.find((s) => s.id === id);
    if (!target) return;

    const newStock = Math.max(0, target.stock + delta);

    setItems((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              stock: newStock,
              lastRestocked: delta > 0 ? 'Hari ini' : s.lastRestocked,
            }
          : s
      )
    );

    try {
      let res = await fetch(`/api/supplies/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      if (!res.ok) {
        await fetch(`http://127.0.0.1:8000/api/supplies/${id}/stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock }),
        });
      }
    } catch (err) {
      console.warn('API error adjusting stock:', err);
    }

    if (onUpdateStock) onUpdateStock(id, newStock);
  };

  const handleConfirmDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributeModalItem) return;

    const targetFac = fasilitasList.find((f) => String(f.id) === String(targetFacilityId)) || fasilitasList[0];
    const qtyToDeduct = Math.max(1, Number(distributeQty));

    const newStock = Math.max(0, distributeModalItem.stock - qtyToDeduct);
    handleAdjustStock(distributeModalItem.id, -qtyToDeduct);

    if (targetFac) {
      try {
        let res = await fetch(`/api/fasilitas/${targetFac.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Tersedia',
            kondisi: 'Sangat Baik (Diisi Ulang)',
            stok_angka: 100,
            jumlah: '100% (Penuh)',
          }),
        });
        if (!res.ok) {
          await fetch(`http://127.0.0.1:8000/api/fasilitas/${targetFac.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'Tersedia',
              kondisi: 'Sangat Baik (Diisi Ulang)',
              stok_angka: 100,
              jumlah: '100% (Penuh)',
            }),
          });
        }
      } catch (_) {}
    }

    const facName = targetFac ? `${targetFac.namaFasilitas || targetFac.utilitasName} (${targetFac.toiletCode})` : 'Fasilitas Bilik';
    setToastMsg(`Stok "${distributeModalItem.name}" sebanyak ${qtyToDeduct} ${distributeModalItem.unit} berhasil didistribusikan ke ${facName}! Sisa stok gudang: ${newStock} ${distributeModalItem.unit}.`);
    setDistributeModalItem(null);

    setTimeout(() => {
      setToastMsg(null);
    }, 6000);
  };

  const confirmDelete = async () => {
    if (!deleteModalItem) return;
    const targetId = deleteModalItem.id;
    setDeleteModalItem(null);

    setItems((prev) => prev.filter((s) => s.id !== targetId));

    try {
      let res = await fetch(`/api/supplies/${targetId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetch(`http://127.0.0.1:8000/api/supplies/${targetId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn('API error deleting supply:', err);
    }

    if (onDeleteSupply) onDeleteSupply(targetId);
  };

  // Filtered supplies list
  const filteredSupplies = useMemo(() => {
    return items.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchLocation = selectedLocation === 'ALL' || s.location.includes(selectedLocation);

      const isLow = s.stock <= s.minThreshold;
      const matchStockStatus =
        selectedStockStatus === 'ALL' ||
        (selectedStockStatus === 'LOW' && isLow) ||
        (selectedStockStatus === 'SAFE' && !isLow);

      return matchSearch && matchCategory && matchLocation && matchStockStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedLocation, selectedStockStatus]);

  // Aggregate KPI Calculations
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter((s) => s.stock <= s.minThreshold).length;
    const safeStockItems = items.filter((s) => s.stock > s.minThreshold).length;
    const totalAssetValue = items.reduce((acc, curr) => acc + curr.stock * (curr.pricePerUnit || 0), 0);
    return { totalItems, lowStockItems, safeStockItems, totalAssetValue };
  }, [items]);

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Dynamic Island Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -35, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -35, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-[#e6fcf5] border border-emerald-300/80 rounded-2xl shadow-xl shadow-emerald-500/10 text-emerald-900 text-xs sm:text-sm font-extrabold select-none whitespace-nowrap"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <CheckCircle2 size={16} />
            </div>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar - Identical alignment with Fasilitas, Bilik Toilet, Perangkat & Pengguna */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Stok Perlengkapan</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Pusat Logistik, Pemantauan Stok Sanitasi & Integrasi Fasilitas Smart Building Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSupplies}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data REST API Inventaris"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Premium Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Jenis Barang</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.totalItems}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Status Stok Aman</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">{stats.safeStockItems}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Perlu Restock / Menipis</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5 font-mono">{stats.lowStockItems}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Estimasi Nilai Aset Logistik</p>
            <p className="text-lg font-black text-purple-700 mt-0.5 font-mono">
              Rp {stats.totalAssetValue.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Low Stock Warning Banner */}
      {stats.lowStockItems > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 via-rose-50/40 to-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <strong className="font-extrabold text-slate-900">Peringatan Restock Logistik:</strong> Terdapat{' '}
              <span className="font-extrabold text-rose-700 font-mono underline">{stats.lowStockItems} barang</span>{' '}
              yang berada di bawah atau mencapai batas minimum stok. Mohon lakukan pengadaan untuk fasilitas sanitasi.
            </div>
          </div>

          <button
            onClick={() => setSelectedStockStatus('LOW')}
            className="px-3.5 py-1.5 font-extrabold text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            Filter Barang Menipis
          </button>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Kategori Barang:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Cairan & Kimia">Cairan & Kimia</option>
                <option value="Kertas & Tisu">Kertas & Tisu</option>
                <option value="Pewangi & Aerosol">Pewangi & Aerosol</option>
                <option value="Alat Pembersih">Alat Pembersih</option>
                <option value="Hardware IoT">Hardware IoT</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Lokasi Gudang:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Lokasi Gudang</option>
                <option value="Gudang Utama Gd. A">Gudang Utama Gd. A</option>
                <option value="Pos Perlengkapan Gd. B">Pos Perlengkapan Gd. B</option>
                <option value="Lab IoT">Lab IoT UNIKOM</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Ketersediaan:</span>
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="SAFE">Stok Aman</option>
                <option value="LOW">Perlu Restock (Menipis)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Table size={15} />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang, kategori, atau lokasi gudang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Table or Grid Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 min-w-[200px] whitespace-nowrap">NAMA BARANG & HARGA</th>
                  <th className="py-4 px-4 whitespace-nowrap">KATEGORI LOGISTIK</th>
                  <th className="py-4 px-4 whitespace-nowrap">KUANTITAS STOK</th>
                  <th className="py-4 px-4 min-w-[220px] whitespace-nowrap">INTEGRASI FASILITAS TERHUBUNG</th>
                  <th className="py-4 px-4 whitespace-nowrap">LOKASI GUDANG</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">DISTRIBUSI & MUTASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs">
                      Tidak ada barang perlengkapan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSupplies.map((item) => {
                    const isLow = item.stock <= item.minThreshold;
                    const connectedFasilitas = getRelatedFasilitas(item.name, item.category);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* NAMA BARANG */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Est. Rp {(item.pricePerUnit || 0).toLocaleString('id-ID')} / {item.unit}
                          </div>
                        </td>

                        {/* KATEGORI */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] border shadow-2xs ${getCategoryBadgeStyle(item.category)}`}>
                            {item.category}
                          </span>
                        </td>

                        {/* KUANTITAS STOK */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-base font-black font-mono ${
                                isLow ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {item.stock}
                            </span>
                            <span className="text-slate-500 text-xs font-semibold">{item.unit}</span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                isLow
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              }`}
                            >
                              {isLow ? 'Menipis' : 'Stok Aman'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Batas Min: {item.minThreshold} {item.unit}
                          </div>
                        </td>

                        {/* INTEGRASI FASILITAS TERHUBUNG */}
                        <td className="py-4 px-4">
                          {connectedFasilitas.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Cadangan Logistik Umum</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {connectedFasilitas.slice(0, 2).map((f, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg inline-flex items-center gap-1 shadow-2xs"
                                >
                                  <Sparkles size={10} />
                                  <span>{f.namaFasilitas || f.utilitasName} ({f.toiletCode})</span>
                                </span>
                              ))}
                              {connectedFasilitas.length > 2 && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-slate-100 text-slate-600 rounded-md">
                                  +{connectedFasilitas.length - 2} Fasilitas
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* LOKASI GUDANG */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="font-semibold">{item.location}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Restock: {item.lastRestocked || 'Hari ini'}
                          </div>
                        </td>

                        {/* DISTRIBUSI & MUTASI AKSI */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(item.id, -1)}
                              title="Gunakan 1 unit (-)"
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg font-bold font-mono text-xs transition-all cursor-pointer active:scale-95 border border-slate-200/80"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item.id, 5)}
                              title="Tambah Stok +5"
                              className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg font-bold font-mono text-xs transition-all cursor-pointer active:scale-95 border border-slate-200/80"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleOpenDistributeModal(item)}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Distribusi / Refill ke Fasilitas Bilik Toilet"
                            >
                              <Send size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Edit Barang"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModalItem(item)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Hapus Barang"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSupplies.map((item) => {
            const isLow = item.stock <= item.minThreshold;
            const connectedFasilitas = getRelatedFasilitas(item.name, item.category);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 shrink-0 text-blue-600">
                        <Package size={22} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{item.name}</h3>
                        <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeStyle(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                        isLow
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      }`}
                    >
                      {isLow ? 'Menipis' : 'Stok Aman'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Kuantitas Stok:</span>
                      <span className={`font-mono font-extrabold text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {item.stock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Batas Minimum:</span>
                      <span className="font-mono text-slate-700">{item.minThreshold} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Lokasi Gudang:</span>
                      <span className="font-bold text-slate-800">{item.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Estimasi Harga Satuan:</span>
                      <span className="font-mono font-bold text-purple-700">Rp {(item.pricePerUnit || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {connectedFasilitas.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Terhubung ke Fasilitas:</span>
                      <div className="flex flex-wrap gap-1">
                        {connectedFasilitas.map((f, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg">
                            {f.namaFasilitas || f.utilitasName} ({f.toiletCode})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-bold text-slate-400">Logistik Sarpras UNIKOM</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDistributeModal(item)}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Refill ke Fasilitas Bilik"
                    >
                      <Send size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Barang"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModalItem(item)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus Barang"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Distribusi / Refill Ke Fasilitas Bilik */}
      <AnimatePresence>
        {distributeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 select-none"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Send size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Distribusi & Refill Fasilitas</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Kirim stok inventaris langsung ke fasilitas bilik toilet
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDistributeModalItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmDistribution} className="space-y-4 text-xs font-medium">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Barang Logistik:</span>
                    <span className="font-bold text-slate-900">{distributeModalItem.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Stok Gudang Tersedia:</span>
                    <span className="font-mono font-extrabold text-emerald-600">{distributeModalItem.stock} {distributeModalItem.unit}</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Fasilitas & Bilik Toilet</label>
                  <select
                    value={targetFacilityId}
                    onChange={(e) => setTargetFacilityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-emerald-500 cursor-pointer"
                  >
                    {fasilitasList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.namaFasilitas || f.utilitasName} ({f.toiletCode} - {f.location}) [{f.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Distribusi / Pengisian ({distributeModalItem.unit})</label>
                  <input
                    type="number"
                    min={1}
                    max={distributeModalItem.stock}
                    value={distributeQty}
                    onChange={(e) => setDistributeQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-extrabold text-slate-800 focus:outline-hidden focus:bg-white focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDistributeModalItem(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={15} />
                    <span>Proses Refill</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Form Tambah / Edit Perlengkapan */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {editingItem ? 'Edit Barang Inventaris' : 'Tambah Barang Logistik Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Integrasi Logistik Sanitasi LetSens UNIKOM
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Barang Logistik</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Sabun Antiseptik Cair 5 Liter"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kategori Logistik</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Cairan & Kimia">Cairan & Kimia</option>
                      <option value="Kertas & Tisu">Kertas & Tisu</option>
                      <option value="Pewangi & Aerosol">Pewangi & Aerosol</option>
                      <option value="Alat Pembersih">Alat Pembersih</option>
                      <option value="Hardware IoT">Hardware IoT</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Satuan Barang</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Liter (Jerigen 5L)">Liter (Jerigen 5L)</option>
                      <option value="Roll">Roll</option>
                      <option value="Can (300ml)">Can (300ml)</option>
                      <option value="Liter">Liter</option>
                      <option value="Pack (isi 20)">Pack (isi 20)</option>
                      <option value="Unit Modul">Unit Modul</option>
                      <option value="Jerigen">Jerigen</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Kotak / Dus">Kotak / Dus</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stok Saat Ini</label>
                    <input
                      type="number"
                      min={0}
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Batas Minimum Peringatan</label>
                    <input
                      type="number"
                      min={1}
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lokasi Gudang Logistik</label>
                    <select
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Gudang Utama Gd. A Lt. Dasar">Gudang Utama Gd. A Lt. Dasar</option>
                      <option value="Pos Perlengkapan Gd. B Lt. 1">Pos Perlengkapan Gd. B Lt. 1</option>
                      <option value="Lab IoT & Embedded Universitas Komputer Indonesia">Lab IoT & Embedded Universitas Komputer Indonesia</option>
                      <option value="Gudang Utama Gd. A">Gudang Utama Gd. A</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimasi Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus Barang */}
      <AnimatePresence>
        {deleteModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-xs">
                <Trash2 size={26} />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">Hapus Barang Logistik?</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  Data <span className="font-bold text-slate-800">"{deleteModalItem.name}"</span> akan dihapus dari inventaris logistik.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalItem(null)}
                  className="w-1/2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-1/2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/25 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 size={15} />
                  Hapus Barang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
