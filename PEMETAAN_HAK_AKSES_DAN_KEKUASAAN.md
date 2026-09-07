# 📜 Laporan Audit: Pemetaan Hak Akses & Pembagian Kekuasaan Sistem PSDM

> **Status Sistem:** Semua celah keamanan telah ditambal (Pasca Penertiban & Penataan Menu Baru)  
> **Tujuan Dokumen:** Rujukan transparan pemetaan hak akses (*Role-Based Access Control* / RBAC) untuk penyusunan PRD dan panduan operasional organisasi.

---

## 🔑 1. Tingkatan Pemegang Kunci Resmi

Di dalam gedung sistem PSDM ini, pembagian kekuasaan dibagi secara tegas menjadi **3 tingkatan peran**:

```
                      [ 👑 SUPER ADMIN ]
                   (Pimpinan Tertinggi / Kunci Master)
                                │
                                ▼
                         [ 🔐 ADMIN ]
                   (Pengawas Lapangan / Kunci Ruangan)
                                │
                                ▼
                        [ 🎓 PENGURUS ]
                 (Anggota Organisasi / Kartu Identitas Mandiri)
```

> **Catatan Struktur Trisula & Kadep:**  
> Jabatan struktural organisasi seperti *Ketua Umum, Sekretaris Umum, Bendahara Umum (Trisula)* serta *Kepala Departemen (Kadep)* dicatat dalam data keanggotaan, namun secara hak akses akun digital mereka memegang kartu **Pengurus** agar tata kelola evaluasi tetap dipegang secara independen oleh Tim PSDM.

---

## 📊 2. Matriks Wewenang & Batasan (Tabel Perbandingan)

* **R/W** : **Full Access** (Bisa Melihat, Mengakses, dan Mengubah/Mengeksekusi)
* **R** : **Read-Only** (Hanya Memantau / Melihat Kaca Pameran)
* **W** : **Action Only** (Bisa mengajukan formulir permohonan mandiri)
* **X** : **Dilarang Total** (Pintu dikunci di UI dan diblokir status 401/403 oleh API & *Middleware*)

| Fitur / Modul Sistem | Super Admin (👑) | Admin (🔐) | Pengurus (🎓) | Keterangan & Proteksi Sistem |
| :--- | :---: | :---: | :---: | :--- |
| **Dashboard Statistik Organisasi** | **R** | **R** | **X** | Pengurus dialihkan khusus ke Dashboard Pribadi |
| **Manajemen SDM (Buku Anggota Master)** | **R/W** | **R/W\*** | **X** | \*Admin kelola data anggota, tapi **dilarang** ubah role pengguna |
| **Promosi / Mutasi Role Akun** | **R/W** | **X** | **X** | Mengangkat Admin / Super Admin eksklusif Super Admin |
| **Imunitas Akun Super Admin** | **R/W\*** | **X** | **X** | \*Super Admin kebal dari sentuhan atau kudeta Admin biasa |
| **Kelola Struktur Departemen** | **R/W** | **X** | **X** | Tambah & hapus departemen via `/api/admin/departments` |
| **Pemetaan Tugas Wilayah (PJ Mapping)** | **R/W** | **R** | **X** | Menugaskan admin memegang departemen binaan |
| **Agenda Kegiatan (Buat/Edit/Hapus)** | **R/W** | **R/W** | **R\*** | \*Pengurus hanya membaca jadwal acara di profil pribadinya |
| **Pencatatan Presensi & Absensi** | **R/W** | **R/W** | **X** | Pengurus diblokir keras mengubah absensi di server |
| **Verifikasi Berkas: Loket Perizinan** | **R/W** | **R/W\*** | **X** | \*Admin dibatasi otomatis oleh Departemen PJ binaannya |
| **Verifikasi Berkas: Loket Klaim Prestasi**| **R/W** | **R/W\*** | **X** | \*Admin dibatasi otomatis oleh Departemen PJ binaannya |
| **Pembatalan Izin yang Disetujui** | **R/W** | **R/W** | **X** | Reset kehadiran dan penetapan sanksi jika izin batal |
| **Pusat Pengajuan Mandiri (Izin & Klaim)** | **R/W** | **R/W** | **R/W** | Loket mandiri pengurus unggah bukti izin sakit & piagam |
| **Input Poin Manual (Reward / Denda)** | **R/W** | **R/W** | **X** | Meja kasir poin manual tertutup rapat dari pengurus |
| **Hapus Riwayat Mutasi Poin Manual** | **R/W** | **R/W** | **X** | Pembatalan log mutasi hanya oleh staf pengelola |
| **Tata Kelola Sanksi (EWS - Terbitkan SP)** | **R/W** | **X** | **X** | Penerbitan SP digembok khusus Super Admin di middleware |
| **Program Pembinaan (Treatment Poin)** | **R/W** | **X** | **X** | Program penebusan poin anggota bermasalah |
| **Laporan, Analisis & Rekapitulasi** | **R/W** | **R/W** | **X** | Unduh laporan PDF & Excel khusus Admin & Super Admin |
| **Pengaturan Sistem (Rumus & Multiplier)**| **R/W** | **R** | **X** | Admin mode *Read-Only*; tombol Simpan dikunci |
| **Identitas Web (Nama & Logo)** | **R/W** | **X** | **X** | Penggantian nama dan logo website (Supabase Storage) |
| **Profil Akun & Ganti Kata Sandi** | **R/W** | **R/W** | **R/W** | Masing-masing akun mengelola kredensialnya sendiri |

