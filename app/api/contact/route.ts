import { NextResponse } from "next/server";
import {
  buildEmailPayload,
  enforceRateLimit,
  getClientIp,
  getResendOrThrow,
  HttpError,
  normalizeAndValidateBody,
  requireTurnstileOrThrow,
} from "./helpers";
import type { ContactPayload } from "./helpers";

export const runtime = 'nodejs';

function jsonError(status: number, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactPayload> & { turnstileToken?: string };
    const ip = getClientIp(request);
    const rateKey = ip || 'unknown';

    await enforceRateLimit(rateKey);
    const { name, email, phone, subjectKey, message, turnstileToken } = normalizeAndValidateBody(body);
    await requireTurnstileOrThrow(turnstileToken, ip);
    const resend = getResendOrThrow();
    const payload = buildEmailPayload(name, email, phone, subjectKey, message);

    try {
      const { error } = await resend.emails.send(payload);
      if (error) throw new HttpError(502, 'Failed to send email.');
    } catch (err) {
      // Normalize unknown send errors into a 502 for the client
      throw new HttpError(502, 'Failed to send email.');
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof HttpError) {
      return jsonError(e.status, e.message, e.headers);
    }
    // Log unexpected errors for debugging while returning a safe message
    console.error('[contact] unexpected error', e);
    return jsonError(400, 'Invalid request.');
  }
}

