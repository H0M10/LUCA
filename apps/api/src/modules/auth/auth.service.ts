import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, hashToken, randomToken, verifyPassword } from '../../lib/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { Errors } from '../../lib/errors.js';
import { sendMail } from '../../lib/mailer.js';
import type { LoginInput, RegisterInput, UserPublic, UserRole } from '@genograma/shared';

function toPublic(u: {
  id: string;
  email: string;
  full_name: string;
  avatar_media_id: string | null;
  birth_date: Date | null;
  gender: string | null;
  role: string;
  status: string;
  email_verified_at: Date | null;
  locale: string | null;
}): UserPublic {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    avatarMediaId: u.avatar_media_id,
    birthDate: u.birth_date ? u.birth_date.toISOString().slice(0, 10) : null,
    gender: u.gender as UserPublic['gender'],
    role: u.role as UserPublic['role'],
    status: u.status as UserPublic['status'],
    emailVerifiedAt: u.email_verified_at?.toISOString() ?? null,
    locale: u.locale,
  };
}

export async function registerUser(input: RegisterInput, meta: { ip?: string; ua?: string }) {
  const existing = await prisma.app_user.findUnique({ where: { email: input.email } });
  if (existing) throw Errors.conflict('Ya existe una cuenta con ese correo');

  const password_hash = await hashPassword(input.password);
  const user = await prisma.app_user.create({
    data: { email: input.email, password_hash, full_name: input.fullName },
  });

  // Auto-crear el árbol personal del usuario
  const firstName = input.fullName.split(' ')[0] ?? input.fullName;
  await prisma.tree.create({
    data: {
      owner_user_id: user.id,
      name: `Árbol de ${firstName}`,
      description: 'Tu árbol genealógico personal',
    },
  });

  // Token de verificación de email
  const raw = randomToken();
  await prisma.auth_token.create({
    data: {
      user_id: user.id,
      purpose: 'email_verify',
      token_hash: hashToken(raw),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const { env } = await import('../../config/env.js');
  const { verifyEmailTemplate } = await import('../../lib/mailer.js');
  const verifyLink = `${env.FRONTEND_URL}/#/verify?token=${raw}`;
  const tmpl = verifyEmailTemplate(user.full_name, verifyLink);
  await sendMail({ to: user.email, toName: user.full_name, subject: tmpl.subject, html: tmpl.html });

  const tokens = await issueTokens(user.id, user.role as UserRole, meta);
  return { user: toPublic(user), tokens };
}

export async function loginUser(input: LoginInput, meta: { ip?: string; ua?: string }) {
  const user = await prisma.app_user.findUnique({ where: { email: input.email } });
  // Verificar siempre el hash aunque no exista para mitigar timing attacks
  const dummy = '$2a$12$abcdefghijklmnopqrstuuKnGmI2H0qkz5p8ksB7vN3jJ8h0Hh7rW';
  const ok = await verifyPassword(input.password, user?.password_hash ?? dummy);

  await prisma.login_attempt.create({
    data: {
      email: input.email,
      user_id: user?.id ?? null,
      ip: meta.ip ?? null,
      user_agent: meta.ua ?? null,
      success: !!user && ok,
      failure_reason: !user ? 'unknown_user' : !ok ? 'bad_password' : null,
    },
  });

  if (!user || !ok) throw Errors.unauthorized('Credenciales inválidas');
  if (user.status !== 'active') throw Errors.forbidden('Cuenta suspendida');

  await prisma.app_user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });

  const tokens = await issueTokens(user.id, user.role as UserRole, meta);
  return { user: toPublic(user), tokens };
}

export async function logoutUser(refreshTokenRaw: string | undefined) {
  if (!refreshTokenRaw) return;
  try {
    const p = verifyRefreshToken(refreshTokenRaw);
    await prisma.refresh_token.updateMany({
      where: { family_id: p.fid, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  } catch {
    /* silently ignore */
  }
}

export async function rotateTokens(
  refreshTokenRaw: string,
  meta: { ip?: string; ua?: string },
): Promise<{ access: string; refresh: string }> {
  let p: ReturnType<typeof verifyRefreshToken>;
  try {
    p = verifyRefreshToken(refreshTokenRaw);
  } catch {
    throw Errors.unauthorized('Refresh inválido');
  }

  const stored = await prisma.refresh_token.findUnique({ where: { id: p.jti } });
  if (!stored || stored.revoked_at) {
    // Token desconocido o ya revocado → posible reuso, revocar toda la familia
    await prisma.refresh_token.updateMany({
      where: { family_id: p.fid, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    throw Errors.unauthorized('Sesión inválida');
  }
  if (stored.used_at) {
    // Reuso detectado: revocar familia completa
    await prisma.refresh_token.updateMany({
      where: { family_id: p.fid, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    throw Errors.unauthorized('Reuso de token detectado');
  }
  if (stored.expires_at < new Date()) throw Errors.unauthorized('Refresh expirado');

  // Marcar como usado y emitir nuevo
  await prisma.refresh_token.update({
    where: { id: stored.id },
    data: { used_at: new Date() },
  });

  const user = await prisma.app_user.findUnique({ where: { id: p.sub } });
  if (!user || user.status !== 'active') throw Errors.unauthorized();

  return issueTokens(user.id, user.role as UserRole, meta, p.fid, stored.id);
}

async function issueTokens(
  userId: string,
  role: UserRole,
  meta: { ip?: string; ua?: string },
  familyId?: string,
  parentId?: string,
): Promise<{ access: string; refresh: string }> {
  const fid = familyId ?? randomUUID();
  const jti = randomUUID();
  const access = signAccessToken({ sub: userId, role });
  const refresh = signRefreshToken({ sub: userId, fid, jti });

  await prisma.refresh_token.create({
    data: {
      id: jti,
      user_id: userId,
      family_id: fid,
      token_hash: hashToken(refresh),
      parent_id: parentId ?? null,
      user_agent: meta.ua ?? null,
      ip: meta.ip ?? null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { access, refresh };
}

export async function getMe(userId: string): Promise<UserPublic> {
  const user = await prisma.app_user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound('Usuario');
  return toPublic(user);
}
