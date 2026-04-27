const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  users.forEach(u => {
    console.log({ id: u.id, prn: u.prn, email: u.email, role: u.role, name: u.name, createdAt: u.createdAt });
  });
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); prisma.$disconnect(); process.exit(1);});
