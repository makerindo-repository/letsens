import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Edit3,
  Trash2,
  LayoutGrid,
  Table,
  Building2,
  UserCheck,
  X,
  Send,
  FileText,
  Sparkles,
  RefreshCw,
  Filter,
  CheckSquare,
  Square,
  ListTodo,
  Pencil,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JadwalPemeliharaanItem, ToiletBilik, PetugasKebersihan, RekapKerusakanItem } from '../../types';
import { maintenanceApi } from '../../api/maintenanceApi';

interface JadwalPemeliharaanViewProps {
  schedules: JadwalPemeliharaanItem[];
  toilets: ToiletBilik[];
  staffList: PetugasKebersihan[];
  damages?: RekapKerusakanItem[];
  onAddSchedule?: (schedule: JadwalPemeliharaanItem) => void;
  onToggleTaskCheck?: (scheduleId: string, taskIndex: number) => void;
  onCompleteSchedule?: (scheduleId: string) => void;
  onUpdateSchedule?: (scheduleId: string, schedule: Partial<JadwalPemeliharaanItem>) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
}

export const JadwalPemeliharaanView: React.FC<JadwalPemeliharaanViewProps> = ({
  schedules: initialSchedules = [],
  toilets = [],
  staffList = [],
  damages = [],
  onAddSchedule,
  onToggleTaskCheck,
  onCompleteSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}) => {
  // Local state synced with props & REST API
  const [items, setItems] = useState<JadwalPemeliharaanItem[]>(initialSchedules);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Synchronize with parent props
  useEffect(() => {
    if (initialSchedules && initialSchedules.length > 0) {
      setItems(initialSchedules);
    }
  }, [initialSchedules]);

  // Filters & Search State
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<JadwalPemeliharaanItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<JadwalPemeliharaanItem | null>(null);

  // Form States
  const [formToiletId, setFormToiletId] = useState<string>(toilets[0]?.id || '');
  const [formStaffId, setFormStaffId] = useState<string>(staffList[0]?.id || '');
  const [formShift, setFormShift] = useState<string>('Pagi (06:00 - 14:00)');
  const [formTimeSlot, setFormTimeSlot] = useState<string>('08:00 - 08:30 WIB');
  const [formType, setFormType] = useState<JadwalPemeliharaanItem['type']>('Pembersihan Rutin');
  const [formTasks, setFormTasks] = useState<string>(
    'Pengecekan Kebersihan Floor Drain & Wastafel\nPembersihan Kloset dengan Desinfektan\nPengisian Ulang Sabun Cair & Tisu Roll\nPengecekan Fungsi Blower Exhaust & Sensor MQ-137'
  );
  const [formNotes, setFormNotes] = useState<string>('');
  const [formLinkedDamage, setFormLinkedDamage] = useState<string>('');

  // Extract unique buildings
  const buildings = useMemo(() => {
    const set = new Set<string>();
    toilets.forEach((t) => {
      if (t.building) set.add(t.building);
    });
    return Array.from(set);
  }, [toilets]);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch backend API to refresh schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.getSchedules();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setItems(res.data);
      }
    } catch (err: any) {
      console.warn('Backend schedules API unavailable, using local state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormToiletId(toilets[0]?.id || '');
    setFormStaffId(staffList[0]?.id || '');
    setFormShift('Pagi (06:00 - 14:00)');
    setFormTimeSlot('08:00 - 08:30 WIB');
    setFormType('Pembersihan Rutin');
    setFormTasks(
      'Pengecekan Kebersihan Floor Drain & Wastafel\nPembersihan Kloset dengan Desinfektan\nPengisian Ulang Sabun Cair & Tisu Roll\nPengecekan Fungsi Blower Exhaust & Sensor MQ-137'
    );
    setFormNotes('');
    setFormLinkedDamage('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: JadwalPemeliharaanItem) => {
    setEditingItem(item);
    const matchedToilet = toilets.find((t) => t.code === item.toiletCode) || toilets[0];
    const matchedStaff = staffList.find((s) => s.id === item.staffId || s.name === item.staffName) || staffList[0];

    setFormToiletId(matchedToilet?.id || toilets[0]?.id || '');
    setFormStaffId(matchedStaff?.id || staffList[0]?.id || '');
    setFormShift(item.shift || 'Pagi (06:00 - 14:00)');
    setFormTimeSlot(item.timeSlot || '08:00 - 08:30 WIB');
    setFormType(item.type);
    setFormTasks(item.checklist.map((c) => c.task).join('\n'));
    setFormNotes(item.notes || '');
    setFormLinkedDamage('');
    setIsModalOpen(true);
  };

  // Save Form Handler (Create or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedToilet = toilets.find((t) => t.id === formToiletId) || toilets[0];
    const selectedStaff = staffList.find((s) => s.id === formStaffId) || staffList[0];

    const toiletCode = selectedToilet ? selectedToilet.code : 'T-A1-M';
    const toiletName = selectedToilet ? selectedToilet.name : 'Gedung A, Lt 1, Male';
    const staffId = selectedStaff ? selectedStaff.id : '1';
    const staffName = selectedStaff ? selectedStaff.name : 'Asep Saepulloh';

    const checklistItems = formTasks
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => {
        if (editingItem) {
          const existing = editingItem.checklist.find((c) => c.task === t);
          return { task: t, done: existing ? existing.done : false };
        }
        return { task: t, done: false };
      });

    let extraNote = formNotes;
    if (formLinkedDamage) {
      const dmgObj = damages.find((d) => d.ticketCode === formLinkedDamage);
      if (dmgObj) {
        extraNote = `[Terkait Laporan ${dmgObj.ticketCode}: ${dmgObj.description}] ${formNotes}`.trim();
      }
    }

    if (editingItem) {
      // Edit mode
      const updatedSchedule: JadwalPemeliharaanItem = {
        ...editingItem,
        toiletCode,
        toiletName,
        staffId,
        staffName,
        shift: formShift,
        timeSlot: formTimeSlot,
        type: formType,
        checklist: checklistItems,
        notes: extraNote || 'Jadwal rutin harian sanitasi kampus',
      };

      setItems((prev) => prev.map((s) => (s.id === editingItem.id ? updatedSchedule : s)));
      if (onUpdateSchedule) onUpdateSchedule(editingItem.id, updatedSchedule);

      try {
        await maintenanceApi.updateSchedule(editingItem.id, updatedSchedule);
      } catch (e) {
        console.warn('API update failed, local state updated');
      }

      showToast(`Jadwal pemeliharaan [${toiletCode}] berhasil diperbarui.`);
    } else {
      // Create mode
      const newSchedule: JadwalPemeliharaanItem = {
        id: `maint-${Date.now()}`,
        toiletCode,
        toiletName,
        staffId,
        staffName,
        shift: formShift,
        timeSlot: formTimeSlot,
        type: formType,
        checklist: checklistItems,
        status: 'Terjadwal',
        notes: extraNote || 'Jadwal rutin harian sanitasi kampus',
      };

      setItems((prev) => [newSchedule, ...prev]);
      if (onAddSchedule) onAddSchedule(newSchedule);

      try {
        await maintenanceApi.createSchedule(newSchedule);
      } catch (e) {
        console.warn('API create failed, local state updated');
      }

      showToast(`Jadwal pemeliharaan baru [${toiletCode}] berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
  };

  // Toggle Single Task Checklist Item
  const handleToggleTaskCheck = async (scheduleId: string, taskIndex: number, taskName: string) => {
    setItems((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId) {
          const updatedChecklist = [...s.checklist];
          updatedChecklist[taskIndex] = {
            ...updatedChecklist[taskIndex],
            done: !updatedChecklist[taskIndex].done,
          };
          const allDone = updatedChecklist.length > 0 && updatedChecklist.every((c) => c.done);
          const anyDone = updatedChecklist.some((c) => c.done);
          const newStatus: JadwalPemeliharaanItem['status'] = allDone
            ? 'Selesai'
            : anyDone
            ? 'Sedang Berjalan'
            : 'Terjadwal';

          return {
            ...s,
            checklist: updatedChecklist,
            status: newStatus,
            completedAt: allDone
              ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : undefined,
          };
        }
        return s;
      })
    );

    if (onToggleTaskCheck) {
      onToggleTaskCheck(scheduleId, taskIndex);
    } else {
      try {
        await maintenanceApi.toggleChecklist(scheduleId, taskIndex);
      } catch (e) {
        console.warn('API toggle failed, local state updated');
      }
    }

    showToast(`Checklist "${taskName.slice(0, 22)}..." diperbarui.`);
  };

  // Quick Change Status Handler
  const handleQuickStatusChange = async (id: string, newStatus: JadwalPemeliharaanItem['status']) => {
    setItems((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const isDone = newStatus === 'Selesai';
          const updatedChecklist = isDone ? s.checklist.map((c) => ({ ...c, done: true })) : s.checklist;
          return {
            ...s,
            status: newStatus,
            checklist: updatedChecklist,
            completedAt: isDone ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : s.completedAt,
          };
        }
        return s;
      })
    );

    if (newStatus === 'Selesai' && onCompleteSchedule) {
      onCompleteSchedule(id);
    } else if (onUpdateSchedule) {
      onUpdateSchedule(id, { status: newStatus });
    }

    try {
      if (newStatus === 'Selesai') {
        await maintenanceApi.completeSchedule(id);
      } else {
        await maintenanceApi.updateSchedule(id, { status: newStatus });
      }
    } catch (e) {
      console.warn('API status update failed, local state updated');
    }

    showToast(`Status jadwal diubah menjadi "${newStatus}".`);
  };

  // Confirm Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return;
    const targetId = deleteModalItem.id;
    const targetCode = deleteModalItem.toiletCode;

    setItems((prev) => prev.filter((s) => s.id !== targetId));
    if (onDeleteSchedule) onDeleteSchedule(targetId);

    try {
      await maintenanceApi.deleteSchedule(targetId);
    } catch (e) {
      console.warn('API delete failed, local state updated');
    }

    setDeleteModalItem(null);
    showToast(`Jadwal pemeliharaan [${targetCode}] berhasil dihapus.`);
  };

  // Filter items computation
  const filteredSchedules = useMemo(() => {
    return items.filter((item) => {
      // Filter Building
      if (selectedBuilding !== 'ALL') {
        const matchedToilet = toilets.find((t) => t.code === item.toiletCode);
        if (!matchedToilet || matchedToilet.building !== selectedBuilding) return false;
      }
      // Filter Status
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      // Filter Type
      if (selectedType !== 'ALL' && item.type !== selectedType) return false;
      // Filter Shift
      if (selectedShift !== 'ALL' && !item.shift.toLowerCase().includes(selectedShift.toLowerCase())) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchToilet = item.toiletCode.toLowerCase().includes(q);
        const matchName = item.toiletName.toLowerCase().includes(q);
        const matchStaff = item.staffName.toLowerCase().includes(q);
        const matchType = item.type.toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchTasks = item.checklist.some((c) => c.task.toLowerCase().includes(q));

        if (!matchToilet && !matchName && !matchStaff && !matchType && !matchNotes && !matchTasks) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedBuilding, selectedStatus, selectedType, selectedShift, searchQuery, toilets]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((s) => s.status === 'Selesai').length;
    const inProgress = items.filter((s) => s.status === 'Sedang Berjalan').length;
    const scheduled = items.filter((s) => s.status === 'Terjadwal').length;

    let totalTasksCount = 0;
    let completedTasksCount = 0;
    items.forEach((s) => {
      totalTasksCount += s.checklist.length;
      completedTasksCount += s.checklist.filter((c) => c.done).length;
    });

    const complianceRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 100;

    return { total, done, inProgress, scheduled, complianceRate, totalTasksCount, completedTasksCount };
  }, [items]);

  // WhatsApp Message Link Generator
  const getWhatsAppUrl = (item: JadwalPemeliharaanItem) => {
    const matchedStaff = staffList.find((s) => s.id === item.staffId || s.name === item.staffName);
    const phoneClean = matchedStaff?.phone ? matchedStaff.phone.replace(/[^0-9]/g, '') : '6281234567890';
    const finalPhone = phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean;

    const checklistFormatted = item.checklist.map((c, i) => `${i + 1}. [${c.done ? 'V' : ' '}] ${c.task}`).join('\n');

    const text = `*PENUGASAN JADWAL PEMELIHARAAN SANITASI - LETSENS AI*

Halo *${item.staffName}*,
Mohon laksanakan tugas pemeliharaan sanitasi berkala untuk lokasi:

• *Kode Bilik:* ${item.toiletCode} - ${item.toiletName}
• *Jenis Agenda:* ${item.type}
• *Shift Kerja:* ${item.shift}
• *Slot Waktu:* ${item.timeSlot}
• *Catatan:* ${item.notes || '-'}

*Item Checklist Pekerjaan:*
${checklistFormatted}

Mohon segera ditindaklanjuti dan perbarui status di SIM LetSens AI Universitas Komputer Indonesia. Terima kasih.`;

    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
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

      {/* Header Bar - Identical with RekapPerbaikanView */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <CalendarClock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Jadwal Pemeliharaan
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Manajemen agenda pembersihan berkala, sanitasi kloset, kalibrasi sensor, dan verifikasi checklist tugas Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data Jadwal Pemeliharaan"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Agenda Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Premium Stat KPI Cards - Identical Layout & Spacing with RekapPerbaikanView */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Agenda */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Agenda Pemeliharaan</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total} Agenda</p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={12} /> Compliance: {stats.complianceRate}%
            </span>
          </div>
        </div>

        {/* Terjadwal */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Terjadwal (Pending)</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5 font-mono">{stats.scheduled} Agenda</p>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              <UserCheck size={12} className="text-amber-500" /> Siap dilaksanakan
            </span>
          </div>
        </div>

        {/* Sedang Berjalan */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <ListTodo size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Sedang Berjalan</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5 font-mono">{stats.inProgress} Agenda</p>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-purple-500" /> Dikerjakan petugas
            </span>
          </div>
        </div>

        {/* Agenda Selesai */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Agenda Selesai</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">{stats.done} Agenda</p>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
              {stats.completedTasksCount}/{stats.totalTasksCount} checklist selesai
            </span>
          </div>
        </div>
      </div>

      {/* Alert Warning Banner for Active Maintenance Schedules */}
      {(stats.scheduled > 0 || stats.inProgress > 0) && (
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-900">Perhatian Pemeliharaan:</span> Terdapat{' '}
              <strong className="underline text-amber-950 font-black">{stats.inProgress} agenda sedang berjalan</strong> dan{' '}
              <strong className="underline text-amber-950 font-black">{stats.scheduled} agenda terjadwal</strong>. Pastikan petugas menyelesaikan checklist kebersihan tepat waktu untuk menjaga skor kualitas sanitasi kampus.
            </div>
          </div>
          <button
            onClick={() => setSelectedStatus('Sedang Berjalan')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 transition-all shadow-xs text-xs cursor-pointer"
          >
            Tampilkan Agenda Aktif
          </button>
        </div>
      )}

      {/* Control Card: Filters & Search - Identical Layout & Spacing with RekapPerbaikanView */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Status Pill Filters */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Agenda:</span>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {['ALL', 'Terjadwal', 'Sedang Berjalan', 'Selesai'].map((st) => (
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

            {/* Filter Gedung */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Lokasi Gedung:</span>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Gedung</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    Gedung: {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Jenis Agenda */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Jenis Agenda:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Jenis Agenda</option>
                <option value="Pembersihan Rutin">Pembersihan Rutin</option>
                <option value="Inspeksi Berkala">Inspeksi Berkala</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Restock Perlengkapan">Restock Perlengkapan</option>
              </select>
            </div>

            {/* Filter Shift */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Shift Kerja:</span>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Shift</option>
                <option value="Pagi">Shift Pagi</option>
                <option value="Siang">Shift Siang</option>
                <option value="Malam">Shift Malam</option>
              </select>
            </div>
          </div>

          {/* View Switcher Button Group */}
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
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode bilik, nama bilik, nama petugas, jenis agenda pemeliharaan, atau checklist..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area (Table vs Grid View) */}
      {filteredSchedules.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <CalendarClock size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-extrabold text-slate-800">Tidak Ada Agenda Pemeliharaan Ditampilkan</h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md mx-auto">
            Coba sesuaikan filter atau kata kunci pencarian Anda untuk melihat agenda pemeliharaan sanitasi lainnya.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            <Plus size={14} />
            <span>Tambah Agenda Baru</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW MODE - Identical styling & clean non-wrapping pills */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  <th className="py-4 px-4 w-12 text-center">No.</th>
                  <th className="py-4 px-4">Bilik Toilet & Lokasi</th>
                  <th className="py-4 px-4">Petugas Kebersihan</th>
                  <th className="py-4 px-4">Shift & Slot Waktu</th>
                  <th className="py-4 px-4">Jenis Agenda</th>
                  <th className="py-4 px-4">Progress Checklist</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSchedules.map((schedule, index) => {
                  const completedTasks = schedule.checklist.filter((c) => c.done).length;
                  const totalTasks = schedule.checklist.length;
                  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                  return (
                    <tr key={schedule.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-4 px-4 text-center font-bold text-slate-400">{index + 1}</td>

                      {/* Bilik Toilet & Lokasi */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2.5">
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold font-mono bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0 whitespace-nowrap">
                            {schedule.toiletCode}
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-900 whitespace-nowrap">{schedule.toiletName}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{schedule.notes || 'Rutin harian'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Petugas Kebersihan */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center border border-blue-200 shrink-0">
                            {schedule.staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{schedule.staffName}</p>
                            <span className="text-[10px] text-slate-500 font-semibold block">Petugas Kebersihan</span>
                          </div>
                        </div>
                      </td>

                      {/* Shift & Slot Waktu */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                            <Clock size={14} className="text-amber-500 shrink-0" />
                            <span>{schedule.timeSlot}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold block">{schedule.shift}</span>
                        </div>
                      </td>

                      {/* Jenis Agenda - Clean Non-Wrapping Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/80 inline-block whitespace-nowrap">
                          {schedule.type}
                        </span>
                      </td>

                      {/* Progress Checklist & Interactive Tasks */}
                      <td className="py-4 px-4">
                        <div className="space-y-2 min-w-[220px]">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>{completedTasks}/{totalTasks} Tugas</span>
                            <span className="font-extrabold text-blue-600">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="space-y-1 pt-1">
                            {schedule.checklist.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleToggleTaskCheck(schedule.id, idx, item.task)}
                                className={`flex items-start gap-1.5 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors border ${
                                  item.done
                                    ? 'bg-emerald-50/40 border-emerald-100 text-slate-400 line-through'
                                    : 'bg-slate-50/80 border-slate-200/60 hover:bg-slate-100 text-slate-800'
                                }`}
                              >
                                {item.done ? (
                                  <CheckSquare size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                  <Square size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                )}
                                <span className="line-clamp-1">{item.task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <select
                          value={schedule.status}
                          onChange={(e) => handleQuickStatusChange(schedule.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border focus:outline-hidden cursor-pointer transition-all ${
                            schedule.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : schedule.status === 'Sedang Berjalan'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Terjadwal">Terjadwal</option>
                          <option value="Sedang Berjalan">Sedang Berjalan</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                      </td>

                      {/* Action & WhatsApp Dispatch Buttons - Standardized */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Dispatch Button */}
                          <a
                            href={getWhatsAppUrl(schedule)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Kirim Penugasan WA ke Petugas"
                          >
                            <Send size={15} />
                          </a>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(schedule)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Edit Agenda"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteModalItem(schedule)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Hapus Agenda"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW MODE - Identical Card Styling with RekapPerbaikanView */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => {
            const completedCount = schedule.checklist.filter((c) => c.done).length;
            const totalTasks = schedule.checklist.length;
            const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

            return (
              <div
                key={schedule.id}
                className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Toilet Code & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold font-mono bg-blue-50 text-blue-700 border border-blue-200/60">
                        {schedule.toiletCode}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{schedule.toiletName}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{schedule.type}</span>
                      </div>
                    </div>

                    <select
                      value={schedule.status}
                      onChange={(e) => handleQuickStatusChange(schedule.id, e.target.value as any)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border focus:outline-hidden cursor-pointer ${
                        schedule.status === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : schedule.status === 'Sedang Berjalan'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Sedang Berjalan">Sedang Berjalan</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  {/* Staff Info Box */}
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-blue-600 shrink-0" />
                      <span className="truncate">
                        Petugas: <strong className="text-slate-800">{schedule.staffName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-500 shrink-0" />
                      <span className="font-bold text-slate-800">{schedule.timeSlot}</span>
                    </div>
                  </div>

                  {/* Checklist & Progress */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <ListTodo size={14} className="text-blue-600" />
                        Checklist Pekerjaan ({completedCount}/{totalTasks})
                      </span>
                      <span className="font-extrabold text-blue-600">{progressPercent}%</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Interactive Tasks Checkbox Items */}
                    <div className="space-y-1.5 pt-1">
                      {schedule.checklist.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleTaskCheck(schedule.id, idx, item.task)}
                          className={`flex items-start gap-2 p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors border ${
                            item.done
                              ? 'bg-emerald-50/40 border-emerald-100 text-slate-500 line-through'
                              : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          {item.done ? (
                            <CheckSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square size={16} className="text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span>{item.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {schedule.notes && (
                    <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl text-[11px] text-amber-900 font-medium">
                      <strong>Catatan:</strong> {schedule.notes}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {schedule.completedAt ? `Selesai: ${schedule.completedAt}` : `Shift: ${schedule.shift}`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={getWhatsAppUrl(schedule)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all shadow-2xs"
                      title="Kirim Instruksi via WA"
                    >
                      <Send size={14} />
                    </a>
                    <button
                      onClick={() => handleOpenEditModal(schedule)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteModalItem(schedule)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Agenda Form - Identical styling with RekapPerbaikanView */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200/60">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingItem ? 'Edit Agenda Pemeliharaan' : 'Tambah Agenda Pemeliharaan'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Penugasan jadwal pembersihan, sanitasi kloset, dan inspeksi berkala
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 mt-4 text-xs font-semibold text-slate-700">
              {/* Target Bilik & Staff Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Target Bilik Toilet</label>
                  <select
                    value={formToiletId}
                    onChange={(e) => setFormToiletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    {toilets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.name} ({t.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Tugaskan Petugas</label>
                  <select
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role || 'Petugas Kebersihan'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional: Link Damage Report */}
              {damages && damages.length > 0 && (
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">
                    Link Tiket Rekap Kerusakan (Opsional)
                  </label>
                  <select
                    value={formLinkedDamage}
                    onChange={(e) => setFormLinkedDamage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Tidak Terikat Tiket Kerusakan --</option>
                    {damages.map((d) => (
                      <option key={d.id} value={d.ticketCode}>
                        {d.ticketCode} - {d.toiletCode} ({d.category}: {d.description.slice(0, 30)}...)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jenis Agenda, Shift, & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Jenis Agenda</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Pembersihan Rutin">Pembersihan Rutin</option>
                    <option value="Inspeksi Berkala">Inspeksi Berkala</option>
                    <option value="Deep Cleaning">Deep Cleaning</option>
                    <option value="Restock Perlengkapan">Restock Perlengkapan</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Shift Kerja</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Pagi (06:00 - 14:00)">Pagi (06:00 - 14:00)</option>
                    <option value="Siang (14:00 - 22:00)">Siang (14:00 - 22:00)</option>
                    <option value="Malam (22:00 - 06:00)">Malam (22:00 - 06:00)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Slot Waktu</label>
                  <input
                    type="text"
                    required
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    placeholder="08:00 - 08:30 WIB"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Checklist Items Textarea */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Item Checklist Pekerjaan (Satu item per baris)
                </label>
                <textarea
                  rows={4}
                  required
                  value={formTasks}
                  onChange={(e) => setFormTasks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-sans"
                />
              </div>

              {/* Notes Input */}
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Pastikan amonia diperiksa setelah pembersihan kloset"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Jadwalkan Pemeliharaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Identical with RekapPerbaikanView */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200/60 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hapus Agenda Pemeliharaan?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Apakah Anda yakin ingin menghapus agenda pemeliharaan untuk bilik{' '}
                <strong className="text-slate-800">[{deleteModalItem.toiletCode}]</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20"
              >
                Hapus Agenda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
