export type MenuView =
  | 'dasbor'
  | 'dashboard'
  | 'data-sensor'
  | 'fasilitas'
  | 'data-utilitas'
  | 'bilik-toilet'
  | 'perangkat'
  | 'pengguna'
  | 'manajemen-toilet'
  | 'manajemen-iot'
  | 'manajemen-petugas'
  | 'stok-perlengkapan'
  | 'manajemen-perlengkapan'
  | 'jadwal-pemeliharaan'
  | 'rekap-kerusakan'
  | 'rekap-perbaikan'
  | 'letsens-ai'
  | 'laporan'
  | 'pengaturan'
  | 'pengaturan-sistem'
  | 'pengaturan-aplikasi'
  | 'log-aktivitas'
  | 'logs'
  | 'glosarium'
  | 'tentang'
  | 'profile'
  | 'profil-saya'
  | 'not-found'
  | '404';

export interface FasilitasItem {
  id: string;
  no?: number;
  namaFasilitas?: string;
  utilitasName?: string;
  toiletId?: string;
  toiletCode: string;
  location: string;
  building: string;
  floor: number;
  kategori?: 'Sanitasi & Kebersihan' | 'Tisu & Kertas' | 'Elektrikal & Lampu' | 'Plumbing & Katup' | 'Hardware IoT' | 'Fasilitas & Dinding' | string;
  category?: string;
  jumlah: string;
  stokAngka?: number;
  unit?: string;
  kondisi: string;
  status?: 'Tersedia' | 'Perlu Diisi' | 'Perlu Perbaikan' | 'Normal' | 'Rusak' | string;
  statusTerakhir?: string;
  petugasJawab?: string;
  terakhirDiperiksa?: string;
  lastUpdated?: string;
  catatan?: string;
  iconType?: string;
}

export type UtilitasItem = FasilitasItem;

export type GenderType = 'Wanita' | 'Pria' | 'Disabilitas' | 'Unisex';

export interface IotDevice {
  id: string;
  nodeId: string; // e.g. ESP32-TK-01A
  name: string; // e.g. Node LetSens Bilik T-A1-F
  toiletCode: string; // e.g. T-A1-F
  toiletName: string;
  building: string;
  floor: number;
  // Nilai Baterai (bat)
  batteryPercent: number; // e.g. 96 (%)
  batteryVoltage: number; // e.g. 4.18 (V)
  powerSource: 'Baterai Li-Ion 18650' | 'Adaptor DC 5V (Mains)' | 'Hybrid Baterai & DC';
  batteryStatus: 'Penuh / Normal' | 'Sedang Diisi (Charging)' | 'Rendah (Low)' | 'Kritis';
  // Nilai RSSI
  rssi: number; // e.g. -58 (dBm)
  rssiQuality: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Lemah';
  wifiSsid: string;
  // Waktu Aktivasi & Uptime
  activationDate: string; // e.g. "15 Jan 2026, 08:30 WIB"
  uptime: string; // e.g. "234 hari 14 jam"
  lastTelemetryTime: string; // e.g. "5 detik yang lalu"
  // Versi
  firmwareVersion: string; // e.g. "v2.4.2-unikom-prod"
  hardwareVersion: string; // e.g. "ESP32-WROOM-32D Rev 3"
  sensorShieldVersion: string; // e.g. "LetSens Dual-MQ Shield v1.4"
  otaStatus: 'Up to Date' | 'Update Tersedia (v2.5.0)' | 'Sedang Update';
  // Jaringan & Telemetri
  ipAddress: string;
  macAddress: string;
  pingLatencyMs: number;
  status: 'Online' | 'Warning' | 'Offline' | 'Kalibrasi';
  connectedSensors: string[];
  rebootCount: number;
}

export interface ToiletBilik {
  id: string;
  code: string; // e.g. T-A1-F
  name: string; // e.g. Gedung A, Lt 1, Wanita
  building: string; // Gedung A, Gedung B, Gedung Smart Kampus
  floor: number;
  gender: GenderType;
  occupied: boolean;
  occupancyDurationMinutes: number;
  doorStatus: 'Tertutup' | 'Terbuka';
  amoniaPPM: number; // MQ-137 / MQ-135
  temperatureC: number; // DHT22
  humidityPercent: number; // DHT22
  lux: number; // LDR
  soapLevelPercent: number; // Ultrasonic
  tissueLevelPercent: number; // ToF sensor
  waterFlowLpm: number; // Flow meter
  batteryPercent: number;
  iotDeviceId: string;
  ipAddress: string;
  macAddress: string;
  lastTelemetryTime: string;
  facilities: string[];
  status: 'Online' | 'Offline' | 'Maintenance';
}

