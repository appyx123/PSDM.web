# 📜 Laporan Detektif: Pemetaan Hak Akses & Pembagian Kekuasaan Sistem PSDM

> **Tujuan Dokumen:** Bahan rujukan penyusunan aturan pembagian wewenang (*Product Requirement Document* / PRD) agar tidak terjadi tumpang tindih kekuasaan atau kudeta sistem.  
> **Gaya Bahasa:** Bahasa manusia sehari-hari (analogi kantor & gedung), bebas dari istilah teknis rumit.

---

## 🔑 1. Daftar Pemegang Kunci (Tingkatan Jabatan)

Di dalam gedung sistem PSDM ini, terdapat **3 tingkatan pemegang kunci** resmi yang diakui:

```
                      [ 👑 SUPER ADMIN ]
                   (Pimpinan Tertinggi / Kunci Master)
                               │
                               ▼
                        [ 🔐 ADMIN ]
                   (Staf Pengelola / Kunci Ruangan)
                               │
                               ▼
                       [ 🎓 PENGURUS ]
                (Anggota Biasa / Kartu Identitas Tamu)
```

> **Catatan Struktur:**  
> Jabatan khusus seperti *Ketua Umum, Sekretaris Umum, Bendahara Umum (Trisula)* serta *Kepala Departemen (Kadep)* dicatat pada profil keanggotaan, namun secara sistem hak akses digitalnya tetap memegang kartu level **Pengurus**.

---

## 🗺️ 2. Peta Kekuasaan (Apa yang Bisa Dilihat & Dilakukan)

### A. 👑 Super Admin (Pemegang Kunci Master)
Ibarat **Direktur Utama / Ketua Majelis Tinggi** yang memegang kunci induk seluruh ruangan di gedung ini.

* **Ruangan yang Bisa Dimasuki:**
  * **Semua Ruangan Tanpa Batas:** Dashboard Statistik, Buku Anggota, Agenda Kegiatan, Evaluasi & Apresiasi Poin, Meja Perizinan, Meja Verifikasi Klaim, Lemari Laporan Rekap, Ruang Tata Kelola (SP), Pengaturan Sistem, dan Ruang Khusus Kelola Admin & Departemen.
* **Tombol yang Bisa Ditekan (Aksi):**
  1. **Mengangkat & Memecat Admin:** Membuat akun admin baru, memilih tingkatannya, atau menghapus admin lama.
  2. **Menambah & Menghapus Departemen:** Membuka departemen baru (misal: Kewirausahaan) atau menutup departemen yang sudah kosong.
  3. **Membagi Wilayah Kerja (PJ Mapping):** Menentukan Admin A memegang kendali atas Departemen Humas, Admin B memegang PSDM, dst.
  4. **Menjatuhkan Vonis Tertinggi (Surat Peringatan / SP):** Menerbitkan SP1, SP2, memasukkan anggota ke program pembinaan (*treatment*), atau membatalkan SP anggota yang sudah bertobat.
  5. **Mengubah Aturan Main:** Mengganti nama aplikasi, mengganti logo, mengubah rumus pengali denda bolos (*alpha multiplier*), dan mengubah patokan poin.

---

### B. 🔐 Admin (Staf Pengelola Harian)
Ibarat **Petugas Piket & Pengawas Lapangan** yang bertugas menjaga ketertiban operasional harian.

* **Ruangan yang Bisa Dimasuki:**
  * Ruang Dashboard, Buku Anggota, Agenda Kegiatan, Evaluasi Poin, Meja Perizinan, Meja Verifikasi Klaim, dan Lemari Laporan.
* **Ruangan yang Dilarang:**
  * **Ruang Tata Kelola (SP):** Ditutup dari pandangan (pintu disembunyikan).
  * **Ruang Kelola Admin & Departemen:** Ditutup dari pandangan.
  * **Ruang Pengaturan Sistem:** Hanya bisa melihat kaca pameran (*read-only*), tidak boleh menyentuh saklar pengaturan.
* **Tombol yang Bisa Ditekan (Aksi):**
  1. **Mengelola Data Pengurus:** Menambah pengurus baru secara manual atau impor borongan lewat file Excel.
  2. **Membuat Agenda & Absensi:** Membuka jadwal rapat/acara baru dan mencatat siapa yang hadir tepat waktu, telat, atau izin.
  3. **Bagi-Bagi Poin & Denda Manual:** Memberi poin penghargaan jika ada yang berprestasi, atau memotong poin jika seragamnya melanggar aturan.
  4. **Menyetujui / Menolak Surat Izin:** Memeriksa surat izin sakit atau izin darurat pengurus.
  5. **Menyetujui / Menolak Klaim Prestasi:** Memeriksa berkas piagam lomba pengurus untuk mencairkan bonus poin.

---

### C. 🎓 Pengurus (Anggota Biasa)
Ibarat **Karyawan / Anggota Organisasi** yang datang ke kantor untuk bekerja dan memeriksa raport pribadinya sendiri.

* **Ruangan yang Bisa Dimasuki:**
  * Hanya **2 ruangan pribadi** khusus untuk dirinya sendiri:
    1. **Bilik Raport Pribadi (*Profil & Dashboard*):** Hanya bisa melihat sisa poin miliknya sendiri, rekam jejak kehadiran miliknya sendiri, riwayat perizinan miliknya, dan status sanksi miliknya.
    2. **Kotak Pengajuan Klaim (*Pelaporan Klaim*):** Meja untuk mengisi formulir klaim prestasi mandiri.
