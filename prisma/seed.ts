import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log('Database already has users. Skipping seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      role: 'ADMIN',
      email: 'admin@psdm.id',
      name: 'Administrator',
      password: hashedPassword,
    }
  });

  console.log('✅ Admin account created:');
  console.log('   Email   :', admin.email);
  console.log('   Password: admin123');
  console.log('   Role    :', admin.role);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
