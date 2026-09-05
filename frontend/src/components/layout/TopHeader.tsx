import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronRight,
  Radio,
  AlertTriangle,
  LayoutGrid,
  LogOut,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuView, RekapKerusakanItem, ToiletBilik, PengaturanSistemConfig, SensorTelemetryRecord } from '../../types';

interface TopHeaderProps {
  currentMenu: MenuView;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  damages?: RekapKerusakanItem[];
  toilets?: ToiletBilik[];
  telemetryLogs?: SensorTelemetryRecord[];
  systemConfig?: PengaturanSistemConfig;
  user?: { name: string; role: string; avatarInitial?: string; profile_photo?: string | null };
  alerts?: { id: string; message: string; time: string; severity: 'warning' | 'danger' | 'info' }[];
  onRoleChange?: (role: string) => void;
  onLogout?: () => void;
  onSelectMenu?: (menu: MenuView) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentMenu,
  isSidebarOpen = true,
  onToggleSidebar = () => {},
  onOpenMobileSidebar,
  onOpenMobileMenu,
  damages = [],
  toilets = [],
  telemetryLogs = [],
  systemConfig,
  user,
  onRoleChange,
  onLogout,
  onSelectMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const handleOpenMobile = onOpenMobileSidebar ?? onOpenMobileMenu ?? (() => {});

  const getBreadcrumbInfo = (menu: MenuView) => {
    switch (menu) {
      case 'dasbor':
      case 'dashboard':
        return { category: 'OPERASIONAL', label: 'Dasbor' };
      case 'data-sensor':
        return { category: 'OPERASIONAL', label: 'Data Sensor' };
      case 'fasilitas':
      case 'data-utilitas':
        return { category: 'MANAJEMEN', label: 'Fasilitas' };
      case 'bilik-toilet':
      case 'manajemen-toilet':
        return { category: 'MANAJEMEN', label: 'Bilik Toilet' };
      case 'perangkat':
      case 'manajemen-iot':
        return { category: 'MANAJEMEN', label: 'Perangkat' };
      case 'pengguna':
      case 'manajemen-petugas':
        return { category: 'MANAJEMEN', label: 'Pengguna' };
      case 'stok-perlengkapan':
      case 'manajemen-perlengkapan':
        return { category: 'MANAJEMEN', label: 'Stok Perlengkapan' };
      case 'jadwal-pemeliharaan':
        return { category: 'OPERASIONAL', label: 'Jadwal Pemeliharaan' };
      case 'rekap-kerusakan':
        return { category: 'OPERASIONAL', label: 'Rekap Kerusakan' };
      case 'rekap-perbaikan':
        return { category: 'OPERASIONAL', label: 'Rekap Perbaikan' };
      case 'letsens-ai':
        return { category: 'ANALITIK', label: 'LetSensAI' };
      case 'laporan':
        return { category: 'SISTEM', label: 'Laporan' };
      case 'pengaturan':
      case 'pengaturan-sistem':
      case 'pengaturan-aplikasi':
        return { category: 'SISTEM', label: 'Pengaturan' };
      case 'log-aktivitas':
      case 'logs':
        return { category: 'SISTEM', label: 'Log Aktivitas' };
      case 'glosarium':
        return { category: 'BANTUAN', label: 'Glosarium' };
      case 'tentang':
        return { category: 'BANTUAN', label: 'Tentang' };
      case 'profile':
      case 'profil-saya':
        return { category: 'PENGGUNA', label: 'Profil Saya' };
      case 'not-found':
      case '404':
        return { category: 'SISTEM', label: 'Halaman Tidak Ditemukan (404)' };
      default:
        return { category: 'OPERASIONAL', label: 'Dasbor' };
    }
  };

  const { label } = getBreadcrumbInfo(currentMenu);

  const warnAmoniaThreshold = systemConfig?.amoniaWarningThreshold ?? 10.0;
  const dangerAmoniaThreshold = systemConfig?.amoniaDangerThreshold ?? 20.0;
  const lowStockThreshold = systemConfig?.lowSoapThresholdPercent ?? 15;

  const activeDamages = damages.filter((d) => d.status === 'Menunggu' || d.status === 'Dalam Perbaikan');
  const hasTelemetryData = telemetryLogs.length > 0;

  const sensorAlerts = hasTelemetryData
    ? toilets
        .filter(
          (t) =>
            t.lastTelemetryTime &&
            (t.amoniaPPM >= warnAmoniaThreshold ||
              (t.soapLevelPercent !== undefined && t.soapLevelPercent <= lowStockThreshold) ||
              (t.tissueLevelPercent !== undefined && t.tissueLevelPercent <= lowStockThreshold))
        )
        .map((t) => ({
          id: `sensor-${t.id}`,
          toiletCode: t.code,
          description:
            t.amoniaPPM >= dangerAmoniaThreshold
              ? `Tingkat Amonia Bahaya: ${t.amoniaPPM.toFixed(1)} PPM (Exhaust Blower Otomatis Aktif)`
              : t.amoniaPPM >= warnAmoniaThreshold
              ? `Tingkat Amonia Waspada: ${t.amoniaPPM.toFixed(1)} PPM`
              : `Stok Perlengkapan Rendah: Sabun ${t.soapLevelPercent}%, Tisu ${t.tissueLevelPercent}%`,
          severity: t.amoniaPPM >= dangerAmoniaThreshold ? 'BAHAYA' : 'WASPADA',
        }))
    : [];

