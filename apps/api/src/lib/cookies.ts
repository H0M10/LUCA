import type { Response } from 'express';
import { env } from '../config/env.js';

const ACCESS = 'gn_at';
const REFRESH = 'gn_rt';

const baseOpts = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/',
  domain: env.COOKIE_DOMAIN === 'localhost' ? undefined : env.COOKIE_DOMAIN,
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
