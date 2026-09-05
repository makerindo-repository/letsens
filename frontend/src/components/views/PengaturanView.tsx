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
  Wifi,
  WifiOff,
  ShieldCheck,
  Loader2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Bot,
  Cpu,
  Terminal,
  Play,
  Square,
  Copy,
  Download,
  Check,
  Send,
  Code,
  Dices,
  Flame,
  Thermometer,
  Droplet,
  Activity,
  Sun,
  BatteryCharging,
  Package,
  Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicIslandToast } from '../DynamicIslandToast';
import { PengaturanSistemConfig, PengaturanAplikasiConfig } from '../../types';
import { settingsApi } from '../../api/settingsApi';
import { telemetryApi } from '../../api/telemetryApi';

interface PengaturanViewProps {
  systemConfig: PengaturanSistemConfig;
  appConfig: PengaturanAplikasiConfig;
  userRole?: string;
  onSaveSystemConfig: (config: PengaturanSistemConfig) => void;
  onSaveAppConfig: (config: PengaturanAplikasiConfig) => void;
  onResetData?: () => void;
  allAppData?: any;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  systemConfig,
  appConfig,
  userRole = 'Super Admin',
  onSaveSystemConfig,
  onSaveAppConfig,
}) => {
  const isSuperAdmin = (userRole || 'Super Admin').toLowerCase().includes('admin');
  const [sysForm, setSysForm] = useState<PengaturanSistemConfig>(systemConfig);
  const [appForm, setAppForm] = useState<PengaturanAplikasiConfig>(appConfig);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mqttTesting, setMqttTesting] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [geminiTestMsg, setGeminiTestMsg] = useState<string | null>(null);

  // ESP32 Telemetry Emulator States (Super Admin Only)
  const [emuDeviceId, setEmuDeviceId] = useState('ESP32-TK-01A');
  const [emuToiletCode, setEmuToiletCode] = useState('T-A1-F');
  const [emuTopic, setEmuTopic] = useState('letsens/toilet/sensordata');
  const [emuIntervalSec, setEmuIntervalSec] = useState<number>(() => {
    return parseInt(localStorage.getItem('letsens_emu_interval') || '15');
  });
  const [emuAmonia, setEmuAmonia] = useState(7.85);
  const [emuSuhu, setEmuSuhu] = useState(26.5);
  const [emuRh, setEmuRh] = useState(62.0);
  const [emuPir, setEmuPir] = useState(true);
  const [emuCahaya, setEmuCahaya] = useState(380);
  const [emuRssi, setEmuRssi] = useState(-52);
  const [emuBaterai, setEmuBaterai] = useState(95);
  const [emuSoap, setEmuSoap] = useState(85);
  const [emuTissue, setEmuTissue] = useState(70);

  const [emuStreaming, setEmuStreaming] = useState<boolean>(() => {
    return localStorage.getItem('letsens_emu_streaming') === 'true';
  });
  const [emuSending, setEmuSending] = useState(false);
  const [emuLogMsg, setEmuLogMsg] = useState<string | null>(null);
  const [copiedPython, setCopiedPython] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Synchronize state when props change
  useEffect(() => {
    setSysForm(systemConfig);
  }, [systemConfig]);

  useEffect(() => {
    setAppForm(appConfig);
  }, [appConfig]);

  // Load all settings from backend on mount
  useEffect(() => {
    loadAllFromBackend();
  }, []);

  const loadAllFromBackend = async () => {
    setLoading(true);
    try {
      const [sysRes, appRes] = await Promise.allSettled([
        settingsApi.getByGroup('system'),
        settingsApi.getByGroup('app'),
      ]);

      if (sysRes.status === 'fulfilled' && sysRes.value.data) {
        const data = sysRes.value.data;
        setSysForm((prev) => ({
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

      if (appRes.status === 'fulfilled' && appRes.value.data) {
        const data = appRes.value.data;
        setAppForm((prev) => ({
          ...prev,
          appName: data.app_name || prev.appName,
          institution: data.institution || prev.institution,
          campusLocation: data.campus_location || prev.campusLocation,
          contactHotline: data.contact_hotline || prev.contactHotline,
          whatsappNotificationNumber: data.whatsapp_notification_number || prev.whatsappNotificationNumber,
          soundAlarmEnabled: data.sound_alarm_enabled === 'true',
        }));
      }

      showToast('Semua pengaturan berhasil dimuat dari server backend.');
    } catch (e) {
      console.warn('Fallback to local config for settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save both system and app settings to backend REST API
      await Promise.all([
        settingsApi.updateGroup('system', {
          mqtt_broker_host: sysForm.mqttBrokerHost,
          mqtt_port: String(sysForm.mqttPort),
          mqtt_topic_root: sysForm.mqttTopicRoot,
          telemetry_interval_seconds: String(sysForm.telemetryIntervalSeconds),
          api_endpoint: sysForm.apiEndpoint,
          amonia_warning_threshold: String(sysForm.amoniaWarningThreshold),
          amonia_danger_threshold: String(sysForm.amoniaDangerThreshold),
          low_soap_threshold_percent: String(sysForm.lowSoapThresholdPercent),
          low_tissue_threshold_percent: String(sysForm.lowTissueThresholdPercent),
          max_occupancy_minutes_alert: String(sysForm.maxOccupancyMinutesAlert),
          auto_trigger_blower: sysForm.autoTriggerBlower ? 'true' : 'false',
          gemini_api_key: sysForm.geminiApiKey || '',
        }),
        settingsApi.updateGroup('app', {
          app_name: appForm.appName,
          institution: appForm.institution,
          campus_location: appForm.campusLocation,
          contact_hotline: appForm.contactHotline,
          whatsapp_notification_number: appForm.whatsappNotificationNumber,
          sound_alarm_enabled: appForm.soundAlarmEnabled ? 'true' : 'false',
        }),
      ]);

      showToast('Semua pengaturan (Sistem, MQTT & Aplikasi) berhasil disimpan!');
    } catch (e) {
      console.warn('Saving to local state fallback');
      showToast('Disimpan ke state lokal (server backend tidak merespons).');
    }

    // Always update parent states
    onSaveSystemConfig(sysForm);
    onSaveAppConfig(appForm);
    setSaving(false);
  };

  const handleTestMqtt = async () => {
    setMqttTesting(true);
    setMqttStatus('idle');
    try {
      await settingsApi.testMqtt(sysForm.mqttBrokerHost, sysForm.mqttPort, sysForm.mqttTopicRoot);
      setMqttStatus('ok');
      showToast(`Koneksi MQTT ke ${sysForm.mqttBrokerHost}:${sysForm.mqttPort} berhasil!`);
    } catch (e) {
      setMqttStatus('fail');
      showToast('Gagal terhubung ke MQTT Broker.');
    } finally {
      setMqttTesting(false);
      setTimeout(() => setMqttStatus('idle'), 5000);
    }
  };

  const handleTestGeminiKey = async () => {
    if (!sysForm.geminiApiKey?.trim()) {
      showToast('Harap isi Gemini API Key terlebih dahulu.');
      return;
    }
    setGeminiTesting(true);
    setGeminiStatus('idle');
    setGeminiTestMsg(null);
    try {
      const res = await settingsApi.testGeminiKey(sysForm.geminiApiKey);
      if (res.data && res.data.status === 'valid') {
        setGeminiStatus('ok');
        const msg = res.message || 'Gemini API Key VALID & Terhubung ke Google AI Studio!';
        setGeminiTestMsg(msg);
        showToast(msg);
      } else {
        setGeminiStatus('fail');
        const errMsg = res.message || 'Gemini API Key TIDAK VALID. Periksa kembali key Anda.';
        setGeminiTestMsg(errMsg);
        showToast(errMsg);
      }
    } catch (err: any) {
      setGeminiStatus('fail');
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Gemini API Key TIDAK VALID! Periksa kembali key Anda.';
      setGeminiTestMsg(errMsg);
      showToast(errMsg);
    } finally {
      setGeminiTesting(false);
    }
  };

  // Realistic Sensor Data Generator Function
  const handleRandomizeData = (preset?: 'normal' | 'busy' | 'critical' | 'night') => {
    if (preset === 'normal') {
      setEmuAmonia(1.25);
      setEmuSuhu(25.8);
      setEmuRh(62);
      setEmuPir(false);
      setEmuCahaya(380);
      setEmuRssi(-55);
      setEmuBaterai(98);
      setEmuSoap(85);
      setEmuTissue(75);
      showToast('Skenario "Kondisi Normal / Clean" diterapkan!');
      return;
    }

    if (preset === 'busy') {
      setEmuAmonia(8.45);
      setEmuSuhu(28.4);
      setEmuRh(76);
      setEmuPir(true);
      setEmuCahaya(460);
      setEmuRssi(-64);
      setEmuBaterai(91);
      setEmuSoap(40);
      setEmuTissue(30);
      showToast('Skenario "Pengunjung Ramai" diterapkan!');
      return;
    }

    if (preset === 'critical') {
      setEmuAmonia(22.80);
      setEmuSuhu(30.6);
      setEmuRh(83);
      setEmuPir(true);
      setEmuCahaya(480);
      setEmuRssi(-72);
      setEmuBaterai(82);
      setEmuSoap(12);
      setEmuTissue(8);
      showToast('Skenario "Peringatan Bau Kritis (Amonia High)" diterapkan!');
      return;
    }

    if (preset === 'night') {
      setEmuAmonia(0.85);
      setEmuSuhu(24.2);
      setEmuRh(64);
      setEmuPir(false);
      setEmuCahaya(25);
      setEmuRssi(-52);
      setEmuBaterai(88);
      setEmuSoap(85);
      setEmuTissue(75);
      showToast('Skenario "Malam Hari / Standby" diterapkan!');
      return;
    }

    // Default Random Realistis with Physical Correlations
    const isOccupied = Math.random() > 0.55;
    const randAmonia = isOccupied
      ? parseFloat((Math.random() * 14 + 4.5).toFixed(2)) // 4.5 - 18.5 PPM when occupied
      : parseFloat((Math.random() * 3.5 + 0.5).toFixed(2)); // 0.5 - 4.0 PPM when vacant

    const randSuhu = parseFloat((Math.random() * 5 + 24.5).toFixed(1)); // 24.5 - 29.5°C
    const randRh = parseFloat((Math.random() * 25 + 55).toFixed(1)); // 55 - 80%
    const randCahaya = isOccupied ? Math.floor(Math.random() * 150 + 350) : Math.floor(Math.random() * 250 + 50); // Lux
    const randRssi = Math.floor(Math.random() * 35 - 85); // -85 to -50 dBm
    const randBat = Math.floor(Math.random() * 30 + 70); // 70-100%
    const randSoap = Math.floor(Math.random() * 80 + 15);
    const randTissue = Math.floor(Math.random() * 80 + 10);

    setEmuAmonia(randAmonia);
    setEmuSuhu(randSuhu);
    setEmuRh(randRh);
    setEmuPir(isOccupied);
    setEmuCahaya(randCahaya);
    setEmuRssi(randRssi);
    setEmuBaterai(randBat);
    setEmuSoap(randSoap);
    setEmuTissue(randTissue);

    showToast('🎲 Data sensor berhasil diacak secara realistis sesuai dinamika fisik!');
  };

  // Real-time synchronization listener for background stream ticks
  useEffect(() => {
    const handleTelemetryPublished = (e: any) => {
      const data = e.detail;
      if (!data) return;

      // Update live UI sliders
      setEmuAmonia(data.amonia);
      setEmuSuhu(data.suhu);
      setEmuRh(data.rh);
      setEmuPir(Boolean(data.PIR));
      setEmuCahaya(data.cahaya);
      setEmuRssi(data.RSSI);
      setEmuBaterai(data.Baterai);
      setEmuSoap(data.soap_level_percent);
      setEmuTissue(data.tissue_level_percent);

      const activeTopic = sysForm.mqttTopicRoot || emuTopic;
      const nowStr = new Date().toLocaleTimeString('id-ID');
      setEmuLogMsg(
        `[${nowStr}] 📡 Auto-Stream Telemetri Realistis Published -> Topik '${activeTopic}' (Node: ${data.kode_perangkat || emuDeviceId}, Amonia: ${data.amonia} PPM, Temp: ${data.suhu}°C, PIR: ${data.PIR ? '1' : '0'})`
      );
    };

    window.addEventListener('letsens_telemetry_published', handleTelemetryPublished);
    return () => {
      window.removeEventListener('letsens_telemetry_published', handleTelemetryPublished);
    };
  }, [emuDeviceId, emuTopic, sysForm.mqttTopicRoot]);

  const handleSendSinglePayload = async () => {
    setEmuSending(true);
    const activeTopic = sysForm.mqttTopicRoot || emuTopic;
    const payload = {
      kode_perangkat: emuDeviceId,
      amonia: emuAmonia,
      suhu: emuSuhu,
      rh: emuRh,
      PIR: emuPir,
      cahaya: emuCahaya,
      RSSI: emuRssi,
      Baterai: emuBaterai,
      soap_level_percent: emuSoap,
      tissue_level_percent: emuTissue,
    };

    const nowStr = new Date().toLocaleTimeString('id-ID');
    // Optimistic UI broadcast for 0ms instant feedback
    window.dispatchEvent(new CustomEvent('letsens_telemetry_published', { detail: payload }));
    setEmuLogMsg(
      `[${nowStr}] 🚀 Single Payload Telemetri Published -> Topik '${activeTopic}' (Node: ${emuDeviceId}, Amonia: ${emuAmonia} PPM)`
    );

    try {
      await telemetryApi.injectTelemetry(payload as any);
      showToast('Payload simulasi ESP32 berhasil dikirim dan disinkronkan ke Web Dashboard!');
    } catch (err: any) {
      setEmuLogMsg(`[${nowStr}] ❌ Error: ${err.message || 'Gagal terhubung ke REST API'}`);
    } finally {
      setEmuSending(false);
    }
  };

  const currentPayloadJson = JSON.stringify(
    {
      kode_perangkat: emuDeviceId,
      amonia: emuAmonia,
      suhu: emuSuhu,
      rh: emuRh,
      PIR: emuPir,
      cahaya: emuCahaya,
      RSSI: emuRssi,
      Baterai: emuBaterai,
      soap_level_percent: emuSoap,
      tissue_level_percent: emuTissue,
    },
    null,
    2
  );

  const pythonScriptCode = `#!/usr/bin/env python3
"""
LetSens AIoT Smart Sanitation System
ESP32 Hardware Emulator & MQTT Telemetry Publisher
Universitas Komputer Indonesia (UNIKOM)
"""

import json
import time
import random
import sys

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Installing paho-mqtt module...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paho-mqtt"])
    import paho.mqtt.client as mqtt

# Configuration
BROKER_HOST = "${sysForm.mqttBrokerHost || 'broker.hivemq.com'}"
BROKER_PORT = ${sysForm.mqttPort || 1883}
TOPIC = "${sysForm.mqttTopicRoot || emuTopic}"
DEVICE_ID = "${emuDeviceId}"
INTERVAL = ${emuIntervalSec}

def generate_telemetry():
    return {
        "kode_perangkat": DEVICE_ID,
        "amonia": round(random.uniform(${Math.max(1, emuAmonia - 2).toFixed(1)}, ${(emuAmonia + 4).toFixed(1)}), 2),
        "suhu": round(random.uniform(24.0, 31.5), 1),
        "rh": round(random.uniform(55.0, 78.0), 1),
        "PIR": random.choice([True, False]),
        "cahaya": round(random.uniform(200.0, 550.0), 1),
        "RSSI": ${emuRssi},
        "Baterai": ${emuBaterai},
        "soap_level_percent": ${emuSoap},
        "tissue_level_percent": ${emuTissue}
    }

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Connected to MQTT Broker: {BROKER_HOST}:{BROKER_PORT}")
        print(f"📡 Publishing to topic: {TOPIC}\\n")
    else:
        print(f"❌ Connection failed with code {rc}")

def run_emulator():
    client = mqtt.Client(client_id=f"Simulator-{DEVICE_ID}")
    client.on_connect = on_connect

    try:
        client.connect(BROKER_HOST, BROKER_PORT, 60)
        client.loop_start()

        print(f"🚀 ESP32 Hardware Emulator Started [{DEVICE_ID}] -> Topic: {TOPIC}")
        print("Tekan Ctrl+C untuk menghentikan simulator.\\n")

        while True:
            payload = generate_telemetry()
            json_payload = json.dumps(payload)
            client.publish(TOPIC, json_payload)
            print(f"[{time.strftime('%H:%M:%S')}] 📤 Telemetry Published to '{TOPIC}':")
            print(json.dumps(payload, indent=2))
            print("-" * 50)
            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\\n🛑 Emulator stopped by user.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    run_emulator()
`;

  const handleCopyPythonScript = () => {
    navigator.clipboard.writeText(pythonScriptCode);
    setCopiedPython(true);
    showToast('Script Python (emulator.py) berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedPython(false), 3000);
  };

  const handleDownloadPythonScript = () => {
    const element = document.createElement('a');
    const file = new Blob([pythonScriptCode], { type: 'text/x-python' });
    element.href = URL.createObjectURL(file);
    element.download = 'emulator.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('File script Python (emulator.py) berhasil diunduh!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <DynamicIslandToast
        show={Boolean(toastMsg)}
        message={toastMsg}
        type="success"
        onClose={() => setToastMsg(null)}
      />

      <form onSubmit={handleSaveAll} className="space-y-6">
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
              onClick={loadAllFromBackend}
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
                  value={sysForm.mqttBrokerHost}
                  onChange={(e) => setSysForm({ ...sysForm, mqttBrokerHost: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                  placeholder="broker.emqx.io"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Port MQTT</label>
                <input
                  type="number"
                  value={sysForm.mqttPort}
                  onChange={(e) => setSysForm({ ...sysForm, mqttPort: parseInt(e.target.value) || 1883 })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Topik Root Telemetri</label>
                <input
                  type="text"
                  value={sysForm.mqttTopicRoot}
                  onChange={(e) => setSysForm({ ...sysForm, mqttTopicRoot: e.target.value })}
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
                  value={sysForm.telemetryIntervalSeconds}
                  onChange={(e) => setSysForm({ ...sysForm, telemetryIntervalSeconds: parseInt(e.target.value) || 10 })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">REST API Ingestion URL</label>
                <input
                  type="text"
                  value={sysForm.apiEndpoint}
                  onChange={(e) => setSysForm({ ...sysForm, apiEndpoint: e.target.value })}
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
                  value={sysForm.amoniaWarningThreshold}
                  onChange={(e) => setSysForm({ ...sysForm, amoniaWarningThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Default: 10.0 PPM</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Amonia Bahaya (PPM)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sysForm.amoniaDangerThreshold}
                  onChange={(e) => setSysForm({ ...sysForm, amoniaDangerThreshold: parseFloat(e.target.value) || 0 })}
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
                  value={sysForm.lowSoapThresholdPercent}
                  onChange={(e) =>
                    setSysForm({
                      ...sysForm,
                      lowSoapThresholdPercent: parseInt(e.target.value) || 15,
                      lowTissueThresholdPercent: parseInt(e.target.value) || 15,
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
                  value={sysForm.maxOccupancyMinutesAlert}
                  onChange={(e) => setSysForm({ ...sysForm, maxOccupancyMinutesAlert: parseInt(e.target.value) || 30 })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Alert darurat jika melebihi batas</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Otomasi Blower</label>
                <div
                  onClick={() => setSysForm({ ...sysForm, autoTriggerBlower: !sysForm.autoTriggerBlower })}
                  className={`w-full h-11 px-4 rounded-2xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                    sysForm.autoTriggerBlower
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <span>{sysForm.autoTriggerBlower ? 'Exhaust Otomatis Aktif' : 'Exhaust Otomatis Nonaktif'}</span>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${sysForm.autoTriggerBlower ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${sysForm.autoTriggerBlower ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Nyalakan exhaust saat amonia &gt; threshold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Profil Institusi & Identitas */}
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
                  value={appForm.appName}
                  onChange={(e) => setAppForm({ ...appForm, appName: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Institusi / Universitas</label>
                <input
                  type="text"
                  value={appForm.institution}
                  onChange={(e) => setAppForm({ ...appForm, institution: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Lokasi Kampus</label>
                <input
                  type="text"
                  value={appForm.campusLocation}
                  onChange={(e) => setAppForm({ ...appForm, campusLocation: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Kontak Hotline Fasilitas</label>
                <input
                  type="text"
                  value={appForm.contactHotline}
                  onChange={(e) => setAppForm({ ...appForm, contactHotline: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Notifikasi & Audio Alarm */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 shrink-0 border border-purple-500/20 shadow-xs">
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
                  value={appForm.whatsappNotificationNumber}
                  onChange={(e) => setAppForm({ ...appForm, whatsappNotificationNumber: e.target.value })}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 focus:outline-hidden focus:border-blue-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Penerima alert darurat amonia &gt; 20 PPM</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Audio Alarm Buzzer</label>
                <div
                  onClick={() => setAppForm({ ...appForm, soundAlarmEnabled: !appForm.soundAlarmEnabled })}
                  className={`w-full h-11 px-4 rounded-2xl border font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                    appForm.soundAlarmEnabled
                      ? 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {appForm.soundAlarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span>{appForm.soundAlarmEnabled ? 'Alarm Audio Aktif' : 'Alarm Audio Nonaktif'}</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${appForm.soundAlarmEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${appForm.soundAlarmEnabled ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Bunyikan sinyal saat status bahaya terdeteksi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Integrasi AI (Google Gemini) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 shrink-0 border border-indigo-500/20 shadow-xs">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                  Integrasi AI (Google Gemini)
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Konfigurasi Gemini API Key dari Google AI Studio untuk kecerdasan audit telemetri di LetSens AI
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                sysForm.geminiApiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {sysForm.geminiApiKey ? '● Gemini API Key Aktif' : '○ Key Belum Diatur'}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700">
                  Gemini API Key (Google AI Studio)
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 font-bold underline flex items-center gap-1 text-[11px]"
                >
                  Dapatkan API Key Gratis di Google AI Studio <ExternalLink size={12} />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={sysForm.geminiApiKey || ''}
                    onChange={(e) => {
                      setSysForm({ ...sysForm, geminiApiKey: e.target.value });
                      if (geminiStatus !== 'idle') setGeminiStatus('idle');
                    }}
                    placeholder="AIzaSy... (Tempelkan Gemini API Key dari Google AI Studio di sini)"
                    className="w-full h-11 pl-10 pr-12 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestGeminiKey}
                  disabled={geminiTesting || !sysForm.geminiApiKey?.trim()}
                  className="h-11 px-5 rounded-2xl font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
                >
                  {geminiTesting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {geminiTesting ? 'Memvalidasi...' : 'Uji Validasi Key'}
                </button>
              </div>

              {/* Real-time Validation Result Box */}
              {geminiStatus === 'ok' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-in fade-in">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>{geminiTestMsg || 'Gemini API Key TERVERIFIKASI VALID & aktif di Google AI Studio!'}</span>
                </div>
              )}

              {geminiStatus === 'fail' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-bold animate-in fade-in">
                  <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-rose-900">Validasi Gagal / API Key Tidak Valid</p>
                    <p className="font-semibold text-rose-700 text-[11px] mt-0.5">{geminiTestMsg}</p>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                Sistem akan secara otomatis mengirim request tes ringan ke endpoint Google Generative AI (<code className="font-mono text-indigo-700 font-bold">generativelanguage.googleapis.com</code>) untuk memverifikasi keabsahan API Key sebelum digunakan pada rute{' '}
                <a href="/letsens-ai" className="font-mono text-indigo-600 font-bold hover:underline">
                  /letsens-ai
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Section 6: ESP32 Hardware Emulator & MQTT Telemetry Publisher (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
            {/* Card Header matching light glassmorphism design */}
            <div className="bg-slate-50/80 border-b border-slate-200/80 p-5 py-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-md shadow-indigo-500/20">
                  <Cpu size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black tracking-tight text-slate-900">
                      Emulator Telemetri Hardware ESP32 & MQTT Simulator
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      Super Admin Only
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Simulasi payload JSON telemetri sensor 100% identik dengan hardware ESP32 ke broker MQTT & REST Ingestion API
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRandomizeData()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Generate data acak yang realistis sesuai fisik sensor"
                >
                  <Dices size={15} />
                  <span>Acak Data Realistis</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendSinglePayload}
                  disabled={emuSending}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {emuSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>Kirim Single Payload</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextState = !emuStreaming;
                    setEmuStreaming(nextState);
                    localStorage.setItem('letsens_emu_streaming', String(nextState));
                    window.dispatchEvent(new Event('letsens_stream_changed'));
                    if (nextState) {
                      showToast(`🚀 Background Auto-Stream (${emuIntervalSec}s) Diaktifkan! Berjalan terus meskipun page di-reload.`);
                    } else {
                      showToast('🛑 Background Auto-Stream Dihentikan.');
                    }
                  }}
                  className={`px-4 py-2.5 font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    emuStreaming
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {emuStreaming ? <Square size={15} /> : <Play size={15} />}
                  <span>{emuStreaming ? 'Hentikan Stream' : `Mulai Auto-Stream (${emuIntervalSec}s)`}</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Scenario Presets Bar */}
              <div className="p-4.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    Preset Skenario Pengujian Hardware Sensor:
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Pilih skenario simulasi otomatis</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRandomizeData('normal')}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:border-emerald-300 font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Normal / Clean</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRandomizeData('busy')}
                    className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200/80 hover:border-amber-300 font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Pengunjung Ramai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRandomizeData('critical')}
                    className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-900 border border-rose-200/80 hover:border-rose-300 font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Bau Kritis (Amonia High)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRandomizeData('night')}
                    className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:border-indigo-300 font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Standby Malam Hari</span>
                  </button>
                </div>
              </div>

              {/* Form Controls Simulator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Cpu size={13} className="text-indigo-600" />
                    Kode Perangkat (Node ID Hardware ESP32)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={emuDeviceId}
                      onChange={(e) => {
                        setEmuDeviceId(e.target.value);
                        localStorage.setItem('letsens_emu_device_id', e.target.value);
                      }}
                      className="w-full h-11 pl-4 pr-16 bg-slate-50/80 border border-slate-200 rounded-2xl font-mono text-xs text-indigo-950 font-black focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                    />
                    <span className="absolute right-3 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                      NODE
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Radio size={13} className="text-emerald-600" />
                    Topik MQTT Target (Publish Destination)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={emuTopic}
                      onChange={(e) => setEmuTopic(e.target.value)}
                      className="w-full h-11 pl-4 pr-16 bg-slate-50/80 border border-slate-200 rounded-2xl font-mono text-xs text-emerald-800 font-extrabold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                    />
                    <span className="absolute right-3 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      MQTT
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-blue-600" />
                    Interval Stream Telemetri (Detik)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={emuIntervalSec}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setEmuIntervalSec(val);
                        localStorage.setItem('letsens_emu_interval', String(val));
                        window.dispatchEvent(new Event('letsens_stream_changed'));
                      }}
                      className="w-full h-11 pl-4 pr-16 bg-slate-50/80 border border-slate-200 rounded-2xl font-mono text-xs text-blue-950 font-black focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-2xs transition-all"
                    />
                    <span className="absolute right-3 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                      DETIK
                    </span>
                  </div>
                </div>
              </div>

              {/* Sliders & Numeric Controls for All Sensors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                {/* Amonia MQ-137 */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <Flame size={14} className="text-amber-500" />
                      Amonia (MQ-137):
                    </span>
                    <span className="font-mono px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black rounded-lg text-[11px] shadow-2xs">
                      {emuAmonia} PPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="0.5"
                    value={emuAmonia}
                    onChange={(e) => setEmuAmonia(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* Suhu DHT22 */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-cyan-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <Thermometer size={14} className="text-cyan-500" />
                      Suhu (DHT22):
                    </span>
                    <span className="font-mono px-2.5 py-0.5 bg-cyan-100 text-cyan-900 font-black rounded-lg text-[11px] shadow-2xs">
                      {emuSuhu} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="45"
                    step="0.5"
                    value={emuSuhu}
                    onChange={(e) => setEmuSuhu(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* Kelembaban RH */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <Droplet size={14} className="text-blue-500" />
                      Kelembaban RH:
                    </span>
                    <span className="font-mono px-2.5 py-0.5 bg-blue-100 text-blue-900 font-black rounded-lg text-[11px] shadow-2xs">
                      {emuRh} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    step="1"
                    value={emuRh}
                    onChange={(e) => setEmuRh(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* PIR Okupansi */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <Activity size={14} className="text-emerald-500" />
                      PIR Okupansi:
                    </span>
                    <span className={`font-mono px-2 py-0.5 font-bold rounded-lg text-[10px] ${emuPir ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {emuPir ? 'ADA PENGUNJUNG' : 'KOSONG'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmuPir(!emuPir)}
                    className={`w-full py-2 rounded-xl font-extrabold text-xs transition-all border cursor-pointer ${
                      emuPir
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {emuPir ? '● PIR: 1 (Ada Pengunjung)' : '○ PIR: 0 (Bilik Kosong)'}
                  </button>
                </div>

                {/* Cahaya LDR */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-yellow-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <Sun size={14} className="text-yellow-500" />
                      Cahaya (LDR):
                    </span>
                    <span className="font-mono px-2.5 py-0.5 bg-yellow-100 text-yellow-900 font-black rounded-lg text-[11px] shadow-2xs">
                      {emuCahaya} Lux
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={emuCahaya}
                    onChange={(e) => setEmuCahaya(parseFloat(e.target.value))}
                    className="w-full accent-yellow-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* Wi-Fi RSSI */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-purple-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <Wifi size={14} className="text-purple-500" />
                      Sinyal Wi-Fi (RSSI):
                    </span>
                    <span className="font-mono px-2.5 py-0.5 bg-purple-100 text-purple-900 font-black rounded-lg text-[11px] shadow-2xs">
                      {emuRssi} dBm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-95"
                    max="-30"
                    step="1"
                    value={emuRssi}
                    onChange={(e) => setEmuRssi(parseInt(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* Baterai */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1.5">
                      <BatteryCharging size={14} className="text-emerald-500" />
                      Baterai Device:
                    </span>
                    <span className="font-mono px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-black rounded-lg text-[11px] shadow-2xs">
                      {emuBaterai} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="1"
                    value={emuBaterai}
                    onChange={(e) => setEmuBaterai(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                  />
                </div>

                {/* Level Sabun & Tisu */}
                <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-all">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-700 font-extrabold flex items-center gap-1">
                      <Package size={13} className="text-teal-600" />
                      Stok Konsumabel:
                    </span>
                    <span className="font-mono text-[10px]">
                      S: <strong className="text-teal-700">{emuSoap}%</strong> | T: <strong className="text-indigo-700">{emuTissue}%</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={emuSoap}
                      onChange={(e) => setEmuSoap(parseInt(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={emuTissue}
                      onChange={(e) => setEmuTissue(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Payload Preview & Live Log Stream Terminal Windows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Live JSON Payload Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Code size={14} className="text-indigo-600" />
                      Payload JSON Telemetri ESP32 Hardware:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      MQTT Format Identik
                    </span>
                  </div>
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
                    {/* Mac Terminal Header */}
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">payload.json</span>
                    </div>
                    <pre className="p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto h-52 scrollbar-thin leading-relaxed">
                      {currentPayloadJson}
                    </pre>
                  </div>
                </div>

                {/* Python Script Generator Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Terminal size={14} className="text-indigo-600" />
                      Script Python MQTT Simulator (`emulator.py`):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyPythonScript}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedPython ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copiedPython ? 'Tersalin' : 'Salin'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPythonScript}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition"
                      >
                        <Download size={12} />
                        <span>Unduh .py</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
                    {/* Mac Terminal Header */}
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">emulator.py</span>
                    </div>
                    <pre className="p-4 font-mono text-[10px] text-blue-300 overflow-x-auto h-52 scrollbar-thin leading-relaxed">
                      {pythonScriptCode}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Status Output Console Log */}
              {emuLogMsg && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 font-mono text-xs text-indigo-300 flex items-center justify-between animate-in fade-in shadow-md">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <span className="truncate">{emuLogMsg}</span>
                  </div>
                  {emuStreaming && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0 ml-2" />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 7: Status Card */}
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
              <p className="text-sm font-black text-slate-900 font-mono">{sysForm.mqttBrokerHost}:{sysForm.mqttPort}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