  const allHeaderNotifications = [
    ...sensorAlerts,
    ...activeDamages.map((d) => {
      const cleanCode = d.toiletCode.replace(/^Bilik\s*/i, '');
      return {
        id: d.id,
        toiletCode: cleanCode,
        description: d.description,
        severity: d.severity.toUpperCase(),
      };
    }),
  ].sort((a, b) => {
    const priority: Record<string, number> = { BAHAYA: 1, DARURAT: 1, WASPADA: 2, TINGGI: 2, SEDANG: 3, INFO: 4 };
    return (priority[a.severity] || 5) - (priority[b.severity] || 5);
  });

  const alertCount = allHeaderNotifications.length;

  const latestLog = hasTelemetryData ? telemetryLogs[0] : null;
  const activeToilet = hasTelemetryData ? (toilets.find((t) => t.code === latestLog?.toiletCode) || toilets[0]) : null;
  const targetCode = latestLog ? (latestLog.nodeId || latestLog.deviceId || latestLog.toiletCode) : (activeToilet ? activeToilet.code : '');
  const displayCode = targetCode ? targetCode.replace(/^Bilik\s*/i, '') : '';
  const amoniaVal = latestLog ? latestLog.amoniaPPM : (activeToilet ? activeToilet.amoniaPPM : 0);

  const isDangerStatus = amoniaVal >= dangerAmoniaThreshold;
  const isWarningStatus = amoniaVal >= warnAmoniaThreshold;
  const toiletStatus = isDangerStatus
    ? 'Bahaya Amonia'
    : isWarningStatus
    ? 'Peringatan Anomali'
    : 'Kondisi Normal';
  const amoniaReading = `Amonia ${amoniaVal.toFixed(2)} PPM`;

  const rawUserName = user?.name || 'Super User';
  const userName = rawUserName.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const userRole = user?.role || 'SUPER ADMIN';
  const avatarLetter = user?.avatarInitial || userName.charAt(0).toUpperCase() || 'S';

  return (
    <motion.header
      id="top-header"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 shrink-0 z-10 sticky top-0 shadow-xs select-none"
    >
      {/* Left Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        <motion.button
          id="mobile-menu-toggle"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenMobile}
          className="p-2 text-slate-600 rounded-xl hover:bg-slate-100 lg:hidden border border-slate-200 cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <motion.button
          id="desktop-sidebar-toggle"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Ciutkan Sidebar' : 'Buka Sidebar'}
          className="hidden lg:flex items-center justify-center w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 cursor-pointer shadow-xs border border-blue-500/20"
        >
          <LayoutGrid size={16} />
        </motion.button>

        <ChevronRight size={14} className="text-slate-400 hidden lg:block" />

        {/* Breadcrumb Pill Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
        >
          <span className="text-xs font-extrabold text-slate-900 tracking-tight">
            {label}
          </span>
        </motion.div>

        <div className="h-5 w-[1px] bg-slate-200/80 hidden md:block"></div>

        {/* Dynamic Activity Feed Pill */}
        {hasTelemetryData ? (
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full shadow-xs border border-slate-800/90 bg-slate-900 text-white backdrop-blur-xl cursor-pointer"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 ${
                  isWarningStatus ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isWarningStatus ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              ></span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-tight">
              <span className="text-cyan-400 uppercase font-black">{displayCode}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-200 font-extrabold">{amoniaReading}</span>
              <span className="text-slate-600">•</span>
              <span className={isWarningStatus ? 'text-amber-400 font-bold' : 'text-emerald-400 font-medium'}>
                {toiletStatus}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold">
            <Radio size={13} className="text-slate-400" />
            <span>Node IoT Standby (Siap Menerima Data Telemetri)</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <motion.button
            id="notification-bell"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 shadow-xs cursor-pointer"
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md animate-pulse">
                {alertCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-blue-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Notifikasi Sistem</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                    {alertCount} Peringatan
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                  {allHeaderNotifications.length > 0 ? (
                    allHeaderNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-blue-50/50 transition-colors flex items-start gap-2.5"
                      >
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{notif.toiletCode}</p>
                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            {notif.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      Tidak ada peringatan darurat saat ini.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Card Dropdown */}
        <div className="relative">
          <div
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-3 p-1.5 pl-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer select-none"
          >
            <div className="flex flex-col text-right hidden sm:flex justify-center max-w-[160px]">
              <span className="text-xs font-black text-slate-900 leading-tight truncate">
                {userName}
              </span>
              <span className="text-[10px] font-bold text-blue-600 leading-tight uppercase tracking-wider mt-0.5 truncate">
                {userRole}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md overflow-hidden shrink-0 border border-blue-400/20">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt={userName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                avatarLetter
              )}
            </div>
          </div>

          <AnimatePresence>
            {showRoleDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1"
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">{userRole}</p>
                </div>

                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    if (onSelectMenu) onSelectMenu('profile');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <User size={14} className="text-blue-600" />
                  <span>Profil Saya</span>
                </button>

                {onRoleChange && (
                  <div className="pt-1 border-t border-slate-100 space-y-1">
                    <p className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Simulasi Peran RBAC
                    </p>
                    {['Super Admin', 'Supervisor / Manajer', 'Teknisi IoT', 'Petugas Kebersihan'].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setShowRoleDropdown(false);
                          onRoleChange(r);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          userRole === r ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                  >
                    <LogOut size={14} />
                    <span>Keluar (Logout)</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};
