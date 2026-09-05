import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Plus,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Filter,
  Table,
  LayoutGrid,
  Search,
  X,
  RefreshCw,
  FileText,
  Pencil,
  Trash2,
  Send,
  MessageSquare,
  Building2,
  ShieldAlert,
  UserCheck,
  Zap,
} from 'lucide-react';
import { RekapKerusakanItem, ToiletBilik } from '../../types';
import { maintenanceApi } from '../../api/maintenanceApi';

interface RekapKerusakanViewProps {
  damages: RekapKerusakanItem[];
  toilets: ToiletBilik[];
  onAddDamage: (damage: RekapKerusakanItem) => void;
  onDispatchToRepair: (damage: RekapKerusakanItem) => void;
  onUpdateDamage?: (damage: RekapKerusakanItem) => void;
  onDeleteDamage?: (damageId: string) => void;
}

const TECHNICIANS = [
  { name: 'Bambang Sudarmono', role: 'Teknisi MEP & Plumbing', phone: '6281234567890' },
  { name: 'Agus Rianto', role: 'Petugas Sanitasi Utama', phone: '6281298765432' },
  { name: 'Rudi Hermawan', role: 'Teknisi Hardware AIoT', phone: '6281311223344' },
  { name: 'Asep Saepulloh', role: 'Teknisi Listrik & Lampu', phone: '6281555443322' },
  { name: 'Ujang Suherman', role: 'Petugas Kebersihan Lt 1-2', phone: '6281777889900' },
  { name: 'Siti Rahmawati', role: 'Supervisor Sanitasi', phone: '6281899900011' },
];

