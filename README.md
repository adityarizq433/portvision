# Portvision

Aplikasi web untuk memantau status port jaringan secara real-time, dibangun dengan Laravel, Inertia.js, React, dan terintegrasi dengan LibreNMS.

---

## Kebutuhan Sistem

Pastikan semua software berikut sudah terinstall sebelum memulai:

| Software | Versi Minimum |
|----------|---------------|
| Docker | 24.x |
| Docker Compose | 2.x |
| Git | - |

> Tidak perlu install PHP, Node.js, atau Composer di mesin lokal — semua sudah berjalan di dalam container Docker.

---

## Persiapan Sebelum Menjalankan

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

## Konfigurasi LibreNMS

Setelah aplikasi berjalan, hubungkan ke LibreNMS melalui halaman **Settings** di dalam aplikasi web. Masukkan:

- **URL LibreNMS** — contoh: `http://192.168.1.10`
- **API Token** — buat di LibreNMS: *Settings → API → API Settings → Create Token*

Setelah tersimpan, jalankan sinkronisasi pertama:

```bash
docker compose exec app php artisan portvision:sync-devices
```

---

## Mengakses Aplikasi

Buka browser dan akses:

```
http://localhost:8000
```

---

## Menghentikan Aplikasi

```bash
docker compose down
```

Jika ingin menghapus data database juga (reset total):

```bash
docker compose down -v
```

---

## Perintah Berguna

| Perintah | Fungsi |
|----------|--------|
| `docker compose logs -f app` | Lihat log aplikasi secara live |
| `docker compose logs -f poller` | Lihat log polling port |
| `docker compose exec app php artisan migrate` | Jalankan migrasi database |
| `docker compose exec app php artisan portvision:sync-devices` | Sinkronisasi device dari LibreNMS |
| `docker compose exec app php artisan tinker` | Masuk ke console PHP |
| `docker compose restart app` | Restart container app |

---

## Mengukur Delay Deteksi Port

Script `measure-delay.ps1` digunakan untuk mengukur seberapa cepat aplikasi mendeteksi perubahan status port (cabut/colok kabel).

Jalankan di PowerShell:

```powershell
.\measure-delay.ps1
```

Cabut atau colok kabel jaringan, lalu perhatikan selisih waktu antara kejadian fisik dan baris `<<< BERUBAH` yang muncul di terminal.
