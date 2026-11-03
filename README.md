# Portvision

Aplikasi web untuk memantau status port jaringan secara real-time, dibangun dengan Laravel, Inertia.js, React, dan terintegrasi dengan LibreNMS.

Ada dua mode menjalankan proyek ini:

- **Mode Production / Backend** — pakai Docker, untuk server utama atau backend developer
- **Mode Frontend Dev** — pakai Node.js lokal, untuk frontend developer yang fokus ke UI/React

---

## Mode 1 — Docker (Backend / Production)

### Kebutuhan Sistem

| Software | Versi Minimum |
|----------|---------------|
| Docker | 24.x |
| Docker Compose | 2.x |
| Git | - |

> Tidak perlu install PHP, Node.js, atau Composer di mesin lokal — semua sudah berjalan di dalam container Docker.

---

## Persiapan Sebelum Menjalankan (Mode Docker)

### 1. Clone repository

```bash
git clone <url-repo-ini>
cd portvision
```

### 2. Buat file `.env`

Salin file contoh environment:

```bash
cp .env.example .env
```

Lalu buka `.env` dan sesuaikan nilai-nilai berikut:

```
APP_NAME=Portvision
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=portvision
DB_USERNAME=portvision
DB_PASSWORD=secret

DB_ROOT_PASSWORD=secret

REDIS_HOST=redis
REDIS_PORT=6379

QUEUE_CONNECTION=redis
CACHE_STORE=redis
```

> **Catatan:** Nilai `DB_HOST=db` dan `REDIS_HOST=redis` adalah nama service di Docker Compose, bukan `localhost`. Jangan diubah kecuali kamu tahu yang kamu lakukan.

### 3. Build dan jalankan container

```bash
docker compose up -d --build
```

Proses ini akan men-download image dan membangun container untuk pertama kali. Tunggu hingga selesai (bisa beberapa menit).

Verifikasi semua container berjalan:

```bash
docker compose ps
```

Semua service harus berstatus `running` atau `healthy`: `app`, `nginx`, `db`, `redis`, `queue`, `scheduler`, `poller`.

### 4. Generate app key

```bash
docker compose exec app php artisan key:generate
```

### 5. Jalankan migrasi database

```bash
docker compose exec app php artisan migrate
```

---

## Mode 2 — Frontend Dev (untuk Frontend Developer)

Gunakan mode ini jika kamu hanya mengerjakan bagian UI/React dan tidak perlu menjalankan backend sendiri. Backend tetap berjalan di server utama (PC server kantor).

### Kebutuhan Sistem

| Software | Versi Minimum |
|----------|---------------|
| Node.js | 18.x |
| npm | 9.x |
| Git | - |

> Tidak perlu Docker, PHP, atau Composer.

### Langkah-langkah

#### 1. Clone repository

```bash
git clone <url-repo-ini>
cd portvision
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Buat file `.env`

```bash
cp .env.example .env
```

Ubah `APP_URL` agar mengarah ke server backend yang sudah berjalan:

```
APP_URL=http://<ip-pc-server>:8000
VITE_APP_NAME=Portvision
```

> Tanya ke backend developer untuk mendapatkan IP server yang benar.

#### 4. Jalankan Vite dev server

```bash
npm run dev
```

#### 5. Buka di browser

```
http://localhost:5173
```

Perubahan di file React (`resources/js/`) akan langsung terlihat di browser tanpa perlu refresh manual (Hot Module Replacement).

### Catatan Penting untuk Frontend Developer

- Semua halaman React ada di folder `resources/js/Pages/`
- Komponen reusable ada di `resources/js/Components/`
- Stack yang dipakai: **React 18 + TypeScript + Tailwind CSS + Inertia.js**
- Jangan ubah file di luar folder `resources/js/` kecuali ada koordinasi dengan backend

---

## Konfigurasi LibreNMS (khusus Backend / Docker)

Setelah aplikasi berjalan, hubungkan ke LibreNMS melalui halaman **Settings** di dalam aplikasi web. Masukkan:

- **URL LibreNMS** — contoh: `http://192.168.1.10`
- **API Token** — buat di LibreNMS: *Settings → API → API Settings → Create Token*

Setelah tersimpan, jalankan sinkronisasi pertama:

```bash
docker compose exec app php artisan portvision:sync-devices
```

---

## Mengakses Aplikasi

| Mode | URL |
|------|-----|
| Docker (backend/production) | `http://localhost:8000` |
| Frontend dev (Vite) | `http://localhost:5173` |

---

## Menghentikan Aplikasi (Mode Docker)

```bash
docker compose down
```

Jika ingin menghapus data database juga (reset total):

```bash
docker compose down -v
```

---

## Perintah Berguna

### Docker

| Perintah | Fungsi |
|----------|--------|
| `docker compose logs -f app` | Lihat log aplikasi secara live |
| `docker compose logs -f poller` | Lihat log polling port |
| `docker compose exec app php artisan migrate` | Jalankan migrasi database |
| `docker compose exec app php artisan portvision:sync-devices` | Sinkronisasi device dari LibreNMS |
| `docker compose exec app php artisan tinker` | Masuk ke console PHP |
| `docker compose restart app` | Restart container app |

### Frontend Dev

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan Vite dev server |
| `npm run build` | Build aset untuk production |

---

## Mengukur Delay Deteksi Port

Script `measure-delay.ps1` digunakan untuk mengukur seberapa cepat aplikasi mendeteksi perubahan status port (cabut/colok kabel). Jalankan di PowerShell pada PC server:

```powershell
.\measure-delay.ps1
```

Cabut atau colok kabel jaringan, lalu perhatikan selisih waktu antara kejadian fisik dan baris `<<< BERUBAH` yang muncul di terminal.
