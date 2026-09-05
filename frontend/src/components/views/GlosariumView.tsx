import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Search,
  ChevronRight,
  Info,
  Layers,
  Radio,
  AlertTriangle,
  Thermometer,
  Droplets,
  Zap,
  Activity,
  Filter,
  BarChart3,
  Download,
  Eye,
  Shield,
  Target,
  TrendingUp,
  Database,
  Cpu,
  HardDrive,
  FileSpreadsheet,
  X,
  Wind,
  UserCheck,
  Package,
  CalendarClock,
  FileText,
  Sparkles,
  Lock,
  Wifi,
  DoorOpen,
  LayoutDashboard,
  Hammer,
  Boxes,
  Users,
  ScrollText,
  Settings,
  Bot
} from 'lucide-react';

export interface GlossaryFeature {
  name: string;
  desc: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface GlossaryItem {
  term: string;
  description: string;
  detail: string;
  roles?: string[];
  category: 'ANALITIK' | 'OPERASIONAL' | 'MANAJEMEN' | 'SISTEM' | 'SPESIFIKASI SENSOR HARDWARE' | 'KAMUS TEKNIS';
  menuIcon?: React.ComponentType<{ size?: number; className?: string }>;
  features?: GlossaryFeature[];
}

const getGlossaryData = (): GlossaryItem[] => [
  // 1. ANALITIK (Persis Seksi 1 Sidebar)
  {
    term: "LetSens AI",
    description: "Modul analitik kecerdasan buatan berbasis Google Gemini AI untuk audit sanitasi dan estimasi persediaan.",
    detail: "Fitur LetSens AI mengolah tren telemetri sensor (kadar amonia NH₃, kelembapan, suhu, dan histori pengunjung) untuk mendeteksi anomali bau gas, memberikan estimasi sisa hari persediaan tisu/sabun, serta menerbitkan rekomendasi otomatis bagi petugas kebersihan dan teknisi.",
    category: "ANALITIK",
    menuIcon: Bot,
    features: [
      { name: "Deteksi Anomali Bau & Gas", desc: "Analisis lonjakan kadar amonia abnormal berdasarkan pola waktu pengunjung.", icon: Sparkles },
      { name: "Prediksi Kebutuhan Restock", desc: "Perkiraan sisa hari sebelum sabun cair atau tisu habis berdasarkan frekuensi penggunaan.", icon: Target },
      { name: "Rekomendasi Pemeliharaan AI", desc: "Saran tindakan otomatis untuk petugas sanitasi dan teknisi MEP berbasis audit telemetri.", icon: FileText }
    ]
  },

  // 2. OPERASIONAL (Persis Seksi 2 Sidebar)
  {
    term: "Dasbor",
    description: "Halaman komando real-time berisi ringkasan status sanitasi bilik, kadar amonia, dan kesehatan IoT node.",
    detail: "Pusat informasi utama aplikasi LetSens untuk memantau status sanitasi seluruh bilik toilet kampus, indikator kadar amonia (PPM), kelembapan, suhu, status okupansi bilik, kesehatan baterai IoT node, dan statistik penggunaan harian.",
    category: "OPERASIONAL",
    menuIcon: LayoutDashboard,
    features: [
      { name: "Ringkasan Status Bilik Sanitasi", desc: "Visualisasi kondisi bilik secara seketika (Normal/Bersih, Waspada, Bahaya/Kotor).", icon: Activity },
      { name: "Pemantauan Amonia & Blower Otomatis", desc: "Pembacaan kadar gas amonia real-time dari sensor MQ-137 dengan pemicu relai blower.", icon: Wind },
      { name: "Kesehatan IoT Node & Baterai", desc: "Indikator persentase daya baterai 18650, kualitas sinyal Wi-Fi (RSSI), dan uptime node.", icon: Radio },
      { name: "Quick Dispatch Petugas", desc: "Fitur panggilan cepat tugas kebersihan via WhatsApp Gateway.", icon: Zap }
    ]
  },
  {
    term: "Data Sensor",
    description: "Rekam medis kronologis dan grafik histori telemetri seluruh perangkat sensor IoT.",
    detail: "Menampilkan data mentah telemetri yang dikirimkan oleh mikrokontroler ESP32 via protokol MQTT/HTTP. Mencakup data kadar Amonia (MQ-137), Suhu & RH (SHT40), Cahaya (Lux), Okupansi (PIR), serta persentase level Sabun & Tisu.",
    category: "OPERASIONAL",
    menuIcon: Activity,
    features: [
      { name: "Filter Rentang Waktu Data", desc: "Penyaringan data histori berdasarkan rentang 24 Jam Terakhir, 7 Hari, atau 30 Hari.", icon: Filter },
      { name: "Tabel Telemetri Kronologis Real-Time", desc: "Daftar stempel waktu pengiriman paket telemetri beserta nilai variabel sensor.", icon: Database },
      { name: "Grafik Tren Dynamic Sensor Parameter", desc: "Grafik interaktif yang memperlihatkan pola lonjakan kadar amonia dan kelembapan udara.", icon: TrendingUp }
    ]
  },
  {
    term: "Jadwal Pemeliharaan",
    description: "Penjadwalan tugas kebersihan rutin shift petugas dan checklist pemeliharaan fisik.",
    detail: "Fitur pengelolaan shift kerja petugas kebersihan (Pagi, Siang, Malam), checklist tugas pembersihan rutin kloset, refill sabun/tisu, pembersihan lantai, serta verifikasi waktu penyelesaian tugas.",
    category: "OPERASIONAL",
    menuIcon: CalendarClock,
    features: [
      { name: "Manajemen Shift Petugas Sanitasi", desc: "Pembagian jadwal tugas kebersihan berkala per lokasi toilet gedung kampus.", icon: CalendarClock },
      { name: "Checklist Pemeliharaan Real-Time", desc: "Daftar periksa tugas pembersihan yang dapat dicentang secara langsung oleh petugas.", icon: Eye },
      { name: "Stempel Waktu Penyelesaian", desc: "Pencatatan waktu presisi saat tugas pemeliharaan diselesaikan.", icon: UserCheck }
    ]
  },
  {
    term: "Rekap Kerusakan",
    description: "Pelaporan tiket keluhan kerusakan fasilitas toilet dan gangguan perangkat sensor IoT.",
    detail: "Menampung laporan kerusakan fisik toilet (kloset mampet, kran bocor, lampu mati) maupun sensor offline yang dilaporkan pengunjung atau petugas. Dilengkapi tingkat keparahan (Rendah, Sedang, Tinggi, Darurat) dan fitur eskalasi otomatis ke perbaikan teknisi.",
    category: "OPERASIONAL",
    menuIcon: AlertTriangle,
    features: [
      { name: "Pencatatan Tiket Kerusakan Berkode Unik", desc: "Registrasi tiket keluhan kerusakan dengan kode identifikasi khusus.", icon: AlertTriangle },
      { name: "Klasifikasi Tingkat Keparahan", desc: "Pengategorian derajat kerusakan (Rendah, Sedang, Tinggi, Darurat) untuk prioritas penanganan.", icon: Shield },
      { name: "Eskalasi Langsung ke Perbaikan", desc: "Tombol pelimpahan tiket keluhan dari pemantauan operasional ke tindakan teknisi.", icon: Hammer }
    ]
  },
  {
    term: "Rekap Perbaikan",
    description: "Manajemen pengerjaan perbaikan fisik dan sparepart oleh teknisi MEP / IoT.",
    detail: "Pelacakan status tindakan perbaikan tiket kerusakan yang ditangani teknisi. Mencakup tindakan perbaikan yang dilakukan, pergantian suku cadang sensor/peralatan, estimasi biaya, serta pengubahan status bilik dari Maintenance kembali ke Online.",
    category: "OPERASIONAL",
    menuIcon: Hammer,
    features: [
      { name: "Tracking Progress Perbaikan", desc: "Pemantauan status penanganan (Dalam Antrian, Proses Pengerjaan, Menunggu Sparepart, Selesai).", icon: Hammer },
      { name: "Pencatatan Sparepart & Estimasi Biaya", desc: "Pendokumentasian komponen yang diganti beserta nilai estimasi perbaikan.", icon: FileSpreadsheet },
      { name: "Integrasi Pemulihan Status Bilik", desc: "Otomatis mengembalikan status bilik menjadi Online setelah perbaikan diselesaikan.", icon: CheckIcon }
    ]
  },

  // 3. MANAJEMEN (Persis Seksi 3 Sidebar)
  {
    term: "Fasilitas",
    description: "Inventarisasi aset fisik utilitas toilet sanitasi dan kondisi keandalannya.",
    detail: "Modul katalog untuk mendaftarkan dan memantau status kondisi aset fisik di seluruh toilet kampus, seperti kloset, wastafel, dispenser sabun, tempat tisu jumbo, lampu LED, fan blower, dan sensor IoT.",
    category: "MANAJEMEN",
    menuIcon: Boxes,
    features: [
      { name: "Pengelompokan Kategori Utilitas", desc: "Klasifikasi jenis aset dari sanitasi, kertas/tisu, elektrikal, hingga hardware IoT.", icon: Boxes },
      { name: "Monitoring Kondisi Fisik & Status", desc: "Pencatatan kelayakan kondisi (Baik, Perlu Restock, Perlu Perbaikan, Rusak).", icon: Layers },
      { name: "Penanggung Jawab Fasilitas", desc: "Penetapan petugas khusus yang bertanggung jawab menjaga keandalan aset.", icon: Users }
    ]
  },
  {
    term: "Bilik Toilet",
    description: "Manajemen data induk bilik toilet, lokasi gedung, gender, dan kontrol blower.",
    detail: "Pengelolaan unit bilik toilet (misal T-A1-F Gedung Smart Kampus), mencakup penentuan lokasi gedung/lantai, tipe gender (Wanita, Pria, Disabilitas), status pintu, durasi okupansi, dan kontrol manual/otomatis exhaust blower.",
    category: "MANAJEMEN",
    menuIcon: DoorOpen,
    features: [
      { name: "Data Induk & Kode Unik Bilik", desc: "Pendaftaran identitas bilik, lokasi gedung, lantai, dan jenis gender.", icon: DoorOpen },
      { name: "Monitoring Okupansi & Timer Durasi", desc: "Pendeteksian status pintu dan durasi penggunaan pengguna di dalam bilik.", icon: Eye },
      { name: "Remote Control Blower Exhaust Fan", desc: "Sakelar manual dan otomatis untuk menyedot udara kotor dari bilik.", icon: Zap }
    ]
  },
  {
    term: "Perangkat",
    description: "Inventarisasi node IoT hardware ESP32, konfigurasi jaringan, dan kesehatan baterai.",
    detail: "Registrasi pengidentifikasi unik modul mikrokontroler (misal ESP32-TK-01A), pemetaan lokasi instalasi bilik, pemantauan tegangan baterai 18650, kualitas sinyal Wi-Fi (RSSI dBm), remote reboot, dan update firmware Over-The-Air (OTA).",
    category: "MANAJEMEN",
    menuIcon: Cpu,
    features: [
      { name: "Registrasi Hardware Node & MAC Address", desc: "Pendaftaran pengidentifikasi unik mikrokontroler dan konfigurasi jaringan.", icon: Cpu },
      { name: "Monitoring Daya Baterai & RSSI Sinyal", desc: "Indikator persentase daya baterai 18650 dan kekuatan sinyal Wi-Fi (dBm).", icon: Wifi },
      { name: "Remote Reboot & Update Firmware OTA", desc: "Fitur restart nirkabel dan pembaruan firmware Over-The-Air.", icon: HardDrive }
    ]
  },
  {
    term: "Pengguna",
    description: "Pengelolaan akun pengguna dan otorisasi tingkat hak akses (RBAC).",
    detail: "Manajemen anggota tim sistem LetSens dengan pembagian peran yang ketat: Super Admin, Supervisor/Manajer, Teknisi IoT, dan Petugas Kebersihan. Setiap peran memiliki batasan akses menu yang telah disesuaikan.",
    category: "MANAJEMEN",
    menuIcon: Users,
    features: [
      { name: "Otorisasi Role-Based Access Control", desc: "Pengaturan tingkatan hak akses fitur berdasarkan peran pengguna.", icon: Shield },
      { name: "Manajemen Profil & Penugasan", desc: "Pembuatan akun baru, pembaruan kata sandi, dan penugasan shift kerja.", icon: Users },
      { name: "Autentikasi Bearer Token Sanctum", desc: "Sistem enkripsi token terpusat untuk mengamankan API HTTP backend.", icon: Lock }
    ]
  },
  {
    term: "Stok Perlengkapan",
    description: "Pelacakan persediaan bahan kimia pembersih, sabun cair, dan refill tisu.",
    detail: "Manajemen persediaan inventaris barang kebersihan (cairan karbol, refill sabun cair, gulungan tisu toilet jumbo, pewangi ruangan) lengkap dengan notifikasi saat stok mencapai batas minimum restock.",
    category: "MANAJEMEN",
    menuIcon: Package,
    features: [
      { name: "Pencatatan Stok & Batas Minimum", desc: "Monitoring jumlah sisa stok dan penentuan batas ambang minimum restock.", icon: Package },
      { name: "Notifikasi Otomatis Kehabisan Bahan", desc: "Peringatan dini saat persediaan sabun cair atau tisu hampir habis.", icon: AlertTriangle },
      { name: "Estimasi Biaya & Histori Pembelian", desc: "Pencatatan riwayat penambahan stok dan perhitungan nilai estimasi.", icon: FileSpreadsheet }
    ]
  },

  // 4. SISTEM (Persis Seksi 4 Sidebar)
  {
    term: "Laporan",
    description: "Pencetakan dokumen laporan resmi sanitasi format PDF dan ekspor data mentah CSV/Excel.",
    detail: "Fasilitas pembuatan dokumen laporan berkala bertemplate resmi institusi kampus dalam format PDF atau mengunduh dataset mentah telemetri dan perbaikan dalam format CSV/Excel untuk audit manajemen.",
    category: "SISTEM",
    menuIcon: FileText,
    features: [
      { name: "Ekspor Data Mentah CSV / Excel", desc: "Pengunduhan dataset mentah telemetri untuk analisis data statistik lanjutan.", icon: Download },
      { name: "Cetak Laporan Sanitasi Formal PDF", desc: "Generasi dokumen ringkasan kinerja sanitasi bertemplate resmi institusi.", icon: FileSpreadsheet },
      { name: "Filter Periode Laporan Audit", desc: "Penyesuaian rentang tanggal laporan sesuai kebutuhan evaluasi berkala.", icon: Filter }
    ]
  },
  {
    term: "Log Aktivitas",
    description: "Rekam jejak audit digital seluruh transaksi aksi pengguna dan aktivitas sistem.",
    detail: "Merekam setiap riwayat tindakan penting pengguna seperti sesi login, perubahan profil, pembaruan parameter ambang batas amonia, penambahan node IoT, serta eksekusi kontrol manual blower.",
    category: "SISTEM",
    menuIcon: ScrollText,
    features: [
      { name: "Audit Rekam Jejak Akses & Config", desc: "Pencatatan detail pengguna, jenis aksi, modul target, dan alamat IP.", icon: ScrollText },
      { name: "Stempel Waktu Presisi Real-Time", desc: "Pencatatan waktu transaksi dalam format WIB untuk keperluan audit auditabilitas.", icon: Database },
      { name: "Leveling Severity Event Log", desc: "Kategorisasi log berbasis tingkat urgensi (INFO, WARNING, ERROR, SUCCESS).", icon: Activity }
    ]
  },
  {
    term: "Pengaturan",
    description: "Konfigurasi global parameter server, broker MQTT, ambang batas amonia, dan identitas kampus.",
    detail: "Pusat penyetelan parameter sistem: URL & port MQTT broker, root topic telemetri, interval transmisi data, ambang batas gas amonia (Warning/Danger), WhatsApp Gateway URL, nama institusi, dan toggle sirine alarm.",
    category: "SISTEM",
    menuIcon: Settings,
    features: [
      { name: "Konfigurasi MQTT Broker & Test", desc: "Pengaturan host broker (EMQX), port 1883, dan pengujian koneksi.", icon: Radio },
      { name: "Penyetelan Ambang Batas Gas Amonia", desc: "Penentuan batas PPM untuk trigger warning (blower) dan danger (alarm).", icon: Wind },
      { name: "Identitas Institusi & Hotline WA", desc: "Pengaturan nama aplikasi, lokasi kampus, dan nomor kontak darurat.", icon: Info }
    ]
  },

  // 5. SPESIFIKASI SENSOR HARDWARE (Kategori Tambahan Hardware)
  {
    term: "MQ-137 (Sensor Gas Amonia - NH₃)",
    description: "Sensor elektrokimia khusus untuk mengukur konsentrasi gas Amonia (PPM).",
    detail: "Sensor utama pendeteksi bau tak sedap pada bilik toilet. Terhubung ke ADC Adafruit ADS1115 (16-Bit) via pin analog. Dikalibrasi presisi dengan oversampling 50x pembacaan untuk stabilitas data.",
    category: "SPESIFIKASI SENSOR HARDWARE",
    menuIcon: Cpu,
    features: [
      { name: "Rentang Pengukuran 5 - 500 PPM", desc: "Pengukuran presisi konsentrasi gas Amonia (NH₃) di dalam ruangan.", icon: Activity },
      { name: "Pengolahan Sinyal Analog ADS1115", desc: "Konversi sinyal analog ke digital 16-bit untuk meredam noise tegangan.", icon: Cpu }
    ]
  },
  {
    term: "SHT40 / DHT22 (Sensor Suhu & Kelembapan)",
    description: "Sensor digital presisi untuk mengukur iklim relatif mikro di dalam bilik.",
    detail: "Mengukur suhu udara (°C) dan kelembapan relatif (% RH) secara kontinu. Terhubung ke pin GPIO mikrokontroler dengan toleransi suhu ±0.2°C dan kelembapan ±1.8% RH.",
    category: "SPESIFIKASI SENSOR HARDWARE",
    menuIcon: Thermometer,
    features: [
      { name: "Presisi Tinggi Suhu (-40°C s/d +125°C)", desc: "Akurasi pembacaan suhu sekitar bilik toilet.", icon: Thermometer },
      { name: "Presisi Kelembapan Udara (0% s/d 100% RH)", desc: "Pendeteksian tingkat kelembapan udara untuk potensi jamur/kelembapan berlebih.", icon: Droplets }
    ]
  },
  {
    term: "PIR Motion Sensor (Deteksi Okupansi)",
    description: "Sensor Passive Infrared untuk mendeteksi pergerakan tubuh pengguna.",
    detail: "Sensor gerak infra merah yang dipasang di dalam bilik toilet untuk memantau keberadaan pengguna. Dikombinasikan dengan timer internal untuk menghitung durasi pemakaian bilik.",
    category: "SPESIFIKASI SENSOR HARDWARE",
    menuIcon: Eye,
    features: [
      { name: "Deteksi Infra Merah Wide Angle", desc: "Jangkauan sudut deteksi hingga 120 derajat dalam ruangan bilik.", icon: Eye },
      { name: "Integrasi Timer Durasi Okupansi", desc: "Pemicu otomatis perhitungan waktu penggunaan bilik oleh pengunjung.", icon: CalendarClock }
    ]
  },
  {
    term: "Relai Exhaust Blower (Relai 5V Optokopler)",
    description: "Sakelar elektronik untuk mengaktifkan fan blower penyedot udara secara otomatis.",
    detail: "Sakelar relai berisolasi optokopler 5V terhubung ke ESP32. Menyala secara otomatis saat kadar amonia melampaui ambang batas warning (>10 PPM) atau diaktifkan secara manual.",
    category: "SPESIFIKASI SENSOR HARDWARE",
    menuIcon: Zap,
    features: [
      { name: "Otomasi Blower Berbasis Sensor", desc: "Sakelar terikat otomatis saat kadar amonia melebiri 10 PPM.", icon: Wind },
      { name: "Manual Command Override", desc: "Kontrol sakelar langsung via tombol remote pada dasbor.", icon: Zap }
    ]
  },
  {
    term: "Adafruit ADS1115 (16-Bit I2C ADC)",
    description: "Pengubah sinyal analog ke digital 16-bit presisi tinggi berbasis antarmuka I2C.",
    detail: "Converter ADC eksternal dengan resolusi 16-Bit (65.536 langkah) berbasis I2C (Alamat 0x48). Mengonversi sinyal analog sensor MQ-137 dengan akurasi jauh melampaui ADC standar mikrokontroler.",
    category: "SPESIFIKASI SENSOR HARDWARE",
    menuIcon: HardDrive,
    features: [
      { name: "Resolusi High-Precision 16-Bit", desc: "Konversi sinyal tegangan analog sensor gas secara presisi tinggi.", icon: HardDrive },
      { name: "Programmable Gain Amplifier", desc: "Fitur penguat sinyal internal untuk memperjelas pembacaan sampel mikro.", icon: Cpu }
    ]
  },
  {
    term: "Mikrokontroler ESP32 Dual-Core (IoT Brain)",
    description: "Unit pemroses utama berbasis arsitektur Dual-Core 32-bit Xtensa.",
    detail: "Brain unit utama yang mengendalikan seluruh sensor, mengolah data telemetri, mengeksekusi task FreeRTOS, dan mempublikasikan data ke broker MQTT via Wi-Fi 2.4GHz.",
    category: "SPESIFIKASI SENSOR HARDWARE",
    menuIcon: Cpu,
    features: [
      { name: "Multitasking Real-Time FreeRTOS", desc: "Pemisahan komputasi pembacaan sensor dan transmisi jaringan.", icon: Cpu },
      { name: "Konektivitas Wi-Fi & MQTT", desc: "Transmisi data telemetri nirkabel cepat ke backend server.", icon: Wifi }
    ]
  },

  // 6. KAMUS TEKNIS (Kategori Kamus Teknis)
  {
    term: "PPM (Parts Per Million)",
    description: "Satuan rasio konsentrasi gas amonia di udara (1 PPM = 1 mg/L udara).",
    detail: "Satuan baku internasional yang digunakan LetSens untuk mengukur kepekatan bau gas amonia di dalam bilik sanitasi.",
    category: "KAMUS TEKNIS",
    menuIcon: Activity,
    features: [
      { name: "Metrik Baku Kualitas Udara", desc: "Standar kuantitatif pengukuran polutan gas amonia ruangan.", icon: Activity }
    ]
  },
  {
    term: "RSSI (Received Signal Strength Indicator)",
    description: "Ukuran kekuatan sinyal Wi-Fi yang diterima oleh node LetSens (dBm).",
    detail: "Nilai -30 dBm hingga -60 dBm menandakan sinyal Wi-Fi sangat kuat, sedangkan di bawah -80 dBm mengindikasikan risiko koneksi terputus.",
    category: "KAMUS TEKNIS",
    menuIcon: Wifi,
    features: [
      { name: "Indikator Keandalan Jaringan", desc: "Parameter diagnosa kualitas koneksi Wi-Fi node IoT.", icon: Wifi }
    ]
  },
  {
    term: "Sanctum Bearer Token",
    description: "Token autentikasi terenkripsi untuk mengamankan API HTTP backend Laravel.",
    detail: "Token keamanan yang dikirimkan pada setiap header HTTP transaksi data antara frontend/node dengan backend Laravel.",
    category: "KAMUS TEKNIS",
    menuIcon: Lock,
    features: [
      { name: "Enkripsi Transaksi RESTful API", desc: "Perlindungan keamanan akses data terpusat antar sistem.", icon: Lock }
    ]
  },
  {
    term: "MQTT (Message Queuing Telemetry Transport)",
    description: "Protokol transmisi data ringan Publish-Subscribe berbasis TCP/IP.",
    detail: "Protokol standar IoT dengan latensi sangat rendah untuk mengirimkan paket telemetri sensor dari node ESP32 ke LetSens server.",
    category: "KAMUS TEKNIS",
    menuIcon: Radio,
    features: [
      { name: "Transmisi Data Sensor Real-Time", desc: "Pengiriman data cepat berlatensi rendah berbasis topik.", icon: Radio }
    ]
  }
];

// Helper check icon fallback
function CheckIcon(props: { size?: number; className?: string }) {
  return <Info size={props.size || 15} className={props.className} />;
}

export default function GlosariumView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const glossaryData = getGlossaryData();

