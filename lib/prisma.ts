import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

function getValidTursoUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
}

const prismaClientSingleton = () => {
  const tursoUrl = getValidTursoUrl(process.env.TURSO_DATABASE_URL);
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || 'placeholder-token';

  if (tursoUrl) {
    try {
      const libsql = createClient({
        url: tursoUrl,
        authToken: tursoAuthToken,
      });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter });
    } catch (err) {
      console.warn('[Prisma/Turso] Failed to initialize Turso client, falling back to standard PrismaClient:', err);
      return new PrismaClient();
    }
  }

  return new PrismaClient();
};

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
