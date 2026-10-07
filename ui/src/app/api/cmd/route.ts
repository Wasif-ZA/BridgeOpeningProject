const UPSTREAM_TIMEOUT_MS = 2000;
const VALID_OP = /^[0-9]$/;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/cmd  -> validates { op: "0".."9" } and proxies it to ESP32 /cmd
export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, reason: 'invalid JSON body' }, 400);
  }
  if (!payload || typeof payload !== 'object') {
    return json({ ok: false, reason: 'invalid JSON body' }, 400);
  }

  const { op: rawOp, ...rest } = payload;
  if (rawOp === undefined || rawOp === null || rawOp === '') {
    return json({ ok: false, reason: 'missing op' }, 400);
  }
  const op = String(rawOp);
  if (!VALID_OP.test(op)) {
    return json({ ok: false, reason: `invalid op "${op}", expected a code 0-9` }, 400);
  }

  const base = process.env.ESP32_BASE_URL?.replace(/\/+$/, '');
  if (!base) {
    return json({ ok: false, reason: 'ESP32_BASE_URL not set' }, 500);
  }

  let espRes: Response;
  try {
    espRes = await fetch(`${base}/cmd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rest, op }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (e) {
    return json({ ok: false, reason: 'ESP32 unreachable', error: String(e) }, 502);
  }

  let data: Record<string, unknown> = {};
  try {
    data = await espRes.json();
  } catch {
    data = {};
  }

  const ok = espRes.ok && data?.ok !== false;
  return json({ ok, proxied: true, status: espRes.status, esp32: data }, espRes.ok ? 200 : 502);
}

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
