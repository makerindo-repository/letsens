import {
  ToiletBilik,
  IotDevice,
  PetugasKebersihan,
  PerlengkapanItem,
  JadwalPemeliharaanItem,
  RekapKerusakanItem,
  RekapPerbaikanItem,
  SystemSettings,
  AppSettings,
  LogRecord,
  SensorTelemetryRecord,
  UtilitasItem,
} from '../types';

// STRICTLY EMPTY ARRAYS BY DEFAULT - ALL DATA DERIVED 100% FROM BACKEND LARAVEL REST API
export const INITIAL_TOILETS: ToiletBilik[] = [];
export const INITIAL_IOT_DEVICES: IotDevice[] = [];
export const INITIAL_STAFF: PetugasKebersihan[] = [];
export const INITIAL_SUPPLIES: PerlengkapanItem[] = [];
export const INITIAL_MAINTENANCE: JadwalPemeliharaanItem[] = [];
export const INITIAL_DAMAGES: RekapKerusakanItem[] = [];
export const INITIAL_REPAIRS: RekapPerbaikanItem[] = [];
export const INITIAL_LOGS: LogRecord[] = [];
export const INITIAL_TELEMETRY_HISTORY: SensorTelemetryRecord[] = [];
export const INITIAL_UTILITAS: UtilitasItem[] = [];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  mqttBrokerHost: 'broker.emqx.io',
  mqttBroker: 'broker.emqx.io',
  mqttPort: 1883,
  mqttTopicRoot: 'letsens/toilet/sensordata',
  mqttTopic: 'letsens/toilet/sensordata',
  telemetryIntervalSeconds: 15,
  apiEndpoint: '/api/sensor-telemetry/store',
  amoniaWarningThreshold: 10.0,
  amoniaDangerThreshold: 20.0,
  tempMaxThreshold: 33.0,
  luxMinThreshold: 150,
  lowSoapThresholdPercent: 20,
  lowTissueThresholdPercent: 15,
  soapMinThreshold: 20,
  tissueMinThreshold: 15,
  maxOccupancyMinutesAlert: 15,
  autoTriggerBlower: true,
  fanAutoTrigger: true,
  waGatewayUrl: 'https://api.whatsapp-gateway.unikom.ac.id/v1/send',
  telegramBotToken: '',
  emailAlertRecipient: 'admin@unikom.ac.id',
  geminiApiKey: '',
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  appName: 'LetSens AIoT - Smart Sanitation System',
  institution: 'Universitas Komputer Indonesia (UNIKOM)',
  campusLocation: 'Kampus UNIKOM, Jl. Dipati Ukur No. 112-116, Bandung',
  buildingLocation: 'Kampus UNIKOM, Jl. Dipati Ukur No. 112-116, Bandung',
  contactHotline: '0812-2244-8899 (Direktorat Fasilitas & Aset UNIKOM)',
  whatsappNotificationNumber: '0812-3456-7890',
  soundAlarmEnabled: true,
  alertSoundEnabled: true,
  timezone: 'Asia/Jakarta (WIB - UTC+7)',
  autoRefreshIntervalSeconds: 3,
  iotSimulationActive: true,
};

// Convenient exports
export const initialToilets = INITIAL_TOILETS;
export const initialIotDevices = INITIAL_IOT_DEVICES;
export const initialPetugas = INITIAL_STAFF;
export const initialPerlengkapan = INITIAL_SUPPLIES;
export const initialJadwalPemeliharaan = INITIAL_MAINTENANCE;
export const initialRekapKerusakan = INITIAL_DAMAGES;
export const initialRekapPerbaikan = INITIAL_REPAIRS;
export const initialSystemLogs = INITIAL_LOGS;
export const initialTelemetryLogs = INITIAL_TELEMETRY_HISTORY;
export const initialPengaturanSistem = INITIAL_SYSTEM_SETTINGS;
export const initialPengaturanAplikasi = INITIAL_APP_SETTINGS;
export const initialUtilitas = INITIAL_UTILITAS;
