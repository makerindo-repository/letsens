# 🏢 LetSens AIoT — Smart Sanitation & Air Quality System

[![PHP Version](https://img.shields.io/badge/PHP-8.2%2B-blue.svg)](https://php.net)
[![Laravel Version](https://img.shields.io/badge/Laravel-11.x-red.svg)](https://laravel.com)
[![React Version](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Proprietary-green.svg)](#-lisensi--hak-cipta)

> **Universitas Komputer Indonesia (UNIKOM)**  
> *Platform Terpadu Telemetri IoT, Monitoring Sanitasi Bilik Toilet & Audit Kebersihan Berbasis Kecerdasan Buatan (LetSens AI).*

---

## 📌 Ringkasan Sistem (System Overview)

**LetSens AIoT** adalah platform sensing & manajemen sanitasi pintar berbasis Internet of Things (IoT) dan Kecerdasan Buatan (AI) yang dirancang untuk fasilitas publik dan lingkungan kampus. Platform ini memberikan solusi komprehensif untuk memantau kualitas udara (kadar gas amonia $NH_3$), iklim mikro (suhu & kelembapan), okupansi bilik toilet, serta otomatisasi ventilasi udara (*exhaust blower*) guna meningkatkan standar kebersihan dan efisiensi pemeliharaan fasilitas.

### 🌟 Fitur & Keunggulan Utama

- 📡 **Telemetri Sensor Real-Time**: Integrasi langsung dengan node sensor ESP32 via protokol **MQTT** (Broker HiveMQ/EMQX) dan **HTTP REST API**.
- 💨 **Otomasi Ventilsasi (Exhaust Blower Control)**: Aktuasi relai kipas penyedot udara secara otomatis ketika kadar amonia melebihi ambang batas aman ($>10\text{ PPM}$).
- 🤖 **LetSens AI Smart Audit**: Rekomendasi tindakan pembersihan dan analisis anomali kualitas udara berbasis Google Gemini AI, serta prediksi konsumsi *supplies* (sabun & tisu).
- 🛡️ **Role-Based Access Control (RBAC)**: Pengelolaan hak akses berjenjang untuk 4 peran (*Super Admin*, *Supervisor / Manajer*, *Teknisi IoT*, dan *Petugas Kebersihan*).
- 📲 **WhatsApp Quick Dispatch**: Fitur integrasi pemanggilan tugas pembersihan langsung ke pesan WhatsApp petugas kebersihan saat terjadi kondisi darurat/kotor.
- 📊 **Pelaporan & Eksportasi Data**: Generasi laporan periodik dalam format **PDF** dan **Excel (.xlsx)** untuk audit kebersihan dan inventaris.
- 📚 **Glosarium & Dokumentasi Sistem**: Modul glosarium teknis interaktif mengenai spesifikasi sensor (MQ-137, SHT40, PIR, ADS1115 ADC) dan panduan penggunaan.

---

## 🏗️ Arsitektur Sistem & Data Flow

```mermaid
graph TD
    subgraph IoT Node Layer
        ESP32[ESP32 Microcontroller] -->|I2C / ADC| MQ137[MQ-137 Ammonia Sensor]
        ESP32 -->|Digital| SHT40[SHT40 Temp & Humidity]
        ESP32 -->|GPIO| PIR[PIR Occupancy Sensor]
        ESP32 -->|Relay| Kipas[Exhaust Blower Fan]
    end

    subgraph Transport & Broker
        ESP32 -->|MQTT Protocol / JSON| HiveMQ[HiveMQ MQTT Broker]
        HiveMQ -->|Topic: letsens/toilet/sensordata| Daemon[Python Telemetry Listener]
    end

    subgraph Backend Core (Laravel 11 REST API)
        Daemon -->|POST /api/sensor-logs| API[Laravel API Gateway]
        API --> Auth[Sanctum Auth & RBAC Middleware]
        API --> TelemetrySvc[Telemetry Service]
        API --> MaintenanceSvc[Maintenance Service]
        API --> GeminiSvc[LetSens AI Gemini Service]
        TelemetrySvc --> DB[(Database SQLite/MySQL)]
    end

    subgraph External Services
        GeminiSvc -->|REST API| GoogleGemini[Google Gemini AI Engine]
        API -->|Direct Link| WhatsApp[WhatsApp Web Gateway]
    end

    subgraph Frontend User Interface (React 19 SPA)
        SPA[React 19 SPA + Vite + TailwindCSS] -->|Axios REST Calls| API
        SPA -->|Real-Time State| Dashboard[Dasbor Telemetri & Bilik Toilet]
    end
```

---

## 💻 Spesifikasi Teknologi (Tech Stack)

### **Backend (Laravel 11 REST API)**
- **Framework**: Laravel 11 (PHP 8.2+)
- **Arsitektur**: Clean Service Pattern (`App\Services\*`, `App\Traits\ApiResponseTrait`)
- **Autentikasi**: Laravel Sanctum (Encrypted Bearer Tokens)
- **Database**: SQLite (Development) / MySQL 8.0+ (Production)
- **Testing**: PHPUnit Test Suite

### **Frontend (React 19 SPA)**
- **Framework**: React 19 + Vite 6 + TypeScript 5
- **Styling**: TailwindCSS v4 + Custom Modern CSS Design System
- **Animasi & Transisi**: Motion (Framer Motion)
- **Ikonografi**: Lucide React
- **Ekspor Dokumen**: jsPDF, AutoTable, SheetJS (XLSX)

### **Hardware & Sensor (IoT Node)**
- **Mikrokontroler**: ESP32 Dual-Core 32-Bit Xtensa
- **Sensor Gas**: MQ-137 (Amonia $NH_3$) + Adafruit ADS1115 16-Bit I2C ADC
- **Sensor Iklim**: SHT40 / DHT22 Digital Sensor
- **Sensor Okupansi**: PIR Motion Sensor + Reed Switch Pintu
- **Aktuator**: Relai 5V Optokopler Exhaust Fan

---

## 📁 Struktur Direktori (Clean Architecture)

```text
letsens/
├── backend/                        # 🖥️ Laravel 11 REST API Server
│   ├── app/
│   │   ├── Services/               # Service Layer Business Logic
│   │   │   ├── TelemetryService.php
│   │   │   ├── MaintenanceService.php
│   │   │   ├── IotDeviceService.php
│   │   │   ├── AuthService.php
│   │   │   └── LetsensAiService.php
│   │   ├── Http/
│   │   │   ├── Controllers/Api/    # Controller REST Endpoints
│   │   │   └── Requests/           # Form Request Validation Rules
│   │   ├── Traits/                 # ApiResponseTrait (Standard JSON Responses)
│   │   └── Models/                 # Eloquent ORM Schemas & Relationships
│   ├── database/
│   │   ├── migrations/             # Database Schema Migrations
│   │   └── seeders/                # DatabaseSeeder & Role Configurations
│   ├── routes/
│   │   ├── api.php                 # Versioned REST API Endpoints
│   │   └── web.php                 # Web Fallback & Healthcheck Endpoint
│   ├── supervisor/                 # Supervisor Daemon Configuration Files
│   └── emulator.py                 # 📟 Hardware Simulator (MQTT/HTTP Telemetry)
├── frontend/                       # 🎨 React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── api/                    # Axios API Service Modules
│   │   ├── components/             # Reusable Interface & Layout Components
│   │   │   ├── layout/             # Sidebar, TopHeader, Navigation
│   │   │   ├── auth/               # LoginPage Component
│   │   │   ├── ui/                 # DynamicIslandToast, Modals, Cards
│   │   │   └── views/              # Page Views (Dasbor, Toilet, Hardware, dll)
│   │   ├── utils/                  # RBAC Permission Helpers & Utilities
│   │   └── pages/                  # Index Barrel Exports
│   └── public/                     # Static Assets & Storage Media
└── README.md                       # 📄 Master VPS Deployment & Documentation Guide
```

---

## 🔌 Dokumentasi REST API Endpoints

Semua endpoint API terlindungi oleh autentikasi **Bearer Token (Sanctum)** dan mengembalikan format respons terstruktur:

```json
{
  "success": true,
  "message": "Deskripsi respons",
  "data": {}
}
```

### Ringkasan Ringkas Endpoint API:

| Kategori | Method | Endpoint | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Autentikasi** | `POST` | `/api/login` | Autentikasi pengguna & pembuatan Token Sanctum |
| | `POST` | `/api/logout` | Revokasi token autentikasi pengguna |
| | `GET` | `/api/me` | Mengambil profil pengguna yang sedang login |
| | `POST` | `/api/profile/photo` | Mengunggah foto profil pengguna |
| **Telemetri** | `GET` | `/api/sensor-logs/latest` | Mengambil log telemetri sensor terbaru per bilik |
| | `POST` | `/api/sensor-logs` | Ingest data telemetri dari node hardware/emulator |
| | `GET` | `/api/toilets/{id}/telemetry-history` | Riwayat telemetri spesifik per bilik toilet |
| **Manajemen Bilik** | `GET` | `/api/toilets` | Daftar seluruh bilik toilet beserta status realtime |
| | `POST` | `/api/toilets` | Menambahkan bilik toilet baru |
| | `PUT` | `/api/toilets/{id}` | Memperbarui data & ambang batas amonia bilik |
| | `DELETE` | `/api/toilets/{id}` | Menghapus bilik toilet |
| **Hardware IoT** | `GET` | `/api/iot-devices` | Inventaris seluruh perangkat ESP32 & sensor |
| | `POST` | `/api/iot-devices` | Pendaftaran perangkat IoT baru |
| **LetSens AI** | `POST` | `/api/letsens-ai/analyze` | Analisis kebersihan & rekomendasi berbasis AI |
| **Stok & Tugas** | `GET` | `/api/supplies` | Pemantauan stok persediaan sabun & tisu |
| | `GET` | `/api/maintenance-schedules` | Jadwal & tiket pemeliharaan kebersihan |
| **Pengaturan** | `GET` | `/api/settings` | Mengambil pengaturan sistem & konfigurasi MQTT |
| | `PUT` | `/api/settings/{group}` | Memperbarui konfigurasi grup (`system`, `app`, `mqtt`) |

---

## 🔐 Manajemen Hak Akses (Role-Based Access Control)

Aplikasi mengimplementasikan 4 tingkatan peran pengguna yang terkonfigurasi secara otomatis saat inisialisasi database:

1. **Super Admin**: Akses penuh ke seluruh modul sistem, pengaturan server, audit log, dan manajemen pengguna.
2. **Supervisor / Manajer**: Akses monitoring dasbor, analisis kecerdasan buatan LetSens AI, audit kebersihan, serta rekapitulasi laporan.
3. **Teknisi IoT**: Akses khusus untuk manajemen perangkat hardware ESP32, kalibrasi sensor MQ-137, dan pengujian broker MQTT.
4. **Petugas Kebersihan**: Akses untuk memperbarui status kebersihan bilik, menerima jadwal pemeliharaan, serta merespon permintaan tugas.

> ℹ️ **Catatan Keamanan**: Akun administrator awal dibuat melalui skrip inisialisasi `php artisan db:seed` pada saat setup awal. Password default diatur secara aman dalam file `.env` atau dikonfigurasi saat pertama kali deployment.

---

## 📟 Pengujian Simulasi Hardware (Emulator)

Untuk menyimulasikan data telemetri dari perangkat mikrokontroler ESP32 di lingkungan pengujian/staging tanpa hardware fisik:

```bash
# Pindah ke direktori backend
cd backend

# Jalankan skrip simulator Python (Mengirimkan payload telemetri real-time via MQTT)
python3 emulator.py
```

*Skrip ini akan mengirimkan data sensor acak terkalibrasi (Gas Amonia, Suhu, RH, Status Okupansi PIR, Persentase Sabun & Tissu, Baterai, dan RSSI) ke broker MQTT setiap 5 detik.*

---

## ⚙️ Konfigurasi Environment Variable (`.env`)

### **Backend (`backend/.env`)**
```env
APP_NAME="LetSens AIoT"
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://domain-anda.com

LOG_CHANNEL=daily
DB_CONNECTION=sqlite
DB_DATABASE=/var/www/letsens/backend/database/database.sqlite

# Google Gemini AI API Key
GEMINI_API_KEY=your_google_gemini_api_key_here

# MQTT Broker Configuration
MQTT_BROKER_HOST=broker.hivemq.com
MQTT_BROKER_PORT=1883
MQTT_TOPIC_ROOT=letsens/toilet/sensordata
```

### **Frontend (`frontend/.env`)**
```env
VITE_API_BASE_URL=https://domain-anda.com/api
```

---

## 🚀 Panduan Deployment VPS (Ubuntu 22.04 / 24.04 LTS)

### 1. Prasyarat Server (System Prerequisites)
Pastikan paket pendukung berikut terpasang pada VPS:
- **PHP**: PHP 8.2+ beserta ekstensi (`php8.2-fpm`, `php8.2-cli`, `php8.2-mbstring`, `php8.2-xml`, `php8.2-curl`, `php8.2-sqlite3`, `php8.2-mysql`, `php8.2-zip`)
- **Composer**: Dependency Manager PHP
- **Node.js**: Node v20 LTS + `npm`
- **Web Server**: Nginx
- **Process Manager**: PM2 atau Supervisor

---

### 2. Deployment Backend (Laravel API)

```bash
# 1. Clone repository ke folder web root
cd /var/www
git clone https://github.com/username/letsens.git
cd letsens/backend

# 2. Install dependensi composer (produksi)
composer install --no-dev --optimize-autoloader

# 3. Salin & sesuaikan environment file
cp .env.example .env
nano .env

# 4. Generate Application Key & Storage Link
php artisan key:generate
php artisan storage:link

# 5. Jalankan Migrasi & Seeder Database Initial
php artisan migrate --force
php artisan db:seed --force

# 6. Atur Izin Akses Folder Storage & Cache
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

### 3. Build & Deployment Frontend (React SPA)

```bash
# 1. Pindah ke folder frontend
cd /var/www/letsens/frontend

# 2. Install dependensi npm
npm install

# 3. Konfigurasi Environment Production
echo "VITE_API_BASE_URL=https://domain-anda.com/api" > .env

# 4. Build aplikasi produksi
npm run build
```
*Hasil kompilasi static bundle akan tersimpan di folder `/var/www/letsens/frontend/dist`.*

---

### 4. Konfigurasi Nginx Web Server

Buat file konfigurasi Nginx di `/etc/nginx/sites-available/letsens`:

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;
    root /var/www/letsens/frontend/dist;
    index index.html;

    # Single Page Application (SPA) Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API Request ke Laravel Backend
    location /api {
        alias /var/www/letsens/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_param SCRIPT_FILENAME /var/www/letsens/backend/public/index.php;
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    # Static Media Storage Link
    location /storage {
        alias /var/www/letsens/backend/storage/app/public;
        access_log off;
        expires 30d;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Aktifkan konfigurasi Nginx dan tes sintaks:

```bash
sudo ln -s /etc/nginx/sites-available/letsens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 5. Konfigurasi Background Process Daemon (Supervisor / PM2)

Untuk memastikan listener telemetri MQTT berjalan tanpa henti di background:

#### Menggunakan Supervisor (`/etc/supervisor/conf.d/letsens-emulator.conf`):
```ini
[program:letsens-emulator]
process_name=%(program_name)s
command=python3 /var/www/letsens/backend/emulator.py
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/letsens/backend/storage/logs/emulator.log
```

Jalankan Supervisor daemon:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start letsens-emulator
```

---

### 6. Keamanan SSL (Certbot Let's Encrypt)

Aktifkan sertifikat SSL gratis untuk enkripsi data HTTPS:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

---

## 🧪 Verifikasi & Pengujian Mutu (Quality Assurance)

Sebelum mengaktifkan di lingkungan produksi, pastikan seluruh pengujian berjalan tanpa eror:

```bash
# Pengujian Unit & Integrasi Backend (PHPUnit)
cd /var/www/letsens/backend
./vendor/bin/phpunit

# Pengujian Tipe Staf & Kompilasi Frontend (TypeScript)
cd /var/www/letsens/frontend
npx tsc --noEmit
```

---

## 📄 Lisensi & Hak Cipta

- **Hak Cipta**: © 2026 **Universitas Komputer Indonesia (UNIKOM)**. Hak Cipta Dilindungi Undang-Undang.
- **Tim Pengembang**: Division IoT & AI Sanitation Engineering.
- **Lisensi**: Proprietary Software. Penggunaan, penyalinan, atau redistribusi tanpa izin tertulis dari pihak UNIKOM dilarang keras.
