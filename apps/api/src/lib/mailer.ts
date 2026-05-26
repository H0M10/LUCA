import { logger } from '../config/logger.js';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Stub: en dev loguea, en prod debería enviar via Resend / Brevo.
// Ver docs/EMAIL.md.
export async function sendMail(opts: MailOptions): Promise<void> {
  logger.info({ to: opts.to, subject: opts.subject }, '[MAIL] (dev stub) email no enviado');
  logger.debug({ html: opts.html }, '[MAIL] cuerpo');
}
