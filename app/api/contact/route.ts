import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";

export const runtime = 'nodejs';

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: 'speaking' | 'work' | 'other';
  message?: string;
  turnstileToken?: string;
};

const SUBJECT_LABELS: Record<ContactPayload['subject'], string> = {
  speaking: 'Speaking engagement',
  work: 'Work with me',
  other: 'Other',
};

// Durable rate limit (per-IP) using Upstash Redis (falls back to in-memory if not configured)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5; // 5 requests per window
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisClient = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const ratelimiter = redisClient
  ? new Ratelimit({ redis: redisClient, limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, `${RATE_LIMIT_WINDOW_MS} ms`) })
  : null;
// Fallback map for single-instance dev/local
const rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map();

function validateEmail(email: string): boolean {
  // reasonable email check; avoids complex RFC 5322 patterns
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type TurnstileVerify = { success: boolean; errorCodes?: string[] };

async function verifyTurnstile(token: string, ip: string | null): Promise<TurnstileVerify> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { success: false, errorCodes: ['missing-secret'] };
  try {
    const form = new URLSearchParams();
    form.set('secret', secret);
    form.set('response', token);
    if (ip) form.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!res.ok) return { success: false, errorCodes: ['http-'+String(res.status)] };
    const data = await res.json().catch(() => ({}));
    return { success: Boolean(data.success), errorCodes: data['error-codes'] };
  } catch {
    return { success: false, errorCodes: ['network-error'] };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactPayload> & { turnstileToken?: string };
    const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : null;

    // Rate limit (per IP)
    const key = ip || 'unknown';
    if (ratelimiter) {
      const { success, reset } = await ratelimiter.limit(`contact:${key}`);
      if (!success) {
        const retryAfter = reset ? Math.max(0, Math.ceil((reset - Date.now()) / 1000)) : 60;
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
      }
    } else {
      // Fallback in-memory limiter (single instance only)
      const now = Date.now();
      const current = rateLimitMap.get(key);
      if (!current || now > current.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      } else {
        if (current.count >= RATE_LIMIT_MAX) {
          const retryAfter = Math.max(0, Math.ceil((current.resetAt - now) / 1000));
          return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
        }
        current.count += 1;
        rateLimitMap.set(key, current);
      }
    }
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const subjectKey = (body.subject ?? 'other') as ContactPayload['subject'];
    const message = (body.message ?? '').toString();
    const turnstileToken = (body.turnstileToken ?? '').toString();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verification required.' }, { status: 400 });
    }

    const turnstileRes = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileRes.success) {
      const code = Array.isArray(turnstileRes.errorCodes) && turnstileRes.errorCodes.length > 0 ? ` (${turnstileRes.errorCodes.join(', ')})` : '';
      return NextResponse.json({ error: `Verification failed${code}.` }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
    const toAddress = 'madnan@voortgang.io';
    const subject = SUBJECT_LABELS[subjectKey] ?? SUBJECT_LABELS.other;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
        <h2 style="margin: 0 0 12px;">New contact submission</h2>
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${phone ? `<p style=\"margin: 0 0 8px;\"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
        <p style="margin: 0 0 12px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        ${message ? `<div style=\"margin: 12px 0;\"><div style=\"font-weight:600;margin-bottom:6px;\">Message</div><div style=\"white-space:pre-wrap;\">${escapeHtml(message)}</div></div>` : ''}
        <p style="margin: 12px 0 0; font-size:12px; color:#666;">Sent from dayemadnan.com MacOS</p>
      </div>
    `;

    const text = `New contact submission\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\nSubject: ${subject}${message ? `\n\nMessage:\n${message}` : ''}`;

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html,
      text,
      replyTo: validateEmail(email) ? email : undefined,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


