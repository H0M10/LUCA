import type { Response, CookieOptions } from 'express';
import { env } from '../config/env.js';

const ACCESS = 'gn_at';
const REFRESH = 'gn_rt';

// Para producción (frontend en h0m10.github.io, backend en onrender.com)
// los cookies van CROSS-SITE → requieren SameSite=None + Secure=true.
// En dev (mismo origen localhost) usamos Lax.
const baseOpts: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
  path: '/',
  domain: env.COOKIE_DOMAIN === 'localhost' || env.COOKIE_DOMAIN === '' ? undefined : env.COOKIE_DOMAIN,
};

export function setAuthCookies(res: Response, access: string, refresh: string): void {
  res.cookie(ACCESS, access, { ...baseOpts, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH, refresh, { ...baseOpts, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS, baseOpts);
  res.clearCookie(REFRESH, baseOpts);
}

export const cookieNames = { ACCESS, REFRESH };
