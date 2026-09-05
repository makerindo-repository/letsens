import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  BarChart3,
  CheckCircle2,
  Building,
  RefreshCw,
  Activity,
  CalendarClock,
  Hammer,
  Package,
  FileSpreadsheet,
  Layers,
  X,
  FileCheck,
  SlidersHorizontal,
  ShieldCheck,
  TableProperties,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ToiletBilik,
  JadwalPemeliharaanItem,
  RekapPerbaikanItem,
  RekapKerusakanItem,
  PerlengkapanItem,
  IotDevice,
  SensorTelemetryRecord,
} from '../../types';

interface LaporanViewProps {
  toilets: ToiletBilik[];
  schedules: JadwalPemeliharaanItem[];
  repairs: RekapPerbaikanItem[];
  damages?: RekapKerusakanItem[];
  supplies?: PerlengkapanItem[];
  devices?: IotDevice[];
  telemetryLogs?: SensorTelemetryRecord[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  toilets = [],
  schedules = [],
  repairs = [],
  damages = [],
  supplies = [],
  devices = [],
  telemetryLogs = [],
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  // Report Configuration States
  const [reportType, setReportType] = useState<'telemetry' | 'sla' | 'repair' | 'supply'>('telemetry');
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'bulanan'>('bulanan');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [fileFormat, setFileFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  // Toast & Preview State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Local state for latest API data
  const [liveToilets, setLiveToilets] = useState<ToiletBilik[]>(toilets);
  const [liveSchedules, setLiveSchedules] = useState<JadwalPemeliharaanItem[]>(schedules);
  const [liveRepairs, setLiveRepairs] = useState<RekapPerbaikanItem[]>(repairs);
  const [liveDamages, setLiveDamages] = useState<RekapKerusakanItem[]>(damages);
  const [liveSupplies, setLiveSupplies] = useState<PerlengkapanItem[]>(supplies);

  // Sync props to local state
  useEffect(() => {
    if (toilets.length > 0) setLiveToilets(toilets);
    if (schedules.length > 0) setLiveSchedules(schedules);
    if (repairs.length > 0) setLiveRepairs(repairs);
    if (damages.length > 0) setLiveDamages(damages);
    if (supplies.length > 0) setLiveSupplies(supplies);
  }, [toilets, schedules, repairs, damages, supplies]);

  // Fetch real-time REST API data from Laravel Backend
  const fetchAllReportsFromBackend = async () => {
    setLoading(true);
    try {
      const [toiletsRes, schedRes, repRes, dmgRes, supRes] = await Promise.allSettled([
        fetch('/api/toilets').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/schedules').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/repairs').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/damages').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/supplies').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (toiletsRes.status === 'fulfilled' && toiletsRes.value?.data) setLiveToilets(toiletsRes.value.data);
      if (schedRes.status === 'fulfilled' && schedRes.value?.data) setLiveSchedules(schedRes.value.data);
      if (repRes.status === 'fulfilled' && repRes.value?.data) setLiveRepairs(repRes.value.data);
      if (dmgRes.status === 'fulfilled' && dmgRes.value?.data) setLiveDamages(dmgRes.value.data);
      if (supRes.status === 'fulfilled' && supRes.value?.data) setLiveSupplies(supRes.value.data);

      showToast('Data laporan berhasil disinkronkan secara real-time!');
    } catch (e) {
      console.warn('Fallback using local state for reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReportsFromBackend();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Report type labels
  const reportTypeLabels: Record<string, string> = {
    'telemetry': 'Laporan Telemetri Sensor',
    'sla': 'Laporan SLA Pemeliharaan',
    'repair': 'Laporan Perbaikan & Kerusakan',
    'supply': 'Laporan Stok Logistik',
  };

  // Period cutoff date helper
  const getPeriodCutoff = (): Date => {
    const now = new Date();
    switch (period) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'bulanan': return new Date(now.getFullYear(), now.getMonth(), 1);
      default: return new Date(0);
    }
  };

  const isWithinPeriod = (dateStr: string | undefined): boolean => {
    if (!dateStr || dateStr === '-') return true; // no date = include by default
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return true; // unparseable = include
    return parsed >= getPeriodCutoff();
  };

  // Build export data based on report type
  const buildExportData = (): Record<string, any>[] => {
    const buildingFilter = (field: string | undefined) =>
      selectedBuilding === 'ALL' || (field || '').includes(selectedBuilding);

    switch (reportType) {
      case 'telemetry':
        return liveToilets
          .filter((t) => buildingFilter(t.building))
          .filter((t) => isWithinPeriod(t.lastTelemetryTime))
          .map((t) => ({
            'Kode Bilik': t.code,
            'Nama': t.name,
            'Gedung': t.building,
            'Lantai': t.floor,
            'Amonia (PPM)': t.amoniaPPM.toFixed(2),
            'Suhu (°C)': t.temperatureC.toFixed(1),
            'Kelembaban (%)': t.humidityPercent,
            'Cahaya (LUX)': t.lux,
            'Sabun (%)': t.soapLevelPercent,
            'Tisu (%)': t.tissueLevelPercent,
            'Okupansi': t.occupied ? 'Terisi' : 'Kosong',
            'Status': t.amoniaPPM >= 20 ? 'Bahaya' : t.amoniaPPM >= 10 ? 'Waspada' : 'Optimal',
            'Terakhir Update': t.lastTelemetryTime || '-',
          }));

      case 'sla':
        return liveSchedules
          .filter((s) => buildingFilter(s.toiletName))
          .filter((s) => isWithinPeriod(s.completedAt))
          .map((s) => ({
            'Kode Bilik': s.toiletCode,
            'Nama Toilet': s.toiletName,
            'Petugas': s.staffName,
            'Shift': s.shift,
            'Slot Waktu': s.timeSlot,
            'Jenis Tugas': s.type,
            'Status': s.status,
            'Selesai Pada': s.completedAt || '-',
            'Catatan': s.notes || '-',
          }));

      case 'repair':
        return liveRepairs
          .filter((r) => buildingFilter(r.locationName))
          .filter((r) => isWithinPeriod(r.startedAt))
          .map((r) => ({
            'Kode Tiket': r.repairCode,
            'Tiket Kerusakan': r.damageTicketCode || '-',
            'Kode Bilik': r.toiletCode,
            'Lokasi': r.locationName,
            'Teknisi': r.technicianName,
            'Tindakan': r.actionTaken,
            'Suku Cadang': r.partsReplaced,
            'Estimasi Biaya': `Rp ${(r.costEstimateRp || 0).toLocaleString('id-ID')}`,
            'Status': r.status,
            'Dimulai': r.startedAt,
            'Selesai': r.completedAt || '-',
          }));

      case 'supply':
        return liveSupplies
          .filter((sup) => buildingFilter(sup.location))
          .filter((sup) => isWithinPeriod(sup.lastRestocked))
          .map((sup) => ({
            'Nama Barang': sup.name,
            'Kategori': sup.category,
            'Stok': `${sup.stock} ${sup.unit}`,
            'Batas Minimum': `${sup.minThreshold} ${sup.unit}`,
            'Harga / Unit': `Rp ${(sup.pricePerUnit || 0).toLocaleString('id-ID')}`,
            'Lokasi Gudang': sup.location,
            'Terakhir Restock': sup.lastRestocked || '-',
            'Status': sup.stock <= sup.minThreshold ? 'Perlu Restock' : 'Stok Aman',
          }));

      default:
        return [];
    }
  };

  // Preview handler
  const handleQuickPreview = () => {
    setIsGenerating(true);
    try {
      const data = buildExportData();
      setPreviewData(data);
      showToast(`Pratinjau berhasil dimuat — ${data.length} baris data.`);
    } catch (err) {
      showToast('Gagal memuat pratinjau data.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Timestamp for filename
  const fileTimestamp = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  // Generate & Download handler
  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const exportData = buildExportData();
      setPreviewData(exportData);

      const typeLabel = reportType === 'telemetry' ? 'Telemetri' : reportType === 'sla' ? 'SLA' : reportType === 'repair' ? 'Perbaikan' : 'Logistik';
      const buildingLabel = selectedBuilding === 'ALL' ? 'Semua_Gedung' : selectedBuilding.replace(/\s+/g, '_');
      const filename = `LetSens_${typeLabel}_${buildingLabel}_${fileTimestamp()}`;

      if (fileFormat === 'csv') {
        // CSV Export
        if (exportData.length === 0) {
          showToast('Tidak ada data untuk diekspor.');
          return;
        }
        const headers = Object.keys(exportData[0]);
        const csvRows = [
          headers.join(','),
          ...exportData.map((row) =>
            headers.map((h) => `"${String(row[h] ?? '-').replace(/"/g, '""')}"`).join(',')
          ),
        ];
        const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(csvBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast('CSV berhasil diunduh!');
      } else if (fileFormat === 'excel') {
        // Excel Export
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        if (exportData.length > 0) {
          const colWidths = Object.keys(exportData[0]).map((key) => {
            const maxLen = Math.max(
              key.length,
              ...exportData.map((row) => String(row[key] ?? '').length)
            );
            return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
          });
          worksheet['!cols'] = colWidths;
        }
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan LetSens');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
        showToast('Excel berhasil diunduh!');
      } else if (fileFormat === 'pdf') {
        // PDF Export with jsPDF + autoTable
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const typeTitle = reportTypeLabels[reportType] || 'Laporan LetSens';

        // Header Banner
        doc.setFillColor(37, 99, 235); // Blue-600
        doc.rect(0, 0, 297, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('LETSENS SMART SANITATION SYSTEM', 14, 11);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${typeTitle.toUpperCase()} — ${buildingLabel.replace(/_/g, ' ').toUpperCase()}`, 14, 18);

        // Report Info Metadata
        doc.setTextColor(51, 65, 85); // Slate 700
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const periodLabel = period === '24h' ? '24 Jam Terakhir' : period === '7d' ? '7 Hari Terakhir' : period === '30d' ? '30 Hari Terakhir' : 'Periode Bulanan';
        doc.text(`Periode: ${periodLabel}`, 14, 30);
        doc.setFont('helvetica', 'normal');
        doc.text(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`, 180, 30);

        if (exportData.length > 0) {
          const head = Object.keys(exportData[0]);
          const body = exportData.map((row) =>
            Object.values(row).map((v) => (v !== null && v !== undefined ? String(v) : '-'))
          );

          autoTable(doc, {
            head: [head],
            body: body,
            startY: 34,
            theme: 'striped',
            headStyles: {
              fillColor: [30, 64, 175], // Blue 800
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7.5,
              halign: 'center',
              cellPadding: 2.5,
            },
            styles: {
              fontSize: 7,
              cellPadding: 2,
              overflow: 'linebreak',
              valign: 'middle',
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252], // Slate 50
            },
            didDrawPage: (data) => {
              // Footer Page Numbering
              const str = `Halaman ${data.pageNumber} dari ${(doc as any).internal.getNumberOfPages()}`;
              doc.setFontSize(8);
              doc.setTextColor(148, 163, 184);
              doc.text(str, 297 - 14, 201, { align: 'right' });
              doc.text('Dokumen LetSens AIoT Smart Sanitation System • UNIKOM', 14, 201);
            },
          });
        } else {
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text('Tidak ada data yang ditemukan pada filter ini.', 14, 45);
        }

        doc.save(`${filename}.pdf`);
        showToast('PDF berhasil diunduh!');
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast('Gagal melakukan ekspor data.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Estimated file size
  const estimatedSize = useMemo(() => {
    if (!previewData || previewData.length === 0) return '-';
    const str = JSON.stringify(previewData);
    const bytes = new Blob([str]).size;

    let multiplier = 1;
    if (fileFormat === 'excel') multiplier = 1.5;
    if (fileFormat === 'pdf') multiplier = 2.0;

    const finalBytes = bytes * multiplier;

    if (finalBytes < 1024) return `${Math.ceil(finalBytes)} B`;
    if (finalBytes < 1024 * 1024) return `${(finalBytes / 1024).toFixed(1)} KB`;
    return `${(finalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [previewData, fileFormat]);

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Laporan</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Pusat data dan laporan sistem LetSens AIoT
            </p>
          </div>
        </div>
        <button
          onClick={fetchAllReportsFromBackend}
          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Konfigurasi Laporan Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0 border border-blue-500/20 shadow-xs">
              <FileCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">Konfigurasi Laporan</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Atur jenis laporan, rentang waktu, gedung, dan format berkas luaran
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* 1. Jenis Laporan */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <SlidersHorizontal size={13} />
                Jenis Laporan
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer shadow-sm"
              >
                <option value="telemetry">Laporan Telemetri Sensor</option>
                <option value="sla">Laporan SLA Pemeliharaan</option>
                <option value="repair">Laporan Perbaikan & Kerusakan</option>
                <option value="supply">Laporan Stok Logistik</option>
              </select>
            </div>

            {/* 2. Filter Gedung */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building size={13} />
                Filter Gedung
              </label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer shadow-sm"
              >
                <option value="ALL">Semua Gedung</option>
                <option value="Gedung A">Gedung A (Rektorat)</option>
                <option value="Gedung B">Gedung B (FTIK)</option>
                <option value="Smart Building">Smart Building UNIKOM</option>
              </select>
            </div>

            {/* 3. Rentang Waktu */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} />
                Rentang Waktu
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer shadow-sm"
              >
                <option value="24h">24 Jam Terakhir</option>
                <option value="7d">7 Hari Terakhir</option>
                <option value="30d">30 Hari Terakhir</option>
                <option value="bulanan">Periode Bulanan</option>
              </select>
            </div>

            {/* 4. Format Berkas Luaran */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileSpreadsheet size={13} />
                Format Berkas Luaran
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['pdf', 'excel', 'csv'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFileFormat(fmt)}
                    className={`h-11 rounded-2xl font-extrabold text-xs uppercase transition-all cursor-pointer ${
                      fileFormat === fmt
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {fmt === 'excel' ? 'XLSX' : fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-2xl font-extrabold text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-sm"
              onClick={handleQuickPreview}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Eye size={16} />
              )}
              Pratinjau Cepat
            </button>
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download size={16} />
              )}
              Unduh Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Pratinjau Laporan Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0 border border-blue-500/20 shadow-xs">
                <TableProperties size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                  Pratinjau Laporan
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Pratinjau struktur data untuk jenis laporan:{' '}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-700 font-extrabold text-[11px] border border-blue-500/20">
                    {reportTypeLabels[reportType]}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden min-h-[220px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
                  <tr>
                    {previewData.length > 0 ? (
                      Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="py-3 px-4 whitespace-nowrap">{key}</th>
                      ))
                    ) : (
                      reportType === 'telemetry' ? (
                        <>
                          <th className="py-3 px-4">Kode Bilik</th>
                          <th className="py-3 px-4">Nama</th>
                          <th className="py-3 px-4">Gedung</th>
                          <th className="py-3 px-4">Amonia (PPM)</th>
                          <th className="py-3 px-4">Suhu (°C)</th>
                          <th className="py-3 px-4">Kelembaban (%)</th>
                          <th className="py-3 px-4">Okupansi</th>
                          <th className="py-3 px-4">Status</th>
                        </>
                      ) : reportType === 'sla' ? (
                        <>
                          <th className="py-3 px-4">Kode Bilik</th>
                          <th className="py-3 px-4">Petugas</th>
                          <th className="py-3 px-4">Jenis Tugas</th>
                          <th className="py-3 px-4">Slot Waktu</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Selesai Pada</th>
                        </>
                      ) : reportType === 'repair' ? (
                        <>
                          <th className="py-3 px-4">Kode Tiket</th>
                          <th className="py-3 px-4">Kode Bilik</th>
                          <th className="py-3 px-4">Teknisi</th>
                          <th className="py-3 px-4">Tindakan</th>
                          <th className="py-3 px-4">Estimasi Biaya</th>
                          <th className="py-3 px-4">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 px-4">Nama Barang</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Stok</th>
                          <th className="py-3 px-4">Harga / Unit</th>
                          <th className="py-3 px-4">Lokasi Gudang</th>
                          <th className="py-3 px-4">Status</th>
                        </>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {previewData.length > 0 ? (
                    previewData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        {Object.values(row).map((val: any, ci: number) => (
                          <td key={ci} className="py-3 px-4 text-xs font-semibold whitespace-nowrap">
                            {val !== null && val !== undefined ? String(val) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-14 text-slate-400 font-semibold text-xs">
                        Klik "Pratinjau Cepat" untuk melihat data pratinjau.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {previewData.length > 10 && (
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200/80 text-center">
                <p className="text-xs font-bold text-slate-500">
                  Menampilkan 10 dari {previewData.length} baris. Unduh laporan untuk data lengkap.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Export Statistics & Document Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0 border border-blue-500/20 shadow-xs">
              <BarChart3 size={22} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Baris</p>
              <h3 className="text-2xl font-black text-slate-900">{previewData.length > 0 ? previewData.length : '-'}</h3>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Estimasi Ukuran</p>
              <h3 className="text-2xl font-black text-slate-900">{estimatedSize}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20 shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Status Dokumen</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-snug">
                Laporan di-generate secara langsung. Tautan unduhan tersedia untuk format CSV, Excel, dan PDF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
