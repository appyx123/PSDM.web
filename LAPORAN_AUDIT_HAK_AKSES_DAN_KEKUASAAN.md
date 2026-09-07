# 🛡️ Laporan Audit Transparan: Batas Kekuasaan & Matriks Hak Akses Sistem PSDM

> **Status Audit:** Pasca Penambalan 5 Celah Keamanan & Penataan Ulang Arsitektur Rute  
> **Tanggal Audit:** 8 September 2026  
> **Ruang Lingkup Pemeriksaan:**  
> 1. Gerbang Keamanan Depan (*Edge Middleware* - `middleware.ts`)  
> 2. Seluruh Rute API Pintu Belakang (`app/api/**/route.ts`)  
> 3. Antarmuka Pengguna & Navigasi Bilah Samping (`components/**`, `app/page.tsx`)  
> 4. Validasi Tingkat Data & Kebijakan Imunitas Pengguna (`prisma/schema.prisma`, `lib/auth.ts`)

---

## 📊 1. Matriks Wewenang & Batasan (Tabel Perbandingan)

Keterangan Kode Hak Akses:
* **R/W** : **Full Access** (Bisa Mengakses, Melihat, Mengeksekusi, dan Mengubah data)
* **R** : **Read-Only** (Hanya bisa melihat/memantau data, tidak bisa mengubah atau menyimpan)
* **W** : **Write-Only / Action** (Hanya bisa mengajukan atau mengeksekusi aksi tertentu)
* **X** : **Dilarang Total** (Pintu dikunci di antarmuka dan diblokir status 401/403 oleh API & *Middleware*)

| Fitur / Modul Sistem | Super Admin (👑) | Admin (🔐) | Pengurus (🎓) | Catatan Pengamanan Teknis |
| :--- | :---: | :---: | :---: | :--- |
| **Dashboard Statistik Global** | **R** | **R** | **X** | Pengurus otomatis dialihkan ke Bilik Profil Pribadi |
| **Manajemen SDM (Buku Anggota Master)** | **R/W** | **R/W\*** | **X** | \*Admin bisa kelola data pengurus, tapi **dilarang** ubah role pengguna |
| **Promosi & Mutasi Role Pengguna** | **R/W** | **X** | **X** | Dropdown role di tabel hanya aktif untuk Super Admin; API mengunci peran |
| **Imunitas Akun Super Admin** | **R/W\*** | **X** | **X** | \*Super Admin hanya bisa diubah oleh dirinya sendiri; Admin diblokir di API |
| **Kelola Struktur Departemen Organisasi** | **R/W** | **X** | **X** | Tambah/Hapus departemen eksklusif Super Admin (`/api/admin/departments`) |
| **Pemetaan Wilayah Tugas (PJ Mapping)** | **R/W** | **R** | **X** | Admin hanya melihat wilayah binaannya; perubahan hanya dari Super Admin |
| **Agenda Kegiatan (Buat / Edit / Hapus)** | **R/W** | **R/W** | **R\*** | \*Pengurus hanya bisa melihat jadwal di riwayat kehadiran pribadinya |
| **Pencatatan Presensi & Absensi** | **R/W** | **R/W** | **X** | Izin PENGURUS telah dihapus total dari rute absensi (`attendance/route.ts`) |
| **Verifikasi Berkas: Loket Perizinan** | **R/W** | **R/W\*** | **X** | \*Admin terikat batasan PJ Departemen; Super Admin bebas lintas departemen |
| **Verifikasi Berkas: Loket Klaim Prestasi** | **R/W** | **R/W\*** | **X** | \*Admin terikat batasan PJ Departemen; Super Admin bebas lintas departemen |
| **Pembatalan Izin yang Disetujui** | **R/W** | **R/W** | **X** | Reset kehadiran dan penetapan status denda baru jika izin dibatalkan |
| **Pusat Pengajuan Mandiri (Izin & Klaim)** | **R/W** | **R/W** | **R/W** | Meja mandiri pengurus untuk unggah surat izin sakit & piagam prestasi |
| **Input Mutasi Poin Manual (Reward/Denda)** | **R/W** | **R/W** | **X** | Pengurus dilarang keras menyentuh kasir poin (`/api/point-logs`) |
| **Hapus Riwayat Mutasi Poin Manual** | **R/W** | **R/W** | **X** | Hanya Admin & Super Admin yang berhak membatalkan log poin manual |
| **Tata Kelola Sanksi (EWS - Terbitkan SP)** | **R/W** | **X** | **X** | Rute `/api/admin/sp` digembok khusus role `SUPER_ADMIN` oleh Middleware |
| **Program Pembinaan (Treatment Poin)** | **R/W** | **X** | **X** | Hak prerogatif Super Admin untuk menentukan masa pemulihan poin |
| **Laporan & Grafik Evaluasi Organisasi** | **R/W** | **R/W** | **X** | Ekspor rekap PDF & Excel hanya untuk staf pengelola (Admin & Super Admin) |
| **Konfigurasi Sistem (Matriks & Multiplier)** | **R/W** | **R** | **X** | Admin masuk mode *Read-Only* (Kaca Pameran); tombol Simpan dinonaktifkan |
| **Penggantian Identitas Web (Nama & Logo)** | **R/W** | **X** | **X** | Formulir dan upload logo Supabase Storage dikunci khusus Super Admin |
| **Kelola Profil & Ganti Kata Sandi Pribadi** | **R/W** | **R/W** | **R/W** | Masing-masing akun berhak mengubah password dan biodata dirinya sendiri |

