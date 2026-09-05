import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Activity,
  Boxes,
  Bot,
  DoorOpen,
  Cpu,
  Users,
  Package,
  CalendarClock,
  AlertTriangle,
  Hammer,
  FileText,
  Settings,
  ScrollText,
  Clock,
  BookOpen,
  Info,
} from 'lucide-react';
import { MenuView } from '../../types';
import { getAllowedMenusForRole } from '../../utils/rbac';

interface SidebarProps {
  currentMenu: MenuView;
  onSelectMenu: (menu: MenuView) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  mobileOpen?: boolean;
  isOpen?: boolean;
  onCloseMobile?: () => void;
  onClose?: () => void;
  activeAlertCount?: number;
  unreadAlertsCount?: number;
  userRole?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isSidebarOpen = true,
  mobileOpen,
  isOpen,
  onCloseMobile,
  onClose,
  activeAlertCount = 0,
  unreadAlertsCount = 0,
  userRole = 'Super Admin',
}) => {
  const isMobileVisible = mobileOpen ?? isOpen ?? false;
  const handleClose = onCloseMobile ?? onClose ?? (() => {});
  const alertsCount = activeAlertCount || unreadAlertsCount || 0;

  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (num: number) => num.toString().padStart(2, '0');
  const hours = formatDigits(time.getHours());
  const minutes = formatDigits(time.getMinutes());
  const seconds = formatDigits(time.getSeconds());

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const dayName = days[time.getDay()];
  const dayNum = formatDigits(time.getDate());
  const monthName = months[time.getMonth()];
  const year = time.getFullYear();

  const dateStr = `${dayName}, ${dayNum} ${monthName} ${year}`;

  const menuSections = [
    {
      title: 'ANALITIK',
      items: [
        { id: 'letsens-ai' as MenuView, label: 'LetSensAI', icon: Bot },
      ],
    },
    {
      title: 'OPERASIONAL',
      items: [
        { id: 'dasbor' as MenuView, label: 'Dasbor', icon: LayoutDashboard },
        { id: 'data-sensor' as MenuView, label: 'Data Sensor', icon: Activity },
        { id: 'jadwal-pemeliharaan' as MenuView, label: 'Jadwal Pemeliharaan', icon: CalendarClock },
        {
          id: 'rekap-kerusakan' as MenuView,
          label: 'Rekap Kerusakan',
          icon: AlertTriangle,
          badge: alertsCount > 0 ? alertsCount : undefined,
        },
        { id: 'rekap-perbaikan' as MenuView, label: 'Rekap Perbaikan', icon: Hammer },
      ],
    },
    {
      title: 'MANAJEMEN',
      items: [
        { id: 'fasilitas' as MenuView, label: 'Fasilitas', icon: Boxes },
        { id: 'bilik-toilet' as MenuView, label: 'Bilik Toilet', icon: DoorOpen },
        { id: 'perangkat' as MenuView, label: 'Perangkat', icon: Cpu },
        { id: 'pengguna' as MenuView, label: 'Pengguna', icon: Users },
        { id: 'stok-perlengkapan' as MenuView, label: 'Stok Perlengkapan', icon: Package },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        { id: 'laporan' as MenuView, label: 'Laporan', icon: FileText },
        { id: 'log-aktivitas' as MenuView, label: 'Log Aktivitas', icon: ScrollText },
        { id: 'pengaturan' as MenuView, label: 'Pengaturan', icon: Settings },
      ],
    },
    {
      title: 'BANTUAN',
      items: [
        { id: 'glosarium' as MenuView, label: 'Glosarium', icon: BookOpen },
        { id: 'tentang' as MenuView, label: 'Tentang', icon: Info },
      ],
    },
  ];

  const allowedMenus = useMemo(() => getAllowedMenusForRole(userRole), [userRole]);

  const visibleMenuSections = useMemo(() => {
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => allowedMenus.includes(item.id)),
      }))
      .filter((section) => section.items.length > 0);
  }, [menuSections, allowedMenus]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileVisible && (
        <div
          id="sidebar-backdrop"
          onClick={handleClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* AgriSense Styled Professional Sidebar for LetSens */}
      <aside
        id="app-sidebar"
        className={`bg-[#0f172a] border-r border-slate-800 flex flex-col z-50 shrink-0 h-full min-h-0 transition-all duration-300 ease-in-out shadow-xl select-none fixed lg:relative inset-y-0 left-0 ${
          isSidebarOpen ? 'w-64' : 'w-[72px]'
        } ${isMobileVisible ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="py-4 px-3 border-b border-slate-800/80 shrink-0 flex items-center justify-center relative min-h-[5rem]">
          <div
            onClick={() => onSelectMenu('dasbor')}
            className={`flex items-center w-full cursor-pointer select-none relative z-10 transition-all duration-200 ${
              isSidebarOpen ? 'flex-col justify-center text-center px-1' : 'justify-center'
            }`}
          >
            {/* Official LetSens Logo Image Box */}
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white p-1 shrink-0 shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30 hover:scale-105 active:scale-95 transition-transform duration-200 overflow-hidden">
              <img
                src="/letsens-logo.jpg"
                alt="LetSens Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {isSidebarOpen && (
              <div className="flex flex-col items-center justify-center text-center w-full mt-2 animate-in fade-in slide-in-from-top-1">
                <span className="font-black text-sm tracking-widest leading-tight text-white text-center uppercase">
                  LETSENS
                </span>
                <span className="text-[10px] font-bold text-cyan-400/90 leading-tight mt-1 text-center tracking-wider uppercase">
                  Toilet Sensing System
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4 scrollbar-thin ${isSidebarOpen ? 'px-3' : 'px-2'}`}>
          {visibleMenuSections.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {isSidebarOpen && (
                <p className="px-3 text-[10px] font-extrabold text-slate-400/80 uppercase tracking-widest mb-1.5 mt-1">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = currentMenu === item.id;
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.id}
                    id={`menu-${item.id}`}
                    href={`/${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectMenu(item.id);
                      handleClose();
                    }}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`flex items-center transition-all duration-200 group focus:outline-hidden relative select-none cursor-pointer active:scale-[0.98] ${
                      isSidebarOpen
                        ? 'w-full py-2.5 px-3 rounded-xl gap-3'
                        : 'w-[44px] h-[44px] justify-center mx-auto rounded-xl'
                    } ${
                      isActive
                        ? isSidebarOpen
                          ? 'bg-blue-600/15 text-blue-400 font-bold shadow-xs border-l-4 border-blue-500 pl-2.5'
                          : 'bg-blue-600 text-white font-bold shadow-md scale-105'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? isSidebarOpen
                            ? 'text-blue-400'
                            : 'text-white'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    {isSidebarOpen && (
                      <span className="text-xs truncate text-left font-semibold">
                        {item.label}
                      </span>
                    )}
                    {item.badge && isSidebarOpen && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-slate-950 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Section: Live Clock */}
        <div className="px-3 py-3 border-t border-slate-800 space-y-2 mt-auto shrink-0 bg-slate-900/60">
          {isSidebarOpen ? (
            <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-md flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-slate-300 leading-tight mb-1 text-center truncate max-w-full">
                {dateStr}
              </span>
              <span className="text-base font-mono font-extrabold tracking-wider text-blue-400 leading-none mt-0.5">
                {hours}:{minutes}:{seconds}
              </span>
            </div>
          ) : (
            <div className="w-[44px] h-[38px] mx-auto flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-blue-400 shadow-xs" title={`${dateStr} ${hours}:${minutes}:${seconds}`}>
              <Clock size={18} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
