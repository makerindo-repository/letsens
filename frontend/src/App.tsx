import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X, Building, Phone, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  MenuView,
  MenuKey,
  ToiletBilik,
  IotDevice,
  PetugasKebersihan,
  PerlengkapanItem,
  JadwalPemeliharaanItem,
  RekapKerusakanItem,
  RekapPerbaikanItem,
  SensorTelemetryRecord,
  SystemLogEntry,
  PengaturanSistemConfig,
  PengaturanAplikasiConfig,
  UtilitasItem,
} from './types';
import {
  initialToilets,
  initialIotDevices,
  initialPetugas,
  initialPerlengkapan,
  initialJadwalPemeliharaan,
  initialRekapKerusakan,
  initialRekapPerbaikan,
  initialTelemetryLogs,
  initialSystemLogs,
  initialPengaturanSistem,
  initialPengaturanAplikasi,
  initialUtilitas,
} from './data/initialData';

// API Services
import { apiClient } from './api/client';
import { toiletApi } from './api/toiletApi';
import { telemetryApi } from './api/telemetryApi';
import { iotDeviceApi } from './api/iotDeviceApi';
import { staffApi } from './api/staffApi';
import { supplyApi } from './api/supplyApi';
import { maintenanceApi } from './api/maintenanceApi';
import { activityLogApi } from './api/activityLogApi';
import { settingsApi } from './api/settingsApi';
import { authApi, AuthUser } from './api/authApi';

// Components
import { isMenuAllowedForRole } from './utils/rbac';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { LoginPage } from './components/LoginPage';

