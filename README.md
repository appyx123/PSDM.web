# PSDM.web

Sistem Manajemen Pengembangan Sumber Daya Manusia (PSDM) — Dashboard berbasis web untuk mengelola anggota, kegiatan, presensi, dan poin evaluasi organisasi.

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Database**: SQLite via Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: JWT (HTTP-only Cookie) + bcryptjs

## Fitur Utama

- 📋 **Manajemen Anggota** — CRUD data pengurus/anggota dengan sistem PRN
- 📅 **Manajemen Kegiatan** — Jadwal kegiatan dan pencatatan presensi
- ⭐ **Evaluasi & Apresiasi** — Mutasi poin manual (Reward & Punishment)
- 📊 **Governance Dashboard** — Monitoring poin, status, dan EWS anggota
- ⚙️ **Pengaturan** — Kategori poin dinamis dan manajemen akun pengurus
- 🔐 **Autentikasi Dual-Role** — Admin (email/password) & Pengurus (PRN/password)

## Setup

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push
npx prisma generate

# Seed admin pertama
npx tsx prisma/seed.ts

# Jalankan dev server
npm run dev
```

## Akun Default

| Role  | Kredensial                        |
|-------|-----------------------------------|
| Admin | Email: `admin@psdm.id` / PW: `admin123` |

> ⚠️ Segera ubah password default setelah pertama kali login.

## Environment

Buat file `.env` di root project:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="ganti-dengan-secret-yang-kuat"
```
