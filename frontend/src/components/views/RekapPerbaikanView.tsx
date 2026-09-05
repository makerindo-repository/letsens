import React, { useState, useEffect, useMemo } from 'react';
import {
  Hammer,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Edit3,
  Trash2,
  LayoutGrid,
  Table,
  Building2,
  UserCheck,
  DollarSign,
  X,
  Send,
  FileText,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Phone,
  PackageCheck,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RekapPerbaikanItem, ToiletBilik, RekapKerusakanItem, PetugasKebersihan } from '../../types';
import { maintenanceApi } from '../../api/maintenanceApi';

interface RekapPerbaikanViewProps {
  repairs: RekapPerbaikanItem[];
  toilets: ToiletBilik[];
  damages?: RekapKerusakanItem[];
  staffList?: PetugasKebersihan[];
  onAddRepair?: (repair: RekapPerbaikanItem) => void;
  onUpdateRepairStatus?: (id: string, newStatus: RekapPerbaikanItem['status']) => void;
  onUpdateRepair?: (id: string, updated: Partial<RekapPerbaikanItem>) => void;
  onDeleteRepair?: (id: string) => void;
}

export const RekapPerbaikanView: React.FC<RekapPerbaikanViewProps> = ({
  repairs: initialRepairs = [],
  toilets = [],
  damages = [],
  staffList = [],
  onAddRepair,
  onUpdateRepairStatus,
  onUpdateRepair,
  onDeleteRepair,
}) => {
  // Local state synced with props & REST API
  const [items, setItems] = useState<RekapPerbaikanItem[]>(initialRepairs);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Synchronize with props
  useEffect(() => {
    if (initialRepairs && initialRepairs.length > 0) {
      setItems(initialRepairs);
    }
  }, [initialRepairs]);

  // Default Technicians MEP & IoT
  const defaultTechnicians = useMemo(() => [
    { name: 'Bambang Sudarmono', role: 'Teknisi MEP & Sistem Utama', phone: '6281234567801' },
    { name: 'Agus Rianto', role: 'Teknisi Plumbing & Sanitasi', phone: '6281234567802' },
    { name: 'Rudi Hermawan', role: 'Teknisi IoT & Sensor', phone: '6281234567803' },
    { name: 'Dedi Kurniawan', role: 'Teknisi Listrik & Exhaust', phone: '6281234567804' },
  ], []);

  // Combine staff from prop and default technicians
  const technicianOptions = useMemo(() => {
    const map = new Map<string, { name: string; role: string; phone?: string }>();
    defaultTechnicians.forEach((t) => map.set(t.name, t));
    staffList.forEach((s) => {
      if (!map.has(s.name)) {
        map.set(s.name, { name: s.name, role: s.role || 'Teknisi Operasional', phone: s.phone });
      }
    });
    return Array.from(map.values());
  }, [staffList, defaultTechnicians]);

  // Filters & Search State
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RekapPerbaikanItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<RekapPerbaikanItem | null>(null);
  const [dispatchItem, setDispatchItem] = useState<RekapPerbaikanItem | null>(null);

  // Form State
  const [formDamageCode, setFormDamageCode] = useState<string>('');
  const [formToiletId, setFormToiletId] = useState<string>(toilets[0]?.id || '');
  const [formTechnician, setFormTechnician] = useState<string>(technicianOptions[0]?.name || '');
  const [formAction, setFormAction] = useState<string>('');
  const [formParts, setFormParts] = useState<string>('');
  const [formCost, setFormCost] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<RekapPerbaikanItem['status']>('Proses Pengerjaan');
  const [formNotes, setFormNotes] = useState<string>('');

  // Extract unique buildings
  const buildings = useMemo(() => {
    const set = new Set<string>();
    toilets.forEach((t) => set.add(t.building));
    return Array.from(set);
  }, [toilets]);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch backend API to sync repairs
  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.getRepairs();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setItems(res.data);
      }
    } catch (err: any) {
      console.warn('Backend repairs API unavailable, fallback to local state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    const firstDamage = damages[0];
    setFormDamageCode(firstDamage ? firstDamage.ticketCode : '');
    const initialToilet = firstDamage ? toilets.find((t) => t.code === firstDamage.toiletCode) : toilets[0];
    setFormToiletId(initialToilet?.id || toilets[0]?.id || '');
    setFormTechnician(technicianOptions[0]?.name || '');
    setFormAction('');
    setFormParts('');
    setFormCost(0);
    setFormStatus('Proses Pengerjaan');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: RekapPerbaikanItem) => {
    setEditingItem(item);
    setFormDamageCode(item.damageTicketCode || '');
    const matchedToilet = toilets.find((t) => t.code === item.toiletCode);
    setFormToiletId(matchedToilet ? matchedToilet.id : toilets[0]?.id || '');
    setFormTechnician(item.technicianName || (technicianOptions[0]?.name ?? ''));
    setFormAction(item.actionTaken || '');
    setFormParts(item.partsReplaced || '');
    setFormCost(item.costEstimateRp || 0);
    setFormStatus(item.status || 'Proses Pengerjaan');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Save Form Handler (Create or Update)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedToilet = toilets.find((t) => t.id === formToiletId) || toilets[0];
    const toiletCode = selectedToilet ? selectedToilet.code : 'T-A1-M';
    const locationName = selectedToilet ? selectedToilet.name : 'Gedung A - Lantai 1 (Pria)';

    if (editingItem) {
      // Edit mode
      const updatedRepair: RekapPerbaikanItem = {
        ...editingItem,
        damageTicketCode: formDamageCode,
        toiletCode,
        locationName,
        technicianName: formTechnician,
        actionTaken: formAction,
        partsReplaced: formParts,
        costEstimateRp: Number(formCost),
        status: formStatus,
        notes: formNotes,
        completedAt: formStatus === 'Selesai' ? new Date().toLocaleString('id-ID') : editingItem.completedAt,
      };

      setItems((prev) => prev.map((r) => (r.id === editingItem.id ? updatedRepair : r)));
      if (onUpdateRepair) onUpdateRepair(editingItem.id, updatedRepair);

      try {
        await maintenanceApi.updateRepair(editingItem.id, updatedRepair);
      } catch (e) {
        console.warn('API update failed, local state updated');
      }

      showToast(`Tiket perbaikan ${updatedRepair.repairCode} berhasil diperbarui.`);
    } else {
      // Create mode
      const newRepair: RekapPerbaikanItem = {
        id: `rep-${Date.now()}`,
        repairCode: `REP-2026-${Math.floor(Math.random() * 899 + 100)}`,
        damageTicketCode: formDamageCode,
        toiletCode,
        locationName,
        technicianName: formTechnician,
        actionTaken: formAction,
        partsReplaced: formParts,
        costEstimateRp: Number(formCost),
        startedAt: 'Hari ini',
        status: formStatus,
        notes: formNotes,
        completedAt: formStatus === 'Selesai' ? new Date().toLocaleString('id-ID') : undefined,
      };

      setItems((prev) => [newRepair, ...prev]);
      if (onAddRepair) onAddRepair(newRepair);

      showToast(`Tiket perbaikan ${newRepair.repairCode} berhasil dicatat.`);
    }

    setIsModalOpen(false);
  };

  // Quick Change Status Handler
  const handleQuickStatusChange = async (id: string, newStatus: RekapPerbaikanItem['status']) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              completedAt: newStatus === 'Selesai' ? new Date().toLocaleString('id-ID') : r.completedAt,
            }
          : r
      )
    );

    if (onUpdateRepairStatus) {
      onUpdateRepairStatus(id, newStatus);
    }

    try {
      await maintenanceApi.updateRepairStatus(id, newStatus);
    } catch (e) {
      console.warn('API status update failed, local state updated');
    }

    showToast(`Status tiket perbaikan diubah menjadi "${newStatus}".`);
  };

  // Confirm Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return;
    const targetId = deleteModalItem.id;
    const targetCode = deleteModalItem.repairCode;

    setItems((prev) => prev.filter((r) => r.id !== targetId));
    if (onDeleteRepair) onDeleteRepair(targetId);

    try {
      await maintenanceApi.deleteRepair(targetId);
    } catch (e) {
      console.warn('API delete failed, local state updated');
    }

    setDeleteModalItem(null);
    showToast(`Tiket perbaikan ${targetCode} telah dihapus.`);
  };

  // Filter items
  const filteredRepairs = useMemo(() => {
    return items.filter((item) => {
      // Filter Building
      if (selectedBuilding !== 'ALL') {
        const t = toilets.find((toilet) => toilet.code === item.toiletCode);
        if (!t || t.building !== selectedBuilding) return false;
      }
      // Filter Status
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      // Filter Technician
      if (selectedTechnician !== 'ALL' && !item.technicianName.toLowerCase().includes(selectedTechnician.toLowerCase())) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchCode = item.repairCode.toLowerCase().includes(q);
        const matchDamage = item.damageTicketCode.toLowerCase().includes(q);
        const matchToilet = item.toiletCode.toLowerCase().includes(q);
        const matchLoc = item.locationName.toLowerCase().includes(q);
        const matchTech = item.technicianName.toLowerCase().includes(q);
        const matchAction = item.actionTaken.toLowerCase().includes(q);
        const matchParts = item.partsReplaced.toLowerCase().includes(q);
        if (!matchCode && !matchDamage && !matchToilet && !matchLoc && !matchTech && !matchAction && !matchParts) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedBuilding, selectedStatus, selectedTechnician, searchQuery, toilets]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((r) => r.status === 'Selesai').length;
    const inProgress = items.filter((r) => r.status === 'Proses Pengerjaan').length;
    const waitingParts = items.filter((r) => r.status === 'Menunggu Sparepart').length;
    const totalCost = items.reduce((acc, curr) => acc + (curr.costEstimateRp || 0), 0);

    return { total, done, inProgress, waitingParts, totalCost };
  }, [items]);

  // WhatsApp Dispatch Message Formatter
  const getWhatsAppUrl = (item: RekapPerbaikanItem) => {
    const matchedTech = technicianOptions.find((t) => t.name === item.technicianName);
    const phone = matchedTech?.phone || '6281234567801';
    const text = `*INSTRUKSI PERBAIKAN MEKANIK & MEP - LETSENS AI*

Halo Bpk/Ibu *${item.technicianName}*,
Berikut rincian penugasan tiket perbaikan fasilitas sanitasi:

• *No. Tiket:* ${item.repairCode} (${item.damageTicketCode})
• *Lokasi Bilik:* ${item.toiletCode} - ${item.locationName}
• *Tindakan:* ${item.actionTaken}
• *Suku Cadang:* ${item.partsReplaced}
• *Estimasi Biaya:* Rp ${item.costEstimateRp.toLocaleString('id-ID')}
• *Status Tiket:* ${item.status}

Mohon segera ditindaklanjuti dan lakukan perbaruan status di SIM LetSens AI Universitas Komputer Indonesia. Terima kasih.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
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

      {/* Header Bar - Identical with FasilitasView */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Hammer size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Rekap Perbaikan
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Log tindakan teknis korektif, pengadaan suku cadang sensor/plumbing, dan integrasi penanganan kerusakan Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRepairs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data Tiket Perbaikan"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Buat Tiket Perbaikan Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Premium Stat KPI Cards - Identical with FasilitasView */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tiket */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Tiket Perbaikan</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total} Tiket</p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={12} /> {stats.done} selesai diuji
            </span>
          </div>
        </div>

        {/* Dalam Pengerjaan */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Dalam Pengerjaan</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5 font-mono">{stats.inProgress} Tiket</p>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              <UserCheck size={12} className="text-amber-500" /> Ditangani teknisi
            </span>
          </div>
        </div>

        {/* Menunggu Sparepart */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <PackageCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Menunggu Sparepart</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5 font-mono">{stats.waitingParts} Tiket</p>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-purple-500" /> Inden komponen
            </span>
          </div>
        </div>

        {/* Total Biaya */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Estimasi Biaya Perbaikan</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
              Rp {stats.totalCost.toLocaleString('id-ID')}
            </p>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
              Alokasi sarpras UNIKOM
            </span>
          </div>
        </div>
      </div>

      {/* Alert Warning Banner for Active Repairs */}
      {(stats.inProgress > 0 || stats.waitingParts > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-900">Perhatian Pemeliharaan:</span> Terdapat{' '}
              <strong className="underline text-amber-950 font-black">{stats.inProgress} tiket perbaikan aktif</strong> dan{' '}
              <strong className="underline text-amber-950 font-black">{stats.waitingParts} tiket menunggu suku cadang</strong>. Pastikan teknisi menyelesaikan perbaikan tepat waktu untuk menjaga skor kebersihan fasilitas.
            </div>
          </div>
          <button
            onClick={() => setSelectedStatus('Proses Pengerjaan')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 transition-all shadow-xs text-xs cursor-pointer"
          >
            Tampilkan Tiket Aktif
          </button>
        </div>
      )}

      {/* Control Card: Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Perbaikan:</span>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {['ALL', 'Proses Pengerjaan', 'Menunggu Sparepart', 'Selesai'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua Status' : st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Lokasi Gedung:</span>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Gedung</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    Gedung: {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Teknisi PJ:</span>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Teknisi</option>
                {technicianOptions.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.role})
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode tiket, bilik, teknisi, atau suku cadang..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Display: Table or Grid */}
      {filteredRepairs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <Wrench size={40} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Tidak ada tiket perbaikan ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter status dan gedung.
          </p>
          <button
            onClick={() => {
              setSelectedBuilding('ALL');
              setSelectedStatus('ALL');
              setSelectedTechnician('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-all"
          >
            Reset Filter Pencarian
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap">NO. TIKET</th>
                  <th className="py-4 px-4 whitespace-nowrap">LOKASI BILIK</th>
                  <th className="py-4 px-4 whitespace-nowrap">TEKNISI PENANGGUNG JAWAB</th>
                  <th className="py-4 px-4 min-w-[220px] whitespace-nowrap">TINDAKAN PERBAIKAN & SUKU CADANG</th>
                  <th className="py-4 px-4 whitespace-nowrap">ESTIMASI BIAYA</th>
                  <th className="py-4 px-4 whitespace-nowrap">STATUS</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* NO TIKET */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-extrabold text-blue-600 text-xs flex items-center gap-1.5">
                        <Hammer size={14} className="text-blue-500 shrink-0" />
                        <span>{repair.repairCode}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Kerusakan: <strong className="text-slate-600">{repair.damageTicketCode}</strong>
                      </div>
                    </td>

                    {/* LOKASI BILIK */}
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Building2 size={14} className="text-slate-400 shrink-0" />
                        <span>{repair.toiletCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">{repair.locationName}</div>
                    </td>

                    {/* TEKNISI */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <UserCheck size={14} className="text-slate-400 shrink-0" />
                        <span>{repair.technicianName}</span>
                      </div>
                      <a
                        href={getWhatsAppUrl(repair)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 hover:underline mt-0.5"
                      >
                        <Phone size={12} /> WhatsApp Teknisi
                      </a>
                    </td>

                    {/* TINDAKAN PERBAIKAN & SUKU CADANG */}
                    <td className="py-4 px-4 max-w-sm">
                      <div className="font-bold text-slate-900 text-xs leading-snug">{repair.actionTaken}</div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono text-[10px] font-bold inline-block">
                          Part: {repair.partsReplaced}
                        </span>
                      </div>
                    </td>

                    {/* ESTIMASI BIAYA */}
                    <td className="py-4 px-4 font-mono font-extrabold text-emerald-700 text-xs whitespace-nowrap">
                      Rp {repair.costEstimateRp.toLocaleString('id-ID')}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                          repair.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : repair.status === 'Proses Pengerjaan'
                            ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                            : 'bg-purple-50 text-purple-700 border-purple-200/80'
                        }`}
                      >
                        {repair.status === 'Selesai' && <CheckCircle2 size={13} className="text-emerald-600" />}
                        {repair.status === 'Proses Pengerjaan' && <Wrench size={13} className="text-amber-600" />}
                        {repair.status === 'Menunggu Sparepart' && <Clock size={13} className="text-purple-600" />}
                        <span>{repair.status}</span>
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {repair.status !== 'Selesai' && (
                          <button
                            onClick={() => handleQuickStatusChange(repair.id, 'Selesai')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Tandai Selesai Perbaikan"
                          >
                            Selesai
                          </button>
                        )}
                        <a
                          href={getWhatsAppUrl(repair)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Kirim Pesan WhatsApp Teknisi"
                        >
                          <Send size={15} />
                        </a>
                        <button
                          onClick={() => handleOpenEditModal(repair)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Edit Tiket"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteModalItem(repair)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Hapus Tiket"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRepairs.map((repair) => (
            <div
              key={repair.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-blue-600 shrink-0">
                      <Hammer size={22} />
                    </div>
                    <div>
                      <h3 className="font-mono font-extrabold text-blue-600 text-xs">{repair.repairCode}</h3>
                      <span className="text-[10px] font-mono text-slate-400 block">Ref: {repair.damageTicketCode}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                      repair.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                        : repair.status === 'Proses Pengerjaan'
                        ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                        : 'bg-purple-50 text-purple-700 border-purple-200/80'
                    }`}
                  >
                    {repair.status}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Bilik Toilet:</span>
                    <span className="font-extrabold text-slate-900">{repair.toiletCode} ({repair.locationName})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Teknisi MEP:</span>
                    <span className="font-bold text-slate-800">{repair.technicianName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Estimasi Biaya:</span>
                    <span className="font-mono font-bold text-emerald-700">Rp {repair.costEstimateRp.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 leading-snug">{repair.actionTaken}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Sparepart: <strong className="text-slate-800">{repair.partsReplaced}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <a
                  href={getWhatsAppUrl(repair)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 hover:underline"
                >
                  <Send size={13} /> WA Teknisi
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(repair)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteModalItem(repair)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE / EDIT REPAIR TICKET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-200">
                  <Hammer size={20} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? 'Edit Tiket Perbaikan Fasilitas' : 'Buat Tiket Perbaikan Fasilitas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Tiket Kerusakan Terkait</label>
                  <select
                    value={formDamageCode}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      setFormDamageCode(selectedCode);
                      const matchedDamage = damages.find((d) => d.ticketCode === selectedCode);
                      if (matchedDamage) {
                        const matchedToilet = toilets.find((t) => t.code === matchedDamage.toiletCode);
                        if (matchedToilet) setFormToiletId(matchedToilet.id);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Tanpa Tiket Kerusakan (Pemeliharaan Rutin) --</option>
                    {damages.map((d) => (
                      <option key={d.id} value={d.ticketCode}>
                        {d.ticketCode} - {d.toiletCode} ({d.category})
                      </option>
                    ))}
                    {formDamageCode && !damages.some((d) => d.ticketCode === formDamageCode) && (
                      <option value={formDamageCode}>{formDamageCode}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Lokasi Bilik Toilet</label>
                  <select
                    value={formToiletId}
                    onChange={(e) => setFormToiletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    {toilets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Teknisi Penanggung Jawab</label>
                <select
                  value={formTechnician}
                  onChange={(e) => setFormTechnician(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {technicianOptions.map((tech) => (
                    <option key={tech.name} value={tech.name}>
                      {tech.name} ({tech.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Tindakan Perbaikan Teknis</label>
                <textarea
                  rows={2}
                  required
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  placeholder="Contoh: Kalibrasi modul sensor MQ-137 dan pembersihan exhaust fan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-extrabold text-slate-700 block mb-1">Suku Cadang Diganti</label>
                  <input
                    type="text"
                    required
                    value={formParts}
                    onChange={(e) => setFormParts(e.target.value)}
                    placeholder="Contoh: Karet O-Ring + Seal Tape"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Status Pengerjaan</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="Proses Pengerjaan">Proses Pengerjaan</option>
                  <option value="Menunggu Sparepart">Menunggu Sparepart</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Catatan Hasil Pengerjaan</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Catatan pengujian atau keterangan akhir"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-2xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-md shadow-blue-500/20"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Tiket Perbaikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP DISPATCH */}
      {dispatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-emerald-600" />
                Dispatch Instruksi WhatsApp
              </h3>
              <button onClick={() => setDispatchItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold">Teknisi:</span>{' '}
                <strong className="text-slate-900">{dispatchItem.technicianName}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Kode Tiket:</span>{' '}
                <strong className="font-mono text-blue-600">{dispatchItem.repairCode}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Lokasi:</span>{' '}
                <strong className="text-slate-900">{dispatchItem.toiletCode} ({dispatchItem.locationName})</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Tindakan:</span>{' '}
                <span className="text-slate-800 font-medium">{dispatchItem.actionTaken}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDispatchItem(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Tutup
              </button>
              <a
                href={getWhatsAppUrl(dispatchItem)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDispatchItem(null)}
                className="px-4 py-2 font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 text-xs"
              >
                <Send size={14} /> Buka WhatsApp Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Tiket Perbaikan?</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{deleteModalItem.repairCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tindakan ini akan menghapus log perbaikan secara permanen dari sistem.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs text-xs"
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