// Views
import { DashboardView } from './components/views/DashboardView';
import { DataSensorView } from './components/views/DataSensorView';
import { FasilitasView } from './components/views/FasilitasView';
import { DataUtilitasView } from './components/views/DataUtilitasView';
import { ManajemenToiletView } from './components/views/ManajemenToiletView';
import { ManajemenPerangkatIoTView } from './components/views/ManajemenPerangkatIoTView';
import { ManajemenPetugasView } from './components/views/ManajemenPetugasView';
import { ManajemenPerlengkapanView } from './components/views/ManajemenPerlengkapanView';
import { JadwalPemeliharaanView } from './components/views/JadwalPemeliharaanView';
import { RekapKerusakanView } from './components/views/RekapKerusakanView';
import { RekapPerbaikanView } from './components/views/RekapPerbaikanView';
import { LetsensAIView } from './components/views/LetsensAIView';
import { LaporanView } from './components/views/LaporanView';
import { PengaturanView } from './components/views/PengaturanView';
import { LogsView } from './components/views/LogsView';
import GlosariumView from './components/views/GlosariumView';
import { TentangView } from './components/views/TentangView';
import { ProfileView } from './components/views/ProfileView';
import { NotFoundView } from './components/views/NotFoundView';

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const cached = localStorage.getItem('letsens_user');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });

  const getInitialMenu = (): MenuView => {
    const rawPath = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    if (rawPath === '' || rawPath === 'dasbor' || rawPath === 'dashboard') return 'dasbor';
    if (rawPath === 'data-sensor' || rawPath === 'telemetri' || rawPath === 'sensor') return 'data-sensor';
    if (rawPath === 'glosarium' || rawPath === 'kamus' || rawPath === 'glossary') return 'glosarium';
    if (rawPath === 'tentang' || rawPath === 'about') return 'tentang';
    if (rawPath === 'fasilitas' || rawPath === 'data-utilitas' || rawPath === 'utilitas') return 'fasilitas';
    if (rawPath === 'bilik-toilet' || rawPath === 'manajemen-toilet' || rawPath === 'toilet') return 'bilik-toilet';
    if (rawPath === 'perangkat' || rawPath === 'manajemen-iot' || rawPath === 'iot') return 'perangkat';
    if (rawPath === 'pengguna' || rawPath === 'manajemen-petugas' || rawPath === 'staff') return 'pengguna';
    if (rawPath === 'stok-perlengkapan' || rawPath === 'manajemen-perlengkapan' || rawPath === 'perlengkapan') return 'stok-perlengkapan';
    if (rawPath === 'jadwal-pemeliharaan' || rawPath === 'pemeliharaan') return 'jadwal-pemeliharaan';
    if (rawPath === 'rekap-kerusakan' || rawPath === 'kerusakan') return 'rekap-kerusakan';
    if (rawPath === 'rekap-perbaikan' || rawPath === 'perbaikan') return 'rekap-perbaikan';
    if (rawPath === 'letsens-ai' || rawPath === 'ai') return 'letsens-ai';
    if (rawPath === 'laporan' || rawPath === 'reports') return 'laporan';
    if (rawPath === 'pengaturan' || rawPath === 'pengaturan-sistem' || rawPath === 'pengaturan-aplikasi' || rawPath === 'settings') return 'pengaturan';
    if (rawPath === 'log-aktivitas' || rawPath === 'logs' || rawPath === 'activity-logs') return 'log-aktivitas';
    if (rawPath === 'profile' || rawPath === 'profil-saya' || rawPath === 'profil') return 'profile';
    return 'not-found';
  };

  const [currentMenu, setCurrentMenu] = useState<MenuView>(getInitialMenu);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>(
    () => authUser?.role || 'Super Admin'
  );

  const handleSelectMenu = (menu: MenuView) => {
    setCurrentMenu(menu);
    const path = menu === 'dashboard' ? 'dasbor' : menu;
    const targetPath = `/${path}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setCurrentUserRole(newRole);
    if (!isMenuAllowedForRole(currentMenu, newRole)) {
      handleSelectMenu('dasbor');
    }
  };

  const handleLoginSuccess = (user: AuthUser, _token: string) => {
    setAuthUser(user);
    setCurrentUserRole(user.role);
    handleSelectMenu('dasbor');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    localStorage.removeItem('letsens_token');
    localStorage.removeItem('letsens_user');
    setAuthUser(null);
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('letsens_token');
      if (token) {
        try {
          const res = await authApi.me();
          if (res.success && res.data) {
            setAuthUser(res.data);
            setCurrentUserRole(res.data.role);
          } else {
            handleLogout();
          }
        } catch (_) {
          handleLogout();
        }
      }
    };
    verifyToken();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentMenu(getInitialMenu());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Core App States
  const [toilets, setToilets] = useState<ToiletBilik[]>(initialToilets);
  const [iotDevices, setIotDevices] = useState<IotDevice[]>(initialIotDevices);
  const [staffList, setStaffList] = useState<PetugasKebersihan[]>(initialPetugas);
  const [supplies, setSupplies] = useState<PerlengkapanItem[]>(initialPerlengkapan);
  const [utilitasList, setUtilitasList] = useState<UtilitasItem[]>(initialUtilitas);
  const [schedules, setSchedules] = useState<JadwalPemeliharaanItem[]>(initialJadwalPemeliharaan);
  const [damages, setDamages] = useState<RekapKerusakanItem[]>(initialRekapKerusakan);
  const [repairs, setRepairs] = useState<RekapPerbaikanItem[]>(initialRekapPerbaikan);
  const [telemetryLogs, setTelemetryLogs] = useState<SensorTelemetryRecord[]>(initialTelemetryLogs);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(initialSystemLogs);
  const [systemConfig, setSystemConfig] = useState<PengaturanSistemConfig>(initialPengaturanSistem);
  const [appConfig, setAppConfig] = useState<PengaturanAplikasiConfig>(initialPengaturanAplikasi);

  // Live telemetry simulation toggle
  const [isSimulating, setIsSimulating] = useState<boolean>(true);



  // Quick Dispatch Staff Modal
  const [dispatchModalData, setDispatchModalData] = useState<{
    open: boolean;
    staffName: string;
    phone: string;
    toiletCode: string;
    issue: string;
  }>({
    open: false,
    staffName: '',
    phone: '',
    toiletCode: '',
    issue: '',
  });

  // Calculate unread high severity damages
  const unreadAlertsCount = damages.filter((d) => d.status === 'Menunggu' && (d.severity === 'Darurat' || d.severity === 'Tinggi')).length;

  // Add system log helper
  const addSystemLog = (
    level: SystemLogEntry['level'],
    module: string,
    event: string,
    message: string,
    details?: string
  ) => {
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB',
      level,
      module,
      event,
      message,
      details,
    };
    setSystemLogs((prev) => [newLog, ...prev.slice(0, 150)]);

    // Persist to Laravel Backend Database via REST API
    const statusMap: Record<string, 'success' | 'warning' | 'error'> = {
      SUCCESS: 'success',
      INFO: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      AI_AUDIT: 'success',
    };

    activityLogApi
      .record({
        action: message,
        module: module,
        status: statusMap[level] || 'success',
        user: 'Super Admin',
        details: details,
      })
      .catch(() => {});
  };

  // Initial Fetch Data from Laravel REST API Backend
  useEffect(() => {
    const syncBackendData = async () => {
      try {
        const [toiletsRes, devicesRes, staffRes, suppliesRes, schedRes, dmgRes, repRes, telRes, fasRes, sysSetRes, appSetRes, actLogRes] = await Promise.allSettled([
          toiletApi.getAllToilets(),
          iotDeviceApi.getAllDevices(),
          staffApi.getAllStaff(),
          supplyApi.getAllSupplies(),
          maintenanceApi.getSchedules(),
          maintenanceApi.getDamages(),
          maintenanceApi.getRepairs(),
          telemetryApi.getLatestLogs(),
          apiClient.get<any[]>('/fasilitas'),
          settingsApi.getByGroup('system'),
          settingsApi.getByGroup('app'),
          activityLogApi.getAll({ limit: 150 }),
        ]);

        if (toiletsRes.status === 'fulfilled' && Array.isArray(toiletsRes.value?.data)) setToilets(toiletsRes.value.data);
        if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value?.data)) setIotDevices(devicesRes.value.data);
        if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.data)) setStaffList(staffRes.value.data);
        if (suppliesRes.status === 'fulfilled' && Array.isArray(suppliesRes.value?.data)) setSupplies(suppliesRes.value.data);
        if (schedRes.status === 'fulfilled' && Array.isArray(schedRes.value?.data)) setSchedules(schedRes.value.data);
        if (dmgRes.status === 'fulfilled' && Array.isArray(dmgRes.value?.data)) setDamages(dmgRes.value.data);
        if (repRes.status === 'fulfilled' && Array.isArray(repRes.value?.data)) setRepairs(repRes.value.data);
        if (telRes.status === 'fulfilled' && Array.isArray(telRes.value?.data)) setTelemetryLogs(telRes.value.data);
        if (actLogRes.status === 'fulfilled' && Array.isArray(actLogRes.value?.data)) setSystemLogs(actLogRes.value.data);
        
        if (sysSetRes.status === 'fulfilled' && sysSetRes.value?.data) {
          const data = sysSetRes.value.data;
          setSystemConfig((prev) => ({
            ...prev,
            mqttBrokerHost: data.mqtt_broker_host || prev.mqttBrokerHost,
            mqttPort: parseInt(data.mqtt_port) || prev.mqttPort,
            mqttTopicRoot: data.mqtt_topic_root || prev.mqttTopicRoot,
            telemetryIntervalSeconds: parseInt(data.telemetry_interval_seconds) || prev.telemetryIntervalSeconds,
            apiEndpoint: data.api_endpoint || prev.apiEndpoint,
            amoniaWarningThreshold: parseFloat(data.amonia_warning_threshold) || prev.amoniaWarningThreshold,
            amoniaDangerThreshold: parseFloat(data.amonia_danger_threshold) || prev.amoniaDangerThreshold,
            lowSoapThresholdPercent: parseInt(data.low_soap_threshold_percent) || prev.lowSoapThresholdPercent,
            lowTissueThresholdPercent: parseInt(data.low_tissue_threshold_percent) || prev.lowTissueThresholdPercent,
            maxOccupancyMinutesAlert: parseInt(data.max_occupancy_minutes_alert) || prev.maxOccupancyMinutesAlert,
            autoTriggerBlower: data.auto_trigger_blower === 'true',
            geminiApiKey: data.gemini_api_key !== undefined ? data.gemini_api_key : prev.geminiApiKey || '',
          }));
        }

        if (appSetRes.status === 'fulfilled' && appSetRes.value?.data) {
          const data = appSetRes.value.data;
          setAppConfig((prev) => ({
            ...prev,
            appName: data.app_name || prev.appName,
            institution: data.institution || prev.institution,
            campusLocation: data.campus_location || prev.campusLocation,
            contactHotline: data.contact_hotline || prev.contactHotline,
            whatsappNotificationNumber: data.whatsapp_notification_number || prev.whatsappNotificationNumber,
            soundAlarmEnabled: data.sound_alarm_enabled === 'true',
          }));
        }

        if (fasRes.status === 'fulfilled' && fasRes.value && Array.isArray(fasRes.value.data)) {
          const mappedFasilitas = fasRes.value.data.map((raw: any, idx: number) => ({
            id: String(raw.id || idx + 1),
            no: idx + 1,
            namaFasilitas: raw.nama_fasilitas || raw.namaFasilitas || 'Fasilitas Sanitasi',
            utilitasName: raw.nama_fasilitas || raw.namaFasilitas || 'Fasilitas Sanitasi',
            toiletId: String(raw.toilet_id || '1'),
            toiletCode: raw.toilet_code || toilets[0]?.code || 'T-A1-F',
            location: raw.location || raw.location_name || 'Gedung A, Lt 1',
            building: raw.building || 'Gedung A',
            floor: Number(raw.floor || 1),
            kategori: raw.kategori || raw.category || 'Sanitasi & Kebersihan',
            jumlah: raw.jumlah || '1 unit',
            stokAngka: raw.stok_angka ?? 100,
            unit: raw.unit || 'unit',
            kondisi: raw.kondisi || 'Baik',
            status: raw.status || raw.statusTerakhir || 'Tersedia',
            petugasJawab: raw.petugas_jawab || staffList[0]?.name || 'Asep Saepulloh',
            terakhirDiperiksa: raw.terakhir_diperiksa || new Date().toISOString(),
            catatan: raw.catatan || '-',
          }));
          setUtilitasList(mappedFasilitas);
        }

        addSystemLog('SUCCESS', 'API_SYNC', 'BACKEND_CONNECTED', 'Data terikat terpusat dengan Backend Laravel REST API (http://localhost:8000/api)');
      } catch (err: any) {
        addSystemLog('WARNING', 'API_SYNC', 'FALLBACK_LOCAL', 'Backend Laravel offline, mengaktifkan data simulasi lokal');
      }
    };

    syncBackendData();
  }, []);

  // Persistent Background Telemetry Service (Runs Continuously Across Page Reloads & Tab Switches)
  const [isEmuStreaming, setIsEmuStreaming] = useState<boolean>(() => {
    return localStorage.getItem('letsens_emu_streaming') === 'true';
  });
  const [emuIntervalSec, setEmuIntervalSec] = useState<number>(() => {
    return parseInt(localStorage.getItem('letsens_emu_interval') || '15');
  });

  const iotDevicesRef = useRef(iotDevices);
  const toiletsRef = useRef(toilets);
  const isTickingRef = useRef(false);

  useEffect(() => {
    iotDevicesRef.current = iotDevices;
  }, [iotDevices]);

  useEffect(() => {
    toiletsRef.current = toilets;
  }, [toilets]);

  useEffect(() => {
    const handleStreamChange = () => {
      const active = localStorage.getItem('letsens_emu_streaming') === 'true';
      const interval = parseInt(localStorage.getItem('letsens_emu_interval') || '15');
      setIsEmuStreaming(active);
      setEmuIntervalSec(interval);
    };

    window.addEventListener('storage', handleStreamChange);
    window.addEventListener('letsens_stream_changed', handleStreamChange);
    return () => {
      window.removeEventListener('storage', handleStreamChange);
      window.removeEventListener('letsens_stream_changed', handleStreamChange);
    };
  }, []);

  // Background Telemetry Polling & Auto-Stream Loop
  useEffect(() => {
    let intervalId: any = null;

    const fireBackgroundStreamTick = async () => {
      if (isTickingRef.current) return;
      isTickingRef.current = true;

      try {
        const isOccupied = Math.random() > 0.55;
        const randAmonia = isOccupied
          ? parseFloat((Math.random() * 14 + 4.5).toFixed(2))
          : parseFloat((Math.random() * 3.5 + 0.5).toFixed(2));
        const randSuhu = parseFloat((Math.random() * 5 + 24.5).toFixed(1));
        const randRh = parseFloat((Math.random() * 25 + 55).toFixed(1));
        const randCahaya = isOccupied ? Math.floor(Math.random() * 150 + 350) : Math.floor(Math.random() * 250 + 50);
        const randRssi = Math.floor(Math.random() * 35 - 85);
        const randBat = Math.floor(Math.random() * 20 + 80);
        const randSoap = Math.floor(Math.random() * 80 + 15);
        const randTissue = Math.floor(Math.random() * 80 + 10);

        const currentIot = iotDevicesRef.current;
        const currentToilets = toiletsRef.current;

        const activeDeviceCode =
          localStorage.getItem('letsens_emu_device_id') ||
          (currentIot.length > 0 ? currentIot[0].nodeId : (currentToilets.length > 0 ? currentToilets[0].iotDeviceId : 'ESP32-TK-01A'));

        const payload = {
          kode_perangkat: activeDeviceCode,
          amonia: randAmonia,
          suhu: randSuhu,
          rh: randRh,
          PIR: isOccupied,
          cahaya: randCahaya,
          RSSI: randRssi,
          Baterai: randBat,
          soap_level_percent: randSoap,
          tissue_level_percent: randTissue,
        };

        await telemetryApi.injectTelemetry(payload as any);
        window.dispatchEvent(new CustomEvent('letsens_telemetry_published', { detail: payload }));

        // Pull updated logs and toilets state immediately
        const [toiletsRes, telRes] = await Promise.allSettled([
          toiletApi.getAllToilets(),
          telemetryApi.getLatestLogs(),
        ]);
        if (toiletsRes.status === 'fulfilled' && toiletsRes.value?.data && Array.isArray(toiletsRes.value.data)) {
          setToilets(toiletsRes.value.data);
        }
        if (telRes.status === 'fulfilled' && telRes.value?.data && Array.isArray(telRes.value.data)) {
          setTelemetryLogs(telRes.value.data);
        }
      } catch (e) {
        console.warn('Background stream tick failed');
      } finally {
        isTickingRef.current = false;
      }
    };

    if (isEmuStreaming) {
      fireBackgroundStreamTick();
      intervalId = setInterval(fireBackgroundStreamTick, emuIntervalSec * 1000);
    } else {
      // Clean background polling (NO fake random data generator if database is empty!)
      intervalId = setInterval(async () => {
        try {
          const [toiletsRes, telRes] = await Promise.allSettled([
            toiletApi.getAllToilets(),
            telemetryApi.getLatestLogs(),
          ]);
          if (toiletsRes.status === 'fulfilled' && toiletsRes.value?.data && Array.isArray(toiletsRes.value.data)) {
            setToilets(toiletsRes.value.data);
          }
          if (telRes.status === 'fulfilled' && telRes.value?.data && Array.isArray(telRes.value.data)) {
            setTelemetryLogs(telRes.value.data);
          }
        } catch (e) {}
      }, systemConfig.telemetryIntervalSeconds * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isEmuStreaming, emuIntervalSec, systemConfig.telemetryIntervalSeconds]);

  // Handle telemetry injection (from ESP32 or manual form)
  const handleInjectTelemetry = async (data: Partial<SensorTelemetryRecord>) => {
    const toiletCode = data.toiletCode || toilets[0]?.code || 'T-A1-F';
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';

    const newRecord: SensorTelemetryRecord = {
      id: `tel-${Date.now()}`,
      toiletCode,
      timestamp: nowTime,
      amoniaPPM: data.amoniaPPM ?? 7.5,
      temperatureC: data.temperatureC ?? 30.5,
      humidityPercent: data.humidityPercent ?? 65,
      lux: data.lux ?? 350,
      occupied: data.occupied ?? false,
      soapLevelPercent: data.soapLevelPercent ?? 80,
      tissueLevelPercent: data.tissueLevelPercent ?? 75,
      waterFlowLpm: data.waterFlowLpm ?? 0.0,
      statusCondition: data.statusCondition ?? 'Normal',
    };

    setTelemetryLogs((prev) => [newRecord, ...prev.slice(0, 100)]);

    setToilets((prev) =>
      prev.map((t) => {
        if (t.code === toiletCode) {
          return {
            ...t,
            amoniaPPM: newRecord.amoniaPPM,
            temperatureC: newRecord.temperatureC,
            humidityPercent: newRecord.humidityPercent,
            lux: newRecord.lux,
            occupied: newRecord.occupied,
            soapLevelPercent: newRecord.soapLevelPercent,
            tissueLevelPercent: newRecord.tissueLevelPercent,
            waterFlowLpm: newRecord.waterFlowLpm,
            lastTelemetryTime: nowTime,
          };
        }
        return t;
      })
    );

    // Sync to Laravel Backend API
    try {
      await telemetryApi.injectTelemetry(newRecord);
    } catch (e) {
      // Ignore network errors in local dev
    }

    addSystemLog(
      'INFO',
      'TELEMETRY',
      'ESP32_DATA_INGEST',
      `Paket data telemetri diterima dari bilik ${toiletCode}`,
      JSON.stringify(newRecord)
    );
  };

  // Quick Dispatch Call
  const handleQuickCallStaff = (staffName: string, phone: string, toiletCode: string, issue?: string) => {
    setDispatchModalData({
      open: true,
      staffName,
      phone,
      toiletCode,
      issue: issue || 'Pembersihan bilik sanitasi & pengecekan amonia',
    });
  };

  const confirmWhatsAppDispatch = async () => {
    const text = encodeURIComponent(
      `*PANGGILAN TUGAS SANITASI - LETSENS AIoT Universitas Komputer Indonesia*\n\nHalo Rekan ${dispatchModalData.staffName},\nMohon segera menuju *Bilik ${dispatchModalData.toiletCode}*.\n\n*Kendala:* ${dispatchModalData.issue}\n*Waktu:* ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n\nTerima kasih atas kerja samanya.`
    );
    const cleanPhone = dispatchModalData.phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${text}`, '_blank');

    // Trigger Laravel WhatsApp dispatch endpoint
    try {
      await staffApi.dispatchWhatsapp({
        staff_name: dispatchModalData.staffName,
        phone: dispatchModalData.phone,
        toilet_code: dispatchModalData.toiletCode,
        issue: dispatchModalData.issue,
      });
    } catch (e) {}

    addSystemLog('INFO', 'DISPATCH', 'WA_SENT', `Panggilan tugas dikirim ke ${dispatchModalData.staffName} (${dispatchModalData.toiletCode})`);
    setDispatchModalData((prev) => ({ ...prev, open: false }));
  };

  // Restock handler
  const handleUpdateSupplyStock = async (id: string, newStock: number) => {
    setSupplies((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const delta = newStock - s.stock;
          addSystemLog(
            'INFO',
            'INVENTORY',
            delta > 0 ? 'RESTOCK' : 'USAGE',
            `Inventaris "${s.name}" diubah dari ${s.stock} menjadi ${newStock} ${s.unit}`
          );
          return { ...s, stock: newStock, lastRestocked: delta > 0 ? 'Hari ini' : s.lastRestocked };
        }
        return s;
      })
    );

    try {
      await supplyApi.adjustStock(id, newStock);
    } catch (e) {}
  };

  // Damage to repair escalation
  const handleDispatchDamageToRepair = async (damage: RekapKerusakanItem) => {
    const existingRepair = repairs.find((r) => r.damageTicketCode === damage.ticketCode);
    if (existingRepair) {
      setCurrentMenu('rekap-perbaikan');
      return;
    }

    const newRepair: RekapPerbaikanItem = {
      id: `rep-${Date.now()}`,
      repairCode: `REP-2026-${Math.floor(Math.random() * 900 + 100)}`,
      damageTicketCode: damage.ticketCode,
      toiletCode: damage.toiletCode,
      locationName: damage.locationName,
      technicianName: 'Bambang Sudarmono (Teknisi MEP)',
      actionTaken: `Tindak lanjut atas keluhan: ${damage.description}`,
      partsReplaced: 'Dalam proses diagnosa',
      costEstimateRp: 50000,
      startedAt: 'Baru dimulai',
      status: 'Proses Pengerjaan',
      notes: 'Eskalasi perbaikan tiket kerusakan',
    };

    setRepairs((prev) => [newRepair, ...prev]);
    setDamages((prev) =>
      prev.map((d) => (d.id === damage.id ? { ...d, status: 'Dalam Perbaikan' } : d))
    );

    try {
      await maintenanceApi.dispatchToRepair(damage.id);
    } catch (e) {}

    addSystemLog(
      'INFO',
      'REPAIR',
      'TICKET_DISPATCHED',
      `Tiket perbaikan ${newRepair.repairCode} dibuat dari laporan ${damage.ticketCode}`
    );

    setCurrentMenu('rekap-perbaikan');
  };

  // IoT Device Handlers
  const handleAddIotDevice = async (newDev: IotDevice) => {
    setIotDevices((prev) => [newDev, ...prev]);
    try {
      await iotDeviceApi.createDevice(newDev);
    } catch (e) {}
    addSystemLog('INFO', 'IOT_DEVICE', 'REGISTER', `Node IoT ${newDev.nodeId} berhasil didaftarkan`, `Lokasi: ${newDev.toiletCode}`);
  };

  const handleUpdateIotDevice = async (updatedDev: IotDevice) => {
    setIotDevices((prev) => prev.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
    try {
      await iotDeviceApi.updateDevice(updatedDev.id, updatedDev);
    } catch (e) {}
    addSystemLog('INFO', 'IOT_DEVICE', 'UPDATE', `Konfigurasi node ${updatedDev.nodeId} diperbarui`);
  };

  const handleDeleteIotDevice = async (id: string) => {
    const target = iotDevices.find((d) => d.id === id);
    setIotDevices((prev) => prev.filter((d) => d.id !== id));
    try {
      await iotDeviceApi.deleteDevice(id);
    } catch (e) {}
    addSystemLog('WARNING', 'IOT_DEVICE', 'DELETE', `Node IoT ${target?.nodeId || id} dihapus dari jaringan`);
  };

  const handleRestartIotDevice = async (id: string) => {
    setIotDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            rebootCount: d.rebootCount + 1,
            uptime: '0 hari 0 jam (Baru di-reboot)',
            lastTelemetryTime: 'Baru saja',
            status: 'Online',
          };
        }
        return d;
      })
    );
    try {
      await iotDeviceApi.rebootDevice(id);
    } catch (e) {}
    addSystemLog('INFO', 'IOT_COMMAND', 'REBOOT_SUCCESS', `Node ID ${id} berhasil di-reboot secara remote`);
  };

  const handleCalibrateIotDevice = async (id: string) => {
    setIotDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            status: 'Online',
            connectedSensors: d.connectedSensors.map((s) =>
              s.includes('Perlu Kalibrasi') ? s.replace(' - Perlu Kalibrasi', ' - Terkalibrasi') : s
            ),
          };
        }
        return d;
      })
    );
    try {
      await iotDeviceApi.calibrateDevice(id);
    } catch (e) {}
    addSystemLog('SUCCESS', 'CALIBRATION', 'MQ137_ZERO_POINT', `Kalibrasi sensor zero-point berhasil untuk node ${id}`);
  };

  const handleOtaUpdateIotDevice = async (id: string) => {
    setIotDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            firmwareVersion: 'v2.5.0-unikom-prod',
            otaStatus: 'Up to Date',
            status: 'Online',
            lastTelemetryTime: 'Baru saja',
          };
        }
        return d;
      })
    );
    try {
      await iotDeviceApi.otaUpdateDevice(id);
    } catch (e) {}
    addSystemLog('SUCCESS', 'OTA_UPDATE', 'FIRMWARE_FLASH', `Firmware node ${id} diperbarui ke v2.5.0-unikom-prod`);
  };

  // Reset data to defaults
  const handleResetData = () => {
    setToilets(initialToilets);
    setIotDevices(initialIotDevices);
    setStaffList(initialPetugas);
    setSupplies(initialPerlengkapan);
    setSchedules(initialJadwalPemeliharaan);
    setDamages(initialRekapKerusakan);
    setRepairs(initialRekapPerbaikan);
    setTelemetryLogs(initialTelemetryLogs);
    setSystemLogs(initialSystemLogs);
    setSystemConfig(initialPengaturanSistem);
    setAppConfig(initialPengaturanAplikasi);
    addSystemLog('WARNING', 'SYSTEM', 'DATABASE_RESET', 'Basis data disetel ulang ke konfigurasi default pabrik.');
  };

  if (!authUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation (Agrisense Layout Style with LetSens Theme) */}
      <Sidebar
        currentMenu={currentMenu}
        isSidebarOpen={isSidebarOpen}
        userRole={currentUserRole}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectMenu={(menu) => {
          handleSelectMenu(menu);
          setMobileSidebarOpen(false);
        }}
        unreadAlertsCount={unreadAlertsCount}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (AgriSense Layout Style connected with LetSens Backend Data) */}
        <TopHeader
          currentMenu={currentMenu}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          damages={damages}
          toilets={toilets}
          telemetryLogs={telemetryLogs}
          systemConfig={systemConfig}
          user={{
            name: authUser?.name || 'Super Admin',
            role: currentUserRole,
            avatarInitial: authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U',
            profile_photo: authUser?.profile_photo,
          }}
          onRoleChange={handleRoleChange}
          onLogout={handleLogout}
          onSelectMenu={handleSelectMenu}
        />


        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {(currentMenu === 'dasbor' || currentMenu === 'dashboard') && (
              <DashboardView
                toilets={toilets}
                devices={iotDevices}
                telemetryLogs={telemetryLogs}
                damages={damages}
                supplies={supplies}
                schedules={schedules}
                systemConfig={systemConfig}
                onSelectMenu={setCurrentMenu}
                onInjectTelemetry={handleInjectTelemetry}
                onQuickCallStaff={(toiletCode) => {
                  const staff = staffList[0];
                  handleQuickCallStaff(staff?.name || 'Petugas Sanitasi', staff?.phone || '081234567890', toiletCode, 'Kadar amonia tinggi atau bilik perlu sanitasi');
                }}
              />
            )}

            {currentMenu === 'data-sensor' && (
              <DataSensorView
                toilets={toilets}
                devices={iotDevices}
                telemetryLogs={telemetryLogs}
                onInjectTelemetry={handleInjectTelemetry}
                onRefresh={() => {
                  addSystemLog('INFO', 'TELEMETRY', 'REFRESH', 'Streaming telemetri sensor diperbarui');
                }}
              />
            )}

            {(currentMenu === 'fasilitas' || currentMenu === 'data-utilitas') && (
              <FasilitasView
                toilets={toilets}
                staffList={staffList}
                fasilitasList={utilitasList}
                supplies={supplies}
                onUpdateSupplyStock={handleUpdateSupplyStock}
                onAddFasilitas={(newItem) => {
                  const item: UtilitasItem = {
                    id: `fas-${Date.now()}`,
                    no: utilitasList.length + 1,
                    namaFasilitas: newItem.namaFasilitas || newItem.utilitasName || 'Fasilitas Sanitasi',
                    utilitasName: newItem.namaFasilitas || newItem.utilitasName || 'Fasilitas Sanitasi',
                    toiletId: newItem.toiletId || toilets[0]?.id || '1',
                    toiletCode: newItem.toiletCode || toilets[0]?.code || 'T-A1-F',
                    location: newItem.location || toilets[0]?.name || 'Gedung A, Lt 1, Wanita',
                    building: newItem.building || toilets[0]?.building || 'Gedung A',
                    floor: newItem.floor || toilets[0]?.floor || 1,
                    kategori: newItem.kategori || 'Sanitasi & Kebersihan',
                    jumlah: newItem.jumlah || '1 unit',
                    stokAngka: newItem.stokAngka || 100,
                    kondisi: newItem.kondisi || 'Baik',
                    status: newItem.status || 'Tersedia',
                    petugasJawab: newItem.petugasJawab || staffList[0]?.name || 'Asep Saepulloh',
                    terakhirDiperiksa: new Date().toISOString(),
                    catatan: newItem.catatan || '-',
                    lastUpdated: newItem.lastUpdated || 'Baru saja',
                  };
                  setUtilitasList((prev) => [item, ...prev]);
                  addSystemLog('INFO', 'FASILITAS', 'ENTRY', `Entry fasilitas ${item.namaFasilitas} di ${item.toiletCode}`);
                }}
                onUpdateFasilitas={(id, updated) => {
                  setUtilitasList((prev) =>
                    prev.map((u) => (u.id === id ? { ...u, ...updated } : u))
                  );
                  addSystemLog('INFO', 'FASILITAS', 'UPDATE', `Data fasilitas ID ${id} diperbarui`);
                }}
                onDeleteFasilitas={(id) => {
                  setUtilitasList((prev) => prev.filter((u) => u.id !== id));
                  addSystemLog('WARNING', 'FASILITAS', 'DELETE', `Fasilitas ID ${id} dihapus`);
                }}
              />
            )}

            {(currentMenu === 'bilik-toilet' || currentMenu === 'manajemen-toilet') && (
              <ManajemenToiletView
                toilets={toilets}
                fasilitasList={utilitasList}
                onAddToilet={async (newToilet) => {
                  setToilets((prev) => [...prev, newToilet]);
                  try {
                    await toiletApi.createToilet(newToilet);
                  } catch (e) {}
                  addSystemLog('INFO', 'MASTER_TOILET', 'CREATE', `Bilik baru ${newToilet.code} ditambahkan`);
                }}
                onUpdateToilet={async (updatedToilet) => {
                  setToilets((prev) =>
                    prev.map((t) => (t.id === updatedToilet.id ? updatedToilet : t))
                  );
                  try {
                    await toiletApi.updateToilet(updatedToilet.id, updatedToilet);
                  } catch (e) {}
                  addSystemLog('INFO', 'MASTER_TOILET', 'UPDATE', `Data bilik ${updatedToilet.code} diperbarui`);
                }}
                onDeleteToilet={async (id) => {
                  const target = toilets.find((t) => t.id === id);
                  setToilets((prev) => prev.filter((t) => t.id !== id));
                  try {
                    await toiletApi.deleteToilet(id);
                  } catch (e) {}
                  addSystemLog('WARNING', 'MASTER_TOILET', 'DELETE', `Bilik ${target?.code} dihapus dari sistem`);
                }}
              />
            )}

            {(currentMenu === 'perangkat' || currentMenu === 'manajemen-iot') && (
              <ManajemenPerangkatIoTView
                devices={iotDevices}
                toilets={toilets}
                telemetryLogs={telemetryLogs}
                onAddDevice={handleAddIotDevice}
                onUpdateDevice={handleUpdateIotDevice}
                onDeleteDevice={handleDeleteIotDevice}
                onRestartDevice={handleRestartIotDevice}
                onCalibrateDevice={handleCalibrateIotDevice}
                onOtaUpdateDevice={handleOtaUpdateIotDevice}
              />
            )}

            {(currentMenu === 'pengguna' || currentMenu === 'manajemen-petugas') && (
              <ManajemenPetugasView
                staffList={staffList}
                onAddStaff={async (staff) => {
                  setStaffList((prev) => [...prev, staff]);
                  try {
                    await staffApi.createStaff(staff);
                  } catch (e) {}
                  addSystemLog('INFO', 'STAFF', 'CREATE', `Petugas baru ${staff.name} didaftarkan`);
                }}
                onUpdateStaff={async (staff) => {
                  setStaffList((prev) =>
                    prev.map((s) => (s.id === staff.id ? staff : s))
                  );
                  try {
                    await staffApi.updateStaff(staff.id, staff);
                  } catch (e) {}
                  addSystemLog('INFO', 'STAFF', 'UPDATE', `Data petugas ${staff.name} diperbarui`);
                }}
                onDeleteStaff={async (id) => {
                  setStaffList((prev) => prev.filter((s) => s.id !== id));
                  try {
                    await staffApi.deleteStaff(id);
                  } catch (e) {}
                  addSystemLog('WARNING', 'STAFF', 'DELETE', `Data petugas ID ${id} dihapus`);
                }}
                onQuickCallStaff={(name, phone, toiletCode) =>
                  handleQuickCallStaff(name, phone, toiletCode)
                }
              />
            )}

            {(currentMenu === 'stok-perlengkapan' || currentMenu === 'manajemen-perlengkapan') && (
              <ManajemenPerlengkapanView
                supplies={supplies}
                fasilitasList={utilitasList}
                onAddSupply={async (item) => {
                  setSupplies((prev) => [...prev, item]);
                  try {
                    await supplyApi.createSupply(item);
                  } catch (e) {}
                  addSystemLog('INFO', 'INVENTORY', 'CREATE', `Barang perlengkapan ${item.name} ditambahkan`);
                }}
                onUpdateStock={handleUpdateSupplyStock}
                onDeleteSupply={async (id) => {
                  setSupplies((prev) => prev.filter((s) => s.id !== id));
                  try {
                    await supplyApi.deleteSupply(id);
                  } catch (e) {}
                  addSystemLog('WARNING', 'INVENTORY', 'DELETE', `Barang ID ${id} dihapus`);
                }}
              />
            )}

            {currentMenu === 'jadwal-pemeliharaan' && (
              <JadwalPemeliharaanView
                schedules={schedules}
                toilets={toilets}
                staffList={staffList}
                damages={damages}
                onAddSchedule={async (sched) => {
                  setSchedules((prev) => [sched, ...prev]);
                  try {
                    await maintenanceApi.createSchedule(sched);
                  } catch (e) {}
                  addSystemLog('INFO', 'SCHEDULE', 'CREATE', `Jadwal baru ${sched.type} ditambahkan`);
                }}
                onToggleTaskCheck={async (scheduleId, taskIndex) => {
                  setSchedules((prev) =>
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
                            ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
                            : undefined,
                        };
                      }
                      return s;
                    })
                  );
                  try {
                    await maintenanceApi.toggleChecklist(scheduleId, taskIndex);
                  } catch (e) {}
                }}
                onCompleteSchedule={async (scheduleId) => {
                  setSchedules((prev) =>
                    prev.map((s) => {
                      if (s.id === scheduleId) {
                        const allDone = s.checklist.map((c) => ({ ...c, done: true }));
                        return {
                          ...s,
                          status: 'Selesai',
                          checklist: allDone,
                          completedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB',
                        };
                      }
                      return s;
                    })
                  );
                  try {
                    await maintenanceApi.completeSchedule(scheduleId);
                  } catch (e) {}
                  addSystemLog('INFO', 'SCHEDULE', 'COMPLETE', `Tugas pemeliharaan ${scheduleId} diselesaikan`);
                }}
                onUpdateSchedule={async (scheduleId, updatedData) => {
                  setSchedules((prev) =>
                    prev.map((s) => (s.id === scheduleId ? { ...s, ...updatedData } : s))
                  );
                  try {
                    await maintenanceApi.updateSchedule(scheduleId, updatedData);
                  } catch (e) {}
                  addSystemLog('INFO', 'SCHEDULE', 'UPDATE', `Jadwal pemeliharaan ${scheduleId} diperbarui`);
                }}
                onDeleteSchedule={async (scheduleId) => {
                  setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
                  try {
                    await maintenanceApi.deleteSchedule(scheduleId);
                  } catch (e) {}
                  addSystemLog('WARNING', 'SCHEDULE', 'DELETE', `Jadwal pemeliharaan ${scheduleId} dihapus`);
                }}
              />
            )}

            {currentMenu === 'rekap-kerusakan' && (
              <RekapKerusakanView
                damages={damages}
                toilets={toilets}
                onAddDamage={async (dmg) => {
                  setDamages((prev) => [{ ...dmg, status: 'Dalam Perbaikan' }, ...prev]);
                  setToilets((prev) =>
                    prev.map((t) => (t.code === dmg.toiletCode ? { ...t, status: 'Maintenance' } : t))
                  );
                  setUtilitasList((prev) =>
                    prev.map((f) =>
                      f.toiletCode === dmg.toiletCode
                        ? { ...f, status: 'Perlu Perbaikan', kondisi: 'Perlu Perbaikan' }
                        : f
                    )
                  );

                  try {
                    const res = await maintenanceApi.createDamage(dmg);
                    if (res && res.data) {
                      const payload = res.data as any;
                      if (payload.damage) {
                        setDamages((prev) =>
                          prev.map((d) => (d.ticketCode === dmg.ticketCode ? payload.damage : d))
                        );
                      }
                      if (payload.repair) {
                        setRepairs((prev) => [payload.repair, ...prev]);
                      }
                    }
                  } catch (e) {
                    console.error('Create damage error:', e);
                  }
                  addSystemLog('WARNING', 'DAMAGE', 'REPORTED', `Laporan kerusakan ${dmg.ticketCode} berhasil disimpan ke DB backend`);
                }}
                onUpdateDamage={async (updatedDmg) => {
                  setDamages((prev) =>
                    prev.map((d) => (d.id === updatedDmg.id ? updatedDmg : d))
                  );
                  try {
                    await maintenanceApi.updateDamage(updatedDmg.id, updatedDmg);
                  } catch (e) {}
                  addSystemLog('INFO', 'DAMAGE', 'UPDATE', `Laporan kerusakan ${updatedDmg.ticketCode} diperbarui di DB backend`);
                }}
                onDeleteDamage={async (damageId) => {
                  setDamages((prev) => prev.filter((d) => d.id !== damageId));
                  try {
                    await maintenanceApi.deleteDamage(damageId);
                  } catch (e) {}
                  addSystemLog('WARNING', 'DAMAGE', 'DELETE', `Laporan kerusakan ID ${damageId} dihapus dari DB backend`);
                }}
                onDispatchToRepair={handleDispatchDamageToRepair}
              />
            )}

            {currentMenu === 'rekap-perbaikan' && (
              <RekapPerbaikanView
                repairs={repairs}
                toilets={toilets}
                damages={damages}
                staffList={staffList}
                onAddRepair={async (rep) => {
                  setRepairs((prev) => [rep, ...prev]);
                  // Auto-cascade to Toilet, Damage, & Fasilitas
                  const isDone = rep.status === 'Selesai';
                  setToilets((prev) =>
                    prev.map((t) => (t.code === rep.toiletCode ? { ...t, status: isDone ? 'Online' : 'Maintenance' } : t))
                  );
                  setDamages((prev) =>
                    prev.map((d) => (d.ticketCode === rep.damageTicketCode ? { ...d, status: isDone ? 'Selesai' : 'Dalam Perbaikan' } : d))
                  );
                  setUtilitasList((prev) =>
                    prev.map((f) =>
                      f.toiletCode === rep.toiletCode
                        ? { ...f, status: isDone ? 'Tersedia' : 'Perlu Perbaikan', kondisi: isDone ? 'Baik' : 'Perlu Perbaikan' }
                        : f
                    )
                  );
                  try {
                    await maintenanceApi.createRepair(rep);
                  } catch (e) {}
                  addSystemLog('INFO', 'REPAIR', 'CREATE', `Tiket perbaikan ${rep.repairCode} dicatat (${rep.toiletCode})`);
                }}
                onUpdateRepairStatus={async (id, newStatus) => {
                  let targetToiletCode = '';
                  let targetDamageCode = '';
                  setRepairs((prev) =>
                    prev.map((r) => {
                      if (r.id === id) {
                        targetToiletCode = r.toiletCode;
                        targetDamageCode = r.damageTicketCode;
                        return { ...r, status: newStatus };
                      }
                      return r;
                    })
                  );

                  const isDone = newStatus === 'Selesai';
                  if (targetToiletCode) {
                    setToilets((prev) =>
                      prev.map((t) => (t.code === targetToiletCode ? { ...t, status: isDone ? 'Online' : 'Maintenance' } : t))
                    );
                    setUtilitasList((prev) =>
                      prev.map((f) =>
                        f.toiletCode === targetToiletCode
                          ? { ...f, status: isDone ? 'Tersedia' : 'Perlu Perbaikan', kondisi: isDone ? 'Baik' : 'Perlu Perbaikan' }
                          : f
                      )
                    );
                  }
                  if (targetDamageCode) {
                    setDamages((prev) =>
                      prev.map((d) => (d.ticketCode === targetDamageCode ? { ...d, status: isDone ? 'Selesai' : 'Dalam Perbaikan' } : d))
                    );
                  }

                  try {
                    await maintenanceApi.updateRepairStatus(id, newStatus);
                  } catch (e) {}
                  addSystemLog('INFO', 'REPAIR', 'STATUS_UPDATE', `Status perbaikan ${id} diubah menjadi ${newStatus}`);
                }}
                onUpdateRepair={async (id, updated) => {
                  setRepairs((prev) =>
                    prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
                  );
                  if (updated.status) {
                    const isDone = updated.status === 'Selesai';
                    if (updated.toiletCode) {
                      setToilets((prev) =>
                        prev.map((t) => (t.code === updated.toiletCode ? { ...t, status: isDone ? 'Online' : 'Maintenance' } : t))
                      );
                      setUtilitasList((prev) =>
                        prev.map((f) =>
                          f.toiletCode === updated.toiletCode
                            ? { ...f, status: isDone ? 'Tersedia' : 'Perlu Perbaikan', kondisi: isDone ? 'Baik' : 'Perlu Perbaikan' }
                            : f
                        )
                      );
                    }
                    if (updated.damageTicketCode) {
                      setDamages((prev) =>
                        prev.map((d) => (d.ticketCode === updated.damageTicketCode ? { ...d, status: isDone ? 'Selesai' : 'Dalam Perbaikan' } : d))
                      );
                    }
                  }
                  try {
                    await maintenanceApi.updateRepair(id, updated);
                  } catch (e) {}
                  addSystemLog('INFO', 'REPAIR', 'UPDATE', `Tiket perbaikan ${id} diperbarui`);
                }}
                onDeleteRepair={async (id) => {
                  setRepairs((prev) => prev.filter((r) => r.id !== id));
                  try {
                    await maintenanceApi.deleteRepair(id);
                  } catch (e) {}
                  addSystemLog('INFO', 'REPAIR', 'DELETE', `Tiket perbaikan ${id} dihapus`);
                }}
              />
            )}

            {currentMenu === 'letsens-ai' && (
              <LetsensAIView
                toilets={toilets}
                telemetryLogs={telemetryLogs}
                damages={damages}
                repairs={repairs}
                supplies={supplies}
                schedules={schedules}
                geminiApiKey={systemConfig.geminiApiKey}
              />
            )}

            {currentMenu === 'laporan' && (
              <LaporanView
                toilets={toilets}
                schedules={schedules}
                repairs={repairs}
                damages={damages}
                supplies={supplies}
                devices={iotDevices}
                telemetryLogs={telemetryLogs}
              />
            )}

            {(currentMenu === 'pengaturan' || currentMenu === 'pengaturan-sistem' || currentMenu === 'pengaturan-aplikasi') && (
              <PengaturanView
                systemConfig={systemConfig}
                appConfig={appConfig}
                userRole={currentUserRole}
                onSaveSystemConfig={(newCfg) => {
                  setSystemConfig(newCfg);
                  addSystemLog('INFO', 'CONFIG', 'SYSTEM_UPDATED', 'Pengaturan parameter sistem AIoT disimpan');
                }}
                onSaveAppConfig={(newCfg) => {
                  setAppConfig(newCfg);
                  addSystemLog('INFO', 'CONFIG', 'APP_UPDATED', 'Pengaturan aplikasi & profil institusi disimpan');
                }}
                onResetData={handleResetData}
                allAppData={{
                  toilets,
                  staffList,
                  supplies,
                  schedules,
                  damages,
                  repairs,
                  systemConfig,
                  appConfig,
                }}
              />
            )}

            {(currentMenu === 'log-aktivitas' || currentMenu === 'logs') && (
              <LogsView
                logs={systemLogs}
                onClearLogs={() => {
                  setSystemLogs([]);
                }}
              />
            )}

            {currentMenu === 'glosarium' && <GlosariumView />}
            {currentMenu === 'tentang' && <TentangView />}

            {(currentMenu === 'profile' || currentMenu === 'profil-saya') && (
              <ProfileView
                user={authUser}
                onUpdateUser={(updatedUser) => {
                  setAuthUser(updatedUser);
                  setCurrentUserRole(updatedUser.role);
                }}
              />
            )}

            {(currentMenu === 'not-found' || currentMenu === '404') && (
              <NotFoundView onNavigate={handleSelectMenu} />
            )}
          </div>
        </main>
      </div>

      {/* Redesigned Premium WhatsApp Dispatch Modal */}
      <AnimatePresence>
        {dispatchModalData.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/90 space-y-5 select-none relative overflow-hidden"
            >
              {/* Top Accent Gradient Header */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600"></div>

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                        Disposisi Tugas WhatsApp
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                        Direct WA
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Kirim panggilan tugas instan ke WhatsApp pengguna yang bertugas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDispatchModalData((prev) => ({ ...prev, open: false }))}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Target User Info Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      {dispatchModalData.staffName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {dispatchModalData.staffName}
                      </h4>
                      <p className="text-[11px] font-mono font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-emerald-600" />
                        <span>{dispatchModalData.phone}</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white border border-emerald-200 text-emerald-700 shadow-2xs">
                    Target User
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Lokasi Bilik:
                    </span>
                    <span className="font-mono font-extrabold text-blue-600 text-xs">
                      {dispatchModalData.toiletCode || 'Bilik General'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Waktu Disposisi:
                    </span>
                    <span className="font-mono font-bold text-slate-700 text-xs">
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                    </span>
                  </div>
                </div>
              </div>

              {/* Message / Instruction Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Instruksi Tugas Sanitasi & Kebersihan:</span>
                  <span className="text-[10px] font-semibold text-slate-400">Dapat disesuaikan</span>
                </label>
                <textarea
                  rows={3}
                  value={dispatchModalData.issue}
                  onChange={(e) => setDispatchModalData((prev) => ({ ...prev, issue: e.target.value }))}
                  placeholder="Deskripsikan instruksi tugas atau anomali yang perlu ditindaklanjuti..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchModalData((prev) => ({ ...prev, open: false }))}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={confirmWhatsAppDispatch}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
                >
                  <Send size={15} />
                  <span>Kirim via WhatsApp</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
