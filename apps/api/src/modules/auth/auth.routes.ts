import { Router, type Router as RouterType } from 'express';
import { authLimiter } from '../../middlewares/rateLimit.js';
import { validateBody } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { LoginSchema, RegisterSchema, type UserRole } from '@genograma/shared';
import * as ctrl from './auth.controller.js';
import {
  buildAuthUrl,
  exchangeCodeAndVerify,
  getGoogleClient,
  signOAuthState,
  verifyOAuthState,
} from '../../lib/googleOAuth.js';
import { findOrCreateGoogleUser, issueGoogleTokens } from './google.service.js';
import { changePassword, verifyEmail } from './auth.password.service.js';
import { confirm2FA, disable2FA, get2FAStatus, setup2FA, verify2FA } from './twofa.service.js';
import { prisma } from '../../lib/prisma.js';
import { hashToken } from '../../lib/hash.js';
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js';
import { randomUUID } from 'node:crypto';
import { setAuthCookies } from '../../lib/cookies.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { z } from 'zod';
import { PasswordSchema } from '@genograma/shared';

export const authRouter: RouterType = Router();

authRouter.post('/register', authLimiter, validateBody(RegisterSchema), ctrl.register);
authRouter.post('/login', authLimiter, validateBody(LoginSchema), ctrl.login);
authRouter.post('/logout', ctrl.logout);
authRouter.post('/refresh', ctrl.refresh);
authRouter.get('/me', authenticate, ctrl.me);

// ───────── Google OAuth ─────────
const OAUTH_STATE_COOKIE = 'gn_oauth';

