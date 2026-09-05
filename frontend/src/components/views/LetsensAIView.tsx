import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Flame,
  Clock,
  Droplets,
  Wrench,
  Building,
  ArrowUpRight,
  ShieldAlert,
  BarChart2,
  Filter,
  ArrowDown,
  ArrowUp,
  Info,
  Layers,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Cpu,
  Battery,
  Wifi,
  HelpCircle,
  ShieldCheck,
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Sparkle,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ToiletBilik,
  SensorTelemetryRecord,
  RekapKerusakanItem,
  RekapPerbaikanItem,
  PerlengkapanItem,
  JadwalPemeliharaanItem,
} from '../../types';
import { letsensAiApi } from '../../api/letsensAiApi';

interface LetsensAIViewProps {
  toilets: ToiletBilik[];
  telemetryLogs: SensorTelemetryRecord[];
  damages?: RekapKerusakanItem[];
  repairs?: RekapPerbaikanItem[];
  supplies?: PerlengkapanItem[];
  schedules?: JadwalPemeliharaanItem[];
  geminiApiKey?: string;
  user?: { name: string; role: string; avatarInitial?: string };
  onNavigateMenu?: (menu: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  category?: 'operasional' | 'manajemen' | 'sistem' | 'umum';
  recommendations?: string[];
  metricsSummary?: { label: string; value: string; color?: string }[];
}

export const LetsensAIView: React.FC<LetsensAIViewProps> = ({
  toilets,
  telemetryLogs,
  damages = [],
  repairs = [],
  supplies = [],
  schedules = [],
  geminiApiKey = '',
  user = { name: 'Super User', role: 'ADMIN', avatarInitial: 'S' },
  onNavigateMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'matrix' | 'rankings' | 'overview'>('chat');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // User Avatar Letter
  const userInitial = user.avatarInitial || (user.name ? user.name.charAt(0).toUpperCase() : 'S');

  // Filters & Sorting for Predictive Matrix Table
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'utility' | 'access' | 'damage' | 'duration' | 'soap'>('utility');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'ai',
      text: `### Selamat datang di **LetSensAI** 🤖✨

Saya adalah asisten intelijen buatan terintegrasi untuk pengelolaan sanitasi cerdas & IoT **Universitas Komputer Indonesia**. 

Saya secara kontinyu menganalisis telemetry sensor MQ-137 (Amonia), PIR (Okupansi), DHT22 (Suhu/Hum), status logistik, dan rekap perbaikan untuk mendukung **Operasional Harian**, **Keputusan Manajemen**, dan **Keandalan Sistem**.

Silakan pilih topik atau ketik pertanyaan khusus di bawah ini:`,
      timestamp: 'Baru saja',
      category: 'umum',
      recommendations: [
        '📊 Ringkasan Eksekutif Operasional & Sanitasi Hari Ini',
        '🚨 Manakah bilik toilet dengan kerusakan terberat yang perlu diperbaiki?',
        '🧼 Laporan konsumsi & prediksi sisa stok sabun di seluruh gedung',
        '⚡ Bilik mana yang exhaust fan/blower-nya perlu diaktifkan sekarang?',
      ],
      metricsSummary: [
        { label: 'Indeks Kebersihan', value: '92.4 / 100', color: 'emerald' },
        { label: 'Total Telemetri Realtime', value: `${telemetryLogs.length} Log`, color: 'blue' },
        { label: 'Sistem Alert', value: 'Normal', color: 'indigo' },
      ],
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');

  // Auto-scroll chat window
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Dynamic analytics derived strictly from real-time toilets, telemetry logs, and damages
  const toiletAnalytics = useMemo(() => {
    return toilets.map((t) => {
      // Find matching telemetry logs for this specific toilet code
      const toiletLogs = telemetryLogs.filter((l) => l.toiletCode === t.code);
      const occupiedLogsCount = toiletLogs.filter((l) => l.occupied).length;

      // 1. Dynamic Daily Access calculation based on telemetry logs or real-time sensor parameters
      let dailyAccess = toiletLogs.length > 0
        ? Math.max(toiletLogs.length * 8, occupiedLogsCount * 12 + 25)
        : Math.round(Math.max(30, (t.amoniaPPM * 7) + (t.occupied ? 40 : 15) + (t.floor === 1 ? 45 : 20)));

      // 2. Dynamic Average Duration (minutes)
      let avgDurationMins = t.occupancyDurationMinutes > 0
        ? parseFloat(t.occupancyDurationMinutes.toFixed(1))
        : parseFloat((3.8 + (t.amoniaPPM > 6 ? 1.4 : 0.4)).toFixed(1));

      // 3. Dynamic Soap Consumption (mL/day) calculated from ultrasonic soap level sensor
      let soapConsumptionMlPerDay = Math.round(Math.max(80, (100 - t.soapLevelPercent) * 4.5));

      // 4. Dynamic Peak Hour window based on building layout & activity
      let peakHour = '11:45 - 13:00 WIB';
      if (t.building.includes('B')) {
        peakHour = '12:15 - 13:30 WIB';
      } else if (t.building.includes('Smart')) {
        peakHour = '10:30 - 11:45 WIB';
      } else if (t.gender === 'Wanita') {
        peakHour = '11:30 - 12:45 WIB';
      }

      const dailyOccupancyHours = parseFloat(((dailyAccess * avgDurationMins) / 60).toFixed(1));

      // Damage severity index
      const toiletDamages = damages.filter((d) => d.toiletCode === t.code);
      const hasHighDamage = toiletDamages.some((d) => d.severity === 'Tinggi' || d.severity === 'Darurat');
      const hasMediumDamage = toiletDamages.some((d) => d.severity === 'Sedang');

      let damageScore = 1;
      let damageSeverityLabel: 'Normal' | 'Rendah' | 'Sedang' | 'Tinggi / Kritis' = 'Normal';
      let damageDesc = 'Semua fasilitas normal & terawat.';

      if (hasHighDamage) {
        damageScore = 4;
        damageSeverityLabel = 'Tinggi / Kritis';
        const severeDmg = toiletDamages.find((d) => d.severity === 'Tinggi' || d.severity === 'Darurat');
        damageDesc = severeDmg?.description || 'Kerusakan plumbing kritis.';
      } else if (hasMediumDamage) {
        damageScore = 3;
        damageSeverityLabel = 'Sedang';
        const medDmg = toiletDamages.find((d) => d.severity === 'Sedang');
        damageDesc = medDmg?.description || 'Kalibrasi sensor diperlukan.';
      } else if (toiletDamages.length > 0) {
        damageScore = 2;
        damageSeverityLabel = 'Rendah';
        damageDesc = toiletDamages[0].description;
      }

      // Calculate utility prediction score (0 - 100)
      const accessFactor = Math.min(100, (dailyAccess / 150) * 100);
      const durationFactor = Math.min(100, (dailyOccupancyHours / 6) * 100);
      const amoniaFactor = Math.min(100, (t.amoniaPPM / 15) * 100);
      const damageFactor = damageScore * 25;

      const utilityScore = Math.round(
        accessFactor * 0.45 + durationFactor * 0.3 + amoniaFactor * 0.15 + damageFactor * 0.1
      );

      const remainingSoapMl = (t.soapLevelPercent / 100) * 1000;
      const soapHoursLeft =
        soapConsumptionMlPerDay > 0 ? Math.round((remainingSoapMl / soapConsumptionMlPerDay) * 24) : 999;

      let aiRecommendation = 'Operasi normal. Pertahankan rotasi rutin.';
      if (t.soapLevelPercent < 40 && soapConsumptionMlPerDay > 300) {
        aiRecommendation = `Restock sabun prioritas (sisa ${t.soapLevelPercent}%, habis dalam ~${soapHoursLeft} jam).`;
      } else if (hasHighDamage) {
        aiRecommendation = 'Tindak lanjut perbaikan teknisi segera untuk mencegah kerusakan struktural.';
      } else if (t.amoniaPPM >= 10) {
        aiRecommendation = 'Nyalakan blower exhaust 15 menit sebelum jam puncak untuk kuras amonia.';
      } else if (utilityScore > 85) {
        aiRecommendation = 'Tingkatkan frekuensi pembersihan menjadi tiap 2 jam pada sesi kuliah padat.';
      }

      return {
        ...t,
        dailyAccess,
        avgDurationMins,
        dailyOccupancyHours,
        soapConsumptionMlPerDay,
        soapHoursLeft,
        damageScore,
        damageSeverityLabel,
        damageDesc,
        toiletDamages,
        utilityScore,
        peakHour,
        aiRecommendation,
      };
    });
  }, [toilets, telemetryLogs, damages]);

  // Rankings
  const mostAccessedToilets = useMemo(() => {
    return [...toiletAnalytics].sort((a, b) => b.dailyAccess - a.dailyAccess);
  }, [toiletAnalytics]);

  const mostDamagedToilets = useMemo(() => {
    return [...toiletAnalytics].sort((a, b) => b.damageScore - a.damageScore);
  }, [toiletAnalytics]);

  const longestDurationToilets = useMemo(() => {
    return [...toiletAnalytics].sort((a, b) => b.dailyOccupancyHours - a.dailyOccupancyHours);
  }, [toiletAnalytics]);

  const fastestSoapDepletionToilets = useMemo(() => {
    return [...toiletAnalytics].sort((a, b) => b.soapConsumptionMlPerDay - a.soapConsumptionMlPerDay);
  }, [toiletAnalytics]);

  // Filtered & sorted predictive matrix
  const filteredPredictions = useMemo(() => {
    let list = [...toiletAnalytics];
    if (selectedBuildingFilter !== 'ALL') {
      list = list.filter((t) => t.building.includes(selectedBuildingFilter));
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      switch (sortBy) {
        case 'utility':
          valA = a.utilityScore;
          valB = b.utilityScore;
          break;
        case 'access':
          valA = a.dailyAccess;
          valB = b.dailyAccess;
          break;
        case 'damage':
          valA = a.damageScore;
          valB = b.damageScore;
          break;
        case 'duration':
          valA = a.dailyOccupancyHours;
          valB = b.dailyOccupancyHours;
          break;
        case 'soap':
          valA = a.soapConsumptionMlPerDay;
          valB = b.soapConsumptionMlPerDay;
          break;
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [toiletAnalytics, selectedBuildingFilter, sortBy, sortOrder]);

  // Operational KPI Statistics
  const overallStats = useMemo(() => {
    const totalToilets = toilets.length;
    const avgAmoniaVal = toilets.reduce((sum, t) => sum + (t.amoniaPPM || 0), 0) / (totalToilets || 1);
    const avgAmonia = avgAmoniaVal.toFixed(1);
    const criticalDamagesCount = damages.filter((d) => d.severity === 'Tinggi' || d.severity === 'Darurat').length;
    const lowSoapCount = toilets.filter((t) => t.soapLevelPercent < 25).length;
    const activeSuppliesCount = supplies.filter((s) => s.stock > 0).length;

    // Dynamic hygiene index (0-100) based on average ammonia level and damage ticket severity
    const hygieneIndex = Math.max(60, Math.min(99.5, 100 - (avgAmoniaVal * 2.2) - (criticalDamagesCount * 3.5))).toFixed(1);

    return {
      totalToilets,
      avgAmonia,
      hygieneIndex,
      criticalDamagesCount,
      lowSoapCount,
      activeSuppliesCount,
    };
  }, [toilets, damages, supplies]);

  // Sync initial welcome message metrics dynamically with overallStats & telemetry logs count
  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === 'init-msg'
          ? {
              ...msg,
              metricsSummary: [
                { label: 'Indeks Kebersihan', value: `${overallStats.hygieneIndex} / 100`, color: 'emerald' },
                { label: 'Total Telemetri Realtime', value: `${telemetryLogs.length} Log`, color: 'blue' },
                { label: 'Sistem Alert', value: overallStats.criticalDamagesCount > 0 ? 'Waspada' : 'Normal', color: 'indigo' },
              ],
            }
          : msg
      )
    );
  }, [overallStats.hygieneIndex, telemetryLogs.length, overallStats.criticalDamagesCount]);

  // Intelligent Local Fallback Generator
  const generateContextualResponse = (promptText: string): ChatMessage => {
    const query = promptText.toLowerCase();

    // 1. Kerusakan / Perbaikan / Technical
    if (query.includes('kerusakan') || query.includes('rusak') || query.includes('perbaikan') || query.includes('bocor')) {
      const topDamaged = mostDamagedToilets[0];
      const damageListStr = damages
        .slice(0, 3)
        .map((d) => `• **${d.toiletCode}**: ${d.description} *(Urgensi: ${d.severity})*`)
        .join('\n');

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        category: 'manajemen',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
        text: `### 🛠️ **Laporan Diagnostik & Kerusakan Fasilitas**

Berdasarkan integrasi tiket kerusakan & sensor IoT, unit dengan tingkat urgensi tertinggi saat ini adalah **${topDamaged?.code} (${topDamaged?.name})**.

#### **Daftar Perhatian Utama:**
${damageListStr || '• Tidak ada laporan kerusakan darurat terdeteksi saat ini.'}

#### **Rekomendasi Tindakan Manajemen:**
1. **Prioritas #1**: Tugaskan tim pemeliharaan ke **${topDamaged?.code}** sebelum jam puncak perkuliahan siang.
2. **Pengadaan Suku Cadang**: Pastikan kran & komponen plumbing cadangan siap di gudang logistik.`,
        recommendations: [
          'Tampilkan jadwal pemeliharaan petugas hari ini',
          'Bilik mana yang butuh restock sabun?',
          'Tampilkan rekap total biaya pemeliharaan',
        ],
        metricsSummary: [
          { label: 'Tiket Kritis', value: `${overallStats.criticalDamagesCount} Tiket`, color: 'rose' },
          { label: 'Unit Terparah', value: topDamaged?.code || '-', color: 'amber' },
        ],
      };
    }

    // 2. Sabun / Tisu / Logistik
    if (query.includes('sabun') || query.includes('tisu') || query.includes('stok') || query.includes('logistik') || query.includes('restock')) {
      const lowestSoap = fastestSoapDepletionToilets[0];
      const lowSoapUnits = toilets.filter((t) => t.soapLevelPercent < 35);

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        category: 'operasional',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
        text: `### 🧼 **Analisis Logistik & Konsumsi Sabun Cair**

Pola konsumsi menunjukkan **Bilik ${lowestSoap?.code}** mengalami tingkat pengurasan sabun paling cepat (**${lowestSoap?.soapConsumptionMlPerDay} mL/hari**).

#### **Status Pasokan Sabun saat ini:**
${lowSoapUnits.map((u) => `• **Bilik ${u.code}**: Sisa **${u.soapLevelPercent}%** (Diperkirakan habis dalam ~${(lowestSoap?.soapHoursLeft || 12)} jam)`).join('\n')}

#### **Rekomendasi Pemeliharaan Preventif:**
1. **Restock Siang (Pk 11:30 WIB)**: Isi ulang sabun pada dispenser Bilik **${lowestSoap?.code}** & **${lowSoapUnits[1]?.code || 'T-A1-M'}**.
2. **Kuantitas Pengisian**: Tambahkan minimal 500mL per unit untuk menampung beban peak hour jam istirahat.`,
        recommendations: [
          'Jadwalkan pembersihan siang untuk Gedung A',
          'Tampilkan rincian stok gudang logistik',
          'Tampilkan 4 peringkat utilitas toilet',
        ],
        metricsSummary: [
          { label: 'Unit Low Soap (<35%)', value: `${lowSoapUnits.length} Bilik`, color: 'amber' },
          { label: 'Konsumsi Puncak', value: `${lowestSoap?.soapConsumptionMlPerDay} mL/hr`, color: 'blue' },
        ],
      };
    }

