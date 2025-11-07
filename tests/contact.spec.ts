import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as contact from '../app/api/contact/helpers';

describe('contact route helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validateEmail works for simple cases', () => {
    expect(contact.validateEmail('user@example.com')).toBe(true);
    expect(contact.validateEmail('bad@no')).toBe(false);
    expect(contact.validateEmail('')).toBe(false);
  });

  it('getClientIp parses x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    const req = new Request('https://test', { headers });
    expect(contact.getClientIp(req)).toBe('1.2.3.4');
  });

  it('normalizeAndValidateBody validates required fields', () => {
    expect(() =>
      contact.normalizeAndValidateBody({ name: '', email: '', turnstileToken: 't' })
    ).toThrow();
    expect(() =>
      contact.normalizeAndValidateBody({ name: 'A', email: 'bad', turnstileToken: 't' })
    ).toThrow();
    expect(() =>
      contact.normalizeAndValidateBody({ name: 'A', email: 'a@b.com' })
    ).toThrow();

    const ok = contact.normalizeAndValidateBody({
      name: ' A ',
      email: ' a@b.com ',
      phone: ' 123 ',
      subject: 'work',
      message: ' Hi ',
      turnstileToken: 't',
    });
    expect(ok.name).toBe('A');
    expect(ok.email).toBe('a@b.com');
    expect(ok.phone).toBe('123');
    expect(ok.subjectKey).toBe('work');
  });

  it('enforceRateLimit fallback blocks after threshold', async () => {
    // Assumes no Upstash configured in test env -> fallback path
    const key = 'test-key';
    // allow RATE_LIMIT_MAX requests (5), then the next should throw
    for (let i = 0; i < 5; i++) {
      await expect(contact.enforceRateLimit(key)).resolves.toBeUndefined();
    }
    await expect(contact.enforceRateLimit(key)).rejects.toBeInstanceOf(Error);
  });

  it('requireTurnstileOrThrow uses provided verifier', async () => {
    const okVerifier = vi.fn().mockResolvedValue({ success: true });
    await expect(contact.requireTurnstileOrThrow('token', null, okVerifier)).resolves.toBeUndefined();
    const badVerifier = vi.fn().mockResolvedValue({ success: false, errorCodes: ['invalid-input-response'] });
    await expect(contact.requireTurnstileOrThrow('token', null, badVerifier)).rejects.toBeInstanceOf(Error);
  });

  it('buildEmailPayload includes replyTo only when email valid', () => {
    const a = contact.buildEmailPayload('A', 'a@b.com', '', 'other', '');
    // @ts-expect-error
    expect(a.replyTo).toBe('a@b.com');
    const b = contact.buildEmailPayload('A', 'bad', '', 'other', '');
    // @ts-expect-error
    expect(b.replyTo).toBeUndefined();
  });
});


