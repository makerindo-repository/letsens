import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bell,
  Volume2,
  VolumeX,
  Database,
  Download,
  RefreshCcw,
  CheckCircle2,
  Save,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PengaturanAplikasiConfig } from '../../types';
import { settingsApi } from '../../api/settingsApi';

interface PengaturanAplikasiViewProps {
  config: PengaturanAplikasiConfig;
  onSaveConfig: (config: PengaturanAplikasiConfig) => void;
  onResetData: () => void;
  allAppData: any;
}

export const PengaturanAplikasiView: React.FC<PengaturanAplikasiViewProps> = ({
  config,
  onSaveConfig,
  onResetData,
  allAppData,
}) => {
  const [formData, setFormData] = useState<PengaturanAplikasiConfig>(config);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load app settings from backend on mount
  useEffect(() => {
    loadFromBackend();
  }, []);

  const loadFromBackend = async () => {
    try {
      const res = await settingsApi.getByGroup('app');
      const data = res.data;
      if (data && typeof data === 'object') {
        setFormData((prev) => ({
          ...prev,
          appName: data.app_name || prev.appName,
          institution: data.institution || prev.institution,
          campusLocation: data.campus_location || prev.campusLocation,
          contactHotline: data.contact_hotline || prev.contactHotline,
          whatsappNotificationNumber: data.whatsapp_notification_number || prev.whatsappNotificationNumber,
          soundAlarmEnabled: data.sound_alarm_enabled === 'true',
        }));
      }
    } catch (e) {
      console.warn('Using local config fallback for app settings');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateGroup('app', {
        app_name: formData.appName,
        institution: formData.institution,
        campus_location: formData.campusLocation,
        contact_hotline: formData.contactHotline,
        whatsapp_notification_number: formData.whatsappNotificationNumber,
        sound_alarm_enabled: formData.soundAlarmEnabled ? 'true' : 'false',
      });
      showToast('Pengaturan aplikasi berhasil disimpan ke server!');
    } catch (e) {
      console.warn('Saving to local state only');
      showToast('Disimpan ke state lokal (server tidak tersedia).');
    }
    onSaveConfig(formData);
    setSaving(false);
  };

  const handleBackupData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allAppData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `letsens_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup database JSON berhasil diunduh!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section: Profil Institusi */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 shrink-0 border border-indigo-500/20 shadow-xs">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">Profil Institusi & Identitas</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Informasi kampus dan kontak penanggung jawab operasional smart toilet
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Nama Aplikasi</label>
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Institusi / Universitas</label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Lokasi Kampus</label>
                <input
                  type="text"
                  value={formData.campusLocation}
                  onChange={(e) => setFormData({ ...formData, campusLocation: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Kontak Hotline Fasilitas</label>
                <input
                  type="text"
                  value={formData.contactHotline}
                  onChange={(e) => setFormData({ ...formData, contactHotline: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Notifikasi & Audio Alarm */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 shrink-0 border border-violet-500/20 shadow-xs">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">Notifikasi & Audio Alarm</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Gateway WhatsApp darurat dan buzzer peringatan dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">No. WhatsApp Koordinator</label>
                <input
                  type="text"
                  value={formData.whatsappNotificationNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNotificationNumber: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                  placeholder="6281234567890"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Penerima alert darurat amonia &gt; 20 PPM</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Audio Alarm Buzzer</label>
                <div
                  onClick={() => setFormData({ ...formData, soundAlarmEnabled: !formData.soundAlarmEnabled })}
                  className={`w-full h-11 px-4 rounded-2xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                    formData.soundAlarmEnabled
                      ? 'bg-violet-50 border-violet-300 text-violet-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {formData.soundAlarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span>{formData.soundAlarmEnabled ? 'Alarm Audio Aktif' : 'Alarm Audio Nonaktif'}</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${formData.soundAlarmEnabled ? 'bg-violet-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${formData.soundAlarmEnabled ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Bunyikan sinyal saat status bahaya terdeteksi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Backup & Data */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20 shadow-xs">
                <Database size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">Manajemen Data & Cadangan</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Unduh salinan data seluruh sistem atau setel ulang ke konfigurasi default
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBackupData}
                className="flex items-center gap-2 h-11 px-5 rounded-2xl font-extrabold text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-sm"
              >
                <Download size={16} className="text-slate-500" />
                Backup Database JSON
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin menyetel ulang database ke data default awal?')) {
                    onResetData();
                    showToast('Data berhasil direset ke konfigurasi default.');
                  }
                }}
                className="flex items-center gap-2 h-11 px-5 rounded-2xl font-extrabold text-xs bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer shadow-sm"
              >
                <RefreshCcw size={16} className="text-rose-500" />
                Reset ke Default
              </button>
            </div>
          </div>
        </div>


      </form>
    </div>
  );
};
