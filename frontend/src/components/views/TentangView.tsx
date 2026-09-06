import React from 'react';
import { Activity, Bot, Boxes, Cpu, Info, ShieldCheck, Sparkles, FileText } from 'lucide-react';

export const TentangView: React.FC = () => {
  const featureCards = [
    {
      icon: Activity,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      title: 'Pemantauan Sensor Telemetri Real-Time',
      desc: 'Pengumpulan data telemetri amonia (MQ-137), suhu & kelembaban udara (DHT22), intensitas cahaya (LDR), serta keberadaan orang (PIR HC-SR501) secara seketika di setiap bilik toilet.',
    },
    {
      icon: Bot,
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      title: 'LetSensAI & Analitik Prediktif',
      desc: 'Model kecerdasan buatan untuk proyeksi tingkat kebersihan, deteksi anomali bau gas amonia, dan rekomendasi waktu sanitasi optimal.',
    },
    {
      icon: Boxes,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      title: 'Manajemen Utilitas & Fasilitas Toilet',
      desc: 'Pencatatan manual dan monitoring ketersediaan sabun cuci tangan, tisu, pengharum ruangan, kastop, kondisi uriner, tembok, dan pintu per gedung & lantai.',
    },
    {
      icon: ShieldCheck,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      title: 'Jadwal Pemeliharaan & Kerusakan',
      desc: 'Penugasan otomatis petugas kebersihan, rekap aduan kerusakan fasilitas fisik, serta pelaporan historis tindakan perbaikan bilik.',
    },
    {
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      title: 'Laporan & Ekspor Otomatis',
      desc: 'Generasi rekapitulasi audit kebersihan berkala dalam format PDF dan Excel/CSV untuk standar sanitasi kampus enterprise.',
    },
    {
      icon: Cpu,
      color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      title: 'Konektivitas IoT Node & Backend API',
      desc: 'Arsitektur terpusat terintegrasi Laravel REST API dan WebSocket/MQTT streaming telemetri node IoT berkecepatan tinggi.',
    },
  ];

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto pb-20 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Tentang
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Sistem Informasi Manajemen Toilet Cerdas Universitas Komputer Indonesia
            </p>
          </div>
        </div>
      </div>

      {/* Hero Banner Header */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white p-8 sm:p-10 shadow-xl relative overflow-hidden text-center sm:text-left border border-slate-800">
        {/* Background Pattern */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
          {/* Logo Brand Container */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2.5 shadow-2xl shrink-0 flex items-center justify-center border border-slate-700/60 ring-4 ring-blue-500/20">
            <img src="/letsens-logo.jpg" alt="LetSens Logo" className="w-full h-full object-contain rounded-2xl" />
          </div>

          <div className="space-y-3 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm text-white">
              LetSens - Toilet Sensing System
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium opacity-95 max-w-3xl">
              Sistem Pemantauan dan Manajemen Toilet Cerdas Universitas Komputer Indonesia yang memadukan Internet of Things (IoT) dan Artificial Intelligence (AI) untuk menghadirkan fasilitas sanitasi higienis, nyaman, dan efisien secara real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Grid 6 Kartu Fitur Unggulan */}
      <section className="space-y-5">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Fitur dan Kapabilitas Unggulan</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Teknologi pintar yang menggerakkan ekosistem LetSens</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col space-y-3 relative overflow-hidden group hover:border-blue-300 transition-all hover:shadow-md"
              >
                <div className={`p-3 w-12 h-12 rounded-2xl flex items-center justify-center font-bold border ${card.color}`}>
                  <IconComponent size={24} />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Institution Section - UNIKOM Logo Only */}
      <section className="pt-6 border-t border-slate-200/80">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div>
            <p className="text-xs font-black tracking-widest uppercase text-blue-600">Dikembangkan Oleh</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Universitas Komputer Indonesia</p>
          </div>
          <div className="flex items-center justify-center p-3 px-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all hover:scale-105">
            <img src="/logo-unikom-new.png" alt="UNIKOM" className="h-12 w-auto object-contain" width={48} height={48} />
          </div>
        </div>
      </section>
    </div>
  );
};