---

## 👑 3. Daftar Rinci Wewenang Super Admin

1. **Pemegang Otoritas Role Pengguna (Kekuasaan Eksekutif):**
   * Menaikkan Pengurus menjadi Admin.
   * Mengangkat Admin menjadi Super Admin.
   * Menurunkan jabatan Admin menjadi Pengurus.
2. **Kekebalan Mutlak (Anti-Coup Protection):**
   * Akun Super Admin tidak bisa diedit, diganti sandinya, atau dihapus oleh siapapun kecuali oleh pemilik akun itu sendiri saat login.
   * Sistem mencegah Super Admin menurunkan jabatannya sendiri (*self-lockout protection*).
3. **Kekuasaan Tata Ruang Departemen:**
   * Membuka unit departemen baru dan menutup departemen yang sudah kosong.
4. **Distribusi Kekuasaan (PJ Mapping):**
   * Menentukan Admin mana yang memegang verifikasi Departemen apa.
5. **Kekuasaan Sanksi Tertinggi (Yudikatif - EWS):**
   * Menerbitkan Surat Peringatan (SP1, SP2, SP3).
   * Memasukkan anggota ke program *treatment* pemulihan poin.
   * Mengampuni dan membatalkan status sanksi SP.
6. **Kekuasaan Pembuat Aturan (Legislatif):**
   * Mengubah rumus nilai poin presensi, penalti alpha, ambang SP, dan kategori penghargaan.
   * Mengganti nama aplikasi serta mengunggah logo resmi sistem.
7. **Verifikasi Bebas Lintas Wilayah:**
   * Memeriksa dan menyetujui izin serta klaim dari seluruh departemen tanpa terhalang filter PJ.

---

## 🔐 4. Daftar Rinci Wewenang Admin

1. **Operasional Harian Kegiatan:**
   * Menjadwalkan agenda baru dan mengisi absensi kehadiran anggota.
2. **Operasional Data Pengurus:**
   * Menambah anggota baru satu per satu atau impor borongan via file Excel (.xlsx).
   * Ekspor buku anggota ke Excel dan CSV.
3. **Verifikasi Berkas Wilayah Binaannya:**
   * Menyetujui atau menolak perizinan sakit/mendesak dari departemen PJ-nya.
   * Menyetujui atau menolak klaim piagam prestasi anggota departemen PJ-nya.
4. **Pemberian Poin & Denda Lapangan:**
   * Menambahkan reward atau punishment poin manual sesuai kategori resmi.
5. **Akses Laporan:**
   * Memantau grafik kinerja dan mengunduh laporan PDF/Excel organisasi.
6. **Pintu Tertutup bagi Admin:**
   * ❌ Dilarang mengangkat/menurunkan role akun.
   * ❌ Dilarang mengubah sandi/menghapus Super Admin.
   * ❌ Dilarang menerbitkan Surat Peringatan (SP).
   * ❌ Dilarang mengubah pengaturan rumus sistem (hanya *Read-Only*).
   * ❌ Dilarang menambah/menghapus struktur departemen.

---

## 🎓 5. Daftar Rinci Batasan Pengurus

1. **Hak Akses Mandiri:**
   * Memantau saldo poin, rekam jejak presensi, dan status SP pribadi.
   * Mengajukan izin dan klaim prestasi lewat Pusat Pengajuan.
   * Mengganti password sendiri dan melengkapi biodata profil sendiri.
2. **Pintu yang Terkunci Rapat:**
   * 🚫 **Sidebar Pengelola:** Tidak ada akses ke panel manajemen.
   * 🚫 **Buku Anggota:** Tidak bisa melihat biodata atau kontak anggota lain.
   * 🚫 **Absensi:** Dilarang keras mengubah kehadiran diri sendiri (`403 Forbidden`).
   * 🚫 **Poin:** Dilarang keras menambah poin sendiri (`403 Forbidden`).
   * 🚫 **Verifikasi:** Tidak bisa memverifikasi pengajuan apapun (`403 Forbidden`).
   * 🚫 **Pos Satpam Edge:** Seluruh rute manajemen diproteksi langsung di gerbang depan oleh `middleware.ts`.
