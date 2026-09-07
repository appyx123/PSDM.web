# 🕵️ Laporan Investigasi: Menelusuri Gedung Rahasia "PSDM System"

> **Status Investigasi:** Selesai  
> **Lokasi Proyek:** `r:\PROJECT\PSDM Project\PSDM.web`  
> **Domain Publik Server:** `https://psdmperisai.online`  
> **Catatan Detektif:** Laporan ini ditulis dengan bahasa manusia sehari-hari tanpa jargon teknis rumit agar mudah dipahami oleh siapa saja.

---

## 🏛️ 1. Bahan Bangunan: Sebenarnya Ini Tempat Apa?

### Perumpamaan Tempat:
Bayangkan Anda sedang melangkah masuk ke **Gedung Kantor Manajemen Kedisiplinan & Pengembangan Anggota (HRD)** milik sebuah organisasi besar bernama **PERISAI**.

Tempat ini **bukan** toko online, bukan aplikasi kasir minimarket, dan bukan blog artikel biasa. Tempat ini adalah **Sistem Rapor & Tata Tertib Organisasi** yang bertugas untuk:
1. **Memantau Kedisiplinan Anggota:** Siapa yang rajin hadir rapat/kegiatan tepat waktu, siapa yang telat, dan siapa yang bolos (alpha).
2. **Sistem Poin (Pahala & Dosa Organisasi):** Setiap anggota dibekali modal awal **100 poin**. Jika berprestasi (juara lomba, pemateri), poin bertambah. Jika melanggar aturan (terlambat, baju tidak rapi/pelanggaran atribut, gagal proker), poin akan disunat.
3. **Surat Peringatan (SP):** Jika poin anggota merosot drastis sampai batas bahaya, sistem ini secara otomatis atau lewat admin akan menerbitkan SP 1, SP 2, hingga program pembinaan khusus.
4. **Meja Perizinan & Klaim:** Anggota bisa mengajukan izin tidak hadir (sakit/darurat) lengkap dengan bukti surat dokter atau dokumen pendukung.

### Pondasi Utama Bangunannya:
Tanpa istilah yang bikin pusing, gedung ini didirikan menggunakan 3 bahan utama:
* **Rangka Bangunan (Next.js / React):** Kerangka beton modern yang membuat perpindahan antar-ruangan terasa sangat mulus, cepat, dan tidak perlu reload halaman dari nol.
* **Cat Dinding & Tata Ruang (Tailwind CSS):** Desain interior bernuansa biru dongker (indigo) yang elegan, rapi, dan responsif (nyaman dilihat di layar laptop maupun layar HP).
* **Bahasa Pengikat Semen (TypeScript):** Aturan penulisan kode yang ketat dan teratur, menjamin setiap saklar dan pintu terpasang di tempat yang pas tanpa konsleting.

---

## 📦 2. Isi Gudang: Apakah Ada Penyimpanan & Apa Isinya?

### Gudang Penyimpanan (Database):
**Ya, tempat ini punya gudang penyimpanan aktif!**  
Gudangnya berbentuk brankas lokal bernama `dev.db` (menggunakan teknologi SQLite) yang dikelola oleh juru catat otomatis (Prisma).

Setelah detektif membongkar arsip di dalam gudang, berikut rincian catatan yang tersimpan:

| Jenis Dokumen di Gudang | Jumlah Catatan | Keterangan Garis Besar |
| :--- | :---: | :--- |
| **Buku Akun (Users)** | **60 Orang** | Ada 2 pimpinan pemegang kunci utama (Super Admin atas nama *Muhammad Rafli* & Admin atas nama *Wa Ode Aqilah*) serta 58 akun pengurus lainnya. |
| **Profil Anggota (Members)** | **57 Anggota** | Berisi nama lengkap, ID Pengurus (kode PRN seperti `PRN0252`), departemen (Humas, Ristek, Kompres, Media, Trisula, Penalaran, PSDM), fakultas, prodi, nomor WhatsApp, hingga akun Instagram. |
| **Buku Aturan Poin** | **25 Aturan** | Daftar nilai pahala dan denda. Contoh: Juara Internasional (+75 poin), Juara PIMNAS (+50 poin), Mentor Internal (+15 poin), Pelanggaran Atribut (-6 poin), Gagal Target Proker (-25 poin). |
| **Agenda Kegiatan (Activities)** | **3 Kegiatan** | Acara yang tercatat di papan agenda, misalnya *Rapat FCP* dan *Scholarship Talk*. |
| **Lembar Presensi & Kehadiran** | Tersimpan | Rekam jejak siapa saja yang hadir tepat waktu, datang terlambat, atau tidak hadir. |
| **Berkas Pengajuan Izin** | Tersimpan | Surat izin sakit atau izin keperluan kampus yang diajukan oleh pengurus beserta status verifikasinya (disetujui/ditolak). |
| **Pengaturan Khusus Sistem** | Aktif | Nama sistem terdaftar sebagai `"PSDM"`, logo aktif, aturan pengali sanksi alpha (pinalti x2), dan pembagian penanggung jawab (PJ) per departemen. |

