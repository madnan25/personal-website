import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = 'nodejs';

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: 'speaking' | 'work' | 'other';
};

const SUBJECT_LABELS: Record<ContactPayload['subject'], string> = {
  speaking: 'Speaking engagement',
  work: 'Work with me',
  other: 'Other',
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactPayload>;
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const subjectKey = (body.subject ?? 'other') as ContactPayload['subject'];

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
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
        <p style="margin: 12px 0 0; font-size:12px; color:#666;">Sent from mdadnan.com contact window.</p>
      </div>
    `;

    const text = `New contact submission\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\nSubject: ${subject}`;

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject,
      html,
      text,
      replyTo: email,
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


