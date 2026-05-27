import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword, hashToken } from '../../lib/hash.js';
import { Errors } from '../../lib/errors.js';

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.app_user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound('Usuario');
  if (!user.password_hash) {
    throw Errors.badRequest('Tu cuenta usa solo Google. Configura una contraseña primero (próximamente).');
  }
  const ok = await verifyPassword(currentPassword, user.password_hash);
  if (!ok) throw Errors.badRequest('Contraseña actual incorrecta');
  if (newPassword === currentPassword) {
    throw Errors.badRequest('La nueva contraseña debe ser distinta a la actual');
  }
  const newHash = await hashPassword(newPassword);
  await prisma.app_user.update({ where: { id: userId }, data: { password_hash: newHash } });

  // Revocar TODOS los refresh tokens para forzar re-login en otros dispositivos
  await prisma.refresh_token.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

export async function verifyEmail(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.auth_token.findFirst({
    where: { token_hash: tokenHash, purpose: 'email_verify', used_at: null },
  });
  if (!row) throw Errors.badRequest('Token inválido o ya usado');
  if (row.expires_at < new Date()) throw Errors.badRequest('Token expirado');
  if (!row.user_id) throw Errors.badRequest('Token sin usuario');

  await prisma.$transaction([
    prisma.auth_token.update({ where: { id: row.id }, data: { used_at: new Date() } }),
    prisma.app_user.update({
      where: { id: row.user_id },
      data: { email_verified_at: new Date() },
    }),
  ]);
}
