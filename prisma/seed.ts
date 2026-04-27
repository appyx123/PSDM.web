import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding point categories...');

  const categories = [
    // PUNISHMENT
    { name: 'Gagal Menjalankan Program Kerja', type: 'PUNISHMENT', points: -25 },
    { name: 'Absen Riset Kemendikbudristek', type: 'PUNISHMENT', points: 0 },
    { name: 'Gagal Target MONEV', type: 'PUNISHMENT', points: -25 },
    { name: 'Izin Beruntun 3 Kali', type: 'PUNISHMENT', points: -10 },
    { name: 'Pelanggaran Atribut', type: 'PUNISHMENT', points: -6 },

    // REWARD PRESTASI
    { name: 'Juara Internasional', type: 'REWARD', points: 75 },
    { name: 'Juara PIMNAS', type: 'REWARD', points: 50 },
    { name: 'Juara PILMAPRES Nasional', type: 'REWARD', points: 40 },
    { name: 'Delegasi PIMNAS/Internasional', type: 'REWARD', points: 30 },
    { name: 'HAKI/Paten', type: 'REWARD', points: 30 },
    { name: 'Juara Lomba Nasional Umum', type: 'REWARD', points: 25 },
    { name: 'Lolos Pendanaan Kemendikbudristek', type: 'REWARD', points: 25 },
    { name: 'Publikasi Jurnal SINTA/Scopus', type: 'REWARD', points: 25 },
    { name: 'Juara Regional/Provinsi', type: 'REWARD', points: 15 },
    { name: 'Lolos MBKM', type: 'REWARD', points: 15 },
    { name: 'Pemateri/Hibah/Pameran Nasional', type: 'REWARD', points: 15 },
    { name: 'Juara Universitas/Lokal', type: 'REWARD', points: 10 },
    { name: 'Submit Proposal/Artikel', type: 'REWARD', points: 10 },
    { name: 'Prestasi di luar 5 bidang', type: 'REWARD', points: 7 },

    // APRESIASI INTERNAL
    { name: 'Mentor/Tutor Internal', type: 'REWARD', points: 15 },
    { name: 'Innovator of the Month', type: 'REWARD', points: 10 },
    { name: 'Ketua Panitia Kegiatan', type: 'REWARD', points: 10 },
    { name: 'Ketua Tim Lomba', type: 'REWARD', points: 10 },
    { name: 'MC/Moderator', type: 'REWARD', points: 5 },
    { name: 'Anggota Teraktif Forum/Rapat', type: 'REWARD', points: 5 },
    { name: 'Delegasi Organisasi Non-Lomba', type: 'REWARD', points: 3 },
  ];

  // Using deleteMany first to ensure no duplicates if re-running
  await prisma.pointCategory.deleteMany({});
  
  await prisma.pointCategory.createMany({
    data: categories,
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