* **Ruangan yang Dilarang:**
  * Seluruh dasbor manajemen, daftar seluruh anggota organisasi, lemari laporan pengurus lain, dan meja verifikasi.
* **Tombol yang Bisa Ditekan (Aksi):**
  1. **Mengajukan Izin:** Mengisi formulir izin tidak hadir rapat disertai unggahan foto bukti surat dokter/kampus.
  2. **Mengajukan Klaim Poin:** Mengunggah foto sertifikat juara atau bukti kegiatan organisasi.
  3. **Mengganti Kata Sandi Pribadi:** Mengubah password login dirinya sendiri.
  4. **Memperbarui Biodata Mandiri:** Mengisi kota asal, nomor HP/WhatsApp, akun Instagram, dan foto profil sendiri.

---

## 🚨 3. Temuan Celah Keamanan (Pintu Belakang yang Terbuka)

Setelah detektif menyisir instalasi pipa dan jalur pintu rahasia di dalam kode, ditemukan **5 celah berbahaya** yang saat ini masih menganga:

### ⚠️ Celah 1: Jalur Siluman "Kudeta Super Admin"
* **Kondisi:** Di salah satu pintu perubahan akun pengguna, sistem mengizinkan Admin biasa untuk mengubah kata sandi akun mana saja.
* **Bahayanya:** Tidak ada pengecekan apakah target yang diubah adalah akun pimpinan tertinggi. Seorang Admin biasa yang nakal bisa mengirim perintah ganti password untuk akun Super Admin, lalu mengambil alih kunci utama gedung!

### ⚠️ Celah 2: Satpam Gerbang Depan Lupa Dibawa ke Internet
* **Kondisi:** Aturan penjaga gerbang utama (file bernama `proxy.ts`) dimasukkan ke dalam daftar file yang ditinggal di laptop lokal (`.gitignore`).
* **Bahayanya:** Saat web ini tayang di internet (Cloudflare), satpam gerbang depan ini **tidak bertugas**. Sistem sepenuhnya bergantung pada apakah pintu tiap ruangan di dalam dikunci atau tidak.

### ⚠️ Celah 3: Lemari Buku Poin Tidak Dikunci Sama Sekali
* **Kondisi:** Pintu tempat pencatatan poin manual dan penghapusan poin tidak memeriksa apakah orang yang mengetuk pintu adalah Admin atau bukan.
* **Bahayanya:** Siapa saja (bahkan pengurus biasa atau orang luar yang tahu alamat pintunya) bisa mengirim formulir untuk menambah 1.000 poin ke akunnya sendiri atau menghapus catatan pelanggaran poin miliknya.

### ⚠️ Celah 4: Pengurus Bisa Mengubah Absensi Sendiri Menjadi "Hadir Tepat Waktu"
* **Kondisi:** Pada pintu pencatatan presensi agenda kegiatan, kode sistem secara terang-terangan menuliskan izin untuk peran "PENGURUS".
* **Bahayanya:** Pengurus yang sedikit paham internet bisa mengirim perintah diam-diam untuk mencoret status "Alpha / Bolos" miliknya dan mengubahnya menjadi "Tepat Waktu".

### ⚠️ Celah 5: Pintu Ganda Verifikasi Klaim (Mengabaikan Surat Tugas PJ)
* **Kondisi:** Ada 2 pintu berbeda untuk menyetujui klaim prestasi pengurus. Pintu pertama memeriksa apakah Admin tersebut memang bertugas di departemen yang bersangkutan. Namun pintu kedua bisa dimasuki oleh Admin mana saja tanpa peduli departemen apa yang diklaim.
* **Bahayanya:** Pemetaan PJ Departemen yang sudah diatur dengan rapi oleh Super Admin bisa dilewati begitu saja.

---

## 🛠️ 4. Tiga Saran Penertiban untuk PRD (Bahasa Awam)

Agar pembagian wewenang menjadi adil, tidak tumpang tindih, dan sistem kebal dari "kudeta", ini 3 rekomendasi langkah pembenahan:

### 1. 🛡️ Pasang Kunci Ganda di Setiap Kamar (Jangan Hanya Andalkan Gerbang Depan)
* **Konsep:** Setiap ruangan yang berhubungan dengan uang/poin, pemecatan anggota, dan absensi harus punya gembok sendiri. 
* **Aturan:** Setiap kali ada berkas masuk, petugas kamar harus memeriksa identitas pengirim di tempat: *"Apakah kamu Admin? Mana kartu identitasmu?"*. Jika tidak ada kartu Admin, tolak detik itu juga.

### 2. 👑 Beri Kekebalan Penuh untuk Akun Super Admin
* **Konsep:** Pimpinan tertinggi tidak boleh bisa diutak-atik oleh bawahannya.
* **Aturan:** Buat larangan mutlak di kode: Admin biasa dilarang keras mengubah kata sandi, mengubah data, ataupun menghapus akun Super Admin. Kata sandi Super Admin hanya boleh diganti oleh dirinya sendiri saat sedang login.

### 3. 🎯 Satukan Pintu Masuk & Tegakkan Batas Wilayah PJ Departemen
* **Konsep:** Satu urusan, satu pintu resmi.
* **Aturan:** Hapus pintu verifikasi cadangan yang longgar. Tegakkan aturan ketat bahwa Admin PJ Humas **hanya berhak** menandatangani surat izin dan klaim dari anggota Humas. Jika ingin mengurusi departemen lain, harus meminjam persetujuan Super Admin.