---

## 👑 2. Daftar Rinci Wewenang Super Admin (Kunci Master Tertinggi)

Super Admin adalah pemegang otoritas absolut sistem. Berikut adalah **daftar hak eksklusif yang HANYA BISA DILAKUKAN oleh Super Admin** dan tertutup rapat dari siapapun:

1. **Promosi & Mutasi Kekuasaan (Role Management):**
   * Mengubah status pengguna dari `PENGURUS` menjadi `ADMIN`.
   * Mengangkat akun `ADMIN` menjadi `SUPER_ADMIN`.
   * Menurunkan jabatan `ADMIN` kembali menjadi `PENGURUS`.
   * Membuat akun Admin baru secara instan melalui sistem.

2. **Kekebalan Mutlak (Anti-Coup Protection):**
   * Akun Super Admin dilindungi oleh protokol imunitas di tingkat kode (`/api/users/[id]` dan `/api/admin/users`).
   * Tidak ada Admin biasa yang bisa menghapus, mengganti kata sandi, ataupun mengubah data akun milik Super Admin.
   * Super Admin tidak bisa secara sengaja atau tidak sengaja menurunkan jabatannya sendiri (*self-demotion protection*).

3. **Arsitektur Struktur Departemen:**
   * Menambahkan nama departemen baru ke dalam organisasi melalui antarmuka khusus (`/api/admin/departments`).
   * Menghapus departemen yang sudah tidak aktif (dilindungi validasi: departemen yang masih memiliki anggota tidak dapat dihapus sembarangan).

4. **Pembagian Wilayah Kerja Penanggung Jawab (PJ Mapping):**
   * Menentukan pemetaan resmi: Admin siapa yang bertanggung jawab atas Departemen apa (misal: Admin A memegang Humas, Admin B memegang PSDM).
   * Menentukan verifikator default untuk setiap loket perizinan dan klaim.

5. **Kekuasaan Yudikatif & Sanksi (Early Warning System / EWS):**
   * Menerbitkan Surat Peringatan resmi tingkat tertinggi (**SP 1**, **SP 2**, hingga **SP 3** / Rekomendasi Dikeluarkan).
   * Memasukkan anggota bermasalah ke dalam jalur pemulihan (*Treatment Program*) dengan target perolehan poin dan durasi hari yang ditentukan sendiri.
   * Memberikan rehabilitasi / pengampunan berupa pembatalan status SP bagi pengurus yang sudah menyelesaikan pembinaan.

6. **Kekuasaan Legislatif Konfigurasi Aturan Main:**
   * Mengubah matriks poin presensi dasar untuk status Tepat Waktu, Terlambat Sah, Izin Sakit, Terlambat Non-Sakti, Pulang Cepat, dan Alpha pada 3 ruang lingkup (Internal, Eksternal, Kepanitiaan).
   * Mengatur pengali sanksi (*Alpha Multiplier*) dan batas maksimal penalti.
   * Mengatur batas ambang skor (*Threshold*) penurunan SP.
   * Menambah dan menghapus kategori reward & punishment resmi.
   * Mengganti identitas website (Nama Aplikasi dan Logo resmi organisasi ke Supabase Storage).

7. **Akses Verifikasi Lintas Wilayah:**
   * Super Admin dapat menyetujui, menolak, atau membatalkan izin dan klaim dari **seluruh departemen tanpa batasan filter PJ**.

---

## 🔐 3. Daftar Rinci Wewenang Admin (Pengawas & Staf Operasional Harian)

Admin memegang kendali operasional harian organisasi agar roda kepengurusan berjalan tertib, dengan koridor kerja yang jelas:

### A. Wewenang Operasional yang Diberikan:
1. **Pencatatan Kehadiran & Agenda:**
   * Membuat agenda rapat, seminar, atau kegiatan baru.
   * Mengisi lembar presensi pengurus (menandai siapa yang Hadir, Terlambat Sah/Non-Sakti, Sakit, atau Alpha).
2. **Pengelolaan Buku Anggota:**
   * Menambahkan profil pengurus baru secara manual satu per satu.
   * Melakukan import borongan data ratusan pengurus via file template Excel (`.xlsx`).
   * Mengunduh rekapitulasi data anggota dalam format Excel dan CSV.
3. **Verifikasi Berkas Harian (Terikat PJ Mapping):**
   * Memeriksa dan menyetujui/menolak surat izin ketidakhadiran pengurus yang masuk di loket perizinan.
   * Memeriksa keabsahan berkas piagam penghargaan/lomba dan menyetujui pencairan poin prestasi.
   * Membatalkan persetujuan izin jika ditemukan bukti ketidaksesuaian di kemudian hari.
