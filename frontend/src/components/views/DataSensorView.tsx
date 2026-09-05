import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Wind,
  Thermometer,
  Sun,
  Droplets,
  Gauge,
  Cpu,
  Download,
  Filter,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Calendar as CalendarIcon,
  Table as TableIcon,
  BarChart2,
  FileSpreadsheet,
  Info,
  Battery,
  Radio,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToiletBilik, SensorTelemetryRecord, IotDevice } from '../../types';
import { telemetryApi } from '../../api/telemetryApi';
import { iotDeviceApi } from '../../api/iotDeviceApi';

interface DataSensorViewProps {
  toilets: ToiletBilik[];
  devices?: IotDevice[];
  telemetryLogs: SensorTelemetryRecord[];
  onInjectTelemetry: (data: Partial<SensorTelemetryRecord>) => void;
  onRefresh: () => void;
}

export const DataSensorView: React.FC<DataSensorViewProps> = ({
  toilets = [],
  devices = [],
  telemetryLogs = [],
  onInjectTelemetry,
  onRefresh,
}) => {
  // Local state for fetched logs and filter options
  const [internalLogs, setInternalLogs] = useState<SensorTelemetryRecord[]>(telemetryLogs);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

  // Default date filter to Today's date (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Simulation Modal State
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);
  const [injectBilik, setInjectBilik] = useState<string>(toilets[0]?.code || 'T-A1-F');
  const [injectDeviceId, setInjectDeviceId] = useState<string>(devices[0]?.nodeId || 'ESP32-TK-01A');
  const [injectAmonia, setInjectAmonia] = useState<number>(8.5);
  const [injectTemp, setInjectTemp] = useState<number>(29.5);
  const [injectHumidity, setInjectHumidity] = useState<number>(65);
  const [injectLux, setInjectLux] = useState<number>(360);
  const [injectOccupied, setInjectOccupied] = useState<boolean>(false);
  const [injectSoap, setInjectSoap] = useState<number>(80);
  const [injectTissue, setInjectTissue] = useState<number>(75);
  const [injectFlow, setInjectFlow] = useState<number>(0.0);

  const [apiDevices, setApiDevices] = useState<IotDevice[]>(devices || []);

  // Sync prop logs to state
  useEffect(() => {
    if (telemetryLogs && telemetryLogs.length > 0 && internalLogs.length === 0) {
      setInternalLogs(telemetryLogs);
    }
  }, [telemetryLogs]);

  // Fetch telemetry logs & registered IoT devices directly from Backend Database API on mount
  const fetchTelemetryFromBackend = async () => {
    setLoading(true);
    try {
      const res = await telemetryApi.getLatestLogs();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setInternalLogs(res.data);
      }
    } catch (e) {
      console.log('Using fallback state for telemetry');
    } finally {
      setLoading(false);
      onRefresh();
    }
  };

  const fetchDevicesFromBackend = async () => {
    try {
      const res = await iotDeviceApi.getAllDevices();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setApiDevices(res.data);
      }
    } catch (e) {
      console.log('Using fallback devices');
    }
  };

  useEffect(() => {
    fetchTelemetryFromBackend();
    fetchDevicesFromBackend();
  }, []);

  // Lookup node / device objects for exact 1-to-1 association with IotDevice list from Database API
  const deviceLookup = useMemo(() => {
    const map: Record<string, IotDevice> = {};
    const targetDevices = apiDevices.length > 0 ? apiDevices : (devices || []);
    targetDevices.forEach((d) => {
      if (d.nodeId) map[d.nodeId] = d;
      if (d.id) map[d.id] = d;
      if (d.toiletCode) map[d.toiletCode] = d;
    });
    return map;
  }, [apiDevices, devices]);

  // List of registered IoT Devices & Raw Hardware Telemetry Nodes for dropdown filter
  const uniqueNodesList = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    const targetDevices = apiDevices.length > 0 ? apiDevices : (devices || []);

    // 1. Actual Registered IoT Devices from Backend Database API
    targetDevices.forEach((d) => {
      const key = d.nodeId || d.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ id: key, label: `${d.nodeId || key} — ${d.name}` });
      }
    });

    // 2. Dynamic Node IDs from actual incoming telemetry logs sent by hardware ESP32
    internalLogs.forEach((log) => {
      const key = log.nodeId || log.deviceId;
      if (key && !seen.has(key)) {
        seen.add(key);
        const dev = deviceLookup[key];
        const name = dev ? dev.name : `Perangkat IoT ${key}`;
        list.push({ id: key, label: `${key} — ${name}` });
      }
    });

    return list;
  }, [devices, internalLogs, deviceLookup]);

  // Filtered Telemetry Logs based on search, device, timeRange, date
  const filteredLogs = useMemo(() => {
    let result = [...internalLogs];

    // Device / Node filter
    if (selectedDeviceFilter !== 'ALL') {
      result = result.filter(
        (log) =>
          log.toiletCode === selectedDeviceFilter ||
          log.deviceId === selectedDeviceFilter ||
          log.nodeId === selectedDeviceFilter
      );
    }

    // Rentang Waktu (Time Range Filter: 24h, 7d, 30d)
    const nowMs = Date.now();
    let limitMs = 24 * 60 * 60 * 1000;
    if (timeRange === '7d') limitMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === '30d') limitMs = 30 * 24 * 60 * 60 * 1000;

    const cutoffTime = nowMs - limitMs;
    result = result.filter((log) => {
      if (!log.timestamp) return true;
      let ts = log.timestamp.trim();
      if (ts.includes(' ') && !ts.includes('T')) {
        ts = ts.replace(' ', 'T');
      }
      if (!ts.includes('-') && !ts.includes('/')) {
        const d = new Date();
        const todayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        ts = `${todayDate}T${ts.replace(/\./g, ':')}`;
      }
      const logDate = new Date(ts);
      if (isNaN(logDate.getTime())) return true;
      return logDate.getTime() >= cutoffTime;
    });

    // Search query (Kode Perangkat IoT only)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((log) => {
        const deviceCode = (log.nodeId || log.deviceId || log.toiletCode || '').toLowerCase();
        return deviceCode.includes(q);
      });
    }

    // Date Filter (Specific date picker - defaults to Today's date YYYY-MM-DD)
    if (selectedDate) {
      const parts = selectedDate.split('-');
      const ddmmyyyy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '';

      result = result.filter((log) => {
        if (!log.timestamp) return true;
        const ts = log.timestamp.trim();
        return ts.startsWith(selectedDate) || (ddmmyyyy && ts.startsWith(ddmmyyyy)) || ts.includes(selectedDate) || (ddmmyyyy && ts.includes(ddmmyyyy));
      });
    }

    // Sort by timestamp descending so the latest log appears at the top
    return result.sort((a, b) => {
      const ta = a.timestamp || '';
      const tb = b.timestamp || '';
      return tb.localeCompare(ta);
    });
  }, [internalLogs, selectedDeviceFilter, timeRange, searchQuery, selectedDate]);

  // Executive KPI summary calculations
  const kpiMetrics = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        avgAmonia: '0.00',
        avgTemp: '0.0',
        avgHumidity: '0',
        avgLux: '0',
        occupiedCount: 0,
        normalCount: 0,
        waspadaCount: 0,
        bahayaCount: 0,
      };
    }

    let sumAmonia = 0;
    let sumTemp = 0;
    let sumHum = 0;
    let sumLux = 0;
    let occupied = 0;
    let normal = 0;
    let waspada = 0;
    let bahaya = 0;

    filteredLogs.forEach((log) => {
      sumAmonia += log.amoniaPPM || 0;
      sumTemp += log.temperatureC || 0;
      sumHum += log.humidityPercent || 0;
      sumLux += log.lux || 0;
      if (log.occupied) occupied += 1;
      if (log.statusCondition === 'Bahaya') bahaya += 1;
      else if (log.statusCondition === 'Waspada') waspada += 1;
      else normal += 1;
    });

    const total = filteredLogs.length;
    return {
      avgAmonia: (sumAmonia / total).toFixed(2),
      avgTemp: (sumTemp / total).toFixed(1),
      avgHumidity: Math.round(sumHum / total).toString(),
      avgLux: Math.round(sumLux / total).toString(),
      occupiedCount: occupied,
      normalCount: normal,
      waspadaCount: waspada,
      bahayaCount: bahaya,
    };
  }, [filteredLogs]);

  // Hover state for interactive SVG Trend Chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // SVG Trend Chart Points Calculation with Rich Metadata
  const chartPoints = useMemo(() => {
    const records = [...filteredLogs].slice(0, 30).reverse();
    if (records.length < 2) return null;

    const width = 800;
    const height = 280;
    const padding = 40;

    const maxAmonia = Math.max(35, ...records.map((r) => r.amoniaPPM || 0));
    const maxTemp = Math.max(40, ...records.map((r) => r.temperatureC || 0));

    const combinedCoords = records.map((r, i) => {
      const x = padding + (i / (records.length - 1)) * (width - 2 * padding);
      const amoniaY = height - padding - ((r.amoniaPPM || 0) / maxAmonia) * (height - 2 * padding);
      const tempY = height - padding - ((r.temperatureC || 0) / maxTemp) * (height - 2 * padding);

      const dev = deviceLookup[r.nodeId || r.deviceId || ''] || deviceLookup[r.toiletCode];
      const deviceCode = r.nodeId || r.deviceId || (dev ? dev.nodeId : r.toiletCode);
      const deviceName = r.deviceName || (dev ? dev.name : `Perangkat IoT ${deviceCode}`);

      let displayTime = (r.timestamp || '').trim();
      if (displayTime.includes(' ')) {
        displayTime = displayTime.split(' ')[1] || displayTime;
      }
      displayTime = displayTime.replace(/:/g, '.').substring(0, 8);

      return {
        x,
        amoniaY,
        tempY,
        amoniaVal: r.amoniaPPM || 0,
        tempVal: r.temperatureC || 0,
        humVal: r.humidityPercent || 0,
        time: displayTime,
        fullTimestamp: r.timestamp || '',
        deviceCode,
        deviceName,
      };
    });

    const amoniaPath = combinedCoords.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.amoniaY}` : `${acc} L ${p.x} ${p.amoniaY}`), '');
    const tempPath = combinedCoords.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.tempY}` : `${acc} L ${p.x} ${p.tempY}`), '');

    const amoniaArea = `${amoniaPath} L ${combinedCoords[combinedCoords.length - 1].x} ${height - padding} L ${combinedCoords[0].x} ${height - padding} Z`;
    const tempArea = `${tempPath} L ${combinedCoords[combinedCoords.length - 1].x} ${height - padding} L ${combinedCoords[0].x} ${height - padding} Z`;

    return { combinedCoords, amoniaPath, tempPath, amoniaArea, tempArea, width, height, padding };
  }, [filteredLogs, deviceLookup]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeviceFilter, selectedStatusFilter, searchQuery, timeRange, selectedDate]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log telemetri yang tersedia untuk diekspor.');
      return;
    }

    const headers = [
      'Waktu Telemetri',
      'Kode Perangkat',
      'Nama Perangkat',
      'Kode Bilik',
      'Amonia MQ-137 (PPM)',
      'Suhu DHT22 (C)',
      'Kelembaban RH (%)',
      'Pencahayaan Lux (LDR)',
      'Okupansi PIR',
      'Baterai (%)',
      'Baterai Voltage (V)',
      'Sinyal RSSI (dBm)',
    ].join(',');

    const rows = filteredLogs.map((log) => {
      const dev = deviceLookup[log.nodeId || log.deviceId || ''] || deviceLookup[log.toiletCode];
      const deviceCode = log.nodeId || log.deviceId || (dev ? dev.nodeId : log.toiletCode);
      const deviceName = log.deviceName || (dev ? dev.name : `Perangkat IoT ${deviceCode}`);
      const batVal = log.batteryPercent ?? dev?.batteryPercent ?? 0;
      const batVolt = log.batteryVoltage ?? dev?.batteryVoltage ?? 0.0;
      const rssiVal = log.rssi ?? dev?.rssi ?? 0;
      const pirStatus = log.occupied ? 'Terisi (Closed)' : 'Kosong (Open)';
      return [
        `"${log.timestamp}"`,
        `"${deviceCode}"`,
        `"${deviceName}"`,
        `"${log.toiletCode}"`,
        log.amoniaPPM,
        log.temperatureC,
        log.humidityPercent,
        log.lux,
        `"${pirStatus}"`,
        batVal,
        batVolt,
        rssiVal,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `letsens_telemetri_sensor_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllSensorLogs = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SELURUH catatan data sensor telemetri dari database? Action ini tidak dapat dibatalkan.')) {
      return;
    }
    setLoading(true);
    try {
      await fetch('/api/sensor-logs', { method: 'DELETE' });
      setInternalLogs([]);
      onRefresh();
    } catch (e) {
      console.log('Failed to clear logs');
    } finally {
      setLoading(false);
    }
  };

  // Submit ESP32 Simulation Payload
  const handleInjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let condition: 'Normal' | 'Waspada' | 'Bahaya' = 'Normal';
    if (injectAmonia >= 25) condition = 'Bahaya';
    else if (injectAmonia >= 10) condition = 'Waspada';

    const newRecord: Partial<SensorTelemetryRecord> = {
      deviceId: injectDeviceId,
      nodeId: injectDeviceId,
      toiletCode: injectBilik,
      amoniaPPM: Number(injectAmonia),
      temperatureC: Number(injectTemp),
      humidityPercent: Number(injectHumidity),
      lux: Number(injectLux),
      occupied: injectOccupied,
      soapLevelPercent: Number(injectSoap),
      tissueLevelPercent: Number(injectTissue),
      waterFlowLpm: Number(injectFlow),
      statusCondition: condition,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    try {
      await telemetryApi.injectTelemetry({
        deviceId: injectDeviceId,
        nodeId: injectDeviceId,
        toiletCode: injectBilik,
        amoniaPPM: injectAmonia,
        temperatureC: injectTemp,
        humidityPercent: injectHumidity,
        lux: injectLux,
        occupied: injectOccupied,
        soapLevelPercent: injectSoap,
        tissueLevelPercent: injectTissue,
        waterFlowLpm: injectFlow,
      });
    } catch (err) {
      console.log('Fallback to local inject');
    }

    onInjectTelemetry(newRecord);
    setShowInjectModal(false);
    fetchTelemetryFromBackend();
  };

  return (
    <div className="w-full space-y-6 px-1 py-1 pb-10">
      {/* Top Header Card - Symmetrical 2-Row Layout Aligned with Agrisense Benchmark */}
      <div className="w-full bg-white backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Title & Main Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl border border-blue-500/20 shadow-xs shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Data Sensor
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Monitoring real-time kadar amonia (MQ-137), iklim mikro (DHT22), okupansi (PIR), pencahayaan (LDR), serta daya &amp; sinyal perangkat IoT
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Row 2: Control Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode Perangkat IoT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 font-semibold text-xs rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Node / Device Filter Dropdown */}
          <div className="relative flex items-center w-full">
            <Cpu size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 shrink-0" />
            <select
              value={selectedDeviceFilter}
              onChange={(e) => setSelectedDeviceFilter(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 font-bold text-xs rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">Semua Perangkat IoT ({uniqueNodesList.length})</option>
              {uniqueNodesList.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Time Range Filter Dropdown */}
          <div className="relative flex items-center w-full">
            <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 shrink-0" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 font-bold text-xs rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none cursor-pointer appearance-none transition-all"
            >
              <option value="24h">24 Jam Terakhir</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Date Picker */}
          <div className="relative flex items-center w-full">
            <CalendarIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none z-10 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) setTimeRange('all');
              }}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 font-bold text-xs rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Top 4 KPI Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Amonia MQ-137 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Rata-rata Amonia NH3 (MQ-137)
            </span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-200/60">
              <Wind size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpiMetrics.avgAmonia}</span>
            <span className="text-xs font-bold text-orange-600">PPM</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
            <span>Ambang Normal: &lt; 10 PPM</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                Number(kpiMetrics.avgAmonia) >= 25
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : Number(kpiMetrics.avgAmonia) >= 10
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {Number(kpiMetrics.avgAmonia) >= 25 ? 'Bahaya' : Number(kpiMetrics.avgAmonia) >= 10 ? 'Waspada' : 'Aman'}
            </span>
          </div>
        </div>

        {/* KPI 2: Temperature (DHT22) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Suhu Udara (DHT22)
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
              <Thermometer size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpiMetrics.avgTemp}°C</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
            <span>Iklim Mikro Perangkat</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                Number(kpiMetrics.avgTemp) === 0
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : Number(kpiMetrics.avgTemp) >= 33
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}
            >
              {Number(kpiMetrics.avgTemp) === 0 ? 'Tanpa Data' : Number(kpiMetrics.avgTemp) >= 33 ? 'Tinggi' : 'Optimal'}
            </span>
          </div>
        </div>

        {/* KPI 3: Humidity (DHT22) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Kelembaban Udara (DHT22)
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200/60">
              <Droplets size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpiMetrics.avgHumidity}%</span>
            <span className="text-xs font-bold text-blue-600">RH</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
            <span>Kelembaban Ruangan</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                Number(kpiMetrics.avgHumidity) === 0
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : Number(kpiMetrics.avgHumidity) >= 75
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {Number(kpiMetrics.avgHumidity) === 0 ? 'Tanpa Data' : Number(kpiMetrics.avgHumidity) >= 75 ? 'Tinggi' : 'Normal'}
            </span>
          </div>
        </div>

        {/* KPI 4: Total Log Telemetri & PIR Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Catatan Telemetri Active
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-200/60">
              <Gauge size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{filteredLogs.length}</span>
            <span className="text-xs font-bold text-purple-600">Records</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
            <span>Perangkat Terisi: {kpiMetrics.occupiedCount}</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
              Live Sync
            </span>
          </div>
        </div>
      </div>

      {/* Full-width View Switcher & Main Display */}
      <div className="w-full space-y-4">
        {/* Tab Switcher Header */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1 inline-flex items-center gap-1">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TableIcon size={14} />
              <span>Tabel Telemetri ({filteredLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart2 size={14} />
              <span>Grafik Tren Telemetri</span>
            </button>
          </div>
        </div>

        {/* View 1: Telemetry Data Table */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-4 px-4 pl-6 whitespace-nowrap">WAKTU (DD/MM/YYYY)</th>
                    <th className="py-4 px-4 whitespace-nowrap">KODE PERANGKAT</th>
                    <th className="py-4 px-4 min-w-[170px] whitespace-nowrap">NAMA PERANGKAT</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">AMONIA (PPM)</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">SUHU (°C)</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">RH (%)</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">SENSOR PIR</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">CAHAYA (LUX)</th>
                    <th className="py-4 px-4 text-center whitespace-nowrap">RSSI (SINYAL)</th>
                    <th className="py-4 px-4 pr-6 text-center whitespace-nowrap">BATERAI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const dev = deviceLookup[log.nodeId || log.deviceId || ''] || deviceLookup[log.toiletCode];
                      const deviceCode = log.nodeId || log.deviceId || (dev ? dev.nodeId : log.toiletCode);
                      const deviceName = log.deviceName || (dev ? dev.name : `Perangkat IoT ${deviceCode}`);
                      const batVal = log.batteryPercent ?? dev?.batteryPercent ?? 100;
                      const calcVolt = (p: number) => Number((3.30 + (Math.max(0, Math.min(100, p)) / 100) * 0.90).toFixed(1));
                      const batVolt = log.batteryVoltage ?? dev?.batteryVoltage ?? calcVolt(batVal);
                      const rssiVal = log.rssi ?? dev?.rssi ?? -55;
                      const rssiQuality = dev ? dev.rssiQuality : (rssiVal < -70 ? 'Cukup' : 'Baik');

                      // Strict DD/MM/YYYY HH.mm.ss WIB formatting
                      let rawTs = (log.timestamp || '').trim();
                      let formattedTimestamp = rawTs;

                      if (rawTs.includes('-') && rawTs.includes(' ')) {
                        // "2026-09-06 03:10:00" -> "06/09/2026 03.10.00 WIB"
                        const [datePart, timePart] = rawTs.split(' ');
                        const [y, m, d] = datePart.split('-');
                        const timeFormatted = (timePart || '00:00:00').replace(/:/g, '.');
                        formattedTimestamp = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y} ${timeFormatted} WIB`;
                      } else if (rawTs.includes('T')) {
                        const dObj = new Date(rawTs);
                        const day = String(dObj.getDate()).padStart(2, '0');
                        const month = String(dObj.getMonth() + 1).padStart(2, '0');
                        const year = dObj.getFullYear();
                        const hours = String(dObj.getHours()).padStart(2, '0');
                        const mins = String(dObj.getMinutes()).padStart(2, '0');
                        const secs = String(dObj.getSeconds()).padStart(2, '0');
                        formattedTimestamp = `${day}/${month}/${year} ${hours}.${mins}.${secs} WIB`;
                      } else if (rawTs.includes('/')) {
                        formattedTimestamp = rawTs.includes('WIB') ? rawTs.replace(/:/g, '.') : `${rawTs.replace(/:/g, '.')} WIB`;
                      } else if (!rawTs) {
                        const dObj = new Date();
                        const day = String(dObj.getDate()).padStart(2, '0');
                        const month = String(dObj.getMonth() + 1).padStart(2, '0');
                        const year = dObj.getFullYear();
                        const hours = String(dObj.getHours()).padStart(2, '0');
                        const mins = String(dObj.getMinutes()).padStart(2, '0');
                        const secs = String(dObj.getSeconds()).padStart(2, '0');
                        formattedTimestamp = `${day}/${month}/${year} ${hours}.${mins}.${secs} WIB`;
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 pl-6 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-blue-600 shrink-0" />
                              <span>{formattedTimestamp}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap inline-block shadow-2xs">
                              {deviceCode}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                            <div>{deviceName}</div>
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                                log.amoniaPPM >= 20
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : log.amoniaPPM >= 10
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              <Wind size={12} />
                              {log.amoniaPPM.toFixed(2)} PPM
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap font-mono font-bold text-slate-900">
                            {log.temperatureC.toFixed(1)}°C
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap font-mono font-bold text-blue-600">
                            {log.humidityPercent}%
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap shadow-2xs ${
                                log.occupied
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${log.occupied ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                              {log.occupied ? 'PIR: Terdeteksi' : 'PIR: Standby'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap font-mono font-bold text-amber-600">
                            {log.lux} LUX
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center">
                              <div className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-2xs">
                                <Radio size={14} className="text-sky-600" />
                                <span>{rssiVal} dBm ({rssiQuality})</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 pr-6 text-center whitespace-nowrap">
                            <div className="inline-flex items-center justify-center">
                              <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-2xs">
                                <Battery size={14} className="text-emerald-600" />
                                <span>{batVal}% ({batVolt}V)</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-slate-400 font-semibold">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="opacity-20 text-slate-500" />
                          <p className="font-bold text-sm text-slate-600">Tidak ada log telemetri yang cocok dengan filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200/80 gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <p className="text-xs text-slate-500 font-semibold">
                  Menampilkan {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                  {Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari {filteredLogs.length} telemetri
                </p>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Baris:</span>
                  <select
                    value={itemsPerPage.toString()}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value || '10'));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 text-xs font-bold border border-slate-200 bg-white rounded-lg outline-none cursor-pointer"
                  >
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} className="inline mr-1" />
                  Sebelumnya
                </button>

                <div className="flex items-center mx-1 gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Berikutnya
                  <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Native SVG Telemetry Trend Chart */}
        {activeTab === 'chart' && (
          <div className="w-full bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                  Grafik Tren Telemetri Amonia (MQ-137) & Suhu Udara (DHT22)
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Visualisasi fluktuasi gas bau amonia dan iklim mikro realtime
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                  <span className="w-3 h-1 bg-rose-500 rounded-full" />
                  Amonia (PPM)
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                  <span className="w-3 h-1 bg-amber-500 rounded-full" />
                  Suhu (°C)
                </span>
              </div>
            </div>

            {chartPoints ? (
              <div className="w-full overflow-x-auto relative">
                {/* Floating Interactive Hover Tooltip */}
                <AnimatePresence>
                  {hoveredPointIndex !== null && chartPoints.combinedCoords[hoveredPointIndex] && (() => {
                    const isNearLeft = hoveredPointIndex < 3;
                    const isNearRight = hoveredPointIndex > chartPoints.combinedCoords.length - 4;
                    const transformClass = isNearLeft ? 'translate-x-0' : isNearRight ? '-translate-x-full' : '-translate-x-1/2';
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          left: `${(chartPoints.combinedCoords[hoveredPointIndex].x / chartPoints.width) * 100}%`,
                          top: '12px',
                        }}
                        className={`absolute z-20 ${transformClass} pointer-events-none bg-slate-900/90 text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md min-w-[170px] space-y-1`}
                      >
                        <div className="text-[10px] font-mono text-slate-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
                          <span>{chartPoints.combinedCoords[hoveredPointIndex].time}</span>
                          <span className="text-blue-400 font-extrabold">{chartPoints.combinedCoords[hoveredPointIndex].deviceCode}</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-200 truncate max-w-[160px]">
                          {chartPoints.combinedCoords[hoveredPointIndex].deviceName}
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono pt-1">
                          <span className="text-rose-400 font-bold">Amonia:</span>
                          <span className="font-extrabold text-rose-300">
                            {chartPoints.combinedCoords[hoveredPointIndex].amoniaVal.toFixed(2)} PPM
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-400 font-bold">Suhu:</span>
                          <span className="font-extrabold text-amber-300">
                            {chartPoints.combinedCoords[hoveredPointIndex].tempVal.toFixed(1)}°C
                          </span>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                <div className="min-w-[700px] h-[320px] relative">
                  <svg
                    viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
                    className="w-full h-full cursor-crosshair"
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <defs>
                      <linearGradient id="amoniaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="40" y1="40" x2="760" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="100" x2="760" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="160" x2="760" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="220" x2="760" y2="220" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="40" y1="240" x2="760" y2="240" stroke="#e2e8f0" strokeWidth="1.5" />

                    {/* Area Fills */}
                    <path d={chartPoints.amoniaArea} fill="url(#amoniaGrad)" />
                    <path d={chartPoints.tempArea} fill="url(#tempGrad)" />

                    {/* Stroke Lines */}
                    <path d={chartPoints.amoniaPath} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                    <path d={chartPoints.tempPath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

                    {/* Vertical Hover Guideline */}
                    {hoveredPointIndex !== null && chartPoints.combinedCoords[hoveredPointIndex] && (
                      <line
                        x1={chartPoints.combinedCoords[hoveredPointIndex].x}
                        y1="35"
                        x2={chartPoints.combinedCoords[hoveredPointIndex].x}
                        y2="240"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Interactive Data Points & Hover Targets */}
                    {chartPoints.combinedCoords.map((p, idx) => {
                      const isHovered = hoveredPointIndex === idx;
                      return (
                        <g
                          key={`pt-${idx}`}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          className="cursor-pointer"
                        >
                          {/* Invisible wide hover area for smooth mouse tracking */}
                          <rect
                            x={p.x - 12}
                            y="30"
                            width="24"
                            height="210"
                            fill="transparent"
                          />

                          {/* Amonia Dot */}
                          <circle
                            cx={p.x}
                            cy={p.amoniaY}
                            r={isHovered ? '6' : '4'}
                            fill={isHovered ? '#ef4444' : '#ffffff'}
                            stroke="#ef4444"
                            strokeWidth={isHovered ? '3' : '2.5'}
                            className="transition-all duration-150"
                          />

                          {/* Temp Dot */}
                          <circle
                            cx={p.x}
                            cy={p.tempY}
                            r={isHovered ? '6' : '4'}
                            fill={isHovered ? '#f59e0b' : '#ffffff'}
                            stroke="#f59e0b"
                            strokeWidth={isHovered ? '3' : '2.5'}
                            className="transition-all duration-150"
                          />

                          {/* Time label on X axis */}
                          {(() => {
                            const labelStep = Math.max(1, Math.ceil(chartPoints.combinedCoords.length / 6));
                            const showLabel = idx === 0 || idx === chartPoints.combinedCoords.length - 1 || idx % labelStep === 0;
                            if (!showLabel) return null;
                            const cleanTime = p.time.replace(/\s*WIB/i, '');

                            return (
                              <text
                                x={p.x}
                                y={chartPoints.height - 12}
                                textAnchor="middle"
                                fontSize="9.5"
                                fontWeight={isHovered ? '900' : '700'}
                                fill={isHovered ? '#2563eb' : '#94a3b8'}
                                className="font-mono"
                              >
                                {cleanTime}
                              </text>
                            );
                          })()}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400 font-bold text-xs">
                Membutuhkan minimal 2 log telemetri untuk menampilkan tren grafik.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Inject Data Telemetri ESP32 (MQTT Simulation) */}
      <AnimatePresence>
        {showInjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200/60">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Simulasikan Kirim Payload MQTT ESP32
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Inject paket data sensor telemetri ke API Backend LetSens
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInjectModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleInjectSubmit} className="space-y-4 mt-4 text-xs">
                {devices && devices.length > 0 && (
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Kode Perangkat Node IoT Terdaftar
                    </label>
                    <select
                      value={injectDeviceId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setInjectDeviceId(selectedId);
                        const dev = devices.find((d) => d.nodeId === selectedId || d.id === selectedId);
                        if (dev) {
                          setInjectBilik(dev.toiletCode);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.nodeId || d.id}>
                          {d.nodeId} — {d.name} ({d.toiletCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Target Bilik Toilet</label>
                    <select
                      value={injectBilik}
                      onChange={(e) => setInjectBilik(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer"
                    >
                      {toilets.map((t) => (
                        <option key={t.id} value={t.code}>
                          {t.code} ({t.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">ID Node ESP32</label>
                    <input
                      type="text"
                      value={injectDeviceId}
                      onChange={(e) => setInjectDeviceId(e.target.value)}
                      placeholder="e.g. ESP32-TK-01A"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Kadar Amonia MQ-137 (PPM)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={injectAmonia}
                      onChange={(e) => setInjectAmonia(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">&gt;25 PPM = Alert Bahaya</span>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Status Bilik (PIR)</label>
                    <select
                      value={injectOccupied ? 'true' : 'false'}
                      onChange={(e) => setInjectOccupied(e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="false">Kosong (Pintu Terbuka)</option>
                      <option value="true">Terisi (Pintu Tertutup)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Suhu (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={injectTemp}
                      onChange={(e) => setInjectTemp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Lembab (%)</label>
                    <input
                      type="number"
                      value={injectHumidity}
                      onChange={(e) => setInjectHumidity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Lux</label>
                    <input
                      type="number"
                      value={injectLux}
                      onChange={(e) => setInjectLux(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Sabun (%)</label>
                    <input
                      type="number"
                      value={injectSoap}
                      onChange={(e) => setInjectSoap(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Tisu (%)</label>
                    <input
                      type="number"
                      value={injectTissue}
                      onChange={(e) => setInjectTissue(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Flow (LPM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={injectFlow}
                      onChange={(e) => setInjectFlow(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInjectModal(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Kirim Telemetri ke Backend
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
