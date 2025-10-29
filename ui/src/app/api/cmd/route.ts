export const runtime = 'edge'; // Next.js 15+ Edge Route

// POST /api/cmd  -> proxies JSON { op: "FORWARD", ... } to ESP32 /cmd
export async function POST(req: Request) {
  try {
    const { op, ...rest } = await req.json();
    if (!op) {
      return new Response(JSON.stringify({ ok: false, reason: 'missing op' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const base = process.env.ESP32_BASE_URL;
    if (!base) {
      return new Response(JSON.stringify({ ok: false, reason: 'ESP32_BASE_URL not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    let data: unknown = {};
    try {
      const espRes: Response = await fetch(`${base}/cmd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op, ...rest }),
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      try {
        data = await espRes.json();
      } catch {
        data = {};
      }
    } catch (e) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, proxied: true, esp32: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, reason: String(err?.message ?? err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Optional: preflight if you ever call this cross-origin
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}