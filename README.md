# 🏢 LetSens AIoT — Smart Sanitation & Air Quality System
> **Universitas Komputer Indonesia (UNIKOM)**  
> Platform Terpadu Telemetri IoT, Monitoring Sanitasi Bilik Toilet & Audit Kebersihan Berbasis Kecerdasan Buatan (LetSens AI).

---

## 📌 Ringkasan Sistem (System Overview)

**LetSens AIoT** adalah platform sensing & manajemen sanitasi pintar yang dirancang untuk memantau kualitas udara (kadar gas amonia $NH_3$), iklim relatif (suhu & kelembapan), status okupansi pergerakan pengunjung, serta kontrol otomatisasi ventilasi penyedot udara (*exhaust blower*) pada bilik-bilik toilet kampus.

### 🌟 Fitur & Keunggulan Utama
- 📡 **Telemetri Real-Time**: Transmisi data sensor dari mikrokontroler ESP32 via protokol **MQTT** (HiveMQ/EMQX) dan **HTTP REST API**.
- 💨 **Otomasi Relay Exhaust Blower**: Blower penyedot udara menyala secara otomatis ketika kadar amonia melebihi ambang batas warning ($>10\text{ PPM}$).
- 🤖 **LetSens AI Smart Audit**: Model rekomendasi kebersihan berbasis kecerdasan buatan terintegrasi Google Gemini AI untuk mendeteksi anomali bau & memprediksi sisa persediaan *consumable* (sabun & tisu).
- 🛡️ **Role-Based Access Control (RBAC)**: Otorisasi hak akses 4 tingkatan (*Super Admin*, *Supervisor / Manajer*, *Teknisi IoT*, dan *Petugas Kebersihan*).
- 📲 **WhatsApp Quick Dispatch Gateway**: Fitur panggilan tugas otomatis ke WhatsApp petugas sanitasi saat terjadi kondisi darurat atau kotor.
- 📚 **Glosarium & Dokumentasi Terpadu**: Kamus istilah teknis, spesifikasi hardware sensor MQ-137, SHT40, PIR, ADS1115 ADC, dan panduan fitur sidebar.

---

## 🏗️ Teknologi & Arsitektur (Tech Stack)

### **Backend (Laravel 11 REST API)**
- **Framework**: Laravel 11 (PHP 8.2+)
- **Architecture**: Domain-Driven & Clean Service Layer (`App\Services\*`, `App\Traits\*`)
- **Authentication**: Laravel Sanctum (Encrypted Bearer Tokens)
- **Database**: SQLite / MySQL / PostgreSQL
- **Testing**: PHPUnit / Pest

### **Frontend (React 19 SPA)**
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS v4 + Vanilla CSS Custom Tokens
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **PDF & Excel Export**: jsPDF, AutoTable, XLSX

### **Hardware & Sensors (IoT Node)**
- **Mikrokontroler**: ESP32 Dual-Core 32-Bit Xtensa (FreeRTOS Multi-tasking)
- **Sensor Gas Amonia**: MQ-137 + Adafruit ADS1115 16-Bit I2C ADC
- **Sensor Suhu & RH**: SHT40 / DHT22 Digital Sensor
- **Sensor Okupansi**: PIR Motion Sensor + Reed Door Switch
- **Aktuator Ventilasi**: Relai Optokopler 5V Exhaust Fan

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
│   │   │   └── Requests/           # Form Request Validations
│   │   ├── Traits/                 # ApiResponseTrait Formatters
│   │   └── Models/                 # Eloquent ORM Schemas
│   ├── database/
│   │   ├── migrations/             # Database Schema Migrations
│   │   └── seeders/                # DatabaseSeeder & Default RBAC
│   ├── routes/
│   │   ├── api.php                 # REST API Endpoints (v1)
│   │   └── web.php                 # Web Fallback & Healthcheck
│   └── emulator.py                 # 📟 Hardware Simulator (MQTT / HTTP Telemetry)
├── frontend/                       # 🎨 React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/             # Reusable UI & Layout Components
│   │   │   ├── layout/             # Sidebar, TopHeader, Navigation
│   │   │   ├── auth/               # LoginPage Component
│   │   │   ├── ui/                 # DynamicIslandToast, Modals, Cards
│   │   │   └── views/              # Page Views (Dasbor, Toilet, Hardware, dll)
│   │   ├── services/               # Axios API Client & Endpoints Integration
│   │   ├── utils/                  # RBAC Permissions & Helpers
│   │   └── pages/                  # Index Barrel Exports
│   └── public/                     # Static Assets & Storage Media
└── README.md                       # 📄 Dokumentasi Utuh VPS Deployment
```

---

## 🔐 Kredensial Pengujian (Default Seeded RBAC Accounts)

Setiap akun memiliki batasan visibilitas menu sidebar dan hak akses CRUD sesuai perannya:

| Peran (Role) | Email Login | Password | Akses Utama |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@letsens.id` | `password123` | Akses Penuh (Manajemen Pengguna, Pengaturan, Hardware, Logs) |
| **Supervisor** | `supervisor@letsens.id` | `password123` | Monitoring Dasbor, Laporan AI, Audit Kebersihan & Stok |
| **Teknisi IoT** | `teknisi@letsens.id` | `password123` | Manajemen Perangkat, Konfigurasi Sensor & Ambang Amonia |
| **Petugas Kebersihan**| `cleaner@letsens.id` | `password123` | Jadwal Pembersihan, Status Kebersihan Bilik & Respon Kebersihan |

