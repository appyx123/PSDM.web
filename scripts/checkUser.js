const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const prn = process.argv[2] || 'PRN0252';
  const user = await prisma.user.findFirst({ where: { prn: prn.toUpperCase() } });
  if(!user){
    console.log('No user found for PRN:', prn);
  } else {
    console.log('User found:');
    console.log({ id: user.id, prn: user.prn, name: user.name, role: user.role, createdAt: user.createdAt, passwordHash: user.password });
  }
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); prisma.$disconnect(); process.exit(1);});
