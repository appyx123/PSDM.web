# 🚀 Panduan Deploy & Update Server PSDM

Untuk memperbarui aplikasi di server dengan kode terbaru dari GitHub, ikuti langkah-langkah ini:

---

## 🔄 Langkah Update di Server

### 1. Masuk ke folder proyek
```bash
cd ~/psdm.web
```

### 2. Backup database dulu (WAJIB sebelum update apapun)
```bash
cp /mnt/data/psdm-db/dev.db /mnt/data/psdm-db/dev.db.backup-$(date +%Y%m%d-%H%M)
```

> ⚠️ Jangan skip langkah ini. Jika terjadi masalah, kamu bisa restore dengan:
> ```bash
> cp /mnt/data/psdm-db/dev.db.backup-TANGGAL /mnt/data/psdm-db/dev.db
> ```

### 3. Hentikan sementara aplikasi
```bash
pm2 stop psdm
```

### 4. Tarik kode terbaru dari GitHub
```bash
git pull origin main
```

> Jika ada konflik, jalankan `git stash` lalu `git pull` ulang.  
> Jangan gunakan `git reset --hard` sembarangan karena bisa menghapus file lokal penting.

### 5. Install dependensi (jika ada perubahan `package.json`)
```bash
npm install
```

### 6. ⚠️ Cek apakah ada perubahan schema Prisma
```bash
git diff HEAD~1 HEAD -- prisma/schema.prisma
```

- Jika ada output → lanjut ke langkah 7
- Jika tidak ada output → lewati ke langkah 9

### 7. Generate Prisma client
```bash
npx prisma generate
```

### 8. Apply migrasi database
```bash
npx prisma migrate deploy
```

> ⚠️ **PENTING — Baca sebelum lanjut:**
>
> Jika muncul pesan `No pending migrations to apply` padahal schema berubah, berarti **migration file belum dibuat oleh developer**.  
> Jangan jalankan `prisma db push` atau `prisma migrate dev` di production — **hubungi developer** untuk membuat migration yang benar terlebih dahulu.
>
> **Tanda bahaya yang harus diwaspadai:**
> | Pesan | Artinya | Yang harus dilakukan |
> |---|---|---|
> | `Drift detected` | Schema tidak sinkron dengan migration history | Hubungi developer |
> | `Do you want to reset the database? All data will be lost` | Database akan dihapus | **Jawab NO**, hubungi developer |
>
> **Penyebab:** developer mengubah `prisma/schema.prisma` tapi lupa menjalankan `npx prisma migrate dev` dan meng-commit file migration sebelum push ke GitHub.

### 9. Build ulang Next.js
```bash
npm run build
```

### 10. Restart aplikasi
```bash
pm2 restart psdm
```

### 11. Cek log untuk memastikan tidak error
```bash
pm2 logs psdm --lines 20
```

---

## 📋 Kewajiban Developer Saat Mengubah Schema Prisma

Setiap kali mengubah `prisma/schema.prisma`, developer **wajib** menjalankan ini sebelum push ke GitHub:

```bash
# 1. Buat migration file
npx prisma migrate dev --name deskripsi_perubahan

# 2. Commit migration file bersama perubahan schema
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "feat: deskripsi perubahan schema"
git push
```

> ❌ Jika tidak dilakukan, server akan mengalami **drift** (schema tidak sinkron) dan **berisiko kehilangan data** saat deploy.

---

## 🔁 Restore Database (Jika Terjadi Masalah)

```bash
# Lihat daftar backup yang tersedia
ls -lh /mnt/data/psdm-db/dev.db.backup-*

# Restore backup tertentu (ganti TANGGAL sesuai nama file)
pm2 stop psdm
cp /mnt/data/psdm-db/dev.db.backup-TANGGAL /mnt/data/psdm-db/dev.db
pm2 restart psdm
```

---

## 📝 Catatan Tambahan

- File yang **tidak** terpengaruh `git pull`: `.env`, `public/uploads/`, `dev.db`
- Database disimpan di luar folder proyek: `/mnt/data/psdm-db/dev.db`
- Aplikasi berjalan di: **https://psdmperisai.online**

---

Setelah semua langkah selesai, buka **https://psdmperisai.online** dan pastikan semua fitur berjalan normal.