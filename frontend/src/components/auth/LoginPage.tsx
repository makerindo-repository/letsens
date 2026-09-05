import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Brain,
  ShieldCheck,
  Zap,
  Sparkles,
  Wind,
  Droplets,
  ShieldAlert
} from 'lucide-react';
import { authApi, AuthUser } from '../../api/authApi';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>(
    () => localStorage.getItem('letsens_remember_email') || ''
  );
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(
    () => !!localStorage.getItem('letsens_remember_email')
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat Email dan Kata Sandi.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.login(email.trim(), password);

      if (res.success && res.data?.token) {
        const { token, user } = res.data;

        if (rememberMe) {
          localStorage.setItem('letsens_remember_email', email.trim());
        } else {
          localStorage.removeItem('letsens_remember_email');
        }

        localStorage.setItem('letsens_token', token);
        localStorage.setItem('letsens_user', JSON.stringify(user));

        onLoginSuccess(user, token);
      } else {
        setErrorMessage(res.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Kredensial email atau kata sandi tidak cocok dengan data terdaftar.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* LEFT HERO SECTION */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-10 xl:p-12 overflow-hidden border-r border-slate-800/80">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('/login-hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/75 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />

        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-slate-700/60 shadow-xl"
          >
            <img src="/logo-unikom.png" alt="UNIKOM Logo" className="h-8 w-auto object-contain" />
            <div className="h-5 w-px bg-slate-700/80" />
            <span className="text-white font-extrabold text-xs tracking-wider uppercase">
              UNIVERSITAS KOMPUTER INDONESIA
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/60 text-xs font-bold text-slate-200 shadow-md">
              <span className="text-sm">🇮🇩</span> <span>Indonesia</span>
            </div>
          </motion.div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2.5 items-center"
          >
            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-extrabold tracking-wide px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs backdrop-blur-md">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              <span>Smart Building Platform</span>
            </span>
            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold tracking-wide px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xs backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Sanctum RBAC Security</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Sistem Telemetri Sanitasi & Kualitas Udara Bilik Toilet Smart Campus
            </h1>
            <p className="text-sm xl:text-base text-slate-300 font-normal leading-relaxed">
              Platform terintegrasi untuk pemantauan konsentrasi amonia (MQ-137), iklim makro bilik,
              serta kontrol otomatisasi ventilasi sirkulasi udara berbasis IoT UNIKOM.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl p-5.5 rounded-3xl shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Brain size={16} className="text-blue-400" />
                <span className="text-xs font-mono font-extrabold text-white">
                  Spesifikasi Operasional & Arsitektur Sistem
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/80 px-2.5 py-0.5 rounded-full">
                Standar Operasional
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
                  <Wind size={14} /> Amonia (MQ-137)
                </div>
                <p className="text-xs font-medium text-slate-300 leading-snug">
                  Deteksi konsentrasi gas amonia & evaluasi ambang batas aman
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
                  <Droplets size={14} /> Suhu & Kelembaban
                </div>
                <p className="text-xs font-medium text-slate-300 leading-snug">
                  Pengukuran iklim bilik untuk menjaga stabilitas kenyamanan
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                  <Eye size={14} /> Presensi & Cahaya (PIR)
                </div>
                <p className="text-xs font-medium text-slate-300 leading-snug">
                  Deteksi okupansi pengunjung & pemantauan intensitas cahaya bilik
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4 font-mono">
          <span>LetSens v1.0</span>
          <span>Universitas Komputer Indonesia</span>
        </div>
      </div>

      {/* RIGHT LOGIN FORM SECTION */}
      <div className="w-full lg:w-[42%] bg-slate-950 flex flex-col justify-between p-6 sm:p-10 xl:p-12 overflow-y-auto border-l border-slate-800/60 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md mx-auto my-auto py-6 space-y-8 relative z-10">
          <div className="text-center space-y-3.5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl shadow-blue-500/10 mb-1"
            >
              <img
                src="/letsens-logo.jpg"
                alt="Logo LetSens"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <div>
              <h2 className="text-3xl font-black tracking-tight text-white font-sans">
                LetSens
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Sistem Monitoring dan Manajemen Bilik Toilet
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 p-7 sm:p-8 rounded-3xl shadow-2xl shadow-slate-950 space-y-6"
          >
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold flex items-start gap-3"
                >
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-medium">
              <div className="space-y-2">
                <label htmlFor="email" className="font-extrabold text-[11px] uppercase tracking-wider text-slate-300 block">
                  ALAMAT EMAIL
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={17} />
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="Masukkan email terdaftar..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="font-extrabold text-[11px] uppercase tracking-wider text-slate-300 block">
                    KATA SANDI
                  </label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={17} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded border-slate-700 cursor-pointer focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-300">Ingat Saya</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>MEMVERIFIKASI...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    <span>MASUK SISTEM</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          <div className="text-center text-xs font-semibold text-slate-500 pt-2">
            &copy; {new Date().getFullYear()} Universitas Komputer Indonesia. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
