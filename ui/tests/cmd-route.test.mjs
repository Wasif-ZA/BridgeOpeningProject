import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/cmd/route.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.ESP32_BASE_URL;
});

const req = (body) =>
  new Request('http://localhost/api/cmd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('rejects invalid JSON with 400', async () => {
  const res = await POST(req('{not json'));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).reason, 'invalid JSON body');
});

test('rejects missing op with 400', async () => {
  const res = await POST(req({}));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).reason, 'missing op');
});

test('rejects op outside 0-9 with 400', async () => {
  for (const op of ['FORWARD', '10', -1, '5; rm']) {
    const res = await POST(req({ op }));
    assert.equal(res.status, 400, `op ${op}`);
  }
});

test('returns 500 when ESP32_BASE_URL is not set', async () => {
  const res = await POST(req({ op: '0' }));
  assert.equal(res.status, 500);
  assert.equal((await res.json()).reason, 'ESP32_BASE_URL not set');
});

test('forwards op as a string and surfaces nano_reply', async () => {
  process.env.ESP32_BASE_URL = 'http://esp.test/';
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, body: JSON.parse(init.body) };
    return Response.json({ ok: true, op: '5', nano_reply: 'ACK RAISE' });
  };
  const res = await POST(req({ op: 5 }));
  assert.equal(res.status, 200);
  assert.deepEqual(seen, { url: 'http://esp.test/cmd', body: { op: '5' } });
  const j = await res.json();
  assert.equal(j.ok, true);
  assert.equal(j.esp32.nano_reply, 'ACK RAISE');
});

test('reports ok:false when ESP32 answers but the actuator is silent', async () => {
  process.env.ESP32_BASE_URL = 'http://esp.test';
  globalThis.fetch = async () => Response.json({ ok: false, op: '5', nano_reply: '' });
  const res = await POST(req({ op: '5' }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, false);
});

test('maps upstream HTTP errors to 502', async () => {
  process.env.ESP32_BASE_URL = 'http://esp.test';
  globalThis.fetch = async () => new Response('boom', { status: 500 });
  const res = await POST(req({ op: '0' }));
  assert.equal(res.status, 502);
  assert.equal((await res.json()).ok, false);
});

test('maps network failures to 502', async () => {
  process.env.ESP32_BASE_URL = 'http://esp.test';
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  const res = await POST(req({ op: '0' }));
  assert.equal(res.status, 502);
  assert.equal((await res.json()).reason, 'ESP32 unreachable');
});
