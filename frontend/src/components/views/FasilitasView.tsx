import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Search,
  Plus,
  Edit3,
  Trash2,
  Droplet,
  FileText,
  Lightbulb,
  Pipette as Pipe,
  Wind,
  Trash,
  DoorClosed,
  Layers,
  Sparkles,
  Building2,
  User,
  Clock,
  LayoutGrid,
  Table,
  RefreshCw,
  Info,
  Check,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  X,
  PackageCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToiletBilik, FasilitasItem, PetugasKebersihan, PerlengkapanItem } from '../../types';

interface FasilitasViewProps {
  toilets: ToiletBilik[];
  staffList?: PetugasKebersihan[];
  fasilitasList?: FasilitasItem[];
  supplies?: PerlengkapanItem[];
  onAddFasilitas?: (item: Partial<FasilitasItem>) => void;
  onUpdateFasilitas?: (id: string, updated: Partial<FasilitasItem>) => void;
  onDeleteFasilitas?: (id: string) => void;
  onUpdateSupplyStock?: (id: string, newStock: number) => void;
}

export const FasilitasView: React.FC<FasilitasViewProps> = ({
  toilets,
  staffList = [],
  fasilitasList: initialPropList = [],
  supplies = [],
  onAddFasilitas,
  onUpdateFasilitas,
  onDeleteFasilitas,
  onUpdateSupplyStock,
}) => {
  const [items, setItems] = useState<FasilitasItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Default fallback staff list matching database seeder
  const defaultStaff = React.useMemo(() => [
    { id: 'st-01', name: 'Asep Saepulloh', shift: 'Pagi (06:00 - 14:00)', assignedBuilding: 'Gedung A' },
    { id: 'st-02', name: 'Siti Rahmawati', shift: 'Pagi (06:00 - 14:00)', assignedBuilding: 'Gedung A' },
    { id: 'st-03', name: 'Rudi Hermawan', shift: 'Siang (14:00 - 22:00)', assignedBuilding: 'Gedung A' },
    { id: 'st-04', name: 'Pak Agus', shift: 'Penuh (Kepala Teknisi)', assignedBuilding: 'Gedung A' },
  ], []);

  const activeStaffList = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; shift?: string; assignedBuilding?: string }>();
    defaultStaff.forEach((s) => map.set(s.name, s));
    staffList.forEach((s) => map.set(s.name, { id: s.id, name: s.name, shift: s.shift, assignedBuilding: s.assignedBuilding }));
    items.forEach((item) => {
      if (item.petugasJawab && !map.has(item.petugasJawab)) {
        map.set(item.petugasJawab, { id: `st-${item.petugasJawab}`, name: item.petugasJawab, shift: 'Shift Pagi', assignedBuilding: item.building || 'Gedung A' });
      }
    });
    return Array.from(map.values());
  }, [staffList, items, defaultStaff]);

  // Extract unique buildings dynamically
  const buildingsList = React.useMemo(() => {
    const set = new Set<string>();
    toilets.forEach((t) => { if (t.building) set.add(t.building); });
    items.forEach((item) => { if (item.building) set.add(item.building); });
    return Array.from(set);
  }, [toilets, items]);

  // Filters & Search State
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedToilet, setSelectedToilet] = useState<string>('ALL');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPetugas, setSelectedPetugas] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FasilitasItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<FasilitasItem | null>(null);

  const [formToiletCode, setFormToiletCode] = useState<string>(toilets[0]?.code || 'T-A1-F');
  const [formNamaFasilitas, setFormNamaFasilitas] = useState<string>('Dispenser Sabun Cair Antiseptik');
  const [formKategori, setFormKategori] = useState<string>('Sanitasi & Kebersihan');
  const [formJumlah, setFormJumlah] = useState<string>('100% (500 mL)');
  const [formStokAngka, setFormStokAngka] = useState<number>(100);
  const [formKondisi, setFormKondisi] = useState<string>('Baik');
  const [formStatus, setFormStatus] = useState<string>('Tersedia');
  const [formPetugasJawab, setFormPetugasJawab] = useState<string>(activeStaffList[0]?.name || 'Asep Saepulloh');

  // Fetch from backend REST API
  const fetchFasilitas = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let res = await fetch('/api/fasilitas');
      let isJson = res.ok && (res.headers.get('content-type') || '').includes('application/json');

      if (!isJson) {
        try {
          const directRes = await fetch('http://127.0.0.1:8000/api/fasilitas');
          if (directRes.ok && (directRes.headers.get('content-type') || '').includes('application/json')) {
            res = directRes;
            isJson = true;
          }
        } catch (_) {}
      }

      if (isJson) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const mapped: FasilitasItem[] = json.data.map((raw: any, idx: number) => ({
            id: String(raw.id || idx + 1),
            no: idx + 1,
            namaFasilitas: raw.nama_fasilitas || raw.utilitasName || raw.namaFasilitas || 'Fasilitas Sanitasi',
            utilitasName: raw.nama_fasilitas || raw.utilitasName || raw.namaFasilitas || 'Fasilitas Sanitasi',
            toiletId: String(raw.toilet_id || raw.toiletId || '1'),
            toiletCode: raw.toilet_code || raw.toiletCode || toilets[0]?.code || 'T-A1-F',
            location: raw.location || raw.location_name || 'Gedung A, Lt 1',
            building: raw.building || 'Gedung A',
            floor: Number(raw.floor || 1),
            kategori: raw.kategori || raw.category || 'Sanitasi & Kebersihan',
            jumlah: raw.jumlah || '1 unit',
            stokAngka: raw.stok_angka ?? 100,
            unit: raw.unit || 'unit',
            kondisi: raw.kondisi || 'Baik',
            status: raw.status || raw.statusTerakhir || 'Tersedia',
            petugasJawab: raw.petugas_jawab || raw.petugasJawab || activeStaffList[0]?.name || 'Asep Saepulloh',
            terakhirDiperiksa: raw.terakhir_diperiksa || raw.lastUpdated || new Date().toISOString(),
            catatan: raw.catatan || '-',
          }));
          setItems(mapped);
          setLoading(false);
          return;
        }
      }

      // Safe fallback to initial prop items if API not JSON
      if (initialPropList && initialPropList.length > 0) {
        setItems(initialPropList.map((item) => ({
          ...item,
          namaFasilitas: item.namaFasilitas || item.utilitasName || 'Fasilitas Sanitasi',
          kategori: item.kategori || item.category || 'Sanitasi & Kebersihan',
          status: item.status || item.statusTerakhir || 'Tersedia',
          kondisi: item.kondisi || 'Baik',
          petugasJawab: item.petugasJawab || 'Budi Santoso',
        })));
      }
    } catch (err) {
      console.warn('Backend API connection fallback to local state:', err);
      if (initialPropList && initialPropList.length > 0) {
        setItems(initialPropList.map((item) => ({
          ...item,
          namaFasilitas: item.namaFasilitas || item.utilitasName || 'Fasilitas Sanitasi',
          kategori: item.kategori || item.category || 'Sanitasi & Kebersihan',
          status: item.status || item.statusTerakhir || 'Tersedia',
          kondisi: item.kondisi || 'Baik',
          petugasJawab: item.petugasJawab || 'Budi Santoso',
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFasilitas();
  }, []);

  // Safe Filter items
  const filteredItems = items.filter((item) => {
    const itemKategori = item.kategori || item.category || 'Sanitasi & Kebersihan';
    const itemStatus = item.status || item.statusTerakhir || 'Tersedia';
    const itemBuilding = item.building || 'Gedung A';
    const itemCode = item.toiletCode || '';
    const itemStaff = item.petugasJawab || '';

    if (selectedBuilding !== 'ALL' && itemBuilding !== selectedBuilding) return false;
    if (selectedToilet !== 'ALL' && itemCode !== selectedToilet) return false;
    if (selectedKategori !== 'ALL' && itemKategori !== selectedKategori) return false;
    if (selectedStatus !== 'ALL' && itemStatus !== selectedStatus) return false;
    if (selectedPetugas !== 'ALL' && itemStaff !== selectedPetugas) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = (item.namaFasilitas || item.utilitasName || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      const matchCode = itemCode.toLowerCase().includes(q);
      const matchKondisi = (item.kondisi || '').toLowerCase().includes(q);
      const matchStaff = itemStaff.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchCode && !matchKondisi && !matchStaff) return false;
    }
    return true;
  });

  // KPI Statistics
  const totalCount = items.length;
  const baikCount = items.filter((i) => (i.status || i.statusTerakhir) === 'Tersedia' || (i.status || i.statusTerakhir) === 'Normal' || i.kondisi === 'Baik' || i.kondisi === 'Sangat Baik').length;
  const restockCount = items.filter((i) => (i.status || i.statusTerakhir) === 'Perlu Diisi' || i.kondisi === 'Menipis').length;
  const rusakCount = items.filter((i) => (i.status || i.statusTerakhir) === 'Perlu Perbaikan' || (i.status || i.statusTerakhir) === 'Rusak' || (i.kondisi || '').toLowerCase().includes('bocor') || (i.kondisi || '').toLowerCase().includes('rusak')).length;

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormToiletCode(toilets[0]?.code || 'T-A1-F');
    const defaultSup = supplies[0];
    setFormNamaFasilitas(defaultSup?.name || 'Hand Soap Antiseptik Cair');
    setFormKategori(defaultSup?.category === 'Kertas & Tisu' ? 'Tisu & Kertas' : 'Sanitasi & Kebersihan');
    setFormJumlah(defaultSup ? `${defaultSup.stock} ${defaultSup.unit} (Stok Gudang)` : '100% (500 mL)');
    setFormStokAngka(defaultSup?.stock || 100);
    setFormKondisi('Baik');
    setFormStatus('Tersedia');
    setFormPetugasJawab(activeStaffList[0]?.name || 'Asep Saepulloh');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FasilitasItem) => {
    setEditingItem(item);
    setFormToiletCode(item.toiletCode);
    setFormNamaFasilitas(item.namaFasilitas || item.utilitasName || '');
    setFormKategori(item.kategori || item.category || 'Sanitasi & Kebersihan');
    setFormJumlah(item.jumlah);
    setFormStokAngka(item.stokAngka || 100);
    setFormKondisi(item.kondisi);
    setFormStatus(item.status || item.statusTerakhir || 'Tersedia');
    setFormPetugasJawab(item.petugasJawab || activeStaffList[0]?.name || 'Asep Saepulloh');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    setEditingItem(null);

    const targetToilet = toilets.find((t) => t.code === formToiletCode) || toilets[0];
    const payload = {
      nama_fasilitas: formNamaFasilitas,
      toilet_code: formToiletCode,
      toilet_id: targetToilet?.id || '1',
      location: targetToilet?.name || 'Gedung A, Lt 1',
      building: targetToilet?.building || 'Gedung A',
      floor: targetToilet?.floor || 1,
      kategori: formKategori,
      jumlah: formJumlah,
      stok_angka: formStokAngka,
      kondisi: formKondisi,
      status: formStatus,
      petugas_jawab: formPetugasJawab,
    };

    if (editingItem) {
      const updatedObj = {
        id: editingItem.id,
        namaFasilitas: formNamaFasilitas,
        utilitasName: formNamaFasilitas,
        toiletCode: formToiletCode,
        location: payload.location,
        building: payload.building,
        floor: payload.floor,
        kategori: formKategori as any,
        jumlah: formJumlah,
        stokAngka: formStokAngka,
        kondisi: formKondisi,
        status: formStatus as any,
        petugasJawab: formPetugasJawab,
        lastUpdated: new Date().toLocaleTimeString('id-ID'),
      };

      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, ...updatedObj } : i))
      );
      setToastMsg(`Data fasilitas "${formNamaFasilitas}" (${formToiletCode}) berhasil diperbarui!`);

      try {
        let res = await fetch(`/api/fasilitas/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch(`http://127.0.0.1:8000/api/fasilitas/${editingItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error updating facility:', err);
      }

      if (onUpdateFasilitas) {
        onUpdateFasilitas(editingItem.id, updatedObj);
      }
    } else {
      const newObj: FasilitasItem = {
        id: String(Date.now()),
        namaFasilitas: formNamaFasilitas,
        utilitasName: formNamaFasilitas,
        toiletCode: formToiletCode,
        location: payload.location,
        building: payload.building,
        floor: payload.floor,
        kategori: formKategori as any,
        jumlah: formJumlah,
        stokAngka: formStokAngka,
        kondisi: formKondisi,
        status: formStatus as any,
        petugasJawab: formPetugasJawab,
        lastUpdated: new Date().toLocaleTimeString('id-ID'),
      };

      setItems((prev) => [newObj, ...prev]);
      setToastMsg(`Fasilitas baru "${formNamaFasilitas}" (${formToiletCode}) berhasil ditambahkan!`);

      try {
        let res = await fetch('/api/fasilitas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch('http://127.0.0.1:8000/api/fasilitas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error creating facility:', err);
      }

      if (onAddFasilitas) {
        onAddFasilitas(newObj);
      }
    }

    setTimeout(() => {
      setToastMsg(null);
    }, 5000);

    setTimeout(() => {
      fetchFasilitas();
    }, 400);
  };

  const handleQuickRefillFromLogistics = async (item: FasilitasItem) => {
    const fName = (item.namaFasilitas || item.utilitasName || '').toLowerCase();
    const matchingSupply = supplies.find((s) => {
      const sName = s.name.toLowerCase();
      if (fName.includes('sabun') && sName.includes('sabun')) return true;
      if (fName.includes('tisu') && sName.includes('tisu')) return true;
      if (fName.includes('pewangi') && (sName.includes('pewangi') || sName.includes('aerosol'))) return true;
      return false;
    }) || supplies[0];

    // 1. Deduct supply stock
    let newStock = 0;
    if (matchingSupply && matchingSupply.stock > 0) {
      newStock = Math.max(0, matchingSupply.stock - 1);
      try {
        await fetch(`/api/supplies/${matchingSupply.id}/stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock }),
        });
      } catch (_) {}
      if (onUpdateSupplyStock) onUpdateSupplyStock(matchingSupply.id, newStock);
    }

    // 2. Update facility status to Tersedia & Sangat Baik
    const updatedObj = {
      ...item,
      status: 'Tersedia' as const,
      kondisi: 'Sangat Baik (Diisi Ulang)',
      stokAngka: 100,
      jumlah: '100% (Penuh)',
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
    };

    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedObj : i)));

    try {
      await fetch(`/api/fasilitas/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Tersedia',
          kondisi: 'Sangat Baik (Diisi Ulang)',
          stok_angka: 100,
          jumlah: '100% (Penuh)',
        }),
      });
    } catch (_) {}

    if (onUpdateFasilitas) onUpdateFasilitas(item.id, updatedObj);

    const sName = matchingSupply ? matchingSupply.name : 'Stok Inventaris';
    setToastMsg(`Fasilitas "${item.namaFasilitas || item.utilitasName}" (${item.toiletCode}) berhasil diisi ulang! Stok "${sName}" berkurang 1 ${matchingSupply?.unit || 'unit'} (Sisa stok: ${newStock} ${matchingSupply?.unit || 'unit'}).`);

    setTimeout(() => {
      setToastMsg(null);
    }, 6000);
  };

  const confirmDelete = async () => {
    if (!deleteModalItem) return;
    const targetId = deleteModalItem.id;
    setDeleteModalItem(null);

    setItems((prev) => prev.filter((item) => item.id !== targetId));

    try {
      let res = await fetch(`/api/fasilitas/${targetId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetch(`http://127.0.0.1:8000/api/fasilitas/${targetId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn('API error deleting facility:', err);
    }

    if (onDeleteFasilitas) {
      onDeleteFasilitas(targetId);
    }
  };

  const getKategoriIcon = (kat?: string) => {
    const k = (kat || '').toLowerCase();
    if (k.includes('sabun') || k.includes('sanitasi')) return <Droplet className="w-4 h-4 text-blue-600" />;
    if (k.includes('tisu') || k.includes('kertas')) return <FileText className="w-4 h-4 text-slate-600" />;
    if (k.includes('elektrikal') || k.includes('lampu')) return <Lightbulb className="w-4 h-4 text-amber-600" />;
    if (k.includes('plumbing') || k.includes('katup')) return <Wrench className="w-4 h-4 text-cyan-600" />;
    if (k.includes('iot') || k.includes('hardware')) return <Sparkles className="w-4 h-4 text-purple-600" />;
    return <Building2 className="w-4 h-4 text-slate-600" />;
  };

  const getKategoriBadgeStyle = (kat?: string) => {
    const k = (kat || '').toLowerCase();
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

  const getInitials = (name?: string) => {
    if (!name) return 'BS';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

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
      {/* Header Bar - Consistent with Tentang Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Boxes size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Manajemen Fasilitas
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Pemantauan Ketersediaan & Status Kondisi Fisik Fasilitas Sanitasi Smart Building
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchFasilitas}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs"
            title="Refresh Data API"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Tambah Fasilitas</span>
          </button>
        </div>
      </div>

      {/* 4 Premium KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Boxes size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Fasilitas</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{totalCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Kondisi Baik</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">{baikCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Perlu Restock / Diisi</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5 font-mono">{restockCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Perlu Perbaikan</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5 font-mono">{rusakCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Gedung:</span>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Gedung</option>
                {buildingsList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Bilik Toilet:</span>
              <select
                value={selectedToilet}
                onChange={(e) => setSelectedToilet(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Bilik</option>
                {toilets.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.code} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Kategori:</span>
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Sanitasi & Kebersihan">Sanitasi & Kebersihan</option>
                <option value="Tisu & Kertas">Tisu & Kertas</option>
                <option value="Elektrikal & Lampu">Elektrikal & Lampu</option>
                <option value="Plumbing & Katup">Plumbing & Katup</option>
                <option value="Hardware IoT">Hardware IoT</option>
                <option value="Fasilitas & Dinding">Fasilitas & Dinding</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Tersedia">Tersedia</option>
                <option value="Perlu Diisi">Perlu Diisi</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Petugas PJ:</span>
              <select
                value={selectedPetugas}
                onChange={(e) => setSelectedPetugas(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Petugas</option>
                {activeStaffList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table / Grid Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <Table size={15} />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari fasilitas / petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Content View: Table / Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-12 text-center">No.</th>
                  <th className="py-4 px-4">Nama Fasilitas</th>
                  <th className="py-4 px-4">Kategori</th>
                  <th className="py-4 px-4">Bilik / Lokasi</th>
                  <th className="py-4 px-4">Stok / Kuantitas</th>
                  <th className="py-4 px-4">Kondisi Fisik</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Petugas PJ</th>
                  <th className="py-4 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                      Tidak ada data fasilitas toilet yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const katText = item.kategori || item.category || 'Sanitasi & Kebersihan';
                    const statusText = item.status || item.statusTerakhir || 'Tersedia';
                    const staffName = item.petugasJawab || 'Budi Santoso';
                    const matchingSupply = supplies.find((s) => {
                      const fName = (item.namaFasilitas || item.utilitasName || '').toLowerCase();
                      const sName = s.name.toLowerCase();
                      if (fName.includes('sabun') && sName.includes('sabun')) return true;
                      if (fName.includes('tisu') && sName.includes('tisu')) return true;
                      if (fName.includes('pewangi') || fName.includes('aerosol')) return sName.includes('pewangi') || sName.includes('aerosol');
                      return sName.includes(fName) || fName.includes(sName);
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 text-center font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0">
                              {getKategoriIcon(katText)}
                            </div>
                            <div>
                              <span className="block text-slate-900 font-extrabold">{item.namaFasilitas || item.utilitasName || 'Fasilitas Sanitasi'}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-semibold">ID: FAS-{item.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${getKategoriBadgeStyle(katText)}`}>
                            {katText}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-extrabold text-blue-600 font-mono block text-xs">{item.toiletCode}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">{item.location}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-slate-900 font-mono">
                          {matchingSupply ? `${matchingSupply.stock} ${matchingSupply.unit}` : item.jumlah}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-700">
                          {item.kondisi}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${
                              statusText === 'Perlu Diisi'
                                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                : statusText === 'Perlu Perbaikan' || statusText === 'Rusak'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            }`}
                          >
                            {statusText === 'Perlu Diisi' && <AlertCircle size={13} className="text-amber-600" />}
                            {(statusText === 'Perlu Perbaikan' || statusText === 'Rusak') && <Wrench size={13} className="text-rose-600" />}
                            {(statusText === 'Tersedia' || statusText === 'Normal') && <CheckCircle2 size={13} className="text-emerald-600" />}
                            <span>{statusText}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 border border-blue-200">
                              {getInitials(staffName)}
                            </div>
                            <span className="font-bold text-slate-800 text-xs truncate max-w-[130px]">{staffName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Edit Fasilitas"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModalItem(item)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Hapus Fasilitas"
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
          {filteredItems.map((item) => {
            const katText = item.kategori || item.category || 'Sanitasi & Kebersihan';
            const statusText = item.status || item.statusTerakhir || 'Tersedia';
            const staffName = item.petugasJawab || 'Budi Santoso';
            const matchingSupply = supplies.find((s) => {
              const fName = (item.namaFasilitas || item.utilitasName || '').toLowerCase();
              const sName = s.name.toLowerCase();
              if (fName.includes('sabun') && sName.includes('sabun')) return true;
              if (fName.includes('tisu') && sName.includes('tisu')) return true;
              if (fName.includes('pewangi') || fName.includes('aerosol')) return sName.includes('pewangi') || sName.includes('aerosol');
              return sName.includes(fName) || fName.includes(sName);
            });

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
                        {getKategoriIcon(katText)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{item.namaFasilitas || item.utilitasName || 'Fasilitas Sanitasi'}</h3>
                        <span className="text-[10px] font-mono text-slate-400">ID: FAS-{item.id}</span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                        statusText === 'Perlu Diisi'
                          ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                          : statusText === 'Perlu Perbaikan' || statusText === 'Rusak'
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Kategori:</span>
                      <span className="font-bold text-slate-800">{katText}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Bilik Toilet:</span>
                      <span className="font-extrabold text-blue-600 font-mono">{item.toiletCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Lokasi:</span>
                      <span className="font-bold text-slate-800">{item.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Stok / Kuantitas:</span>
                      <span className="font-extrabold text-slate-900 font-mono">
                        {matchingSupply ? `${matchingSupply.stock} ${matchingSupply.unit}` : item.jumlah}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Kondisi Fisik:</span>
                      <span className="font-bold text-slate-800">{item.kondisi}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[9px] flex items-center justify-center shrink-0">
                      {getInitials(staffName)}
                    </div>
                    <span className="text-[11px] text-slate-600 font-bold">{staffName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Fasilitas"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModalItem(item)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus Fasilitas"
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

      {/* Modal Input & Edit Fasilitas */}
      <AnimatePresence>
        {isModalOpen && (
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
                    <Boxes size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {editingItem ? 'Edit Data Fasilitas Toilet' : 'Tambah Fasilitas Toilet Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Integrasi REST API LetSens Backend
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitModal} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Bilik Toilet</label>
                  <select
                    value={formToiletCode}
                    onChange={(e) => setFormToiletCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  >
                    {toilets.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.code} - {t.name} ({t.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Fasilitas</label>
                  <select
                    value={formNamaFasilitas}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setFormNamaFasilitas(selectedName);
                      const matchingSupply = supplies.find((s) => s.name === selectedName);
                      if (matchingSupply) {
                        setFormJumlah(`${matchingSupply.stock} ${matchingSupply.unit} (Stok Gudang)`);
                        setFormStokAngka(matchingSupply.stock);
                        if (matchingSupply.category === 'Cairan & Kimia') setFormKategori('Sanitasi & Kebersihan');
                        else if (matchingSupply.category === 'Kertas & Tisu') setFormKategori('Tisu & Kertas');
                        else if (matchingSupply.category === 'Hardware IoT') setFormKategori('Hardware IoT');
                        else setFormKategori('Sanitasi & Kebersihan');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    {supplies.length === 0 ? (
                      <option value="Hand Soap Antiseptik Cair">Hand Soap Antiseptik Cair</option>
                    ) : (
                      supplies.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.category} - Stok Gudang: {s.stock} {s.unit})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    >
                      <option value="Sanitasi & Kebersihan">Sanitasi & Kebersihan</option>
                      <option value="Tisu & Kertas">Tisu & Kertas</option>
                      <option value="Elektrikal & Lampu">Elektrikal & Lampu</option>
                      <option value="Plumbing & Katup">Plumbing & Katup</option>
                      <option value="Hardware IoT">Hardware IoT</option>
                      <option value="Fasilitas & Dinding">Fasilitas & Dinding</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stok / Kuantitas</label>
                    <input
                      type="text"
                      value={formJumlah}
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl font-mono font-bold text-slate-600 cursor-not-allowed select-none"
                      title="Nilai kuantitas ini otomatis terikat dengan Stok Perlengkapan Logistik (Read-Only)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kondisi Fisik</label>
                    <select
                      value={formKondisi}
                      onChange={(e) => setFormKondisi(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Baik">Baik</option>
                      <option value="Sangat Baik">Sangat Baik</option>
                      <option value="Menipis">Menipis</option>
                      <option value="Bocor Ringan">Bocor Ringan</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                      <option value="Rusak">Rusak</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Status Operasional</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Perlu Diisi">Perlu Diisi</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    </select>
                  </div>
                </div>

                {/* Dropdown Petugas Penanggung Jawab dari daftar aktual petugas */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Penanggung Jawab (PJ)</label>
                  <select
                    value={formPetugasJawab}
                    onChange={(e) => setFormPetugasJawab(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  >
                    {activeStaffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.shift || 'Petugas Sanitation'} - {s.assignedBuilding || 'Gedung Universitas Komputer Indonesia'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                  >
                    Simpan Fasilitas
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Professional Modal Konfirmasi Hapus Data Fasilitas */}
      <AnimatePresence>
        {deleteModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-xs">
                <Trash2 size={26} />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Hapus Data Fasilitas?
                </h3>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  Tindakan ini tidak dapat dibatalkan. Fasilitas <span className="font-bold text-slate-800">"{deleteModalItem.namaFasilitas || deleteModalItem.utilitasName}"</span> pada <span className="font-bold text-slate-800">{deleteModalItem.toiletCode}</span> akan dihapus permanen.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs font-medium space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Kategori:</span>
                  <span className="font-bold text-slate-800">{deleteModalItem.kategori}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Lokasi:</span>
                  <span className="font-bold text-slate-800">{deleteModalItem.location}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Petugas PJ:</span>
                  <span className="font-bold text-slate-800">{deleteModalItem.petugasJawab}</span>
                </div>
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
                  Hapus Fasilitas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
