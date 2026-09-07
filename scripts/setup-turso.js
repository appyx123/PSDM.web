const { createClient } = require('@libsql/client');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Membaca file .env jika ada
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('ERROR: TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN tidak ditemukan di .env!');
  process.exit(1);
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

async function main() {
  console.log('🚀 [1/3] Memeriksa & Membangun Skema Database di Turso Cloud...');

  // Hasilkan SQL DDL resmi dari schema.prisma
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const ddl = execSync(`npx prisma migrate diff --from-empty --to-schema-datamodel "${schemaPath}" --script`, {
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
  });

  console.log('📦 Menerapkan cetakan skema ke Turso...');
  await client.executeMultiple(ddl);
  console.log('✅ Skema berhasil dibangun di Turso!');

  // Inisialisasi Prisma Client dengan Turso adapter
  const adapter = new PrismaLibSQL(client);
  const prisma = new PrismaClient({ adapter });

  console.log('\n👑 [2/3] Mencetak Akun Master (Seeder)...');
  const defaultPassword = 'password';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // 1. Akun Master SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { prn: 'SA001' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      name: 'Master Super Admin',
      email: 'superadmin@psdm.com',
    },
    create: {
      prn: 'SA001',
      email: 'superadmin@psdm.com',
      name: 'Master Super Admin',
      role: 'SUPER_ADMIN',
      password: hashedPassword,
    },
  });
  console.log('✅ Akun Master SUPER_ADMIN dibuat:', superAdmin.prn, `(${superAdmin.email})`);

  // 2. Akun Master ADMIN
  const admin = await prisma.user.upsert({
    where: { prn: 'ADM001' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Master Admin',
      email: 'admin@psdm.com',
    },
    create: {
      prn: 'ADM001',
      email: 'admin@psdm.com',
      name: 'Master Admin',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });
  console.log('✅ Akun Master ADMIN dibuat:', admin.prn, `(${admin.email})`);

  // 3. Akun Master PENGURUS
  // Harus memiliki profil Member aktif terlebih dahulu
  const member = await prisma.member.upsert({
    where: { prn: 'PRN001' },
    update: {
      name: 'Master Pengurus',
      department: 'PSDM',
      position: 'Staff',
      status: 'AKTIF',
      basePoints: 100,
    },
    create: {
      name: 'Master Pengurus',
      prn: 'PRN001',
      department: 'PSDM',
      position: 'Staff',
      status: 'AKTIF',
      basePoints: 100,
      joinDate: '2026-01-01',
    },
  });

  const pengurus = await prisma.user.upsert({
    where: { prn: 'PRN001' },
    update: {
      email: 'pengurus@psdm.com',
      name: 'Master Pengurus',
      password: hashedPassword,
      role: 'PENGURUS',
      memberId: member.id,
    },
    create: {
      prn: 'PRN001',
      email: 'pengurus@psdm.com',
      name: 'Master Pengurus',
      password: hashedPassword,
      role: 'PENGURUS',
      memberId: member.id,
    },
  });
  console.log('✅ Akun Master PENGURUS dibuat:', pengurus.prn, `(${pengurus.email})`);

  // 4. Pengaturan Sistem Awal (System Settings)
  console.log('\n⚙️ Menyiapkan konfigurasi dasar sistem...');
  await prisma.systemSetting.upsert({
    where: { key: 'APP_NAME' },
    update: { value: 'PSDM System' },
    create: { key: 'APP_NAME', value: 'PSDM System' },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'ALPHA_MULTIPLIER' },
    update: { value: '2' },
    create: { key: 'ALPHA_MULTIPLIER', value: '2' },
  });

  // 5. Kategori Poin Awal (Point Categories)
  const defaultCategories = [
    { name: 'Gagal Menjalankan Program Kerja', type: 'PUNISHMENT', points: -25 },
    { name: 'Gagal Target MONEV', type: 'PUNISHMENT', points: -25 },
    { name: 'Izin Beruntun 3 Kali', type: 'PUNISHMENT', points: -10 },
    { name: 'Pelanggaran Atribut', type: 'PUNISHMENT', points: -6 },
    { name: 'Juara Internasional', type: 'REWARD', points: 75 },
    { name: 'Juara PIMNAS', type: 'REWARD', points: 50 },
    { name: 'Juara Lomba Nasional Umum', type: 'REWARD', points: 25 },
    { name: 'Mentor/Tutor Internal', type: 'REWARD', points: 15 },
    { name: 'Ketua Panitia Kegiatan', type: 'REWARD', points: 10 },
    { name: 'MC/Moderator', type: 'REWARD', points: 5 },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.pointCategory.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await prisma.pointCategory.create({ data: cat });
    }
  }
  console.log('✅ Konfigurasi dan kategori poin dasar tersimpan!');

  // Verifikasi hash password
  console.log('\n🔍 [3/3] Memverifikasi Keamanan Enkripsi Password...');
  const verifySuper = await bcrypt.compare(defaultPassword, superAdmin.password);
  const verifyAdmin = await bcrypt.compare(defaultPassword, admin.password);
  const verifyPengurus = await bcrypt.compare(defaultPassword, pengurus.password);

  console.log(`- Validasi password Super Admin: ${verifySuper ? 'SUKSES (100% Cocok)' : 'GAGAL'}`);
  console.log(`- Validasi password Admin: ${verifyAdmin ? 'SUKSES (100% Cocok)' : 'GAGAL'}`);
  console.log(`- Validasi password Pengurus: ${verifyPengurus ? 'SUKSES (100% Cocok)' : 'GAGAL'}`);

  console.log('\n🎉 PROSES SELESAI DENGAN SEMPURNA!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan:', err);
  process.exit(1);
});
