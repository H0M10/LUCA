import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Cuando conectamos a Supabase a través del Transaction Pooler (puerto 6543)
 * el pgbouncer reusa conexiones Postgres entre transacciones, lo que rompe
 * los prepared statements que Prisma intenta cachear (errores s5/s6/s18 etc).
 *
 * Fuerza el parámetro `pgbouncer=true` siempre que el host sea un pooler de Supabase,
 * sin importar qué se haya configurado en Render. Esto desactiva los prepared statements
 * a nivel de Prisma usando Simple Query Protocol.
 */
function ensurePoolerParams(url: string): string {
  try {
    const u = new URL(url);
    const isPooler = u.hostname.includes('pooler.supabase.com') || u.port === '6543';
    if (!isPooler) return url;
    if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true');
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '1');
    return u.toString();
  } catch {
    return url;
  }
}

const datasourceUrl = ensurePoolerParams(env.DATABASE_URL);

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    datasourceUrl,
    log: env.isDev ? ['warn', 'error'] : ['error'],
  });

if (env.isDev) globalThis.__prisma = prisma;
