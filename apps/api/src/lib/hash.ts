import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const hashToken = (raw: string): string =>
  crypto.createHash('sha256').update(raw).digest('hex');

export const randomToken = (bytes = 32): string => crypto.randomBytes(bytes).toString('hex');
