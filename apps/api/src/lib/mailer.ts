import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

interface MailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envía email vía Brevo (transactional API).
 * Si BREVO_API_KEY no está configurada, loguea a consola (modo dev).
 */
export async function sendMail(opts: MailOptions): Promise<void> {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM_EMAIL) {
    logger.info({ to: opts.to, subject: opts.subject }, '[MAIL DEV] no enviado (sin BREVO_API_KEY)');
    logger.debug({ html: opts.html }, '[MAIL DEV] cuerpo');
    return;
  }

  const body = {
    sender: { name: env.MAIL_FROM_NAME || 'Luca', email: env.MAIL_FROM_EMAIL },
    to: [{ email: opts.to, ...(opts.toName ? { name: opts.toName } : {}) }],
    subject: opts.subject,
    htmlContent: opts.html,
    ...(opts.text ? { textContent: opts.text } : {}),
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error({ status: res.status, body: errText }, '[MAIL] Brevo respondió error');
      throw new Error(`Brevo: HTTP ${res.status}`);
    }
    const result = (await res.json()) as { messageId?: string };
    logger.info({ to: opts.to, subject: opts.subject, messageId: result.messageId }, '[MAIL] enviado');
  } catch (e) {
    logger.error({ err: e, to: opts.to }, '[MAIL] fallo de envío');
    // No tiramos el error para no romper el flow del usuario; el email es secundario.
  }
}

// --- Templates ---

const wrap = (title: string, body: string): string => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#F5F1E8;font-family:'DM Sans',system-ui,sans-serif;color:#1F1A14;">
  <div style="max-width:560px;margin:40px auto;background:#FBF8F1;border:1px solid #E5DDD0;padding:40px 32px;">
    <div style="border-bottom:1px solid #E5DDD0;padding-bottom:16px;margin-bottom:24px;">
      <span style="font-family:Georgia,serif;font-size:28px;font-weight:600;color:#3D5240;">Luca</span>
      <span style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#5E574E;margin-left:8px;">— ${title}</span>
    </div>
    ${body}
    <div style="border-top:1px solid #E5DDD0;margin-top:32px;padding-top:16px;font-size:11px;color:#5E574E;">
      Recibiste este correo porque te registraste en Luca. Si no fuiste tú, ignora este mensaje.<br/>
      <span style="color:#A89F8E;">Desarrollado por 3gm</span>
    </div>
  </div>
</body></html>`;

export function verifyEmailTemplate(name: string, link: string): { subject: string; html: string } {
  return {
    subject: 'Verifica tu cuenta en Luca',
    html: wrap(
      'Verifica tu cuenta',
      `<p style="font-size:18px;line-height:1.5;">Hola <strong>${escapeHtml(name)}</strong>,</p>
       <p style="font-size:16px;line-height:1.6;color:#3A332B;">
         Tu cuenta en <strong>Luca</strong> está casi lista. Solo necesitamos confirmar que este email es tuyo.
       </p>
       <p style="text-align:center;margin:32px 0;">
         <a href="${link}" style="display:inline-block;background:#1F1A14;color:#FBF8F1;text-decoration:none;padding:14px 32px;font-weight:500;border-radius:9999px;">Verificar mi cuenta →</a>
       </p>
       <p style="font-size:13px;color:#5E574E;">O copia este enlace: <br/><code style="word-break:break-all;font-size:11px;">${link}</code></p>
       <p style="font-size:13px;color:#5E574E;">El enlace expira en 24 horas.</p>`,
    ),
  };
}

export function passwordResetTemplate(name: string, link: string): { subject: string; html: string } {
  return {
    subject: 'Restablecer contraseña en Luca',
    html: wrap(
      'Restablecer contraseña',
      `<p style="font-size:18px;">Hola <strong>${escapeHtml(name)}</strong>,</p>
       <p>Solicitaste restablecer tu contraseña. Si fuiste tú, da click en el botón:</p>
       <p style="text-align:center;margin:32px 0;">
         <a href="${link}" style="display:inline-block;background:#3D5240;color:#FBF8F1;text-decoration:none;padding:14px 32px;font-weight:500;border-radius:9999px;">Crear nueva contraseña</a>
       </p>
       <p style="font-size:13px;color:#5E574E;">Si no fuiste tú, ignora este correo y tu contraseña actual seguirá funcionando.</p>`,
    ),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
