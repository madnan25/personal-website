export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return new Response(JSON.stringify({ ok: false, reason: 'env-missing', backend: 'none' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const txt = await res.text().catch(() => '');
    const ok = res.ok && txt.includes('PONG');
    return new Response(JSON.stringify({ ok, backend: 'upstash', httpOk: res.ok, body: ok ? 'PONG' : txt.slice(0, 120) }), {
      status: ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, backend: 'upstash', error: 'ping-failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


