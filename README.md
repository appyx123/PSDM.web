Untuk memperbarui aplikasi di server dengan kode terbaru dari GitHub, ikuti langkah-langkah ini:

---

### 🔄 Langkah Update di Server

**1. Masuk ke folder proyek**
```bash
cd ~/psdm.web
```

**2. Hentikan sementara aplikasi (opsional, agar lebih bersih)**
```bash
pm2 stop psdm
```

**3. Tarik kode terbaru dari GitHub**
```bash
git pull origin main
```
> Jika ada konflik atau error, cukup hapus perubahan lokal dulu dengan `git stash` atau `git reset --hard origin/main`.

**4. Install dependensi (hanya jika ada tambahan)**
```bash
npm install
```
> Kalau tidak ada perubahan di `package.json`, langkah ini bisa dilewati.

**5. Generate Prisma client (jika ada perubahan schema)**
```bash
npx prisma generate
```

**6. Jalankan migrasi database (jika ada migrasi baru)**
```bash
npx prisma migrate deploy
```

**7. Build ulang Next.js**
```bash
npm run build
```

**8. Restart aplikasi**
```bash
pm2 restart psdm
```

**9. Cek log untuk memastikan tidak error**
```bash
pm2 logs psdm --lines 20
```

---

### 📝 Catatan Penting
- **Backup database** sebelum update jika kamu ragu:
  ```bash
  cp /mnt/data/psdm-db/dev.db /mnt/data/psdm-db/dev.db.backup-$(date +%Y%m%d-%H%M)
  ```
- File dan folder yang tidak di-track oleh Git (seperti `.env`, `public/uploads`, `dev.db`) tidak akan terpengaruh oleh `git pull`.

Setelah semua langkah selesai, buka `https://psdmperisai.online` dan pastikan fitur berjalan normal.