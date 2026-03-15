import { Resend } from 'resend';
import { z } from 'zod';
import { createLogger } from './logger';

const logger = createLogger('EmailService');

// ── Validation schema ────────────────────────────────────────────────────────
// All callers must provide these fields; the service validates before sending.
const EmailSchema = z.object({
  to: z.string().email('Invalid recipient email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'Email body is required'),
});

// ── Lazy Resend client ────────────────────────────────────────────────────────
// Resend is only constructed when an API key is actually present, so importing
// this module in test environments does not throw.
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// ── Master send function ──────────────────────────────────────────────────────
export async function sendSystemEmail(params: { to: string; subject: string; html: string }) {
  // 1. Validate inputs before touching any external service
  const parsed = EmailSchema.safeParse(params);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => i.message).join(', ');
    logger.warn('Email send skipped — validation failed', { errors, to: params.to });
    return { success: false, error: `Validation failed: ${errors}` };
  }

  const { to, subject, html } = parsed.data;

  // 2. Check client availability (no key = no-op, not a crash)
  const client = getResendClient();
  if (!client) {
    logger.warn('Email send skipped — RESEND_API_KEY not configured', { to, subject });
    return { success: false, error: 'Email service not configured' };
  }

  // 3. Send with structured log on both paths
  try {
    const data = await client.emails.send({
      from: 'SafetyMEG <noreply@safetymeg.com>',
      to: [to],
      subject,
      html,
    });
    logger.info('Email sent successfully', { to, subject, id: (data as any)?.data?.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Email send failed', error, { to, subject });
    return { success: false, error };
  }
}