---

## 📟 Pengujian Simulasi Telemetri Hardware (Emulator)

Untuk menyimulasikan data telemetry dari perangkat sensor fisik ESP32 di lingkungan pengujian tanpa hardware nyata:

```bash
# Pindah ke direktori backend
cd backend

# Jalankan skrip simulator Python (Mengirimkan payload telemetri acak real-time via MQTT)
python3 emulator.py
```

*Skrip ini akan mempublikasikan data sensor (Amonia, Suhu, RH, PIR, Sabun, Tissu, Baterai, RSSI) ke broker MQTT `broker.hivemq.com` pada topik `letsens/toilet/sensordata` setiap 5 detik.*

---

## 🚀 Panduan Deployment VPS (Ubuntu 22.04 / 24.04 LTS)

### 1. Prasyarat Server (System Prerequisites)
Pastikan paket pendukung berikut terpasang di VPS:
- **PHP**: PHP 8.2+ beserta ekstensi (`php8.2-fpm`, `php8.2-cli`, `php8.2-mbstring`, `php8.2-xml`, `php8.2-curl`, `php8.2-sqlite3`, `php8.2-mysql`, `php8.2-zip`)
- **Composer**: PHP Package Manager
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

# 2. Install dependensi composer
composer install --no-dev --optimize-autoloader

# 3. Salin environment file
cp .env.example .env

# 4. Sesuaikan konfigurasi .env
# Edit APP_ENV=production, APP_DEBUG=false, APP_URL=https://domain-anda.com
nano .env

# 5. Generate Application Key & Link Storage
php artisan key:generate
php artisan storage:link

# 6. Jalankan Migrasi & Seeder Database
php artisan migrate --force
php artisan db:seed --force

# 7. Atur Izin Akses Folder Storage & Cache
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

# 3. Konfigurasi Environment Frontend (.env)
# Buat file .env jika menggunakan API terpisah
echo "VITE_API_BASE_URL=https://domain-anda.com/api" > .env

# 4. Build aplikasi produksi
npm run build
```
*Hasil kompilasi static files akan tersimpan di folder `/var/www/letsens/frontend/dist`.*

---

### 4. Konfigurasi Web Server Nginx

Buat konfigurasi Nginx baru pada `/etc/nginx/sites-available/letsens`:

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;
    root /var/www/letsens/frontend/dist;
    index index.html;

    # Frontend Single Page Application (SPA) Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy request API ke Laravel Backend
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

    # Media Storage Static Asset Link
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

Aktifkan konfigurasi Nginx dan reload service:

```bash
sudo ln -s /etc/nginx/sites-available/letsens /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 5. Konfigurasi Daemon Process Manager (PM2 / Supervisor)

Untuk memastikan background worker (seperti listener MQTT telemetri atau queue worker) tetap berjalan:

#### Opsi menggunakan PM2:
```bash
# Install PM2 global
sudo npm install -g pm2

# Jalankan skrip simulator / listener telemetri
pm2 start /var/www/letsens/backend/emulator.py --name "letsens-emulator" --interpreter python3
pm2 save
pm2 startup
```

---

### 6. SSL Certificate (Certbot Let's Encrypt)

Amankan domain aplikasi dengan enkripsi HTTPS gratis:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

---

## 🧪 Verifikasi & Pengujian Mutu (Quality Assurance)

Sebelum mengaktifkan di produksi, jalankan pengujian backend dan frontend:

```bash
# Jalankan PHPUnit test suite pada backend
cd /var/www/letsens/backend
./vendor/bin/phpunit

# Jalankan TypeScript static check pada frontend
cd /var/www/letsens/frontend
npx tsc --noEmit
```

---

## 📄 Lisensi & Kontributor
- **Institusi**: Universitas Komputer Indonesia (UNIKOM)
- **Tim Pengembang**: Division IoT & AI Sanitation Engineering
- **Lisensi**: Proprietary / Hak Cipta Dilindungi Undang-Undang.