export const RekapKerusakanView: React.FC<RekapKerusakanViewProps> = ({
  damages: initialDamages,
  toilets,
  onAddDamage,
  onDispatchToRepair,
  onUpdateDamage,
  onDeleteDamage,
}) => {
  const [damagesList, setDamagesList] = useState<RekapKerusakanItem[]>(initialDamages);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync prop changes
  useEffect(() => {
    setDamagesList(initialDamages);
  }, [initialDamages]);

  // View mode & filters
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RekapKerusakanItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<RekapKerusakanItem | null>(null);
  const [dispatchModalItem, setDispatchModalItem] = useState<RekapKerusakanItem | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>(TECHNICIANS[0].name);

  // Form State
  const [formToiletId, setFormToiletId] = useState<string>(toilets[0]?.id || '');
  const [formCategory, setFormCategory] = useState<RekapKerusakanItem['category']>('Plumbing & Air');
  const [formSeverity, setFormSeverity] = useState<RekapKerusakanItem['severity']>('Sedang');
  const [formReporter, setFormReporter] = useState<string>('Petugas Sanitasi');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<RekapKerusakanItem['status']>('Menunggu');

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch backend API to sync damages
  const fetchDamages = async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.getDamages();
      if (res.data && res.data.length > 0) {
        setDamagesList(res.data);
        showToast('Data laporan kerusakan diperbarui dari server backend');
      }
    } catch (err) {
      console.warn('Backend sync warning, using local state.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique buildings
  const buildingsList = useMemo(() => {
    const set = new Set<string>();
    toilets.forEach((t) => {
      if (t.building) set.add(t.building);
    });
    return Array.from(set);
  }, [toilets]);

  // Statistics KPI calculations
  const stats = useMemo(() => {
    const total = damagesList.length;
    const emergency = damagesList.filter(
      (d) => d.severity === 'Darurat' || d.severity === 'Tinggi'
    ).length;
    const pending = damagesList.filter((d) => d.status === 'Menunggu').length;
    const resolved = damagesList.filter(
      (d) => d.status === 'Selesai' || d.status === 'Dalam Perbaikan'
    ).length;

    return { total, emergency, pending, resolved };
  }, [damagesList]);

  // Filtered List
  const filteredDamages = useMemo(() => {
    return damagesList.filter((item) => {
      const matchedCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchedSev = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
      const matchedStat = selectedStatus === 'ALL' || item.status === selectedStatus;

      const matchedToilet = toilets.find((t) => t.code === item.toiletCode);
      const matchedBld =
        selectedBuilding === 'ALL' || (matchedToilet && matchedToilet.building === selectedBuilding);

      const query = searchQuery.toLowerCase().trim();
      const matchedQuery =
        !query ||
        item.ticketCode.toLowerCase().includes(query) ||
        item.toiletCode.toLowerCase().includes(query) ||
        item.locationName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.reportedBy.toLowerCase().includes(query);

      return matchedCat && matchedSev && matchedStat && matchedBld && matchedQuery;
    });
  }, [damagesList, selectedCategory, selectedSeverity, selectedStatus, selectedBuilding, searchQuery, toilets]);

  // Handlers for Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormToiletId(toilets[0]?.id || '');
    setFormCategory('Plumbing & Air');
    setFormSeverity('Sedang');
    setFormReporter('Petugas Sanitasi');
    setFormDescription('');
    setFormStatus('Menunggu');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RekapKerusakanItem) => {
    setEditingItem(item);
    const matchedToilet = toilets.find((t) => t.code === item.toiletCode);
    setFormToiletId(matchedToilet ? matchedToilet.id : toilets[0]?.id || '');
    setFormCategory(item.category);
    setFormSeverity(item.severity);
    setFormReporter(item.reportedBy);
    setFormDescription(item.description);
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      showToast('Mohon isi deskripsi keluhan kerusakan!');
      return;
    }

    const selectedToiletObj = toilets.find((t) => t.id === formToiletId) || toilets[0];
    const toiletCode = selectedToiletObj ? selectedToiletObj.code : 'T-A1-M';
    const locationName = selectedToiletObj ? selectedToiletObj.name : 'Gedung A - Lantai 1';

    if (editingItem) {
      // Edit mode
      const updatedItem: RekapKerusakanItem = {
        ...editingItem,
        toiletCode,
        locationName,
        category: formCategory,
        severity: formSeverity,
        reportedBy: formReporter,
        description: formDescription,
        status: formStatus,
      };

      setDamagesList((prev) => prev.map((d) => (d.id === editingItem.id ? updatedItem : d)));
      if (onUpdateDamage) onUpdateDamage(updatedItem);

      try {
        await maintenanceApi.updateDamage(editingItem.id, {
          toiletCode,
          locationName,
          category: formCategory,
          severity: formSeverity,
          reportedBy: formReporter,
          description: formDescription,
          status: formStatus,
        });
      } catch (err) {}

      showToast(`Laporan kerusakan ${editingItem.ticketCode} berhasil diperbarui!`);
    } else {
      // Create mode
      const newTicketCode = `DMG-2026-${Math.floor(Math.random() * 900 + 100)}`;
      const newItem: RekapKerusakanItem = {
        id: `dmg-${Date.now()}`,
        ticketCode: newTicketCode,
        toiletCode,
        locationName,
        category: formCategory,
        severity: formSeverity,
        reportedBy: formReporter,
        reportedAt: 'Hari ini, baru saja',
        description: formDescription,
        status: 'Menunggu',
      };

      setDamagesList((prev) => [newItem, ...prev]);
      onAddDamage(newItem);

      showToast(`Laporan kerusakan baru ${newTicketCode} berhasil dicatat!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return;
    const targetId = deleteModalItem.id;
    const targetCode = deleteModalItem.ticketCode;

    setDamagesList((prev) => prev.filter((d) => d.id !== targetId));
    if (onDeleteDamage) onDeleteDamage(targetId);

    try {
      await maintenanceApi.deleteDamage(targetId);
    } catch (err) {}

    showToast(`Tiket kerusakan ${targetCode} telah berhasil dihapus!`);
    setDeleteModalItem(null);
  };

  const handleExecuteDispatch = async (item: RekapKerusakanItem) => {
    onDispatchToRepair(item);
    setDamagesList((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, status: 'Dalam Perbaikan' } : d))
    );

    try {
      await maintenanceApi.dispatchToRepair(item.id, selectedTech);
    } catch (err) {}

    const techObj = TECHNICIANS.find((t) => t.name === selectedTech) || TECHNICIANS[0];
    const messageText = `Halo ${techObj.name} (${techObj.role}), terdapat eskalasi perbaikan tiket *${item.ticketCode}* di *${item.toiletCode} - ${item.locationName}*. Kategori: ${item.category}, Urgensi: *${item.severity}*. Deskripsi: "${item.description}". Mohon segera ditindaklanjuti. Terima kasih.`;
    const waUrl = `https://wa.me/${techObj.phone}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');

    showToast(`Tiket ${item.ticketCode} berhasil ditipekan ke teknisi ${techObj.name}`);
    setDispatchModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Island Top Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Rekap Kerusakan
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Database keluhan sanitasi, deteksi otomatis anomali sensor AIoT, dan eskalasi penanganan kerusakan ke tim teknisi MEP Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDamages}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data Laporan Kerusakan"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Lapor Kerusakan Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Premium Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Laporan */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Laporan Kerusakan</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total} Tiket</p>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              Database aktif terintegrasi
            </span>
          </div>
        </div>

        {/* Urgensi Tinggi / Darurat */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Urgensi Tinggi & Darurat</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5 font-mono">{stats.emergency} Tiket</p>
            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
              <Zap size={12} /> Perlu tindakan prioritas
            </span>
          </div>
        </div>

        {/* Menunggu Penanganan */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Menunggu Eskalasi</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5 font-mono">{stats.pending} Tiket</p>
            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
              Siap ditipekan ke teknisi
            </span>
          </div>
        </div>

        {/* Terselesaikan */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Dalam / Selesai Perbaikan</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">{stats.resolved} Tiket</p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              Ditangani teknisi MEP
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {stats.emergency > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-extrabold text-rose-950">Perhatian Darurat:</span> Terdapat{' '}
              <strong className="underline text-rose-950 font-black">{stats.emergency} tiket kerusakan berurgensi tinggi / darurat</strong>. Segera lakukan eskalasi perbaikan ke tim teknisi untuk menghindari gangguan operasional fasilitas.
            </div>
          </div>
          <button
            onClick={() => setSelectedSeverity('Darurat')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 transition-all shadow-xs text-xs cursor-pointer"
          >
            Tampilkan Tiket Darurat
          </button>
        </div>
      )}

      {/* Filter & Search Bar - Identical with ManajemenToiletView */}
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
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Kategori Masalah:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Plumbing & Air">Plumbing & Air</option>
                <option value="Sensor & IoT">Sensor & IoT</option>
                <option value="Sanitasi & Kloset">Sanitasi & Kloset</option>
                <option value="Elektrikal & Lampu">Elektrikal & Lampu</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Tingkat Urgensi:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Urgensi</option>
                <option value="Darurat">Darurat</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Penanganan:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                <option value="Selesai">Selesai</option>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode tiket, kode bilik, lokasi, deskripsi masalah, atau pelapor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Content View: Table / Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1080px]">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-12 text-center">No.</th>
                  <th className="py-4 px-4 whitespace-nowrap">Kode Tiket</th>
                  <th className="py-4 px-4 whitespace-nowrap">Lokasi Bilik</th>
                  <th className="py-4 px-4 whitespace-nowrap">Kategori</th>
                  <th className="py-4 px-4">Deskripsi Masalah</th>
                  <th className="py-4 px-4 whitespace-nowrap">Urgensi</th>
                  <th className="py-4 px-4 whitespace-nowrap">Pelapor & Waktu</th>
                  <th className="py-4 px-4 whitespace-nowrap">Status</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredDamages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                      Tidak ada data laporan kerusakan yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredDamages.map((dmg, idx) => (
                    <tr key={dmg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800">
                          {dmg.ticketCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{dmg.toiletCode}</div>
                        <div className="text-[11px] text-slate-500">{dmg.locationName}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-[11px] border border-blue-100/80 whitespace-nowrap inline-block">
                          {dmg.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px] max-w-sm">
                        <p className="text-slate-700 line-clamp-2 leading-relaxed text-[11px]">
                          {dmg.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1 ${
                            dmg.severity === 'Darurat'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                              : dmg.severity === 'Tinggi'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : dmg.severity === 'Sedang'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {dmg.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{dmg.reportedBy}</div>
                        <div className="text-[10px] text-slate-400">{dmg.reportedAt}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            dmg.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : dmg.status === 'Dalam Perbaikan'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {dmg.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {dmg.status !== 'Selesai' && (
                            <button
                              onClick={() => setDispatchModalItem(dmg)}
                              className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200/80 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1 font-bold text-xs"
                              title="Eskalasi Perbaikan ke Teknisi"
                            >
                              <Wrench size={15} />
                              <span>Eskalasi</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(dmg)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Edit Laporan"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteModalItem(dmg)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Hapus Tiket"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDamages.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
              <AlertTriangle className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-sm font-bold text-slate-600">Tidak ada laporan kerusakan ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau cari dengan kata kunci lain.</p>
            </div>
          ) : (
            filteredDamages.map((dmg) => (
              <div
                key={dmg.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl">
                      {dmg.ticketCode}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        dmg.severity === 'Darurat'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          : dmg.severity === 'Tinggi'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : dmg.severity === 'Sedang'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      Urgensi: {dmg.severity}
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <Building2 size={13} /> {dmg.toiletCode}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{dmg.locationName}</h3>
                    <span className="inline-block mt-1 text-[10px] font-bold text-slate-600 px-2.5 py-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
                      {dmg.category}
                    </span>
                  </div>

                  <div className="mt-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                    <p className="font-medium">{dmg.description}</p>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1 text-slate-600 font-semibold">
                      <UserCheck size={13} className="text-slate-400" />
                      <span>Pelapor: <strong>{dmg.reportedBy}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock size={13} />
                      <span>{dmg.reportedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl ${
                      dmg.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dmg.status === 'Dalam Perbaikan'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {dmg.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {dmg.status !== 'Selesai' && (
                      <button
                        onClick={() => setDispatchModalItem(dmg)}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200/80 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1 font-bold text-xs"
                        title="Eskalasi Perbaikan ke Teknisi"
                      >
                        <Wrench size={15} />
                        <span>Eskalasi</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(dmg)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Laporan"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModalItem(dmg)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus Tiket"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal 1: Create & Edit Damage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <span>{editingItem ? 'Edit Laporan Kerusakan' : 'Lapor Kerusakan Sanitasi / AIoT'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Lokasi Bilik Toilet</label>
                  <select
                    value={formToiletId}
                    onChange={(e) => setFormToiletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    {toilets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Kategori Masalah</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Plumbing & Air">Plumbing & Air</option>
                    <option value="Sensor & IoT">Sensor & IoT</option>
                    <option value="Sanitasi & Kloset">Sanitasi & Kloset</option>
                    <option value="Elektrikal & Lampu">Elektrikal & Lampu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Tingkat Urgensi</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Rendah">Rendah (Dapat dijadwalkan)</option>
                    <option value="Sedang">Sedang (Penanganan hari ini)</option>
                    <option value="Tinggi">Tinggi (Mengganggu kenyamanan)</option>
                    <option value="Darurat">Darurat (Bilik harus ditutup)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Pelapor</label>
                  <input
                    type="text"
                    required
                    value={formReporter}
                    onChange={(e) => setFormReporter(e.target.value)}
                    placeholder="Petugas Sanitasi / Pengunjung / System AI"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {editingItem && (
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Status Penanganan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Deskripsi Detail Kerusakan</label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan kendala fasilitas, misal: Kran bocor deras, sensor air flow tidak mendeteksi air..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Kirim Laporan Kerusakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: WhatsApp Dispatch Technician Modal */}
      {dispatchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" />
                <span>Eskalasi Perbaikan ke Teknisi</span>
              </h3>
              <button
                onClick={() => setDispatchModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">{dispatchModalItem.ticketCode}</span>
                  <span className="font-extrabold text-rose-600">{dispatchModalItem.severity}</span>
                </div>
                <div className="font-extrabold text-slate-900">{dispatchModalItem.locationName}</div>
                <p className="text-slate-600 line-clamp-2">{dispatchModalItem.description}</p>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1.5">Pilih Teknisi Penanggung Jawab:</label>
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  {TECHNICIANS.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchModalItem(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteDispatch(dispatchModalItem)}
                  className="flex items-center gap-1.5 px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Send size={15} />
                  <span>Eskalasi & Kirim WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Tiket</h3>
            <p className="text-xs text-slate-500 mt-1">
              Apakah Anda yakin ingin menghapus tiket kerusakan <strong className="text-slate-900">{deleteModalItem.ticketCode}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Ya, Hapus Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
