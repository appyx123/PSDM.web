import prisma from './lib/prisma';

async function test() {
  try {
    console.log('Keys in prisma object:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    // @ts-ignore
    console.log('systemSetting exists:', !!prisma.systemSetting);
    // @ts-ignore
    console.log('settingsAudit exists:', !!prisma.settingsAudit);
  } catch (e) {
    console.error(e);
  }
}

test();
