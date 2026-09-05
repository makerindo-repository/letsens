import React from 'react';
import { LayoutDashboard, Bot, Compass, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface NotFoundViewProps {
  invalidPath?: string;
  onNavigate: (menu: any) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  invalidPath = window.location.pathname,
  onNavigate,
}) => {
  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden"
      >
        {/* Glow Background Elements */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* 404 Header Graphic */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-600 border border-blue-200 flex items-center justify-center shadow-inner shrink-0">
            <Compass size={48} className="text-blue-600 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 px-3 py-1 bg-rose-500 text-white font-mono font-black text-xs rounded-full shadow-md">
            404
          </span>
        </div>

        {/* Text Content */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed max-w-md mx-auto">
            Alamat URL <code className="bg-slate-100 px-2.5 py-1 rounded-xl text-blue-600 font-mono text-xs font-bold border border-slate-200">{invalidPath}</code> yang Anda tuju tidak terdaftar atau telah dipindahkan dalam Sistem Informasi LetSens AIoT UNIKOM.
          </p>
        </div>

        {/* Information Box */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs font-medium text-slate-600 space-y-1 text-left flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">Petunjuk Navigasi Sistem:</p>
            <p className="text-slate-500">
              Gunakan menu di sidebar sebelah kiri atau klik tombol di bawah untuk kembali ke halaman Dasbor Utama.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('dasbor')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <LayoutDashboard size={16} />
            <span>Kembali ke Dasbor Utama</span>
          </button>

          <button
            onClick={() => onNavigate('letsens-ai')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-slate-200"
          >
            <Bot size={16} className="text-blue-600" />
            <span>Tanyakan LetSensAI</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