---

## 🏷️ 3. Papan Nama: Mau Ganti Tulisan & Gambar di Depan?

Jika Anda ingin mengganti tulisan sambutan, judul sistem, atau logo di pintu gerbang utama, ini peta file yang harus Anda tuju:

### 1. Pintu Masuk / Halaman Login:
* 📁 **File:** `app/login/page.tsx`
  * Di file ini ada tulisan judul:
    * `"PSDM System"` (Baris 67)
    * `"Sistem Manajemen Pengembangan SDM"` (Baris 68)
    * Tombol tab `"🎓 Pengurus"` dan `"🔐 Admin"` (Baris 84 & 95)
  * Di sini juga terdapat ikon perisai putih berlatar biru yang menjadi logo gerbang depan.

### 2. Label Pintu di Tab Browser (Title & Favicon):
* 📁 **File:** `app/layout.tsx`
  * Di bagian `metadata` (Baris 10), Anda bisa mengganti:
    * `title: 'PSDM System'` ➡️ Judul yang tertera di tab atas browser Anda.
    * `description: 'Management System for PSDM'` ➡️ Keterangan ringkas situs.
* 📁 **Folder Gambar / Logo:** `public/`
  * File gambar logo tab seperti `icon.svg`, `icon-light-32x32.png`, dan `apple-icon.png`. Ganti gambar ini jika ingin mengubah lambang di tab browser.

### 3. Papan Nama di Ruang Kerja Bagian Dalam (Dashboard Sidebar):
* Menariknya, tulisan nama aplikasi di pojok kiri atas saat sudah login **bisa diganti langsung dari dalam web** tanpa menyentuh kode!
* Cukup login sebagai Admin ➡️ buka menu **Settings (Pengaturan)** ➡️ ubah kolom **Application Name** dan unggah **App Logo**. Nilai ini tersimpan otomatis di gudang database.

---

## ⚡ 4. Menyalakan Saklar: Cara Menghidupkan Tempat Ini di Laptop

Untuk menghidupkan aliran listrik dan melihat sistem ini beroperasi secara nyata di layar laptop Anda sekarang, ikuti langkah super mudah ini:

### Langkah 1: Buka Terminal
Buka jendela **PowerShell** atau **Command Prompt** (Terminal di VS Code / Antigravity) yang sedang berada di folder proyek:
```text
r:\PROJECT\PSDM Project\PSDM.web
```

### Langkah 2: Tekan Saklar Utama
Ketik perintah berikut lalu tekan **Enter**:
```bash
npm run dev
```
*(Sistem akan mulai memanaskan mesin Next.js selama beberapa detik hingga muncul tulisan `Ready in ... ms` atau `http://localhost:3000`)*.

### Langkah 3: Masuk Melalui Pintu Depan
Buka peramban web kesayangan Anda (Google Chrome, Microsoft Edge, atau Mozilla Firefox), lalu ketik alamat ini di address bar:
```text
http://localhost:3000
```

> 💡 **Tips Tambahan:**
> Jika Anda diarahkan ke gerbang login (`http://localhost:3000/login`):
> * Pilihan **Admin:** Masuk dengan email admin yang terdaftar di gudang (contoh: `waodeaqilah@gmail.com` atau `muhammadrafli@gmail.com`).
> * Pilihan **Pengurus:** Masuk menggunakan nomor induk PRN (contoh: `PRN0271`, `PRN0276`, dsb.).

---

## 📝 Kesimpulan Akhir Sang Detektif
Bangunan ini adalah **Markas Digital Tata Kelola & Kedisiplinan SDM** yang sudah dibangun dengan sangat rapi, kokoh, dan siap pakai. Sistem perizinan, presensi, pembagian rapor poin, hingga brankas datanya sudah terisi dengan data nyata organisasi kepengurusan.
