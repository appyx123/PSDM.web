import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

function getValidTursoUrl(url?: string): string {
  if (!url || typeof url !== 'string') return 'https://placeholder-database.turso.io';
  let trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return 'https://placeholder-database.turso.io';
  
  // Prefer HTTPS over WebSockets (libsql/wss) for serverless/Edge connection pooling
  if (trimmed.startsWith('libsql://')) {
    trimmed = trimmed.replace('libsql://', 'https://');
  } else if (trimmed.startsWith('wss://')) {
    trimmed = trimmed.replace('wss://', 'https://');
  } else if (trimmed.startsWith('ws://')) {
    trimmed = trimmed.replace('ws://', 'http://');
  }

  if (/^(https|http):/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const prismaClientSingleton = () => {
  const tursoUrl = getValidTursoUrl(process.env.TURSO_DATABASE_URL);
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || 'placeholder-token';

  const libsql = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });
  const adapter = new PrismaLibSQL(libsql);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (!globalThis.prismaGlobal) globalThis.prismaGlobal = prisma;
