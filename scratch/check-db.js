const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.member.count();
    console.log(`Total members: ${count}`);
    const members = await prisma.member.findMany({ take: 5 });
    console.log('Sample members:', JSON.stringify(members, null, 2));
  } catch (e) {
    console.error('Error fetching members:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
