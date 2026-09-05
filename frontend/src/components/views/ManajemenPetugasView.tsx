import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  MessageCircle,
  Clock,
  Building,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  Table,
  LayoutGrid,
  ShieldCheck,
  UserCheck,
  Wrench,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PetugasKebersihan } from '../../types';

interface ManajemenPetugasViewProps {
  staffList: PetugasKebersihan[];
  onAddStaff: (staff: PetugasKebersihan) => void;
  onUpdateStaff: (staff: PetugasKebersihan) => void;
  onDeleteStaff: (id: string) => void;
  onQuickCallStaff: (staffName: string, phone: string, toiletCode: string) => void;
}

export const ManajemenPetugasView: React.FC<ManajemenPetugasViewProps> = ({
  staffList: initialPropStaff = [],
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onQuickCallStaff,
}) => {
  const [items, setItems] = useState<PetugasKebersihan[]>(initialPropStaff);
  const [loading, setLoading] = useState<boolean>(false);

  // Dynamic lists derived from staff API items
  const buildingsList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => { if (s.assignedBuilding) set.add(s.assignedBuilding); });
    return Array.from(set);
  }, [items]);

  const rolesList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((s) => { if (s.role) set.add(s.role); });
    return Array.from(set);
  }, [items]);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<PetugasKebersihan | null>(null);
  const [deleteModalStaff, setDeleteModalStaff] = useState<PetugasKebersihan | null>(null);

  // Form inputs
  const [formName, setFormName] = useState<string>('');
  const [formNip, setFormNip] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('Petugas Kebersihan');
  const [formShift, setFormShift] = useState<string>('Pagi (06:00 - 14:00)');
  const [formBuilding, setFormBuilding] = useState<string>('Gedung A');
  const [formStatus, setFormStatus] = useState<string>('Bertugas');

  // Sync props to state
  useEffect(() => {
    if (initialPropStaff && initialPropStaff.length > 0) {
      setItems(initialPropStaff);
    }
  }, [initialPropStaff]);

  // Fetch API REST
  const fetchStaff = async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/staff');
      let isJson = res.ok && (res.headers.get('content-type') || '').includes('application/json');

      if (!isJson) {
        try {
          const directRes = await fetch('http://127.0.0.1:8000/api/staff');
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
      console.warn('API error fetching staff users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormNip(`USR-UNIKOM-${Date.now().toString().slice(-4)}`);
    setFormPhone('0812-3456-7890');
    setFormEmail('');
    setFormRole('Petugas Kebersihan');
    setFormShift('Pagi (06:00 - 14:00)');
    setFormBuilding('Gedung A');
    setFormStatus('Bertugas');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (staff: PetugasKebersihan) => {
    const defaultMail = `${(staff.nip || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@letsens.unikom.ac.id`;
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormNip(staff.nip);
    setFormPhone(staff.phone);
    setFormEmail(staff.email || defaultMail);
    setFormRole(staff.role || 'Petugas Kebersihan');
    setFormShift(staff.shift);
    setFormBuilding(staff.assignedBuilding);
    setFormStatus(staff.status);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormModalOpen(false);

    const initials = formName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const payload = {
      nip: formNip,
      name: formName,
      phone: formPhone,
      email: formEmail,
      role: formRole,
      shift: formShift,
      assigned_building: formBuilding,
      status: formStatus,
    };

    if (editingStaff) {
      const updatedObj: PetugasKebersihan = {
        ...editingStaff,
        name: formName,
        nip: formNip,
        phone: formPhone,
        email: formEmail,
        role: formRole,
        shift: formShift as any,
        assignedBuilding: formBuilding,
        status: formStatus as any,
        avatar: initials || 'US',
      };

      setItems((prev) => prev.map((s) => (s.id === editingStaff.id || s.nip === editingStaff.nip ? updatedObj : s)));

      try {
        let res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch(`/api/staff/${editingStaff.nip}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error updating staff:', err);
      }

      if (onUpdateStaff) {
        onUpdateStaff(updatedObj);
      }
    } else {
      const newObj: PetugasKebersihan = {
        id: `st-${Date.now()}`,
        name: formName,
        nip: formNip,
        phone: formPhone,
        email: formEmail,
        role: formRole,
        shift: formShift as any,
        assignedBuilding: formBuilding,
        status: formStatus as any,
        rating: 4.9,
        completedTasksToday: 0,
        avatar: initials || 'US',
        lastActive: 'Baru saja',
      };

      setItems((prev) => [newObj, ...prev]);

      try {
        let res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch('http://127.0.0.1:8000/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error creating staff:', err);
      }

      if (onAddStaff) {
        onAddStaff(newObj);
      }
    }

    setTimeout(() => {
      fetchStaff();
    }, 400);
  };

  const confirmDelete = async () => {
    if (!deleteModalStaff) return;
    const targetId = deleteModalStaff.id;
    const targetNip = deleteModalStaff.nip;
    setDeleteModalStaff(null);

    setItems((prev) => prev.filter((s) => s.id !== targetId && s.nip !== targetNip));

    try {
      let res = await fetch(`/api/staff/${targetId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetch(`/api/staff/${targetNip}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn('API error deleting staff:', err);
    }

    if (onDeleteStaff) {
      onDeleteStaff(targetId);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return items.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.assignedBuilding.toLowerCase().includes(searchTerm.toLowerCase());

      const userRole = s.role || 'Petugas Kebersihan';
      const matchRole = selectedRole === 'ALL' || userRole.includes(selectedRole);
      const matchBuilding = selectedBuilding === 'ALL' || s.assignedBuilding.includes(selectedBuilding);
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchSearch && matchRole && matchBuilding && matchStatus;
    });
  }, [items, searchTerm, selectedRole, selectedBuilding, selectedStatus]);

  // Aggregate KPI
  const stats = useMemo(() => {
    const total = items.length;
    const bertugas = items.filter((s) => s.status === 'Bertugas').length;
    const sanitation = items.filter((s) => (s.role || 'Petugas Kebersihan').includes('Kebersihan')).length;
    const techAdmin = items.filter((s) => (s.role || '').includes('Teknisi') || (s.role || '').includes('Admin') || (s.role || '').includes('Supervisor')).length;
    return { total, bertugas, sanitation, techAdmin };
  }, [items]);

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Header Bar - Consistent with Fasilitas, Bilik Toilet & Perangkat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Pengguna</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Pusat Pengelolaan Pengguna & Hak Akses Multi-Role Smart Building Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStaff}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data API Pengguna"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* 4 Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Pengguna</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Status Bertugas</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">{stats.bertugas}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
            <User size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Petugas Kebersihan</p>
            <p className="text-2xl font-black text-sky-700 mt-0.5 font-mono">{stats.sanitation}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Admin & Teknisi</p>
            <p className="text-2xl font-black text-purple-700 mt-0.5 font-mono">{stats.techAdmin}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Peran (Role):</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Peran</option>
                {rolesList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Lokasi Gedung:</span>
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
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Kehadiran:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Bertugas">Bertugas</option>
                <option value="Siaga">Siaga</option>
                <option value="Istirahat">Istirahat</option>
                <option value="Izin">Izin</option>
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
            placeholder="Cari NIP/ID pengguna, nama lengkap, atau nomor WhatsApp..."
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
                  <th className="py-4 px-4 whitespace-nowrap">ID / NIP PENGGUNA</th>
                  <th className="py-4 px-4 min-w-[180px] whitespace-nowrap">NAMA PENGGUNA</th>
                  <th className="py-4 px-4 whitespace-nowrap">EMAIL PENGGUNA</th>
                  <th className="py-4 px-4 whitespace-nowrap">PERAN (ROLE)</th>
                  <th className="py-4 px-4 whitespace-nowrap">LOKASI & SHIFT</th>
                  <th className="py-4 px-4 whitespace-nowrap">STATUS KEHADIRAN</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs">
                      Tidak ada data pengguna yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const roleName = staff.role || 'Petugas Kebersihan';
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* NIP / ID */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap inline-block shadow-2xs">
                            {staff.nip}
                          </span>
                        </td>

                        {/* NAMA PENGGUNA */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            {staff.avatar && (staff.avatar.startsWith('http://') || staff.avatar.startsWith('https://')) ? (
                              <img src={staff.avatar} alt={staff.name} className="w-8 h-8 rounded-xl object-cover border border-blue-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                                {staff.avatar && staff.avatar.length <= 4 ? staff.avatar : (staff.name ? staff.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'US')}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{staff.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone size={11} className="text-slate-400" />
                                <span>{staff.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* EMAIL PENGGUNA */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <span>{staff.email || `${(staff.nip || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@letsens.unikom.ac.id`}</span>
                          </div>
                        </td>

                        {/* PERAN (ROLE) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap shadow-2xs ${
                              roleName.includes('Admin')
                                ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                                : roleName.includes('Teknisi')
                                ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                                : roleName.includes('Supervisor')
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            }`}
                          >
                            {roleName}
                          </span>
                        </td>

                        {/* LOKASI & SHIFT */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col text-slate-700">
                            <span className="font-bold">{staff.assignedBuilding}</span>
                            <span className="text-[11px] text-slate-400">{staff.shift}</span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap shadow-2xs ${
                              staff.status === 'Bertugas'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : staff.status === 'Siaga'
                                ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                : staff.status === 'Istirahat'
                                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                staff.status === 'Bertugas'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : staff.status === 'Siaga'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            <span>{staff.status}</span>
                          </span>
                        </td>

                        {/* AKSI */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onQuickCallStaff(staff.name, staff.phone, 'Gedung A')}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Panggil WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(staff)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Edit Pengguna"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModalStaff(staff)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Hapus Pengguna"
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
          {filteredStaff.map((staff) => {
            const roleName = staff.role || 'Petugas Kebersihan';
            return (
              <div
                key={staff.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {staff.avatar && (staff.avatar.startsWith('http://') || staff.avatar.startsWith('https://')) ? (
                        <img src={staff.avatar} alt={staff.name} className="w-11 h-11 rounded-2xl object-cover border border-blue-200 shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-sm flex items-center justify-center border border-blue-200 shrink-0">
                          {staff.avatar && staff.avatar.length <= 4 ? staff.avatar : (staff.name ? staff.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'US')}
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{staff.name}</h3>
                        <span className="text-[11px] font-mono font-extrabold text-blue-600">{staff.nip}</span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                        staff.status === 'Bertugas'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-amber-50 text-amber-800 border-amber-200/80'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Peran (Role):</span>
                      <span className="font-bold text-slate-800">{roleName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Gedung Tugas:</span>
                      <span className="font-bold text-slate-800">{staff.assignedBuilding}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">WhatsApp:</span>
                      <span className="font-mono text-slate-700">{staff.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Email:</span>
                      <span className="font-mono text-slate-700 text-[11px]">{staff.email || `${(staff.nip || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@letsens.unikom.ac.id`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-bold text-slate-400">UNIKOM Sanitation Team</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickCallStaff(staff.name, staff.phone, 'Gedung A')}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Panggil WhatsApp"
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(staff)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Pengguna"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModalStaff(staff)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus Pengguna"
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

      {/* Modal Input & Edit Pengguna */}
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
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {editingStaff ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Pusat Manajemen Pengguna & Multi-Role LetSens
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
                  <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Pengguna</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="Contoh: ahmad.fauzi@letsens.unikom.ac.id"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">NIP / ID Pengguna</label>
                    <input
                      type="text"
                      value={formNip}
                      onChange={(e) => setFormNip(e.target.value)}
                      placeholder="Contoh: USR-UNIKOM-2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-extrabold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Peran (Role)</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Petugas Kebersihan">Petugas Kebersihan</option>
                      <option value="Teknisi IoT">Teknisi IoT & Maintenance</option>
                      <option value="Supervisor / Manajer">Supervisor / Manajer Kampus</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Gedung Penugasan</label>
                    <select
                      value={formBuilding}
                      onChange={(e) => setFormBuilding(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Gedung A">Gedung A</option>
                      <option value="Gedung B">Gedung B</option>
                      <option value="Gedung C">Gedung C</option>
                      <option value="Smart Building">Smart Building UNIKOM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shift Kerja</label>
                    <select
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Pagi (06:00 - 14:00)">Pagi (06:00 - 14:00)</option>
                      <option value="Siang (14:00 - 22:00)">Siang (14:00 - 22:00)</option>
                      <option value="Malam (22:00 - 06:00)">Malam (22:00 - 06:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Status Kehadiran</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Bertugas">Bertugas (Aktif)</option>
                      <option value="Siaga">Siaga (Standby)</option>
                      <option value="Istirahat">Istirahat</option>
                      <option value="Izin">Izin / Cuti</option>
                    </select>
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
                    {editingStaff ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hapus Pengguna */}
      <AnimatePresence>
        {deleteModalStaff && (
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
                <h3 className="font-extrabold text-slate-900 text-lg">Hapus Pengguna?</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  Tindakan ini tidak dapat dibatalkan. Pengguna{' '}
                  <span className="font-bold text-slate-800">"{deleteModalStaff.name}"</span> ({deleteModalStaff.nip}) akan dihapus dari sistem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalStaff(null)}
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
                  Hapus Pengguna
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