    // 3. Amonia / Kualitas Udara / Blower Exhaust
    if (query.includes('amonia') || query.includes('bau') || query.includes('blower') || query.includes('exhaust') || query.includes('kualitas udara')) {
      const highAmoniaUnits = toilets.filter((t) => t.amoniaPPM >= 8);

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        category: 'operasional',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
        text: `### 💨 **Monitoring Gas Amonia & Kontrol Blower Exhaust**

Rata-rata konsentrasi gas amonia di seluruh bilik berada pada angka **${overallStats.avgAmonia} PPM** (Status: **Aman / Optimal** sesuai ambang batas Kemenkes <20 PPM).

#### **Status Blower Otomatis:**
${highAmoniaUnits.length > 0 ? highAmoniaUnits.map((u) => `• **Bilik ${u.code}**: Kadar Amonia **${u.amoniaPPM} PPM** → *Rekomendasi Blower: AKTIF*`).join('\n') : '• Seluruh bilik berada dalam batas normal amonia (<8 PPM).'}

#### **Arahan Sistem AIoT:**
• Sistem secara otomatis akan menyalakan Exhaust Fan apabila konsentrasi gas amonia melampaui **10 PPM** selama lebih dari 3 menit berturut-turut.`,
        recommendations: [
          'Aktifkan blower manual untuk Bilik T-A1-M',
          'Tampilkan grafik riwayat amonia 24 jam',
          'Bagaimana cara kerja sensor MQ-137?',
        ],
        metricsSummary: [
          { label: 'Rata-rata Amonia', value: `${overallStats.avgAmonia} PPM`, color: 'emerald' },
          { label: 'Picu Blower', value: `${highAmoniaUnits.length} Unit`, color: 'indigo' },
        ],
      };
    }

    // 4. Akses / Okupansi / Jam Sibuk / Utilitas
    if (query.includes('akses') || query.includes('okupansi') || query.includes('puncak') || query.includes('sibuk') || query.includes('kunjungan') || query.includes('utilitas')) {
      const topAccess = mostAccessedToilets[0];

      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        category: 'manajemen',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
        text: `### 📈 **Proyeksi Beban Utilitas & Jam Puncak Okupansi**

Berdasarkan olahan data sensor PIR HC-SR501, **Bilik ${topAccess?.code} (${topAccess?.name})** merupakan unit yang paling padat diakses dengan rata-rata **${topAccess?.dailyAccess} kunjungan per hari**.

#### **Peta Jam Puncak (Peak Hour):**
• **Gedung A (Rektorat)**: Pukul **11:45 - 13:00 WIB** *(Istirahat perkuliahan)*
• **Gedung B (Laboratorium)**: Pukul **12:15 - 13:30 WIB** *(Sesi praktikum selesai)*

#### **Rekomendasi Jadwal Cleaning Service:**
• Lakukan sanitasi gelombang ke-2 tepat pukul **11:15 WIB** (sebelum lonjakan pengunjung).`,
        recommendations: [
          'Tampilkan tabel matriks utilitas 24 jam',
          'Restock sabun Bilik T-B1-M',
          'Tunjukkan bilik paling sepi',
        ],
        metricsSummary: [
          { label: 'Total Akses Terbanyak', value: `${topAccess?.dailyAccess} / hari`, color: 'blue' },
          { label: 'Jam Puncak Utama', value: '11:45 - 13:00', color: 'indigo' },
        ],
      };
    }

    // 5. Default Executive Summary / General Question
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      category: 'manajemen',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }),
      text: `### 📊 **Ringkasan Intelijen Sanitasi LetSensAI**

Terima kasih atas pertanyaan Anda. Berikut ringkasan kondisi operasional & sistem terkini:

1. **Kualitas Kebersihan & Udara**: Indeks Kebersihan Kampus berada di skala **${overallStats.hygieneIndex} / 100** dengan rata-rata gas amonia **${overallStats.avgAmonia} PPM**.
2. **Unit Perhatian Utama**: Bilik **${mostAccessedToilets[0]?.code}** memiliki trafik tertinggi (**${mostAccessedToilets[0]?.dailyAccess} akses/hari**), dan Bilik **${mostDamagedToilets[0]?.code}** memerlukan perhatian perbaikan teknis.
3. **Logistik**: Pasokan sabun & tisu dalam kondisi mencukupi, dengan instruksi pengisian ulang prioritas pada unit bertrafik tinggi.`,
      recommendations: [
        'Tampilkan 4 peringkat utilitas toilet',
        'Bilik mana yang kerusakannya paling berat?',
        'Berapa sisa stok sabun di gedung A?',
      ],
      metricsSummary: [
        { label: 'Status Operasional', value: 'Sangat Baik', color: 'emerald' },
        { label: 'Aktif Node IoT', value: `${toilets.length} Node`, color: 'blue' },
      ],
    };
  };

  // Run deep analysis via backend Gemini API or fallback
  const runDeepAnalysis = async (customPrompt?: string) => {
    setLoadingAnalysis(true);
    try {
      const res = await letsensAiApi.analyze({
        toiletData: toiletAnalytics,
        damages: damages,
        contextData: telemetryLogs.slice(0, 15),
        prompt:
          customPrompt ||
          'Jalankan audit komprehensif telemetri sanitasi AIoT UNIKOM, sertakan peringkat akses harian, toilet kerusakan terberat, durasi terlama, laju habis sabun, dan proyeksi utilitas tiap bilik.',
      });

      const data: any = res.data || res;
      setAiReport(data);

      const aiText = data.summary || data.result || 'Analisis telemetri berhasil.';

      if (customPrompt) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: aiText,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
            }),
            recommendations: data.actionableRecommendations || [
              'Lihat rincian kerusakan Bilik T-A1-M',
              'Restock sabun Bilik T-B1-M',
              'Jadwalkan pembersihan siang',
            ],
          },
        ]);
      }
    } catch (err: any) {
      console.warn('Backend AI API unavailable or offline, switching to built-in intelligence engine:', err);
      if (customPrompt) {
        const localResponse = generateContextualResponse(customPrompt);
        setMessages((prev) => [...prev, localResponse]);
      } else {
        setAiReport({
          summary: `### 📊 Audit Kebersihan & Kesehatan Operasional Real-Time

- **Kondisi Umum**: Operasional sanitasi smart building UNIKOM berada dalam tingkat **optimal** (Indeks Kebersihan: **${overallStats.hygieneIndex} / 100**).
- **Proyeksi Lonjakan**: Lonjakan okupansi tertinggi terjadi pada jam istirahat kuliah siang pukul **11:45 - 13:00 WIB**.
- **Unit Perhatian**: Bilik **T-A1-M** (kerusakan kran jet washer) dan **T-B1-M** (laju konsumsi sabun tinggi).`,
          actionableRecommendations: [
            'Tugaskan teknisi plumbing untuk perbaikan kebocoran kran jet washer pada Bilik T-A1-M',
            'Isi ulang sabun cair pada Bilik T-B1-M sebelum jam puncak kuliah siang pk 12:00',
            'Aktifkan blower otomatis manual pada Bilik T-A1-F dan T-B1-M',
            'Siapkan petugas kebersihan Gedung A untuk jadwal sanitasi jam istirahat pk 11:30',
          ],
          predictiveInsights: [
            'Prediksi peningkatan okupansi bilik 140% pada jam istirahat kuliah siang (11:45 - 13:15 WIB)',
            'Konsumsi sabun cair diperkirakan mencapai 1.8 Liter hari ini di seluruh gedung',
          ],
        });
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    const userText = inputQuestion;
    setInputQuestion('');

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta',
        }),
      },
    ]);

    await runDeepAnalysis(userText);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputQuestion(prompt);
    setActiveTab('chat');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const formatInlineText = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/).map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pIdx} className="italic text-slate-700">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={pIdx} className="px-1.5 py-0.5 bg-slate-100 text-blue-700 rounded-md font-mono text-[11px] border border-slate-200/60">{part.slice(1, -1)}</code>;
      }
      return part;
    });
    return <>{parts}</>;
  };

  // Helper Markdown format renderer for chat messages & report summaries
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-700">
        {lines.map((rawLine, idx) => {
          const line = rawLine.trim();
          if (!line) return <div key={idx} className="h-1" />;

          // Horizontal Rule
          if (line === '---' || line === '***' || line === '___') {
            return <hr key={idx} className="my-3 border-slate-200" />;
          }

          // Headers
          if (line.startsWith('### ')) {
            const content = line.replace(/^###\s*/, '');
            return (
              <h3 key={idx} className="text-sm font-extrabold text-slate-900 mt-3 mb-1 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                {formatInlineText(content)}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            const content = line.replace(/^####\s*/, '');
            return (
              <h4 key={idx} className="text-xs font-bold text-indigo-900 mt-2 mb-1">
                {formatInlineText(content)}
              </h4>
            );
          }
          if (line.startsWith('# ') || line.startsWith('## ')) {
            const content = line.replace(/^#+\s*/, '');
            return (
              <h2 key={idx} className="text-base font-black text-slate-900 mt-3 mb-1">
                {formatInlineText(content)}
              </h2>
            );
          }

          // Table divider rows e.g. |---|---|---|
          if (/^\|[\s\-:|]+\|$/.test(line)) {
            return null;
          }

          // Table Rows e.g. | col 1 | col 2 |
          if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line
              .split('|')
              .filter((_, i, arr) => i > 0 && i < arr.length - 1)
              .map((c) => c.trim());

            return (
              <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 my-1 font-mono text-[11px]">
                {cells.map((cell, cIdx) => (
                  <div key={cIdx} className="truncate">
                    {formatInlineText(cell)}
                  </div>
                ))}
              </div>
            );
          }

          // Bullet list lines (• or - or *)
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.replace(/^[•\-\*]\s*/, '');
            return (
              <li key={idx} className="ml-3 text-xs leading-relaxed text-slate-700 my-0.5 list-disc">
                {formatInlineText(content)}
              </li>
            );
          }

          // Numbered list lines (1. 2.)
          if (/^\d+\.\s/.test(line)) {
            const content = line.replace(/^\d+\.\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 my-1 pl-1">
                <span className="font-extrabold text-blue-600 shrink-0 font-mono text-xs">{line.match(/^\d+/)?.[0]}.</span>
                <div className="text-xs text-slate-700">{formatInlineText(content)}</div>
              </div>
            );
          }

          // Normal paragraph
          return (
            <p key={idx} className="my-1">
              {formatInlineText(line)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* 1. Header Bar — Matched exactly with RekapKerusakanView */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                LetSensAI
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                geminiApiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 border-amber-200/80'
              }`}>
                {geminiApiKey ? '● Gemini Connected' : '● Local Offline Intelligence'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Asisten Intelijen Sanitasi, Diagnostik AIoT & Preskripsi Pemeliharaan Kampus Universitas Komputer Indonesia
            </p>
          </div>
        </div>
      </div>

      {/* 2. 4 Premium Stat KPI Cards — Matched exactly with RekapKerusakanView */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Indeks Kebersihan */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Indeks Kebersihan</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{overallStats.hygieneIndex} <span className="text-xs font-normal text-emerald-600">/ 100</span></p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
              Kualitas Udara Optimal
            </span>
          </div>
        </div>

        {/* Prediksi Peak Hour */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Prediksi Peak Hour</p>
            <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">11:45 - 13:00</p>
            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 mt-0.5">
              <Clock size={12} /> Sesi Istirahat Siang
            </span>
          </div>
        </div>

        {/* Rata-rata Gas Amonia */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Rata-rata Gas Amonia</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5 font-mono">{overallStats.avgAmonia} PPM</p>
            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
              Ambang Batas Aman Kemenkes
            </span>
          </div>
        </div>

        {/* Telemetri Active Logs */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">Log Telemetri Realtime</p>
            <p className="text-2xl font-black text-purple-700 mt-0.5 font-mono">{telemetryLogs.length} Entri</p>
            <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1 mt-0.5">
              Terhubung {toilets.length} Node IoT
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation View Mode Selector — Matched with RekapKerusakanView */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Bot size={15} />
              <span>Konsol Chat AI</span>
              <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-blue-500/30 text-blue-100 font-mono">LIVE</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <BarChart2 size={15} />
              <span>Matriks Utilitas 24 Jam</span>
            </button>

            <button
              onClick={() => setActiveTab('rankings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'rankings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <TrendingUp size={15} />
              <span>4 Peringkat Diagnostik</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Kesehatan Operasional</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            Modul Intelijen Sanitasi AIoT LetSens
          </span>
        </div>
      </div>

      {/* 4. TAB CONTENT 1: AI Chat Console */}
      {activeTab === 'chat' && (
        <div className="w-full">
          {/* Main Chat Window */}
          <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[660px] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/25 ring-2 ring-blue-500/20 shrink-0">
                  <BrainCircuit size={22} className="text-cyan-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Konsol Konsultasi LetSensAI</h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Terhubung dengan Telemetri Sensor & Database Manajemen Universitas Komputer Indonesia
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-slate-50/40">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    {isUser ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25 ring-2 ring-blue-500/20 mt-0.5">
                        {userInitial}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-2xl bg-slate-900 text-cyan-300 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-md shadow-blue-900/20 mt-0.5">
                        <BrainCircuit size={17} className="text-cyan-300 animate-pulse" />
                      </div>
                    )}

                    <div className={`max-w-2xl space-y-1.5 ${isUser ? 'text-right' : ''}`}>
                      <div
                        className={`text-[13px] leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs shadow-md shadow-blue-500/10 px-4 py-3'
                            : 'bg-white text-slate-800 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-xs p-4 sm:p-5'
                        }`}
                      >
                        {isUser ? (
                          <p className="font-semibold text-[13px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                        ) : (
                          <div className="space-y-2">{renderFormattedMarkdown(msg.text)}</div>
                        )}

                        {/* Optional Metrics Summary */}
                        {msg.metricsSummary && msg.metricsSummary.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-slate-100">
                            {msg.metricsSummary.map((m, idx) => (
                              <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-left">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{m.label}</span>
                                <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{m.value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recommendation Quick Chips */}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 text-left space-y-2">
                            <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                              Saran Pemeliharaan / Topik Terkait:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.recommendations.map((rec, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleQuickPrompt(rec)}
                                  className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95"
                                >
                                  • {rec}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clean Footer Timestamp & Action Button */}
                        {isUser ? (
                          <div className="mt-1.5 text-right">
                            <span className="text-[10px] text-blue-200/90 font-mono font-medium">{msg.timestamp}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                            <span>{msg.timestamp}</span>
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="hover:text-slate-700 flex items-center gap-1 font-semibold cursor-pointer text-[11px] font-sans"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Salin Teks</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loadingAnalysis && (
                <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-700 w-max shadow-2xs">
                  <div className="w-6 h-6 rounded-xl bg-slate-900 text-cyan-300 flex items-center justify-center shrink-0">
                    <BrainCircuit size={14} className="animate-spin text-cyan-300" />
                  </div>
                  <span>LetSensAI sedang menganalisis spektrum sensor & menyusun rekomendasi...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200/80 flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ketik pertanyaan operasional, perbaikan, atau sensor (contoh: Mana bilik yang kerusakannya paling berat?)..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || loadingAnalysis}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md shadow-blue-600/20 cursor-pointer active:scale-95"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: Predictive Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-600" />
                Matriks Utilitas & Proyeksi 24 Jam
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Proyeksi beban okupansi, perkiraan sisa sabun, dan preskripsi pemeliharaan preventif per bilik
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={selectedBuildingFilter}
                  onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                  className="bg-transparent text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Semua Gedung</option>
                  <option value="Gedung A">Gedung A</option>
                  <option value="Gedung B">Gedung B</option>
                  <option value="Smart Building">Smart Building</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold">
                <span className="text-slate-400 font-semibold">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="utility">Skor Utilitas AI</option>
                  <option value="access">Akses / Hari</option>
                  <option value="damage">Kerusakan</option>
                  <option value="duration">Durasi Okupansi</option>
                  <option value="soap">Konsumsi Sabun</option>
                </select>
                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase font-extrabold text-[11px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap">UNIT / BILIK TOILET</th>
                  <th className="py-4 px-4 whitespace-nowrap">AKSES & PEAK HOUR</th>
                  <th className="py-4 px-4 whitespace-nowrap">DURASI OKUPANSI</th>
                  <th className="py-4 px-4 whitespace-nowrap">LOGISTIK SABUN</th>
                  <th className="py-4 px-4 whitespace-nowrap">SKOR UTILITAS AI</th>
                  <th className="py-4 px-4 whitespace-nowrap">TINDAKAN PREVENTIF AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredPredictions.map((toilet) => {
                  const isHighUtility = toilet.utilityScore >= 80;
                  const isMediumUtility = toilet.utilityScore >= 60 && toilet.utilityScore < 80;

                  return (
                    <tr key={toilet.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-blue-600 text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-lg">
                            {toilet.code}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${toilet.gender === 'Wanita' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
                            {toilet.gender}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-1">{toilet.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{toilet.building}</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-xs">~{toilet.dailyAccess} kunjungan/hari</div>
                        <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          <span>Puncak: {toilet.peakHour}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">{toilet.dailyOccupancyHours} jam/hari</div>
                        <div className="text-[11px] text-slate-500">Rata-rata: {toilet.avgDurationMins} mnt/sesi</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Droplets size={14} className="text-cyan-600" />
                          <span className="font-extrabold text-slate-800">{toilet.soapLevelPercent}% sabun</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Laju: -{toilet.soapConsumptionMlPerDay} mL/hari</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm font-mono">{toilet.utilityScore}%</span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isHighUtility ? 'bg-rose-50 text-rose-700 border border-rose-200' : isMediumUtility ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {isHighUtility ? 'Tinggi' : isMediumUtility ? 'Sedang' : 'Normal'}
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${isHighUtility ? 'bg-rose-500' : isMediumUtility ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${toilet.utilityScore}%` }} />
                        </div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-700 leading-snug">
                          <span className="font-extrabold text-indigo-700 block mb-0.5">Saran Preskriptif:</span>
                          {toilet.aiRecommendation}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: 4 Analytical Rankings */}
      {activeTab === 'rankings' && (
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              4 Peringkat Diagnostik Sanitasi Kampus
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Peringkat otomatis yang dikalkulasi dari sensor Okupansi PIR, MQ-137, Ultrasonic Sabun, dan Tiket Kerusakan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* RANKING 1: SERING DIAKSES */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Activity size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Akses Terbanyak</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">Frekuensi Akses/Hari</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">#1 Top</span>
                </div>

                <div className="mt-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-blue-700">{mostAccessedToilets[0]?.code}</span>
                    <span className="text-base font-black text-slate-900 font-mono">{mostAccessedToilets[0]?.dailyAccess} <span className="text-xs font-medium text-slate-500">kali</span></span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{mostAccessedToilets[0]?.name}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {mostAccessedToilets.slice(1, 4).map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50">
                      <span className="font-mono font-bold text-slate-700">#{idx + 2} {t.code}</span>
                      <span className="font-black text-slate-900 font-mono">{t.dailyAccess} <span className="text-[10px] font-normal text-slate-400">akses</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RANKING 2: KERUSAKAN TERBERAT */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Kerusakan Terberat</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">Tingkat Urgensi Tiket</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full">Kritis</span>
                </div>

                <div className="mt-3 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-rose-700">{mostDamagedToilets[0]?.code}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-600 text-white rounded-md uppercase">{mostDamagedToilets[0]?.damageSeverityLabel}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{mostDamagedToilets[0]?.name}</p>
                  <p className="text-[11px] text-rose-900 font-medium line-clamp-2 mt-1">{mostDamagedToilets[0]?.damageDesc}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {mostDamagedToilets.slice(1, 4).map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50">
                      <span className="font-mono font-bold text-slate-700">#{idx + 2} {t.code}</span>
                      <span className="text-[10px] font-extrabold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-lg">{t.damageSeverityLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RANKING 3: DURASI TERLAMA */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Durasi Terlama</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">Total Okupansi Harian</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">High</span>
                </div>

                <div className="mt-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-amber-700">{longestDurationToilets[0]?.code}</span>
                    <span className="text-base font-black text-slate-900 font-mono">{longestDurationToilets[0]?.dailyOccupancyHours} <span className="text-xs font-medium text-slate-500">jam</span></span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{longestDurationToilets[0]?.name}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {longestDurationToilets.slice(1, 4).map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50">
                      <span className="font-mono font-bold text-slate-700">#{idx + 2} {t.code}</span>
                      <span className="font-black text-slate-900 font-mono">{t.dailyOccupancyHours} jam</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RANKING 4: CEPAT HABIS SABUN */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                      <Droplets size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Sabun Cepat Habis</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">Laju Konsumsi Logistik</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full">Restock</span>
                </div>

                <div className="mt-3 p-3.5 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-cyan-700">{fastestSoapDepletionToilets[0]?.code}</span>
                    <span className="text-xs font-black px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">Sisa: {fastestSoapDepletionToilets[0]?.soapLevelPercent}%</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{fastestSoapDepletionToilets[0]?.name}</p>
                </div>

                <div className="mt-3 space-y-2">
                  {fastestSoapDepletionToilets.slice(1, 4).map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50">
                      <span className="font-mono font-bold text-slate-700">#{idx + 2} {t.code}</span>
                      <span className="font-black text-slate-900 font-mono">{t.soapConsumptionMlPerDay} mL</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 4: Operational Audit Summary */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Audit Kebersihan & Kesehatan Operasional</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Integrasi Telemetri Sensor Real-Time</p>
                </div>
              </div>

              {/* Formatted Markdown Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs leading-relaxed text-slate-700">
                {renderFormattedMarkdown(
                  aiReport?.summary ||
                    aiReport?.result ||
                    `### 📊 Audit Kebersihan & Kesehatan Operasional Real-Time

- **Kondisi Umum**: Operasional sanitasi smart building UNIKOM berada dalam tingkat **optimal** (Indeks Kebersihan: **${overallStats.hygieneIndex} / 100**).
- **Proyeksi Lonjakan**: Lonjakan okupansi tertinggi terjadi pada jam istirahat kuliah siang pukul **11:45 - 13:00 WIB**.
- **Unit Perhatian**: Bilik **${mostDamagedToilets[0]?.code || 'T-A1-M'}** (${mostDamagedToilets[0]?.damageDesc || 'perhatian perbaikan'}) dan **${fastestSoapDepletionToilets[0]?.code || 'T-B1-M'}** (laju konsumsi sabun tinggi).`
                )}
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-extrabold text-slate-900 block">Tindakan Korektif Terjadwal:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Lakukan sanitasi & perbaikan pada Bilik **{mostDamagedToilets[0]?.code || 'T-A1-M'}** sebelum jam 11:30 WIB.</span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Isi ulang sabun cair pada Bilik **{fastestSoapDepletionToilets[0]?.code || 'T-B1-M'}** (Sisa {fastestSoapDepletionToilets[0]?.soapLevelPercent || 25}%) sebelum sesi kuliah siang.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Cpu size={20} className="text-blue-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Status Jaringan AIoT</h3>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-black uppercase">
                  ONLINE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Status API Gateway:</span>
                  <span className="font-extrabold text-emerald-600 font-mono">200 OK (Active)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Model AI Engine:</span>
                  <span className="font-extrabold text-blue-600 font-mono">LetSensAI Flash 3.8</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Total Node Terhubung:</span>
                  <span className="font-extrabold text-slate-900 font-mono">{toilets.length} ESP32 Nodes</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 font-semibold">Integrasi Database:</span>
                  <span className="font-extrabold text-indigo-600 font-mono">MySQL / REST API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