export interface SensorTelemetryRecord {
  id: string;
  timestamp: string;
  deviceId?: string;
  nodeId?: string;
  deviceName?: string;
  toiletCode: string;
  toiletName?: string;
  building?: string;
  amoniaPPM: number;
  temperatureC: number;
  humidityPercent: number;
  lux: number;
  occupied: boolean;
  soapLevelPercent: number;
  tissueLevelPercent: number;
  waterFlowLpm: number;
  flushCount?: number;
  batteryPercent?: number;
  batteryVoltage?: number;
  rssi?: number;
  statusCondition: 'Normal' | 'Waspada' | 'Bahaya';
}

export interface PetugasKebersihan {
  id: string;
  nip: string;
  name: string;
  phone: string;
  role?: 'Super Admin' | 'Petugas Kebersihan' | 'Teknisi IoT' | 'Supervisor / Manajer' | string;
  email?: string;
  shift: 'Pagi (06:00 - 14:00)' | 'Siang (14:00 - 22:00)' | 'Malam (22:00 - 06:00)' | string;
  assignedBuilding: string;
  status: 'Bertugas' | 'Istirahat' | 'Siaga' | 'Izin' | string;
  rating: number; // e.g. 4.8 / 5
  completedTasksToday: number;
  avatar: string;
  lastActive: string;
}

export interface PerlengkapanItem {
  id: string;
  name: string;
  category: 'Cairan & Kimia' | 'Kertas & Tisu' | 'Pewangi & Aerosol' | 'Alat Pembersih' | 'Hardware IoT';
  stock: number;
  unit: string;
  minThreshold: number;
  location: string;
  lastRestocked: string;
  pricePerUnit: number;
}

export interface JadwalPemeliharaanItem {
  id: string;
  toiletCode: string;
  toiletName: string;
  staffId: string;
  staffName: string;
  shift: string;
  timeSlot: string;
  type: 'Pembersihan Rutin' | 'Inspeksi Berkala' | 'Deep Cleaning' | 'Restock Perlengkapan';
  checklist: { task: string; done: boolean }[];
  status: 'Terjadwal' | 'Sedang Berjalan' | 'Selesai';
  notes: string;
  completedAt?: string;
}

export interface RekapKerusakanItem {
  id: string;
  ticketCode: string;
  toiletCode: string;
  locationName: string;
  category: 'Plumbing & Air' | 'Sensor & IoT' | 'Sanitasi & Kloset' | 'Elektrikal & Lampu';
  description: string;
  reportedBy: string; // Pengunjung / Petugas / LetSens AI Auto-Detection
  reportedAt: string;
  severity: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  status: 'Menunggu' | 'Diteruskan ke Teknisi' | 'Dalam Perbaikan' | 'Selesai';
}

export interface RekapPerbaikanItem {
  id: string;
  repairCode: string;
  damageTicketCode: string;
  toiletCode: string;
  locationName: string;
  technicianName: string;
  actionTaken: string;
  partsReplaced: string;
  costEstimateRp: number;
  startedAt: string;
  completedAt?: string;
  status: 'Dalam Antrian' | 'Proses Pengerjaan' | 'Menunggu Sparepart' | 'Selesai';
  notes: string;
}

export interface SystemSettings {
  mqttBrokerHost: string;
  mqttBroker?: string;
  mqttPort: number;
  mqttTopicRoot: string;
  mqttTopic?: string;
  telemetryIntervalSeconds: number;
  apiEndpoint: string;
  amoniaWarningThreshold: number; // e.g. 10 PPM
  amoniaDangerThreshold: number; // e.g. 25 PPM
  tempMaxThreshold?: number;
  luxMinThreshold?: number;
  lowSoapThresholdPercent: number;
  lowTissueThresholdPercent: number;
  soapMinThreshold?: number;
  tissueMinThreshold?: number;
  maxOccupancyMinutesAlert: number;
  autoTriggerBlower: boolean;
  fanAutoTrigger?: boolean;
  waGatewayUrl?: string;
  telegramBotToken?: string;
  emailAlertRecipient?: string;
  geminiApiKey?: string;
}

export interface AppSettings {
  appName: string;
  institution: string;
  campusLocation: string;
  buildingLocation?: string;
  contactHotline: string;
  whatsappNotificationNumber: string;
  soundAlarmEnabled: boolean;
  alertSoundEnabled?: boolean;
  timezone?: string;
  autoRefreshIntervalSeconds?: number;
  iotSimulationActive?: boolean;
}

export interface LogRecord {
  id: string;
  timestamp: string;
  category?: 'IoT Telemetry' | 'AI Alert' | 'User Action' | 'Maintenance' | 'System Error';
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'AI_AUDIT';
  module: string;
  event: string;
  message: string;
  deviceId?: string;
  details?: string;
  rawPayload?: string;
}

// Aliases for unified interface naming across components
export type MenuKey = MenuView;
export type SystemLogEntry = LogRecord;
export type PengaturanSistemConfig = SystemSettings;
export type PengaturanAplikasiConfig = AppSettings;
