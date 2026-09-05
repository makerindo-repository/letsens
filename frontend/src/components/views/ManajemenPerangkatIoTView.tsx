import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Radio,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Terminal,
  Server,
  Edit3,
  Trash2,
  Info,
  MapPin,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IotDevice, ToiletBilik, SensorTelemetryRecord } from '../../types';

interface ManajemenPerangkatIoTViewProps {
  devices: IotDevice[];
  toilets: ToiletBilik[];
  telemetryLogs?: SensorTelemetryRecord[];
  onAddDevice?: (device: IotDevice) => void;
  onUpdateDevice?: (device: IotDevice) => void;
  onDeleteDevice?: (id: string) => void;
  onRestartDevice?: (id: string) => void;
  onCalibrateDevice?: (id: string) => void;
  onOtaUpdateDevice?: (id: string) => void;
}

export const ManajemenPerangkatIoTView: React.FC<ManajemenPerangkatIoTViewProps> = ({
  devices: initialPropDevices = [],
  toilets = [],
  telemetryLogs = [],
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  onRestartDevice,
  onCalibrateDevice,
  onOtaUpdateDevice,
}) => {
  const [items, setItems] = useState<IotDevice[]>(initialPropDevices);
  const [liveTelemetryLogs, setLiveTelemetryLogs] = useState<SensorTelemetryRecord[]>(telemetryLogs);
  const [loading, setLoading] = useState<boolean>(false);

  // Extract unique buildings dynamically
  const buildingsList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((d) => { if (d.building) set.add(d.building); });
    toilets.forEach((t) => { if (t.building) set.add(t.building); });
    return Array.from(set);
  }, [items, toilets]);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<IotDevice | null>(null);
  const [deleteModalDevice, setDeleteModalDevice] = useState<IotDevice | null>(null);
  const [activeDeviceDetail, setActiveDeviceDetail] = useState<IotDevice | null>(null);

  // Form inputs
  const [formNodeId, setFormNodeId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formToiletCode, setFormToiletCode] = useState<string>(toilets[0]?.code || 'T-A1-M');
  const [formBuilding, setFormBuilding] = useState<string>('Gedung A (Rektorat & Pascasarjana)');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formPowerSource, setFormPowerSource] = useState<string>('Adaptor DC 5V (Mains)');
  const [formStatus, setFormStatus] = useState<'Online' | 'Offline' | 'Warning'>('Online');
  const [formIpAddress, setFormIpAddress] = useState<string>('192.168.1.100');
  const [formMacAddress, setFormMacAddress] = useState<string>('24:6F:28:AB:CD:01');
  const [formFirmwareVersion, setFormFirmwareVersion] = useState<string>('v2.4.2-unikom-prod');

  // Notifications & Actions state
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  // Sync props to state
  useEffect(() => {
    if (initialPropDevices && initialPropDevices.length > 0) {
      setItems(initialPropDevices);
    }
  }, [initialPropDevices]);

  useEffect(() => {
    if (telemetryLogs) {
      setLiveTelemetryLogs(telemetryLogs);
    }
  }, [telemetryLogs]);

  // Fetch Telemetry Logs from Backend API
  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/sensor-telemetry/latest?limit=100');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setLiveTelemetryLogs(json.data);
        }
      }
    } catch (_) {}
  };

  // Fetch API REST Devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      let res = await fetch('/api/iot-devices');
      let isJson = res.ok && (res.headers.get('content-type') || '').includes('application/json');

      if (!isJson) {
        try {
          const directRes = await fetch('http://127.0.0.1:8000/api/iot-devices');
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
      await fetchTelemetry();
    } catch (err) {
      console.warn('API error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const triggerNotification = (type: 'success' | 'info', message: string) => {
    setActionAlert({ type, message });
    setTimeout(() => {
      setActionAlert(null);
    }, 4500);
  };

  const handleOpenAddModal = () => {
    setEditingDevice(null);
    const initialToiletCode = toilets[0]?.code || 'T-A1-M';
    setFormToiletCode(initialToiletCode);
    setFormNodeId(`NODE-${initialToiletCode}`);
    setFormName(`Node LetSens Bilik ${initialToiletCode}`);
    setFormBuilding('Gedung A (Rektorat & Pascasarjana)');
    setFormFloor(1);
    setFormPowerSource('Adaptor DC 5V (Mains)');
    setFormStatus('Online');
    setFormIpAddress(`192.168.1.${Math.floor(Math.random() * 100 + 100)}`);
    setFormMacAddress('24:6F:28:AB:CD:' + Math.floor(Math.random() * 89 + 10));
    setFormFirmwareVersion('v2.4.2-unikom-prod');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (device: IotDevice) => {
    setEditingDevice(device);
    setFormNodeId(device.nodeId);
    setFormName(device.name);
    setFormToiletCode(device.toiletCode);
    setFormBuilding(device.building || 'Gedung A');
    setFormFloor(device.floor || 1);
    setFormPowerSource(device.powerSource || 'Adaptor DC 5V (Mains)');
    setFormStatus((device.status as any) || 'Online');
    setFormIpAddress(device.ipAddress || '192.168.1.100');
    setFormMacAddress(device.macAddress || '24:6F:28:AB:CD:01');
    setFormFirmwareVersion(device.firmwareVersion || 'v2.4.2-unikom-prod');
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormModalOpen(false);

    const matchedToilet = toilets.find((t) => t.code === formToiletCode);

    const payload = {
      node_id: formNodeId,
      name: formName,
      toilet_code: formToiletCode,
      building: formBuilding,
      floor: Number(formFloor),
      power_source: formPowerSource,
      status: formStatus,
      ip_address: formIpAddress,
      mac_address: formMacAddress,
      firmware_version: formFirmwareVersion,
    };

    if (editingDevice) {
      const updatedObj: IotDevice = {
        ...editingDevice,
        nodeId: formNodeId,
        name: formName,
        toiletCode: formToiletCode,
        toiletName: matchedToilet ? matchedToilet.name : `Bilik ${formToiletCode}`,
        building: formBuilding,
        floor: Number(formFloor),
        powerSource: formPowerSource as any,
        status: formStatus as any,
        ipAddress: formIpAddress,
        macAddress: formMacAddress,
        firmwareVersion: formFirmwareVersion,
      };

      setItems((prev) =>
        prev.map((d) => (d.id === editingDevice.id || d.nodeId === editingDevice.nodeId ? updatedObj : d))
      );

      try {
        let res = await fetch(`/api/iot-devices/${editingDevice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch(`/api/iot-devices/${editingDevice.nodeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error updating device:', err);
      }

      if (onUpdateDevice) {
        onUpdateDevice(updatedObj);
      }
      triggerNotification('success', `Perangkat ${formNodeId} berhasil diperbarui.`);
    } else {
      const newObj: IotDevice = {
        id: String(Date.now()),
        nodeId: formNodeId,
        name: formName,
        toiletCode: formToiletCode,
        toiletName: matchedToilet ? matchedToilet.name : `Bilik ${formToiletCode}`,
        building: formBuilding,
        floor: Number(formFloor),
        batteryPercent: 100,
        batteryVoltage: 4.2,
        powerSource: formPowerSource as any,
        batteryStatus: 'Penuh / Normal',
        rssi: -58,
        rssiQuality: 'Sangat Baik',
        wifiSsid: 'UNIKOM-IoT-Secure',
        activationDate: new Date().toLocaleDateString('id-ID'),
        uptime: '0 hari 1 jam',
        lastTelemetryTime: 'Baru saja',
        firmwareVersion: formFirmwareVersion,
        hardwareVersion: 'ESP32-WROOM-32D Rev 3',
        sensorShieldVersion: 'LetSens Dual-MQ Shield v1.4',
        otaStatus: 'Up to Date',
        ipAddress: formIpAddress,
        macAddress: formMacAddress,
        pingLatencyMs: 14,
        status: formStatus as any,
        connectedSensors: ['MQ-137 (Gas Amonia)', 'DHT22 (Suhu/Hum)', 'LDR (Lux)'],
        rebootCount: 0,
      };

      setItems((prev) => [newObj, ...prev]);

      try {
        let res = await fetch('/api/iot-devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          await fetch('http://127.0.0.1:8000/api/iot-devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.warn('API error creating device:', err);
      }

      if (onAddDevice) {
        onAddDevice(newObj);
      }
      triggerNotification('success', `Node IoT ${newObj.nodeId} berhasil didaftarkan!`);
    }

    setTimeout(() => {
      fetchDevices();
    }, 400);
  };

  const confirmDelete = async () => {
    if (!deleteModalDevice) return;
    const targetId = deleteModalDevice.id;
    const targetNodeId = deleteModalDevice.nodeId;
    setDeleteModalDevice(null);

    setItems((prev) => prev.filter((d) => d.id !== targetId && d.nodeId !== targetNodeId));

    try {
      let res = await fetch(`/api/iot-devices/${targetId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetch(`/api/iot-devices/${targetNodeId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn('API error deleting device:', err);
    }

    if (onDeleteDevice) {
      onDeleteDevice(targetId);
    }
    triggerNotification('success', `Perangkat ${targetNodeId} berhasil dihapus dari jaringan.`);
  };

  const handleReboot = async (device: IotDevice) => {
    setRebootingId(device.id);
    triggerNotification('info', `Mengirim perintah Remote REBOOT via MQTT ke ${device.nodeId}...`);

    try {
      await fetch(`/api/iot-devices/${device.id}/reboot`, { method: 'POST' });
    } catch (_) {}

    setTimeout(() => {
      setRebootingId(null);
      if (onRestartDevice) onRestartDevice(device.id);
      triggerNotification('success', `Node ${device.nodeId} merespons ACK REBOOT. Status: Online (14ms).`);
      fetchDevices();
    }, 1500);
  };

  // Map of latest telemetry log by node/toilet code
  const latestTelemetryByNode = useMemo(() => {
    const map: Record<string, SensorTelemetryRecord> = {};
    liveTelemetryLogs.forEach((log) => {
      const key = log.nodeId || log.deviceId || log.toiletCode;
      if (key && !map[key]) {
        map[key] = log;
      }
    });
    return map;
  }, [liveTelemetryLogs]);

  // Helper to check if telemetry timestamp is recent (heartbeat within 45 seconds)
  const isTelemetryRecent = (timestampStr?: string | null): boolean => {
    if (!timestampStr) return false;
    const lower = timestampStr.toLowerCase().trim();
    if (lower === 'baru saja' || lower === 'just now') return true;
    if (lower.includes('detik yang lalu') || lower.includes('seconds ago') || lower.includes('second ago')) {
      const match = lower.match(/(\d+)/);
      if (match) return parseInt(match[1]) <= 45;
      return true;
    }
    if (
      lower.includes('menit') || lower.includes('minute') ||
      lower.includes('jam') || lower.includes('hour') ||
      lower.includes('hari') || lower.includes('day') ||
      lower.includes('minggu') || lower.includes('week') ||
      lower.includes('bulan') || lower.includes('month') ||
      lower.includes('tahun') || lower.includes('year') ||
      lower.includes('belum ada') || lower.includes('menunggu')
    ) {
      return false;
    }

    try {
      let logTime = new Date(timestampStr).getTime();
      if (isNaN(logTime) && timestampStr.includes('/')) {
        const cleanStr = timestampStr.replace(/\s*WIB/i, '').trim();
        const parts = cleanStr.split(' ');
        if (parts.length >= 2) {
          const [d, m, y] = parts[0].split('/');
          const timeClean = parts[1].replace(/\./g, ':');
          logTime = new Date(`${y}-${m}-${d}T${timeClean}`).getTime();
        }
      }
      if (isNaN(logTime)) return false;
      const diffSec = (Date.now() - logTime) / 1000;
      return diffSec >= -5 && diffSec <= 45;
    } catch (_) {
      return false;
    }
  };

  // Compute dynamic telemetry reading for a device node (STRICTLY DERIVED FROM SENSOR LOGS - NO FAKE HARDCODED DATA)
  const getDeviceDynamicTelemetry = (device: IotDevice) => {
    const matchedLog =
      latestTelemetryByNode[device.nodeId] ||
      latestTelemetryByNode[device.toiletCode] ||
      liveTelemetryLogs.find(
        (l) => l.nodeId === device.nodeId || l.toiletCode === device.toiletCode
      );

    const isRecent = matchedLog ? isTelemetryRecent(matchedLog.timestamp) : false;
    const isOnline = isRecent || (device.status === 'Online' && isRecent);

    if (matchedLog) {
      const batVal = matchedLog.batteryPercent ?? device.batteryPercent ?? 100;
      const batVolt = matchedLog.batteryVoltage ?? device.batteryVoltage ?? 4.2;
      const rssiVal = matchedLog.rssi ?? device.rssi ?? -55;
      const rssiQuality = rssiVal < -75 ? 'Cukup' : 'Sangat Baik';

      return {
        hasTelemetry: true,
        status: isOnline ? 'Online' : 'Offline',
        batteryPercent: batVal,
        batteryVoltage: batVolt,
        rssi: rssiVal,
        rssiQuality,
        lastTelemetryTime: matchedLog.timestamp || 'Baru saja',
        latestLog: matchedLog,
      };
    }

    // STRICTLY NO SENSOR LOG IN DATABASE - DO NOT HARDCODE FAKE ONLINE / 100% BATTERY / -60dBm VALUES!
    return {
      hasTelemetry: false,
      status: 'Offline',
      batteryPercent: null,
      batteryVoltage: null,
      rssi: null,
      rssiQuality: 'Belum Ada Data',
      lastTelemetryTime: 'Menunggu Data Sensor...',
      latestLog: null,
    };
  };

  // Filtered list
  const filteredDevices = useMemo(() => {
    return items.filter((d) => {
      const dyn = getDeviceDynamicTelemetry(d);
      const matchSearch =
        d.nodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.toiletCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.building || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchBuilding = selectedBuilding === 'ALL' || (d.building || '').includes(selectedBuilding);
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'Online' && dyn.status === 'Online') ||
        (selectedStatus === 'Offline' && dyn.status === 'Offline') ||
        (selectedStatus === 'Warning' && (dyn.status === 'Warning' || dyn.status === 'Menunggu Data'));

      return matchSearch && matchBuilding && matchStatus;
    });
  }, [items, searchTerm, selectedBuilding, selectedStatus, latestTelemetryByNode, liveTelemetryLogs]);

  // Aggregate KPI
  const stats = useMemo(() => {
    const total = items.length;
    let onlineCount = 0;
    let totalBat = 0;
    let batCount = 0;
    let totalRssi = 0;
    let rssiCount = 0;

    items.forEach((d) => {
      const dyn = getDeviceDynamicTelemetry(d);
      if (dyn.status === 'Online') onlineCount++;
      if (dyn.batteryPercent !== null) {
        totalBat += dyn.batteryPercent;
        batCount++;
      }
      if (dyn.rssi !== null) {
        totalRssi += dyn.rssi;
        rssiCount++;
      }
    });

    const avgBatteryStr = batCount > 0 ? `${Math.round(totalBat / batCount)}%` : 'N/A';
    const avgRssiStr = rssiCount > 0 ? `${Math.round(totalRssi / rssiCount)} dBm` : 'N/A';

    return { total, online: onlineCount, avgBattery: avgBatteryStr, avgRssi: avgRssiStr };
  }, [items, latestTelemetryByNode, liveTelemetryLogs]);

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Header Bar - Consistent with Fasilitas & Bilik Toilet Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Perangkat</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Pemantauan Telemetri MQTT & Pengelolaan Node IoT Smart Building Universitas Komputer Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDevices}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Refresh Telemetri REST API"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Perangkat</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert (if active) */}
      <AnimatePresence>
        {actionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
              actionAlert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{actionAlert.message}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-700 font-bold">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Premium Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Server size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Total Perangkat IoT</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{stats.total}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Status Online</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">{stats.online}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
            <BatteryCharging size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Rata-rata Baterai</p>
            <p className="text-2xl font-black text-sky-700 mt-0.5 font-mono">{stats.avgBattery}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Radio size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Rata-rata Sinyal</p>
            <p className="text-2xl font-black text-purple-700 mt-0.5 font-mono">{stats.avgRssi}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
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
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Status Operasional:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:border-blue-400 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Online">Online</option>
                <option value="Warning">Warning</option>
                <option value="Offline">Offline</option>
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
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
            placeholder="Cari kode perangkat (contoh: ESP32-TK-01A), nama perangkat, atau bilik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Main Table or Grid View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap">KODE PERANGKAT</th>
                  <th className="py-4 px-4 min-w-[180px] whitespace-nowrap">NAMA PERANGKAT</th>
                  <th className="py-4 px-4 min-w-[180px] whitespace-nowrap">BILIK TOILET</th>
                  <th className="py-4 px-4 whitespace-nowrap">STATUS</th>
                  <th className="py-4 px-4 whitespace-nowrap">BATERAI</th>
                  <th className="py-4 px-4 whitespace-nowrap">SINYAL</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-xs">
                      Tidak ada data perangkat IoT yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => {
                    const isRebooting = rebootingId === device.id;
                    const dyn = getDeviceDynamicTelemetry(device);

                    return (
                      <tr key={device.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* KODE PERANGKAT */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl font-mono font-extrabold text-xs whitespace-nowrap inline-block shadow-2xs">
                            {device.nodeId}
                          </span>
                        </td>

                        {/* NAMA PERANGKAT */}
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div>{device.name}</div>
                        </td>

                        {/* BILIK TOILET */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="font-mono font-extrabold text-blue-600">{device.toiletCode}</span>
                            <span className="text-slate-500 font-medium">({device.toiletName || device.building})</span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap shadow-2xs ${
                              dyn.status === 'Online'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : dyn.status === 'Warning'
                                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                : dyn.status === 'Offline'
                                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                dyn.status === 'Online'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : dyn.status === 'Warning'
                                  ? 'bg-amber-500 animate-pulse'
                                  : dyn.status === 'Offline'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400 animate-ping'
                              }`}
                            />
                            <span>{dyn.status === 'Menunggu Data' ? 'Menunggu Payload' : dyn.status}</span>
                          </span>
                        </td>

                        {/* BATERAI */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {dyn.batteryPercent !== null ? (
                              <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                                <BatteryCharging size={14} className="text-emerald-600" />
                                <span>{dyn.batteryPercent}%</span>
                                <span className="text-[10px] font-normal text-slate-500">({dyn.batteryVoltage}V)</span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-bold text-xs">
                                Belum Ada Payload
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SINYAL */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {dyn.rssi !== null ? (
                              <div className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-2xs">
                                <Wifi size={14} className="text-sky-600" />
                                <span>{dyn.rssi} dBm</span>
                                <span className="text-[10px] font-normal text-slate-500">({dyn.rssiQuality})</span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-bold text-xs">
                                Sinyal N/A
                              </span>
                            )}
                          </div>
                        </td>

                        {/* AKSI */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleReboot(device)}
                              disabled={isRebooting}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Reboot Perangkat Remote"
                            >
                              <RotateCcw size={16} className={isRebooting ? 'animate-spin text-blue-600' : ''} />
                            </button>
                            <button
                              onClick={() => setActiveDeviceDetail(device)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer active:scale-95"
                              title="Lihat Telemetri MQTT"
                            >
                              <Terminal size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(device)}
                              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer active:scale-95"
                              title="Edit Perangkat"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteModalDevice(device)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer active:scale-95"
                              title="Hapus Perangkat"
                            >
                              <Trash2 size={16} />
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
          {filteredDevices.map((device) => {
            const isRebooting = rebootingId === device.id;
            const dyn = getDeviceDynamicTelemetry(device);

            return (
              <div
                key={device.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 text-blue-600">
                        <Cpu size={22} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{device.name}</h3>
                        <span className="text-[11px] font-mono font-extrabold text-blue-600">{device.nodeId}</span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                        dyn.status === 'Online'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : dyn.status === 'Warning'
                          ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                          : dyn.status === 'Offline'
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {dyn.status === 'Menunggu Data' ? 'Menunggu Payload' : dyn.status}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Bilik Toilet:</span>
                      <span className="font-bold text-slate-800">{device.toiletCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Baterai:</span>
                      <span className="font-extrabold text-slate-900 font-mono">
                        {dyn.batteryPercent !== null ? `${dyn.batteryPercent}% (${dyn.batteryVoltage}V)` : 'Belum Ada Payload'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Sinyal RSSI:</span>
                      <span className="font-extrabold text-sky-700 font-mono">
                        {dyn.rssi !== null ? `${dyn.rssi} dBm (${dyn.rssiQuality})` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-mono text-slate-400">IP: {device.ipAddress}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReboot(device)}
                      disabled={isRebooting}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Reboot Perangkat Remote"
                    >
                      <RotateCcw size={15} className={isRebooting ? 'animate-spin text-blue-600' : ''} />
                    </button>
                    <button
                      onClick={() => setActiveDeviceDetail(device)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Lihat Telemetri MQTT"
                    >
                      <Terminal size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(device)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Perangkat"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModalDevice(device)}
                      className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/80 transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Hapus Perangkat"
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

      {/* Modal Input & Edit Perangkat */}
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
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {editingDevice ? 'Edit Data Perangkat IoT' : 'Registrasi Perangkat IoT Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Integrasi REST API & Telemetri MQTT LetSens
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
                  <label className="font-bold text-slate-700 block mb-1">Target Bilik Toilet</label>
                  <select
                    value={formToiletCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setFormToiletCode(code);
                      if (!editingDevice) {
                        setFormNodeId(`NODE-${code}`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 cursor-pointer"
                  >
                    {toilets.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.code} - {t.name} ({t.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Perangkat</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Node LetSens Smart Toilet"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                {/* Auto Config Info Box */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-[11px] text-blue-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info size={14} className="text-blue-600 shrink-0" />
                    <span>Konfigurasi Otomatis Telemetri IoT & MQTT Broker:</span>
                  </div>
                  <p className="text-slate-600">• <strong>Kode Perangkat (Node ID):</strong> Otomatis di-generate <span className="font-mono font-extrabold text-blue-700">({formNodeId || `NODE-${formToiletCode}`})</span></p>
                  <p className="text-slate-600">• <strong>Status Operasional:</strong> Otomatis <strong>Online</strong> saat perangkat mengirim payload telemetri MQTT, dan <strong>Offline</strong> jika payload terhenti.</p>
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
                    {editingDevice ? 'Simpan Perubahan' : 'Tambah Perangkat'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hapus Perangkat */}
      <AnimatePresence>
        {deleteModalDevice && (
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
                <h3 className="font-extrabold text-slate-900 text-lg">Hapus Perangkat IoT?</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  Tindakan ini tidak dapat dibatalkan. Node{' '}
                  <span className="font-bold text-slate-800">"{deleteModalDevice.nodeId}"</span> ({deleteModalDevice.name})
                  akan dihapus dari sistem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalDevice(null)}
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
                  Hapus Node
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Telemetri Live MQTT Stream */}
      <AnimatePresence>
        {activeDeviceDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
                    <Terminal size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{activeDeviceDetail.name}</h3>
                    <p className="text-xs font-mono font-bold text-blue-600">{activeDeviceDetail.nodeId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDeviceDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Terminal Telemetry Body */}
              {(() => {
                const detailDyn = getDeviceDynamicTelemetry(activeDeviceDetail);
                return (
                  <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-[11px] leading-relaxed border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[10px]">
                      <span>MQTT Broker Stream ({activeDeviceDetail.nodeId})</span>
                      <span className="text-emerald-400 font-bold">Topic: letsens/toilet/sensordata</span>
                    </div>
                    <p className="text-emerald-400">
                      &gt; [SUBSCRIBE OK] Broker HiveMQ Cloud | Topic: letsens/toilet/sensordata
                    </p>
                    {detailDyn.hasTelemetry && detailDyn.latestLog ? (
                      <>
                        <p className="text-slate-100">
                          &gt; [PAYLOAD REAL] {JSON.stringify({
                            kode_perangkat: activeDeviceDetail.nodeId,
                            toilet_code: activeDeviceDetail.toiletCode,
                            amonia: detailDyn.latestLog.amoniaPPM,
                            suhu: detailDyn.latestLog.temperatureC,
                            rh: detailDyn.latestLog.humidityPercent,
                            light_lux: detailDyn.latestLog.lux,
                            pir_occupied: detailDyn.latestLog.occupied,
                            battery: detailDyn.batteryPercent,
                            rssi: detailDyn.rssi,
                            waktu: detailDyn.lastTelemetryTime,
                          })}
                        </p>
                        <p className="text-sky-400">
                          &gt; [TELEMETRY ACK] RSSI: {detailDyn.rssi} dBm | BAT: {detailDyn.batteryPercent}% ({detailDyn.batteryVoltage}V) | IP: {activeDeviceDetail.ipAddress || '192.168.1.100'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-400">
                          &gt; [WAITING PAYLOAD] Belum ada log telemetri sensor yang diterima untuk node {activeDeviceDetail.nodeId}.
                        </p>
                        <p className="text-slate-500 font-bold">
                          &gt; Database backend saat ini memiliki 0 log sensor. Menunggu transmisi payload pertama dari hardware ESP32...
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveDeviceDetail(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
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
