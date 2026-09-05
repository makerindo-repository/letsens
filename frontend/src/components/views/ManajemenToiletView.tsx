import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  Plus,
  QrCode,
  Edit3,
  Trash2,
  CheckCircle2,
  MapPin,
  Sparkles,
  Search,
  RefreshCw,
  Building2,
  User,
  LayoutGrid,
  Table,
  Layers,
  AlertTriangle,
  Wrench,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToiletBilik, GenderType, FasilitasItem } from '../../types';

interface ManajemenToiletViewProps {
  toilets: ToiletBilik[];
  fasilitasList?: FasilitasItem[];
  onAddToilet?: (toilet: ToiletBilik) => void;
  onUpdateToilet?: (toilet: ToiletBilik) => void;
  onDeleteToilet?: (id: string) => void;
}

export const ManajemenToiletView: React.FC<ManajemenToiletViewProps> = ({
  toilets: initialPropToilets = [],
  fasilitasList = [],
  onAddToilet,
  onUpdateToilet,
  onDeleteToilet,
}) => {
  const [items, setItems] = useState<ToiletBilik[]>(initialPropToilets);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingToilet, setEditingToilet] = useState<ToiletBilik | null>(null);
  const [deleteModalToilet, setDeleteModalToilet] = useState<ToiletBilik | null>(null);
  const [qrModalToilet, setQrModalToilet] = useState<ToiletBilik | null>(null);

  // Form inputs
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formBuilding, setFormBuilding] = useState<string>('Gedung A (Rektorat & Pascasarjana)');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formGender, setFormGender] = useState<GenderType>('Wanita');
  const [formStatus, setFormStatus] = useState<'Online' | 'Offline' | 'Maintenance'>('Online');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const [liveFasilitas, setLiveFasilitas] = useState<FasilitasItem[]>(fasilitasList);

  useEffect(() => {
    if (fasilitasList && fasilitasList.length > 0) {
      setLiveFasilitas(fasilitasList);
    }
  }, [fasilitasList]);

  // Available facilities master list dynamically derived 100% from backend API
  const availableFacilityOptions = React.useMemo(() => {
    const sourceList = liveFasilitas.length > 0 ? liveFasilitas : fasilitasList;
    const names = sourceList.map((f) => f.namaFasilitas || f.utilitasName).filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [fasilitasList, liveFasilitas]);

  // Unique buildings list dynamically derived
  const buildingsList = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((t) => { if (t.building) set.add(t.building); });
    return Array.from(set);
  }, [items]);

  // Sync state with props
  useEffect(() => {
    if (initialPropToilets && initialPropToilets.length > 0) {
      setItems(initialPropToilets);
    }
  }, [initialPropToilets]);

  // Fetch API function
  const fetchToilets = async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/toilets');
      let isJson = res.ok && (res.headers.get('content-type') || '').includes('application/json');

      if (!isJson) {
        try {
          const directRes = await fetch('http://127.0.0.1:8000/api/toilets');
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

      // Fetch live fasilitas list
      try {
        let fasRes = await fetch('/api/fasilitas');
        if (fasRes.ok && (fasRes.headers.get('content-type') || '').includes('application/json')) {
          const fasJson = await fasRes.json();
          if (fasJson.data && Array.isArray(fasJson.data)) {
            const mapped = fasJson.data.map((raw: any, idx: number) => ({
              id: String(raw.id || idx + 1),
              namaFasilitas: raw.nama_fasilitas || raw.namaFasilitas,
              utilitasName: raw.nama_fasilitas || raw.namaFasilitas,
              toiletCode: raw.toilet_code,
              kategori: raw.kategori,
            }));
            setLiveFasilitas(mapped);
          }
        }
      } catch (_) {}
    } catch (err) {
      console.warn('API error fetching toilets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingToilet(null);
    setFormCode(`T-A${Math.floor(Math.random() * 8 + 1)}-${Math.random() > 0.5 ? 'M' : 'F'}`);
    setFormName('');
    setFormBuilding('Gedung A');
    setFormFloor(1);
    setFormGender('Wanita');
    setFormStatus('Online');
    setSelectedFacilities([]);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (toilet: ToiletBilik) => {
    setEditingToilet(toilet);
    setFormCode(toilet.code);
    setFormName(toilet.name);
    setFormBuilding(toilet.building);
    setFormFloor(toilet.floor || 1);
    setFormGender(toilet.gender || 'Wanita');
    setFormStatus(toilet.status || 'Online');

    const sourceFasilitas = liveFasilitas.length > 0 ? liveFasilitas : fasilitasList;
    const realFromProps = sourceFasilitas
      .filter((f) => f.toiletCode === toilet.code)
      .map((f) => f.namaFasilitas || f.utilitasName)
      .filter(Boolean) as string[];
    const backendFacilities = (Array.isArray(toilet.facilities) ? toilet.facilities : []).filter((f) =>
      availableFacilityOptions.includes(f)
    );
    const initialFacilities = Array.from(new Set([...realFromProps, ...backendFacilities]));
    setSelectedFacilities(initialFacilities);
    setIsFormModalOpen(true);
  };

  // Connected facilities derived readonly based on formCode
  const connectedFacilities = React.useMemo(() => {
    const sourceList = liveFasilitas.length > 0 ? liveFasilitas : fasilitasList;
    const names = sourceList
      .filter((f) => f.toiletCode === formCode)
      .map((f) => f.namaFasilitas || f.utilitasName)
      .filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [liveFasilitas, fasilitasList, formCode]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormModalOpen(false);

    const payload = {
      code: formCode,
      name: formName,
      building: formBuilding,
      floor: Number(formFloor),
      gender: formGender,
      status: formStatus,
    };

    if (editingToilet) {
      const updatedObj: ToiletBilik = {
        ...editingToilet,
        code: formCode,
        name: formName,
        building: formBuilding,
        floor: Number(formFloor),
        gender: formGender,
        status: formStatus,
      };

      setItems((prev) =>
        prev.map((t) => (t.id === editingToilet.id || t.code === editingToilet.code ? updatedObj : t))
      );

      try {
        let res = await fetch(`/api/toilets/${editingToilet.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch(`/api/toilets/${editingToilet.code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error updating toilet:', err);
      }

      if (onUpdateToilet) {
        onUpdateToilet(updatedObj);
      }
    } else {
      const newObj: ToiletBilik = {
        id: String(Date.now()),
        code: formCode,
        name: formName,
        building: formBuilding,
        floor: Number(formFloor),
        gender: formGender,
        occupied: false,
        occupancyDurationMinutes: 0,
        doorStatus: 'Terbuka',
        amoniaPPM: 5.0,
        temperatureC: 30.0,
        humidityPercent: 60,
        lux: 350,
        soapLevelPercent: 90,
        tissueLevelPercent: 85,
        waterFlowLpm: 0.0,
        batteryPercent: 100,
        iotDeviceId: 'N/A',
        ipAddress: '127.0.0.1',
        macAddress: '00:00:00:00:00:00',
        lastTelemetryTime: 'Baru saja',
        facilities: [],
        status: formStatus,
      };

      setItems((prev) => [newObj, ...prev]);

      try {
        let res = await fetch('/api/toilets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch('http://127.0.0.1:8000/api/toilets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error creating toilet:', err);
      }

      if (onAddToilet) {
        onAddToilet(newObj);
      }
    }

    setTimeout(() => {
      fetchToilets();
    }, 400);
  };

  const confirmDelete = async () => {
    if (!deleteModalToilet) return;
    const targetId = deleteModalToilet.id;
    setDeleteModalToilet(null);

    setItems((prev) => prev.filter((t) => t.id !== targetId));

    try {
      let res = await fetch(`/api/toilets/${targetId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetch(`http://127.0.0.1:8000/api/toilets/${targetId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn('API error deleting toilet:', err);
    }

    if (onDeleteToilet) {
      onDeleteToilet(targetId);
    }
  };

  // Filter items
  const filteredToilets = items.filter((t) => {
    const codeMatch = t.code.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const bldgMatch = t.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = searchTerm.trim() === '' || codeMatch || nameMatch || bldgMatch;

    const matchesBuilding = selectedBuilding === 'ALL' || t.building.includes(selectedBuilding);
    const matchesGender = selectedGender === 'ALL' || t.gender === selectedGender;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;

    return matchesSearch && matchesBuilding && matchesGender && matchesStatus;
  });

  // KPI Calculations
  const totalCount = items.length;
  const wanitaCount = items.filter((t) => t.gender === 'Wanita').length;
  const priaCount = items.filter((t) => t.gender === 'Pria').length;
  const disabilitasCount = items.filter((t) => t.gender === 'Disabilitas' || t.gender === 'Unisex').length;

  // Print Official Professional QR Code Door Sticker Layout
  const handlePrintQrSticker = (toilet: ToiletBilik) => {
    const targetUrl = `http://localhost:3000/bilik-toilet?code=${encodeURIComponent(toilet.code)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;

    const printWindow = window.open('', '_blank', 'width=650,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Stiker Resmi QR Code Sanitasi - ${toilet.code}</title>
        <style>
          @page {
            size: A6 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .sticker-card {
            width: 380px;
            border: 3px solid #1e3a8a;
            border-radius: 24px;
            padding: 24px;
            background: #ffffff;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.08);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          .sticker-card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 8px;
            background: linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa);
          }
          .institution-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #1e40af;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .system-title {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }
          .scan-pill {
            display: inline-block;
            background: #2563eb;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            padding: 4px 14px;
            border-radius: 999px;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 12px;
            box-shadow: 0 2px 6px rgba(37,99,235,0.3);
          }
          .qr-wrapper {
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 20px;
            padding: 14px;
            display: inline-block;
            margin: 0 auto 12px auto;
          }
          .qr-image {
            width: 180px;
            height: 180px;
            display: block;
            margin: 0 auto;
          }
          .code-badge {
            display: inline-block;
            background: #eff6ff;
            border: 2px solid #93c5fd;
            color: #1d4ed8;
            font-family: monospace;
            font-size: 18px;
            font-weight: 900;
            padding: 5px 20px;
            border-radius: 999px;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          .location-name {
            font-size: 14px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 3px;
          }
          .building-info {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .features-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 10px;
            margin-bottom: 12px;
            text-align: left;
          }
          .feature-item {
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 3px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .feature-item:last-child {
            margin-bottom: 0;
          }
          .footer-badge {
            background: #0f172a;
            color: #ffffff;
            padding: 9px 12px;
            border-radius: 12px;
            font-size: 9.5px;
            font-weight: 700;
            line-height: 1.4;
          }
          .footer-badge span {
            color: #38bdf8;
          }
        </style>
      </head>
      <body>
        <div class="sticker-card">
          <div class="institution-title">UNIVERSITAS KOMPUTER INDONESIA</div>
          <div class="system-title">STIKER RESMI PINTU MASUK BILIK SANITASI</div>

          <div class="scan-pill">PINDAI QR SEBELUM MASUK BILIK</div>

          <div class="qr-wrapper">
            <img src="${qrUrl}" class="qr-image" alt="QR Code ${toilet.code}" />
          </div>

          <div class="code-badge">${toilet.code}</div>
          <div class="location-name">${toilet.name}</div>
          <div class="building-info">${toilet.building} • Lantai ${toilet.floor || 1} (${toilet.gender})</div>

          <div class="features-box">
            <div class="feature-item">✔ Cek Status Keterisian Bilik & Sensor Pintu</div>
            <div class="feature-item">✔ Monitoring Kualitas Udara Amonia (PPM) Real-Time</div>
            <div class="feature-item">✔ Laporkan Keluhan Kebersihan & Kerusakan Instan</div>
          </div>

          <div class="footer-badge">
            <span>Panduan Pintu Masuk:</span> Arahkan kamera HP ke QR Code untuk mengecek kenyamanan & status bilik sebelum digunakan.
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Header Bar - Consistent with Fasilitas & Tentang Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <DoorOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Bilik Toilet
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Pemantauan & Pengelolaan Bilik Sanitasi Kampus Smart Building Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchToilets}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data API"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Bilik Toilet</span>
          </button>
        </div>
      </div>

      {/* 4 Premium KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <DoorOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Bilik Toilet</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{totalCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <User size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Bilik Wanita</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5 font-mono">{wanitaCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
            <User size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Bilik Pria</p>
            <p className="text-2xl font-black text-sky-700 mt-0.5 font-mono">{priaCount}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Disabilitas / Unisex</p>
            <p className="text-2xl font-black text-purple-700 mt-0.5 font-mono">{disabilitasCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Lokasi Gedung:</span>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400"
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
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Gender:</span>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400"
              >
                <option value="ALL">Semua Gender</option>
                <option value="Wanita">Wanita</option>
                <option value="Pria">Pria</option>
                <option value="Disabilitas">Disabilitas / Unisex</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Operasional:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400"
              >
                <option value="ALL">Semua Status</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Maintenance">Maintenance</option>
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
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode bilik (contoh: T-A1-M), nama bilik, atau gedung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area - Table or Grid View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap">Kode Bilik</th>
                  <th className="py-4 px-4 min-w-[200px] whitespace-nowrap">Nama & Lokasi Bilik</th>
                  <th className="py-4 px-4 whitespace-nowrap">Gedung & Lantai</th>
                  <th className="py-4 px-4 whitespace-nowrap">Kategori Gender</th>
                  <th className="py-4 px-4 min-w-[240px] whitespace-nowrap">Fasilitas Sanitasi</th>
                  <th className="py-4 px-4 whitespace-nowrap">Status Operasional</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredToilets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs">
                      Tidak ada data bilik toilet yang cocok dengan filter search.
                    </td>
                  </tr>
                ) : (
                  filteredToilets.map((toilet) => {
                    const sourceFasilitas = liveFasilitas.length > 0 ? liveFasilitas : fasilitasList;
                    const realFasilitasNames = sourceFasilitas
                      .filter((f) => f.toiletCode === toilet.code)
                      .map((f) => f.namaFasilitas || f.utilitasName)
                      .filter(Boolean) as string[];
                    const baseFacilities = (Array.isArray(toilet.facilities) ? toilet.facilities : []).filter((f) =>
                      availableFacilityOptions.includes(f)
                    );
                    const facilitiesList = Array.from(new Set([...realFasilitasNames, ...baseFacilities]));
                    return (
                      <tr key={toilet.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap inline-block shadow-2xs">
                            {toilet.code}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {toilet.name}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span>{toilet.building}, Lt {toilet.floor || 1}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap shadow-2xs ${
                              toilet.gender === 'Wanita'
                                ? 'bg-pink-50 text-pink-700 border-pink-200/80'
                                : toilet.gender === 'Pria'
                                ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                : 'bg-purple-50 text-purple-700 border-purple-200/80'
                            }`}
                          >
                            {toilet.gender}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {facilitiesList.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">Tanpa Fasilitas</span>
                            ) : (
                              facilitiesList.map((f, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100/90 text-slate-700 rounded-lg border border-slate-200/60 whitespace-nowrap shadow-2xs"
                                >
                                  {f}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap shadow-2xs ${
                              toilet.status === 'Online'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : toilet.status === 'Maintenance'
                                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                : 'bg-rose-50 text-rose-700 border-rose-200/80'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              toilet.status === 'Online' ? 'bg-emerald-500 animate-pulse' : toilet.status === 'Maintenance' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span>{toilet.status || 'Online'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setQrModalToilet(toilet)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Lihat Label QR Code"
                            >
                              <QrCode size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(toilet)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Edit Bilik Toilet"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteModalToilet(toilet)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Hapus Bilik Toilet"
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
          {filteredToilets.map((toilet) => {
            const sourceFasilitas = liveFasilitas.length > 0 ? liveFasilitas : fasilitasList;
            const realFasilitasNames = sourceFasilitas
              .filter((f) => f.toiletCode === toilet.code)
              .map((f) => f.namaFasilitas || f.utilitasName)
              .filter(Boolean) as string[];
            const baseFacilities = (Array.isArray(toilet.facilities) ? toilet.facilities : []).filter((f) =>
              availableFacilityOptions.includes(f)
            );
            const facilitiesList = Array.from(new Set([...realFasilitasNames, ...baseFacilities]));
            return (
              <div
                key={toilet.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 text-blue-600">
                        <DoorOpen size={22} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{toilet.name}</h3>
                        <span className="text-[11px] font-mono font-extrabold text-blue-600">{toilet.code}</span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                        toilet.gender === 'Wanita'
                          ? 'bg-pink-50 text-pink-700 border-pink-200/80'
                          : toilet.gender === 'Pria'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : 'bg-purple-50 text-purple-700 border-purple-200/80'
                      }`}
                    >
                      {toilet.gender}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Gedung:</span>
                      <span className="font-bold text-slate-800">{toilet.building}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Lantai:</span>
                      <span className="font-extrabold text-slate-900 font-mono">Lt {toilet.floor || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Status Operasional:</span>
                      <span
                        className={`font-extrabold ${
                          toilet.status === 'Online'
                            ? 'text-emerald-600'
                            : toilet.status === 'Maintenance'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {toilet.status || 'Online'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Fasilitas Sanitasi:</span>
                    <div className="flex flex-wrap gap-1">
                      {facilitiesList.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-lg border border-slate-200/60"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-bold text-slate-400">Universitas Komputer Indonesia Smart Toilet Stalls</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQrModalToilet(toilet)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Lihat Label QR Code"
                    >
                      <QrCode size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(toilet)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Bilik Toilet"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModalToilet(toilet)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus Bilik Toilet"
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

      {/* Modal Input & Edit Bilik Toilet */}
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
                    <DoorOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {editingToilet ? 'Edit Data Bilik Toilet' : 'Tambah Bilik Toilet Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Integrasi Backend REST API LetSens Universitas Komputer Indonesia
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kode Bilik Toilet (Unik)</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="Contoh: T-A1-M"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-extrabold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kategori Gender</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as GenderType)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    >
                      <option value="Wanita">Wanita</option>
                      <option value="Pria">Pria</option>
                      <option value="Disabilitas">Disabilitas / Unisex</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Deskriptif Bilik</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Gedung A, Lt 1, Pria"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Lokasi Gedung</label>
                    <select
                      value={formBuilding}
                      onChange={(e) => setFormBuilding(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    >
                      <option value="Gedung A (Rektorat & Pascasarjana)">Gedung A (Rektorat & Pascasarjana)</option>
                      <option value="Gedung B (FTIK)">Gedung B (FTIK)</option>
                      <option value="Gedung C (Fakultas Desain)">Gedung C (Fakultas Desain)</option>
                      <option value="Smart Building Universitas Komputer Indonesia">Smart Building Universitas Komputer Indonesia</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Lantai</label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={formFloor}
                      onChange={(e) => setFormFloor(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Operasional</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  >
                    <option value="Online">Online (Aktif)</option>
                    <option value="Maintenance">Maintenance (Dalam Perbaikan)</option>
                    <option value="Offline">Offline (Non-Aktif)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Fasilitas Sanitasi Terhubung (Otomatis dari Master Fasilitas)
                  </label>

                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[46px] items-center">
                    {connectedFacilities.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">
                        Belum ada fasilitas terhubung untuk kode bilik {formCode}. Kelola melalui menu Fasilitas.
                      </span>
                    ) : (
                      connectedFacilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold shadow-2xs"
                        >
                          {fac}
                        </span>
                      ))
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    *Fasilitas dikelola secara otomatis via menu <strong>Fasilitas</strong> berdasarkan Kode Bilik ({formCode}).
                  </p>
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
                    {editingToilet ? 'Simpan Perubahan' : 'Tambah Bilik Toilet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Professional Modal Konfirmasi Hapus Data Bilik */}
      <AnimatePresence>
        {deleteModalToilet && (
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
                  Hapus Bilik Toilet?
                </h3>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  Tindakan ini tidak dapat dibatalkan. Data bilik <span className="font-bold text-slate-800">"{deleteModalToilet.code}"</span> ({deleteModalToilet.name}) akan dihapus permanen.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs font-medium space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Gedung & Lokasi:</span>
                  <span className="font-bold text-slate-800">{deleteModalToilet.building} (Lt {deleteModalToilet.floor})</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kategori Gender:</span>
                  <span className="font-bold text-slate-800">{deleteModalToilet.gender}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalToilet(null)}
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
                  Hapus Bilik
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Dynamic Integrated QR Code Label Pintu Bilik */}
      <AnimatePresence>
        {qrModalToilet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/90 text-center space-y-4 select-none relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-left">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Stiker Pintu Masuk Bilik</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">Universitas Komputer Indonesia</p>
                  </div>
                </div>

                <button
                  onClick={() => setQrModalToilet(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="inline-block px-3 py-1 bg-blue-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                Pindai QR Sebelum Masuk Bilik
              </div>

              <div className="my-1 p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 border-2 border-dashed border-blue-200 rounded-2xl inline-block mx-auto shadow-2xs">
                <div className="w-44 h-44 bg-white p-2 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center relative shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`http://localhost:3000/bilik-toilet?code=${qrModalToilet.code}`)}`}
                    alt={`QR Code ${qrModalToilet.code}`}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-mono font-black text-sm rounded-full shadow-2xs">
                  {qrModalToilet.code}
                </div>
                <div className="text-xs font-extrabold text-slate-900 pt-1">{qrModalToilet.name}</div>
                <div className="text-[11px] font-semibold text-slate-500">{qrModalToilet.building} (Lt {qrModalToilet.floor || 1})</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[10px] text-slate-600 font-semibold space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <CheckCircle2 size={13} />
                  <span>Cek Status Pintu & Keterisian Bilik</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <CheckCircle2 size={13} />
                  <span>Kualitas Udara Amonia (PPM) & Suhu</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <CheckCircle2 size={13} />
                  <span>Laporkan Kerusakan & Kebersihan</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handlePrintQrSticker(qrModalToilet)}
                  className="flex-1 py-2.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <QrCode size={14} />
                  <span>Cetak Stiker Pintu</span>
                </button>
                <button
                  onClick={() => setQrModalToilet(null)}
                  className="px-4 py-2.5 font-bold text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
