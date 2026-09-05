import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Save,
  Camera,
  User,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { authApi, AuthUser } from '../../api/authApi';
import { DynamicIslandToast } from '../DynamicIslandToast';

interface ProfileViewProps {
  user: AuthUser | null;
  onUpdateUser: (updatedUser: AuthUser) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profile_photo || null);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.profile_photo) setPhotoPreview(user.profile_photo);
  }, [user]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Password Strength Calculator
  const passwordStrength = React.useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 1) return { score: 25, label: 'Lemah', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 65, label: 'Sedang', color: 'bg-amber-500' };
    return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500' };
  }, [newPassword]);

  // Photo Upload Handler with Canvas Compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('error', 'Ukuran foto maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoPreview(compressedBase64);
        setProfilePhoto(compressedBase64);
        showToast('info', 'Foto berhasil dimuat. Klik "Simpan Semua Perubahan" untuk memperbarui.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo Handler (Reset to Default)
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setProfilePhoto('DELETE');
    showToast('info', 'Foto profil dikembalikan ke default. Klik "Simpan Semua Perubahan" untuk menerapkan.');
  };

  // Save All Changes (Backend API Integration)
  const handleSaveAll = async () => {
    if (!name.trim()) {
      showToast('error', 'Nama lengkap tidak boleh kosong.');
      return;
    }

    const isPasswordAttempt = Boolean(currentPassword || newPassword || confirmPassword);
    if (isPasswordAttempt) {
      if (!currentPassword) {
        showToast('error', 'Masukkan kata sandi lama Anda terlebih dahulu.');
        return;
      }
      if (newPassword.length < 8) {
        showToast('error', 'Kata sandi baru minimal 8 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('error', 'Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    setIsSaving(true);
    let profileUpdated = false;
    let passwordUpdated = false;

    try {
      // 1. Update Profile
      const isProfileChanged = name.trim() !== user?.name || profilePhoto !== null;

      if (isProfileChanged) {
        const payload: { name: string; profile_photo?: string | null } = {
          name: name.trim(),
        };

        if (profilePhoto === 'DELETE') {
          payload.profile_photo = null;
        } else if (profilePhoto) {
          payload.profile_photo = profilePhoto;
        }

        const res = await authApi.updateProfile(payload);
        const updatedUserObj = res.data?.user || (res as any).user || (res as any).data;

        if (res.success && updatedUserObj) {
          const updated = {
            ...user!,
            name: updatedUserObj.name,
            profile_photo: updatedUserObj.profile_photo ?? null,
          };
          localStorage.setItem('letsens_user', JSON.stringify(updated));
          onUpdateUser(updated);
          setProfilePhoto(null);
          setPhotoPreview(updatedUserObj.profile_photo ?? null);
          profileUpdated = true;
        } else {
          showToast('error', res.message || 'Gagal memperbarui profil.');
        }
      }

      // 2. Update Password
      if (isPasswordAttempt) {
        const res = await authApi.updatePassword({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        });

        if (res.success) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          passwordUpdated = true;
        } else {
          showToast('error', res.message || 'Kata sandi lama tidak cocok.');
        }
      }

      if (profileUpdated && passwordUpdated) {
        showToast('success', 'Profil dan kata sandi Anda berhasil diperbarui!');
      } else if (profileUpdated) {
        showToast('success', 'Informasi profil berhasil diperbarui!');
      } else if (passwordUpdated) {
        showToast('success', 'Kata sandi akun Anda berhasil diperbarui!');
      } else if (!isPasswordAttempt && !isProfileChanged) {
        showToast('info', 'Tidak ada perubahan data yang perlu disimpan.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 select-none relative">
      {/* Dynamic Island Floating Notification Pill */}
      <DynamicIslandToast
        show={Boolean(notification)}
        message={notification?.message ?? null}
        type={notification?.type ?? 'info'}
        onClose={() => setNotification(null)}
      />

      {/* Page Title & Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Profil Saya</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Kelola data diri, foto profil, dan pengaturan keamanan akun LetSens Anda
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-extrabold shadow-xs">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>Akun Sanctum Terverifikasi</span>
        </div>
      </div>

      {/* Hero Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar Ring Glassmorphism + Camera Hover Uploader */}
          <div className="flex flex-col items-center sm:items-start gap-2.5">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-white/30 shadow-2xl bg-slate-950 flex items-center justify-center relative group cursor-pointer">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Avatar"
                    className="w-full h-full rounded-3xl object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full rounded-3xl bg-blue-600/30 text-blue-200 font-black text-3xl flex items-center justify-center">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                {/* Professional Hover Overlay */}
                <label className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer rounded-3xl">
                  <Camera size={20} className="text-blue-300" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Ubah Foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>

              {/* Single Refined Circular Camera Badge */}
              <label
                title="Unggah Foto Baru"
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg ring-3 ring-slate-900 cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
              >
                <Camera size={15} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Remove Photo Action Link */}
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[11px] font-bold text-rose-300 hover:text-rose-200 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Hapus foto profil</span>
              </button>
            )}
          </div>

          {/* User Identity Info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Pengguna LetSens'}</h2>
              <span className="bg-white/15 text-white border border-white/20 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
                {user?.role || 'Super Admin'}
              </span>
            </div>
            <p className="text-blue-100 text-xs font-medium opacity-90">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tab Bar */}
      <div className="space-y-5">
        <div className="flex gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl self-start w-fit">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <User size={15} />
            <span>Biodata</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Lock size={15} />
            <span>Keamanan</span>
          </button>
        </div>

        {/* TAB 1: BIODATA */}
        {activeTab === 'info' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Informasi Data Diri
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Perbarui nama lengkap akun Anda yang ditampilkan pada laporan sistem
                </p>
              </div>

              <div className="space-y-5 text-xs font-medium">
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Masukkan nama lengkap Anda..."
                  />
                  <p className="text-[11px] text-slate-500 font-semibold">Nama ini ditampilkan pada seluruh log aktivitas dan laporan sistem.</p>
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                    Alamat Email (Pos-el)
                  </label>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="font-extrabold text-sm text-slate-900">{email}</span>
                    <span className="text-[10px] font-bold bg-white text-slate-500 px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                      Terkunci (Hak Akses System)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                    Peran Pengguna (Role RBAC)
                  </label>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-blue-600" />
                      <span className="font-extrabold text-sm text-slate-900">{user?.role || 'Super Admin'}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-slate-500 px-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                      Dikelola Super Admin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: KEAMANAN */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Key size={18} className="text-blue-600" />
                  Pembaruan Kata Sandi
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Pastikan kata sandi Anda kuat untuk menjaga keamanan otentikasi Sanctum
                </p>
              </div>

              <div className="space-y-5 text-xs font-medium">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                    Kata Sandi Lama
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Masukkan kata sandi lama Anda..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={!currentPassword}
                      className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                      placeholder="Minimal 8 karakter (huruf, angka, simbol)..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={!currentPassword}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-extrabold">
                        <span className="text-slate-500">Kekuatan Kata Sandi:</span>
                        <span className={passwordStrength.score >= 100 ? 'text-emerald-600' : passwordStrength.score >= 65 ? 'text-amber-600' : 'text-rose-600'}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={!currentPassword}
                      className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                      placeholder="Ulangi kata sandi baru Anda..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={!currentPassword}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {confirmPassword && newPassword && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                      {confirmPassword === newPassword ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Kata sandi cocok
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle size={13} /> Kata sandi belum cocok
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Save Changes Action Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-2 flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full sm:w-auto sm:min-w-[240px] py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>{isSaving ? 'MENYIMPAN PERUBAHAN...' : 'SIMPAN SEMUA PERUBAHAN'}</span>
        </button>
      </motion.div>
    </div>
  );
};