// FRONTEND_URL ej. https://h0m10.github.io/LUCA (sin slash final)
// Usamos BrowserRouter, no HashRouter, así que NO ponemos /# en las URLs
const frontPath = (path: string, query?: string): string => {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}${query ? `?${query}` : ''}`;
};

// 1) Inicia el flujo: redirige a Google
authRouter.get('/google', (_req, res, next) => {
  try {
    if (!getGoogleClient()) {
      return res.redirect(frontPath('/login', 'error=google_not_configured'));
    }
    const { state, nonce } = signOAuthState();
    res.cookie(OAUTH_STATE_COOKIE, JSON.stringify({ state, nonce }), {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });
    const url = buildAuthUrl(state, nonce);
    res.redirect(url);
  } catch (e) {
    next(e);
  }
});

// 2) Google nos llama de vuelta con code+state
authRouter.get('/google/callback', async (req, res) => {
  try {
    logger.info({ query: req.query, cookies: Object.keys(req.cookies || {}) }, 'Google callback');

    if (!getGoogleClient()) {
      return res.redirect(frontPath('/login', 'error=google_not_configured'));
    }
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) {
      return res.redirect(frontPath('/login', 'error=missing_params'));
    }

    const raw = req.cookies?.[OAUTH_STATE_COOKIE];
    if (!raw) {
      logger.warn('Google callback: state cookie missing — likely cross-site cookie blocked');
      return res.redirect(frontPath('/login', 'error=no_state_cookie'));
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    let cookiePayload: { state: string; nonce: string };
    try {
      cookiePayload = JSON.parse(raw);
    } catch {
      return res.redirect(frontPath('/login', 'error=bad_cookie'));
    }
    if (cookiePayload.state !== state) {
      return res.redirect(frontPath('/login', 'error=state_mismatch'));
    }
    const { nonce } = verifyOAuthState(state);
    if (nonce !== cookiePayload.nonce) {
      return res.redirect(frontPath('/login', 'error=nonce_mismatch'));
    }

    const payload = await exchangeCodeAndVerify(code, nonce);
    const user = await findOrCreateGoogleUser(payload);
    const tokens = await issueGoogleTokens(
      user.id,
      user.role as UserRole,
      { ip: req.ip, ua: req.headers['user-agent'] },
    );
    setAuthCookies(res, tokens.access, tokens.refresh);

    logger.info({ userId: user.id }, 'Google login OK, redirecting to dashboard');
    res.redirect(frontPath('/dashboard'));
  } catch (e) {
    logger.error({ err: { msg: (e as Error).message, stack: (e as Error).stack } }, 'Google OAuth callback failed');
    res.redirect(frontPath('/login', `error=oauth_failed&msg=${encodeURIComponent((e as Error).message ?? '')}`));
  }
});

authRouter.get('/providers', (_req, res) => {
  res.json({ data: { google: !!getGoogleClient() } });
});

// ───────── Cambio de contraseña ─────────
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});

authRouter.post(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordSchema),
  async (req, res, next) => {
    try {
      await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  },
);

// ───────── Verificación de email ─────────
const VerifyEmailSchema = z.object({ token: z.string().min(10) });

authRouter.post('/verify-email', validateBody(VerifyEmailSchema), async (req, res, next) => {
  try {
    await verifyEmail(req.body.token);
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

// ───────── 2FA TOTP ─────────
const TwoFaCodeSchema = z.object({ code: z.string().min(6).max(10) });
const TwoFaChallengeSchema = z.object({
  challengeId: z.string().min(10),
  code: z.string().min(6).max(10),
});

authRouter.get('/2fa/status', authenticate, async (req, res, next) => {
  try {
    const s = await get2FAStatus(req.user!.id);
    res.json({ data: s });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/2fa/setup', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.app_user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new Error('User missing');
    const { qrDataUrl, secret } = await setup2FA(req.user!.id, user.email);
    res.json({ data: { qrDataUrl, secret } });
  } catch (e) {
    next(e);
  }
});

authRouter.post(
  '/2fa/confirm',
  authenticate,
  validateBody(TwoFaCodeSchema),
  async (req, res, next) => {
    try {
      const { backupCodes } = await confirm2FA(req.user!.id, req.body.code);
      res.json({ data: { ok: true, backupCodes } });
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post(
  '/2fa/disable',
  authenticate,
  validateBody(TwoFaCodeSchema),
  async (req, res, next) => {
    try {
      await disable2FA(req.user!.id, req.body.code);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  },
);

// Endpoint para completar login si el usuario tiene 2FA: recibe el challenge token
// que devolvió /login (en lugar de cookies de sesión) + el código TOTP.
// Si OK, emite cookies de sesión normales.
authRouter.post(
  '/2fa/challenge',
  authLimiter,
  validateBody(TwoFaChallengeSchema),
  async (req, res, next) => {
    try {
      // Encontrar el challenge guardado en auth_token (purpose='2fa_challenge')
      const challengeHash = hashToken(req.body.challengeId);
      const row = await prisma.auth_token.findFirst({
        where: { token_hash: challengeHash, purpose: 'magic_link', used_at: null },
      });
      if (!row || !row.user_id || row.expires_at < new Date()) {
        return res.status(401).json({ error: { code: 'INVALID_CHALLENGE', message: 'Challenge inválido o expirado' } });
      }
      const ok = await verify2FA(row.user_id, req.body.code);
      if (!ok) return res.status(401).json({ error: { code: 'BAD_CODE', message: 'Código incorrecto' } });

      // Marcar challenge usado y emitir tokens
      await prisma.auth_token.update({ where: { id: row.id }, data: { used_at: new Date() } });
      const user = await prisma.app_user.findUnique({ where: { id: row.user_id } });
      if (!user) throw new Error('User missing');

      const fid = randomUUID();
      const jti = randomUUID();
      const access = signAccessToken({ sub: user.id, role: user.role as UserRole });
      const refresh = signRefreshToken({ sub: user.id, fid, jti });
      await prisma.refresh_token.create({
        data: {
          id: jti,
          user_id: user.id,
          family_id: fid,
          token_hash: hashToken(refresh),
          user_agent: req.headers['user-agent'] ?? null,
          ip: req.ip ?? null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      setAuthCookies(res, access, refresh);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  },
);
