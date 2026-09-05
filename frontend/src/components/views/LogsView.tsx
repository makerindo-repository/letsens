import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Activity,
  RefreshCw,
  X,
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { activityLogApi, ActivityLogItem } from '../../api/activityLogApi';
import { SystemLogEntry } from '../../types';

interface LogsViewProps {
  logs?: SystemLogEntry[];
  onClearLogs?: () => void;
}

const AUTH_MODULES = ['auth', 'login', 'logout', 'session', 'sesi', 'pengguna', 'petugas'];
const DEVICE_MODULES = ['node', 'device', 'perangkat', 'sensor', 'iot', 'telemetri', 'telemetry'];

function classifyLogCategory(log: ActivityLogItem): 'auth' | 'device' | 'system' {
  const mod = (log.module || '').toLowerCase();
  const act = (log.action || '').toLowerCase();

  if (AUTH_MODULES.some((k) => mod.includes(k) || act.includes(k))) return 'auth';
  if (DEVICE_MODULES.some((k) => mod.includes(k) || act.includes(k))) return 'device';
  return 'system';
}

export const LogsView: React.FC<LogsViewProps> = ({ logs: fallbackLogs = [], onClearLogs }) => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [activeTab, setActiveTab] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch backend activity logs with 8s polling
  const fetchBackendLogs = async () => {
    setIsLoading(true);
    try {
      const res = await activityLogApi.getAll({ limit: 500 });
      if (res.data && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      console.warn('Backend activity logs unavailable, using fallback');
      if (logs.length === 0 && fallbackLogs.length > 0) {
        const mapped: ActivityLogItem[] = fallbackLogs.map((l, idx) => ({
          id: String(l.id || idx),
          timestamp: l.timestamp,
          user: 'Super Admin',
          action: l.message,
          module: l.module,
          status: l.level === 'ERROR' ? 'error' : l.level === 'WARNING' ? 'warning' : 'success',
          ip: '127.0.0.1',
          details: l.details,
        }));
        setLogs(mapped);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendLogs();
    const interval = setInterval(fetchBackendLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  // Categorize logs
  const { allLogs, authLogs, deviceLogs, systemLogs, moduleList } = useMemo(() => {
    const auth: ActivityLogItem[] = [];
    const device: ActivityLogItem[] = [];
    const system: ActivityLogItem[] = [];
    const modulesSet = new Set<string>();

    logs.forEach((log) => {
      if (log.module) modulesSet.add(log.module);
      const cat = classifyLogCategory(log);
      if (cat === 'auth') auth.push(log);
      else if (cat === 'device') device.push(log);
      else system.push(log);
    });

    return {
      allLogs: logs,
      authLogs: auth,
      deviceLogs: device,
      systemLogs: system,
      moduleList: Array.from(modulesSet),
    };
  }, [logs]);

  const activeLogsList = useMemo(() => {
    if (activeTab === 'auth') return authLogs;
    if (activeTab === 'device') return deviceLogs;
    if (activeTab === 'system') return systemLogs;
    return allLogs;
  }, [activeTab, allLogs, authLogs, deviceLogs, systemLogs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return activeLogsList.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (log.user || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.module || '').toLowerCase().includes(q) ||
        (log.ip || '').toLowerCase().includes(q);

      const matchesModule =
        selectedModule === 'ALL' || (log.module || '').toLowerCase() === selectedModule.toLowerCase();
      return matchesSearch && matchesModule;
    });
  }, [searchQuery, selectedModule, activeLogsList]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModule, activeTab, itemsPerPage]);

  // Realtime Metrics
  const todayCount = useMemo(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return logs.filter((l) => l.timestamp && l.timestamp.startsWith(today)).length;
  }, [logs]);

  const successRate = useMemo(() => {
    if (logs.length === 0) return 100;
    const successCount = logs.filter((l) => l.status === 'success').length;
    return Math.round((successCount / logs.length) * 100);
  }, [logs]);

  // Handle Clear
  const handleClear = async () => {
    if (confirm('Apakah Anda yakin ingin membersihkan riwayat log aktivitas di database?')) {
      try {
        await activityLogApi.clear();
        setLogs([]);
        if (onClearLogs) onClearLogs();
        showToast('Riwayat log aktivitas berhasil dibersihkan.');
      } catch (e) {
        showToast('Gagal membersihkan log di server.');
      }
    }
  };

  // Export handlers
  const exportLogsToExcel = () => {
    const data = filteredLogs.map((l) => ({
      'Stempel Waktu': l.timestamp,
      Pengguna: l.user || 'System',
      Aktivitas: l.action,
      'Modul Sistem': l.module,
      Status: l.status || 'success',
      'Alamat IP': l.ip || '127.0.0.1',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    const sheetName = activeTab.toUpperCase() + '_LOGS';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `LetSens_Log_Aktivitas_${sheetName}.xlsx`);
    setShowExportMenu(false);
    showToast('File Excel Log Aktivitas berhasil diunduh!');
  };

  const exportLogsToPDF = () => {
    const doc = new jsPDF();
    doc.text('LetSens AIoT — Rekam Jejak Audit Log Aktivitas', 14, 15);

    const tableData = filteredLogs.map((l) => [
      l.timestamp,
      l.user || 'System',
      l.action,
      l.module,
      l.status || 'success',
      l.ip || '127.0.0.1',
    ]);

    autoTable(doc, {
      head: [['Stempel Waktu', 'Pengguna', 'Aktivitas', 'Modul', 'Status', 'Alamat IP']],
      body: tableData,
      startY: 22,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`LetSens_Log_Aktivitas_${activeTab}.pdf`);
    setShowExportMenu(false);
    showToast('File PDF Log Aktivitas berhasil diunduh!');
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Toast Notification */}
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Log Aktivitas</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Rekam jejak seluruh aktivitas pengguna, CRUD modul, telemetri, dan sistem LetSens AIoT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchBackendLogs}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Data Log"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>Ekspor Log</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 z-50">
                <button
                  onClick={exportLogsToExcel}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Ekspor ke Excel (.xlsx)
                </button>
                <button
                  onClick={exportLogsToPDF}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Ekspor ke PDF (.pdf)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 shadow-xs rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Entri Log</p>
              <h3 className="text-lg font-black text-slate-900">{logs.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0 border border-blue-500/20">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Aktivitas Hari Ini</p>
              <h3 className="text-lg font-black text-slate-900">{todayCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 shrink-0 border border-purple-500/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Keberhasilan Akses</p>
              <h3 className="text-lg font-black text-slate-900">{successRate}%</h3>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 shadow-xs rounded-3xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0 border border-amber-500/20">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Modul Aktif</p>
              <h3 className="text-lg font-black text-slate-900">{moduleList.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Module Filter Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Cari pengguna, aktivitas, modul, atau IP..."
            className="w-full h-11 pl-11 pr-10 bg-white border border-slate-200 font-extrabold text-xs sm:text-sm text-slate-800 rounded-2xl shadow-xs focus:outline-hidden focus:border-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Module Filter Dropdown */}
        <div className="relative sm:w-[220px] shrink-0">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-2xl font-extrabold text-xs text-slate-700 shadow-xs focus:outline-hidden focus:border-blue-400 cursor-pointer appearance-none"
          >
            <option value="ALL">Semua Modul</option>
            {moduleList.map((m) => (
              <option key={m} value={m}>
                Modul {m}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Categorized Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Log ({allLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('auth')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
            activeTab === 'auth'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Log Pengguna ({authLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('device')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
            activeTab === 'device'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Log Perangkat &amp; Telemetri ({deviceLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
            activeTab === 'system'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Log Sistem &amp; Modul ({systemLogs.length})
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden w-full">
        <div className="p-5 overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-8 my-2">
              <Activity size={40} className="text-slate-300 mb-3" />
              <h3 className="font-extrabold text-sm text-slate-800">Belum ada log aktivitas terdeteksi</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mt-1">
                Aktivitas sistem yang terekam akan muncul secara otomatis pada tabel ini.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50/80">
                  <th className="py-3 px-4 rounded-l-xl">Stempel Waktu</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Aktivitas</th>
                  <th className="py-3 px-4">Modul Sistem</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      {log.user || 'Super Admin'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md leading-snug">
                      {log.action}
                      {log.details && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          Payload: {log.details}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                          log.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'warning'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        ) : log.status === 'warning' ? (
                          <AlertTriangle size={12} className="text-amber-600" />
                        ) : (
                          <XCircle size={12} className="text-rose-600" />
                        )}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-500 whitespace-nowrap">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200/80 bg-slate-50/50 gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-3">
            <p>
              Menampilkan <span className="font-extrabold text-slate-900">{filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>-
              <span className="font-extrabold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari{' '}
              <span className="font-extrabold text-slate-900">{filteredLogs.length}</span> data
            </p>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Baris per Halaman:</span>
              <select
                value={itemsPerPage.toString()}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value) || 10)}
                className="h-8 px-2 text-xs font-extrabold bg-white border border-slate-200 rounded-xl cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-600 hover:text-white font-extrabold disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Sebelumnya</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-xl font-extrabold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-blue-600 hover:text-white font-extrabold disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Berikutnya</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
