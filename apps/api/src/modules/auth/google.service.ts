import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { hashToken } from '../../lib/hash.js';
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js';
import { Errors } from '../../lib/errors.js';
import type { TokenPayload } from 'google-auth-library';

/**
 * Si el usuario ya existe (por email o por google_id), lo devuelve.
 * Si no, lo crea.
 * Vincula el oauth_account si no estaba vinculado todavía.
 */
export async function findOrCreateGoogleUser(payload: TokenPayload) {
  if (!payload.sub || !payload.email) throw Errors.badRequest('Datos Google incompletos');
  const googleSub = payload.sub;
  const email = payload.email.toLowerCase();
  const emailVerified = payload.email_verified === true;
  const fullName = payload.name ?? email.split('@')[0]!;

  // Buscar primero por oauth_account
  const oa = await prisma.oauth_account.findFirst({
    where: { provider: 'google', provider_user_id: googleSub },
    include: { app_user: true },
  });
  if (oa) {
    if (oa.app_user.status !== 'active') throw Errors.forbidden('Cuenta suspendida');
    return oa.app_user;
  }

  // Si no, buscar por email
  let user = await prisma.app_user.findUnique({ where: { email } });

  if (user) {
    // Vincular oauth a usuario existente (solo si Google confirma el email)
    if (!emailVerified) throw Errors.forbidden('Google no confirmó tu email; no se puede vincular');
    await prisma.oauth_account.create({
      data: {
        user_id: user.id,
        provider: 'google',
        provider_user_id: googleSub,
        email,
        email_verified: emailVerified,
      },
    });
    // Marcar email como verificado en app_user si no lo estaba
    if (!user.email_verified_at) {
      user = await prisma.app_user.update({
        where: { id: user.id },
        data: { email_verified_at: new Date() },
      });
    }
  } else {
    // Crear usuario nuevo + oauth_account en una transacción
    user = await prisma.app_user.create({
      data: {
        email,
        full_name: fullName,
        email_verified_at: emailVerified ? new Date() : null,
        oauth_account: {
          create: {
            provider: 'google',
            provider_user_id: googleSub,
            email,
            email_verified: emailVerified,
          },
        },
      },
    });
    // Auto-crear el árbol personal del usuario nuevo
    const first = fullName.split(' ')[0] ?? fullName;
    await prisma.tree.create({
      data: {
        owner_user_id: user.id,
        name: `Árbol de ${first}`,
        description: 'Tu árbol genealógico personal',
      },
    });
  }

  if (user.status !== 'active') throw Errors.forbidden('Cuenta suspendida');
  return user;
}

export async function issueGoogleTokens(
  userId: string,
  role: 'user' | 'admin',
  meta: { ip?: string; ua?: string },
): Promise<{ access: string; refresh: string }> {
  const fid = randomUUID();
  const jti = randomUUID();
  const access = signAccessToken({ sub: userId, role });
  const refresh = signRefreshToken({ sub: userId, fid, jti });

  await prisma.refresh_token.create({
    data: {
      id: jti,
      user_id: userId,
      family_id: fid,
      token_hash: hashToken(refresh),
      user_agent: meta.ua ?? null,
      ip: meta.ip ?? null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.app_user.update({ where: { id: userId }, data: { last_login_at: new Date() } });

  return { access, refresh };
}
