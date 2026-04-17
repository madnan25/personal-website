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
    if (!ok) {
      console.warn('[kv-keepalive] upstash ping failed', { httpOk: res.ok, sample: txt.slice(0, 120) });
    }
    return new Response(JSON.stringify({ ok, backend: 'upstash' }), {
      status: ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.warn('[kv-keepalive] upstash ping threw', err);
    return new Response(JSON.stringify({ ok: false, backend: 'upstash' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