  // Apply search & category filter
  const filteredTerms = glossaryData.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group terms by category
  const groupedTerms = filteredTerms.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, GlossaryItem[]>);

  // Exact Order matching Sidebar Sections Top-to-Bottom
  const categoryOrder: GlossaryItem['category'][] = [
    'ANALITIK',
    'OPERASIONAL',
    'MANAJEMEN',
    'SISTEM',
    'SPESIFIKASI SENSOR HARDWARE',
    'KAMUS TEKNIS'
  ];

  const sortedCategories = Object.keys(groupedTerms).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a as any);
    const indexB = categoryOrder.indexOf(b as any);
    return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
  });

  const categoryBadgeColors: Record<string, string> = {
    'ANALITIK': 'bg-indigo-50 text-indigo-700 border-indigo-200/90 shadow-2xs',
    'OPERASIONAL': 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs',
    'MANAJEMEN': 'bg-blue-50 text-blue-700 border-blue-200/90 shadow-2xs',
    'SISTEM': 'bg-amber-50 text-amber-700 border-amber-200/90 shadow-2xs',
    'SPESIFIKASI SENSOR HARDWARE': 'bg-cyan-50 text-cyan-700 border-cyan-200/90 shadow-2xs',
    'KAMUS TEKNIS': 'bg-purple-50 text-purple-700 border-purple-200/90 shadow-2xs'
  };

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto pb-24 select-none">
      {/* Page Header (Matching Pengaturan UI/UX) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Glosarium</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Panduan fitur menu sidebar, spesifikasi sensor hardware IoT, dan kamus istilah teknis
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Category Chips */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari fitur menu, sensor, atau istilah teknis..."
            className="w-full pl-11 pr-10 h-11 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Pills (Exact Sidebar Order) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua Kategori ({glossaryData.length})
          </button>
          {categoryOrder.map((cat) => {
            const count = glossaryData.filter((t) => t.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Glossary Content Grid */}
      {sortedCategories.length > 0 ? (
        <div className="space-y-8">
          {sortedCategories.map((category) => (
            <div key={category} className="space-y-3.5">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide uppercase border ${categoryBadgeColors[category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {category}
                </span>
                <div className="h-[1px] flex-1 bg-slate-200/80 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {groupedTerms[category].map((item, idx) => {
                  const MenuIcon = item.menuIcon || Info;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div
                        onClick={() => setSelectedTerm(item)}
                        className="h-full bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 rounded-2xl p-5 cursor-pointer group transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 transition-colors shrink-0">
                                <MenuIcon size={18} />
                              </div>
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                {item.term}
                              </h3>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition-colors flex items-center justify-center shrink-0">
                              <ChevronRight size={15} />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 pt-3 mt-3 border-t border-slate-100">
                          <Info size={13} />
                          <span>Detail Fitur & Komponen</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-8">
          <BookOpen size={40} className="text-slate-300 mb-3" />
          <h3 className="font-bold text-base text-slate-800">Istilah Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mt-1">
            Kata kunci "{searchTerm}" tidak cocok dengan fitur menu atau sensor di kamus LetSens.
          </p>
        </div>
      )}

      {/* Modal Detail Glosarium */}
      <AnimatePresence>
        {selectedTerm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                <div className="space-y-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${categoryBadgeColors[selectedTerm.category] || 'bg-slate-100 text-slate-700'}`}>
                    {selectedTerm.category}
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    {selectedTerm.menuIcon && (
                      <selectedTerm.menuIcon size={20} className="text-blue-600 shrink-0" />
                    )}
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {selectedTerm.term}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {selectedTerm.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-600" />
                    Penjelasan Fitur Terpadu
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                    {selectedTerm.detail}
                  </div>
                </div>

                {selectedTerm.features && selectedTerm.features.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      Fitur & Sub-Komponen Utama
                    </h4>
                    <div className="space-y-2">
                      {selectedTerm.features.map((f, i) => {
                        const Icon = f.icon || Info;
                        return (
                          <div key={i} className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={15} className="text-blue-600 shrink-0" />
                              <span className="text-xs font-bold text-slate-900">{f.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium pl-6">
                              {f.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
