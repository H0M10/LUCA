import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

let client: OAuth2Client | null = null;

export function getGoogleClient(): OAuth2Client | null {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) return null;
  if (!client) {
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
  }
  return client;
}

export function buildAuthUrl(state: string, nonce: string): string {
  const c = getGoogleClient();
  if (!c) throw new Error('Google OAuth no configurado');
  return c.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
    nonce,
  } as Parameters<OAuth2Client['generateAuthUrl']>[0]);
}

export async function exchangeCodeAndVerify(
  code: string,
  expectedNonce: string,
): Promise<TokenPayload> {
  const c = getGoogleClient();
  if (!c) throw new Error('Google OAuth no configurado');
  const { tokens } = await c.getToken(code);
  if (!tokens.id_token) throw new Error('No id_token en respuesta');
  const ticket = await c.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('id_token inválido');
  if (payload.nonce !== expectedNonce) throw new Error('Nonce no coincide');
  return payload;
}

// State firmado HMAC con nonce embebido, expira en 10 min
export function signOAuthState(): { state: string; nonce: string } {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = { n: nonce, exp: Math.floor(Date.now() / 1000) + 600 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(data)
    .digest('base64url');
  return { state: `${data}.${sig}`, nonce };
}

export function verifyOAuthState(state: string): { nonce: string } {
  const parts = state.split('.');
  if (parts.length !== 2) throw new Error('State malformado');
  const [data, sig] = parts;
  if (!data || !sig) throw new Error('State malformado');
  const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('State firma inválida');
  }
  const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as {
    n: string;
    exp: number;
  };
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('State expirado');
  return { nonce: payload.n };
}
