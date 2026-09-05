import React, { useState, useEffect } from 'react';
import {
  Settings,
  Radio,
  Sliders,
  Bell,
  Save,
  CheckCircle2,
  RefreshCw,
  Building2,
  Volume2,
  VolumeX,
  Database,
  Download,
  RefreshCcw,
  Wifi,
  WifiOff,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PengaturanSistemConfig } from '../../types';
import { settingsApi } from '../../api/settingsApi';

interface PengaturanSistemViewProps {
  config: PengaturanSistemConfig;
  onSaveConfig: (newConfig: PengaturanSistemConfig) => void;
}

export const PengaturanSistemView: React.FC<PengaturanSistemViewProps> = ({
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<PengaturanSistemConfig>(config);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mqttTesting, setMqttTesting] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load settings from backend on mount
  useEffect(() => {
    loadFromBackend();
  }, []);

  const loadFromBackend = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getByGroup('system');
      const data = res.data;
      if (data && typeof data === 'object') {
        setFormData((prev) => ({
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
        }));
        showToast('Konfigurasi sistem berhasil dimuat dari server.');
      }
    } catch (e) {
      console.warn('Using local config fallback for system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save to backend
      await settingsApi.updateGroup('system', {
        mqtt_broker_host: formData.mqttBrokerHost,
        mqtt_port: String(formData.mqttPort),
        mqtt_topic_root: formData.mqttTopicRoot,
        telemetry_interval_seconds: String(formData.telemetryIntervalSeconds),
        api_endpoint: formData.apiEndpoint,
        amonia_warning_threshold: String(formData.amoniaWarningThreshold),
        amonia_danger_threshold: String(formData.amoniaDangerThreshold),
        low_soap_threshold_percent: String(formData.lowSoapThresholdPercent),
        low_tissue_threshold_percent: String(formData.lowTissueThresholdPercent),
        max_occupancy_minutes_alert: String(formData.maxOccupancyMinutesAlert),
        auto_trigger_blower: formData.autoTriggerBlower ? 'true' : 'false',
      });
      showToast('Konfigurasi sistem berhasil disimpan ke server!');
    } catch (e) {
      console.warn('Saving to local state only');
      showToast('Disimpan ke state lokal (server tidak tersedia).');
    }
    // Always update parent state
    onSaveConfig(formData);
    setSaving(false);
  };

  const handleTestMqtt = async () => {
    setMqttTesting(true);
    setMqttStatus('idle');
    try {
      await settingsApi.testMqtt(formData.mqttBrokerHost, formData.mqttPort, formData.mqttTopicRoot);
      setMqttStatus('ok');
      showToast(`Koneksi MQTT ke ${formData.mqttBrokerHost}:${formData.mqttPort} berhasil!`);
    } catch (e) {
      setMqttStatus('fail');
      showToast('Gagal terhubung ke MQTT Broker.');
    } finally {
      setMqttTesting(false);
      setTimeout(() => setMqttStatus('idle'), 5000);
    }
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Pengaturan</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Konfigurasi sistem IoT, MQTT, ambang batas sensor, dan parameter operasional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadFromBackend}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all shadow-2xs cursor-pointer"
            title="Muat Ulang dari Server"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-2xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>
        {/* Section 1: MQTT & Koneksi IoT */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 shrink-0 border border-blue-500/20 shadow-xs">
                <Radio size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">Koneksi IoT & MQTT Broker</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Konfigurasi broker MQTT untuk menerima payload telemetri dari ESP32
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Host MQTT Broker</label>
                <input
                  type="text"
                  value={formData.mqttBrokerHost}
                  onChange={(e) => setFormData({ ...formData, mqttBrokerHost: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                  placeholder="broker.emqx.io"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Port MQTT</label>
                <input
                  type="number"
                  value={formData.mqttPort}
                  onChange={(e) => setFormData({ ...formData, mqttPort: parseInt(e.target.value) })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Topik Root Telemetri</label>
                <input
                  type="text"
                  value={formData.mqttTopicRoot}
                  onChange={(e) => setFormData({ ...formData, mqttTopicRoot: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                  placeholder="letsens/toilet/sensordata"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Interval Telemetri (Detik)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.telemetryIntervalSeconds}
                  onChange={(e) => setFormData({ ...formData, telemetryIntervalSeconds: parseInt(e.target.value) })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">REST API Ingestion URL</label>
                <input
                  type="text"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-xs text-slate-500 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
            </div>

            {/* MQTT Test Button */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleTestMqtt}
                disabled={mqttTesting}
                className="flex items-center gap-2 h-11 px-5 rounded-2xl font-extrabold text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {mqttTesting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : mqttStatus === 'ok' ? (
                  <Wifi size={16} className="text-emerald-600" />
                ) : mqttStatus === 'fail' ? (
                  <WifiOff size={16} className="text-rose-600" />
                ) : (
                  <Wifi size={16} />
                )}
                Test Koneksi MQTT
              </button>
              {mqttStatus === 'ok' && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Terhubung
                </span>
              )}
              {mqttStatus === 'fail' && (
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <WifiOff size={14} /> Gagal Terhubung
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Ambang Batas Sensor */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0 border border-amber-500/20 shadow-xs">
                <Sliders size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">Ambang Batas Sensor & Otomasi</h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Parameter peringatan amonia, stok, okupansi, dan kontrol exhaust blower
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Amonia Waspada (PPM)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.amoniaWarningThreshold}
                  onChange={(e) => setFormData({ ...formData, amoniaWarningThreshold: parseFloat(e.target.value) })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Default: 10.0 PPM</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Amonia Bahaya (PPM)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.amoniaDangerThreshold}
                  onChange={(e) => setFormData({ ...formData, amoniaDangerThreshold: parseFloat(e.target.value) })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Default: 20.0 PPM</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Alert Sabun & Tisu (%)</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.lowSoapThresholdPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowSoapThresholdPercent: parseInt(e.target.value),
                      lowTissueThresholdPercent: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Di bawah nilai ini kirim alert</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Maks Okupansi Bilik (Menit)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.maxOccupancyMinutesAlert}
                  onChange={(e) => setFormData({ ...formData, maxOccupancyMinutesAlert: parseInt(e.target.value) })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Alert darurat jika melebihi batas</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Otomasi Blower</label>
                <div
                  onClick={() => setFormData({ ...formData, autoTriggerBlower: !formData.autoTriggerBlower })}
                  className={`w-full h-11 px-4 rounded-2xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                    formData.autoTriggerBlower
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{formData.autoTriggerBlower ? 'Exhaust Otomatis Aktif' : 'Exhaust Otomatis Nonaktif'}</span>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${formData.autoTriggerBlower ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${formData.autoTriggerBlower ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Nyalakan exhaust saat amonia &gt; threshold</span>
              </div>
            </div>
          </div>
        </div>


      </form>

      {/* Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0 border border-emerald-500/20 shadow-xs">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Status Konfigurasi</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-snug">
              Pengaturan disimpan ke database Laravel dan disinkronkan dengan MQTT payload ESP32.
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">MQTT Broker</p>
            <p className="text-sm font-black text-slate-900 font-mono">{formData.mqttBrokerHost}:{formData.mqttPort}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
