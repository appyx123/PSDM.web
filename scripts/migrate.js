const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating ADMIN to SUPER_ADMIN...');
  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'SUPER_ADMIN' }
  });
  console.log(`Updated ${result.count} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