4. **Pemberian Poin Apresiasi & Sanksi Lapangan:**
   * Memberikan poin tambahan langsung (*Reward*) jika ada pengurus yang bertugas luar biasa.
   * Memotong poin langsung (*Punishment*) jika ada pelanggaran tata tertib harian (misal: atribut seragam tidak lengkap).
5. **Akses Pemantauan Laporan:**
   * Melihat rangking poin pengurus, grafik tren partisipasi, dan statistik kehadiran.
   * Mencetak dan mengekspor laporan kinerja organisasi ke dokumen PDF dan lembar kerja Excel.

### B. Batasan Ketat & Pintu yang Ditutup bagi Admin:
1. **Dilarang Menyentuh Role Pengguna:** Admin **tidak bisa** menaikkan jabatan pengurus menjadi Admin, dan **tidak bisa** menyentuh akun Super Admin.
2. **Dilarang Menerbitkan SP:** Menu Tata Kelola (EWS) ditutup dari bilah samping Admin, dan rute API penerbitan SP akan membalas dengan error `403 Forbidden: Super Admin only`.
3. **Dilarang Menembus Wilayah PJ Lain:** Admin Departemen A tidak akan melihat dan tidak diizinkan menyetujui berkas perizinan dari anggota Departemen B (dicegat oleh validasi server).
4. **Dilarang Mengubah Aturan Sistem:** Halaman Pengaturan bagi Admin hanya berstatus *Read-Only* (Kaca Pameran). Tombol Simpan, formulir upload logo, dan saklar pengali nilai dimatikan total.
5. **Dilarang Mengutak-atik Departemen:** Tidak bisa menambah atau menghapus unit departemen organisasi.

---

## 🎓 4. Daftar Rinci Batasan Pengurus (Anggota Biasa)

Pengurus adalah pengguna akhir yang menikmati transparansi sistem pembinaan. Sistem menerapkan prinsip *Least Privilege* (hanya membuka apa yang mutlak diperlukan):

### A. Hak Akses yang Disediakan:
1. **Raport Digital Pribadi:**
   * Melihat sisa saldo poin miliknya sendiri secara *real-time*.
   * Memeriksa riwayat kehadiran kegiatan miliknya sendiri.
   * Memeriksa apakah dirinya sedang dalam status SP atau masa pembinaan.
2. **Pusat Pengajuan Mandiri:**
   * Mengajukan permohonan izin ketidakhadiran dengan melampirkan foto surat dokter/keterangan kampus.
   * Mengajukan klaim pencairan poin prestasi dengan melampirkan piagam juara/sertifikat kegiatan.
   * Memantau status pengajuannya (Menunggu Persetujuan, Diterima, atau Ditolak beserta alasannya).
3. **Kemandirian Profil:**
   * Memperbarui informasi biodata (kota asal, domisili saat ini, nomor WhatsApp, akun Instagram).
   * Mengganti foto profil avatar pribadi ke Supabase Storage.
   * Mengganti kata sandi akun miliknya sendiri sewaktu-waktu.

### B. Rute & Fasilitas yang Dikunci Total dari Pengurus:
1. **Terkunci dari Dasbor Pengelola:** Bilah navigasi samping (*Sidebar*) admin tidak ditampilkan sama sekali. Pengurus hanya disajikan antarmuka bersih berupa Header Profil dan Bilik Mandiri.
2. **Terkunci dari Buku Anggota:** Dilarang keras melihat daftar pengurus lain, nomor kontak, maupun raport poin rekan organisasinya.
3. **Gembok Absensi:** Rute `/api/activities/[id]/attendance` memblokir pengurus 100%. Pengurus tidak bisa menandai dirinya sendiri "Hadir" atau menghapus status "Alpha".
4. **Gembok Kasir Poin:** Rute `/api/point-logs` memblokir peran Pengurus. Pengurus tidak bisa menambahkan poin sendiri atau menghapus catatan pelanggaran.
5. **Gembok Verifikasi:** Seluruh rute `/api/permissions/*/verify` dan `/api/claims/*/verify` otomatis menolak jika diketuk oleh akun berstatus Pengurus.
6. **Penjagaan Pos Satpam Edge:** Jika pengurus mencoba mengetik manual rute-rute manajemen di browser atau mengirim request via Postman/cURL, *Edge Middleware* (`middleware.ts`) langsung memutus koneksi dengan respon `403 Forbidden`.

---

## 🛡️ 5. Kesimpulan Kesiapan Arsitektur Keamanan

Sistem PSDM saat ini telah memiliki pertahanan berlapis (**Defense-in-Depth**):
1. **Lapisan 1 (Jaringan & Routing):** Diperiksa oleh Edge Middleware `middleware.ts` sebelum mencapai server.
2. **Lapisan 2 (Handler Rute API):** Diperiksa ulang oleh fungsi verifikasi sesi JWT dan pengecekan role database.
3. **Lapisan 3 (Logika Bisnis):** Diperiksa kesesuaian penugasan PJ Departemen dan kekebalan imunitas akun pimpinan tertinggi.
4. **Lapisan 4 (Antarmuka Pengguna):** Tombol aksi dan halaman sensitif disembunyikan secara otomatis sesuai lencana jabatan yang sah.
