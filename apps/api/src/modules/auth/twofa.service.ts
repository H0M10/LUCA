import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { Errors } from '../../lib/errors.js';
import { hashToken, randomToken } from '../../lib/hash.js';

// Configurar window de tolerancia (1 = aceptamos código actual + previo + siguiente, ~90s tolerancia)
authenticator.options = { window: 1 };

/**
 * Genera un nuevo secreto TOTP para el usuario (sin confirmar todavía).
 * Devuelve el secreto en base32 y un QR-code data URL listo para mostrar.
 */
export async function setup2FA(userId: string, userEmail: string) {
  const secret = authenticator.generateSecret(); // base32
  const otpauthUrl = authenticator.keyuri(userEmail, 'Luca', secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Cifrar el secreto antes de guardar (con la JWT secret como key sencilla)
  const encrypted = encryptSecret(secret);
  await prisma.totp_secret.upsert({
    where: { user_id: userId },
    create: { user_id: userId, secret_encrypted: encrypted, confirmed_at: null },
    update: { secret_encrypted: encrypted, confirmed_at: null },
  });

  return { qrDataUrl, otpauthUrl, secret };
}

/**
 * Verifica el primer código para confirmar el setup.
 */
export async function confirm2FA(userId: string, code: string) {
  const row = await prisma.totp_secret.findUnique({ where: { user_id: userId } });
  if (!row) throw Errors.badRequest('No has iniciado el setup de 2FA');
  const secret = decryptSecret(row.secret_encrypted);
  const ok = authenticator.verify({ token: code, secret });
  if (!ok) throw Errors.badRequest('Código incorrecto');

  // Generar 10 códigos de respaldo
  const backupCodes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = randomToken(6).slice(0, 10).toUpperCase();
    backupCodes.push(code);
    await prisma.totp_backup_code.create({
      data: { user_id: userId, code_hash: hashToken(code) },
    });
  }

  await prisma.totp_secret.update({
    where: { user_id: userId },
    data: { confirmed_at: new Date() },
  });

  return { backupCodes };
}

/**
 * Verifica un código TOTP o un backup code para login con 2FA.
 */
export async function verify2FA(userId: string, code: string): Promise<boolean> {
  const trimmed = code.trim().toUpperCase();

  const row = await prisma.totp_secret.findUnique({ where: { user_id: userId } });
  if (!row || !row.confirmed_at) return false;

  // Intentar TOTP primero
  if (/^\d{6}$/.test(trimmed)) {
    const secret = decryptSecret(row.secret_encrypted);
    if (authenticator.verify({ token: trimmed, secret })) return true;
  }

  // Sino backup code
  const codeHash = hashToken(trimmed);
  const backup = await prisma.totp_backup_code.findFirst({
    where: { user_id: userId, code_hash: codeHash, used_at: null },
  });
  if (backup) {
    await prisma.totp_backup_code.update({
      where: { id: backup.id },
      data: { used_at: new Date() },
    });
    return true;
  }

  return false;
}

export async function disable2FA(userId: string, code: string) {
  const ok = await verify2FA(userId, code);
  if (!ok) throw Errors.badRequest('Código incorrecto');
  await prisma.totp_backup_code.deleteMany({ where: { user_id: userId } });
  await prisma.totp_secret.delete({ where: { user_id: userId } });
}

export async function get2FAStatus(userId: string): Promise<{ enabled: boolean }> {
  const row = await prisma.totp_secret.findUnique({ where: { user_id: userId } });
  return { enabled: !!row?.confirmed_at };
}

// --- Cifrado simétrico simple ---
function encryptSecret(plain: string): string {
  const key = crypto.createHash('sha256').update(process.env.JWT_SECRET ?? 'fallback').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptSecret(encoded: string): string {
  const key = crypto.createHash('sha256').update(process.env.JWT_SECRET ?? 'fallback').digest();
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
