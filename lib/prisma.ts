import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

function getValidTursoUrl(url?: string): string {
  if (!url || typeof url !== 'string') return 'libsql://placeholder-database.turso.io';
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return 'libsql://placeholder-database.turso.io';
  if (/^(libsql|wss|ws|https|http):/i.test(trimmed)) {
    return trimmed;
  }
  return `libsql://${trimmed}`;
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

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
