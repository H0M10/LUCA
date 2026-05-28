import type { RequestHandler } from 'express';
import { setAuthCookies, clearAuthCookies, cookieNames } from '../../lib/cookies.js';
import * as svc from './auth.service.js';
import { prisma } from '../../lib/prisma.js';
import { hashToken, randomToken } from '../../lib/hash.js';

const meta = (req: Parameters<RequestHandler>[0]) => ({
  ip: req.ip,
  ua: req.headers['user-agent'],
});

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { user, tokens } = await svc.registerUser(req.body, meta(req));
    setAuthCookies(res, tokens.access, tokens.refresh);
    res.status(201).json({ data: user });
  } catch (e) {
    next(e);
  }
};

/**
 * Login con email/password. Si el usuario tiene 2FA habilitado, NO emite
 * cookies de sesión — devuelve un `challengeId` que debe enviarse junto
 * con el código TOTP a /api/auth/2fa/challenge.
 */
export const login: RequestHandler = async (req, res, next) => {
  try {
    const { user, tokens } = await svc.loginUser(req.body, meta(req));

    // Si tiene 2FA, NO emitir cookies todavía
    const twofa = await prisma.totp_secret.findUnique({ where: { user_id: user.id } });
    if (twofa?.confirmed_at) {
      // Revocar el refresh que acabamos de emitir (no se usa)
      await prisma.refresh_token.updateMany({
        where: { user_id: user.id, used_at: null, revoked_at: null },
        data: { revoked_at: new Date() },
      });

      // Crear challenge token de un solo uso (5 min)
      const challenge = randomToken(32);
      await prisma.auth_token.create({
        data: {
          user_id: user.id,
          purpose: 'magic_link',
          token_hash: hashToken(challenge),
          expires_at: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      res.json({ data: { requires2FA: true, challengeId: challenge } });
      return;
    }

    setAuthCookies(res, tokens.access, tokens.refresh);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await svc.logoutUser(req.cookies?.[cookieNames.REFRESH]);
    clearAuthCookies(res);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const raw = req.cookies?.[cookieNames.REFRESH];
    if (!raw) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh' } });
    const tokens = await svc.rotateTokens(raw, meta(req));
    setAuthCookies(res, tokens.access, tokens.refresh);
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await svc.getMe(req.user!.id);
    res.json({ data: user });
  } catch (e) {
    next(e);
  }
};
