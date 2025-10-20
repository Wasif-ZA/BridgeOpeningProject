'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** === Numeric command map (match Anna's firmware) === */
const CMD = {
  STOP: 0,
  AUTO: 1,
  MANUAL: 2,
  FORWARD: 5,
  BACKWARD: 6,
  ESTOP: 9,
} as const;

type LogEntry = {
  t: string;             // human time
  epoch: number;         // ms epoch
  code: number;          // numeric op
  ms: number;            // round-trip
  ok: boolean;           // request ok
  reply: string;         // nano_reply if present
};

export default function BridgeControl() {
  /** --- UI State --- */
  const [online, setOnline] = useState<boolean>(false);
  const [mock, setMock] = useState<boolean>(false);       // simulate when HW is away
  const [busy, setBusy] = useState<boolean>(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastAck, setLastAck] = useState<string>('-');
  const [mode, setMode] = useState<'AUTO' | 'MANUAL' | 'IDLE'>('IDLE');

  /** placeholders for future sensor tiles (safe to keep for Mech handoff) */
  const [sensors, setSensors] = useState({
    bridge: 'Idle',     // Open / Moving / Closed / Idle
    road: 'Clear',      // Clear / Blocked
    boat: 'Clear',      // Approaching / Cleared
  });

  /** simple interlock demo: disable forward/back if not MANUAL */
  const interlockMoveDisabled = mode !== 'MANUAL';

  /** --- connectivity ping every 4s (uses STOP=0 as a no-op ping) --- */
  useEffect(() => {
    let alive = true;
    async function ping() {
      if (mock) { setOnline(true); if (alive) setTimeout(ping, 4000); return; }
      try {
        const r = await fetch('/api/cmd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: String(CMD.STOP) })
        });
        setOnline(r.ok);
      } catch {
        setOnline(false);
      }
      if (alive) setTimeout(ping, 4000);
    }
    ping();
    return () => { alive = false; };
  }, [mock]);

  /** --- core send (numeric only) --- */
  async function sendCode(code: number) {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    const now = Date.now();

    // mock path (for demos without hardware)
    if (mock) {
      await new Promise(r => setTimeout(r, 120));
      const ms = Math.round(performance.now() - t0);
      const reply = mockReply(code);
      pushLog({ t: ts(now), epoch: now, code, ms, ok: true, reply });
      postSendSideEffects(code, reply);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: String(code) })
      });

      const ms = Math.round(performance.now() - t0);
      const j = await res.json().catch(() => ({} as any));
      const ok = res.ok && (j?.ok ?? true);
      const reply: string = j?.esp32?.nano_reply ?? j?.nano_reply ?? '';

      pushLog({ t: ts(now), epoch: now, code, ms, ok, reply });
      postSendSideEffects(code, reply);
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      pushLog({ t: ts(now), epoch: now, code, ms, ok: false, reply: String(e) });
    } finally {
      setBusy(false);
    }
  }

  function postSendSideEffects(code: number, reply: string) {
    setLastAck(reply || '-');
    switch (code) {
      case CMD.AUTO: setMode('AUTO'); break;
      case CMD.MANUAL: setMode('MANUAL'); break;
      case CMD.STOP: if (mode === 'IDLE') setMode('IDLE'); break;
      case CMD.ESTOP:
        // briefly lock UI look; you can expand this if Mech exposes a latched state
        break;
    }
  }

  function pushLog(entry: LogEntry) {
    setLog(prev => [entry, ...prev].slice(0, 500)); // keep last 500
  }

  /** --- CSV export of the log --- */
  function exportCSV() {
    const header = 'time,epoch_ms,code,ms,ok,reply\n';
    const rows = log
      .slice()
      .reverse()
      .map(e => `${e.t},${e.epoch},${e.code},${e.ms},${e.ok ? '1' : '0'},"${(e.reply || '').replace(/"/g, '""')}"`)
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bridge-ui-log-${new Date().toISOString().slice(0,19)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  /** --- UI helpers --- */
  const disabledControls = !online && !mock;
  const badge = (label: string, value: string) => (
    <span style={styles.badge}>
      <strong style={{ opacity: .85 }}>{label}:</strong>&nbsp;{value}
    </span>
  );

  return (
    <div style={styles.page}>
      {/* Sticky E-Stop */}
      <header style={styles.estopBar}>
        <button
          onClick={() => sendCode(CMD.ESTOP)}
          style={styles.estopBtn}
          disabled={busy || disabledControls}
          aria-label="Emergency Stop"
        >
          EMERGENCY STOP (9)
        </button>
      </header>

      {/* Title + toolbar */}
      <div style={styles.wrap}>
        <div style={styles.toolbar}>
          <h2 style={{ margin: 0 }}>Bridge Control (UNO)</h2>
          <div style={styles.toolbarRight}>
            <StatusDot ok={online || mock} label={mock ? 'Mock' : (online ? 'Online' : 'Offline')} />
            <label style={styles.switchLabel}>
              <input type="checkbox" checked={mock} onChange={e => setMock(e.target.checked)} />
              <span>Mock mode</span>
            </label>
            <button onClick={exportCSV} style={styles.ghostBtn}>Export CSV</button>
          </div>
        </div>

        {/* Live status strip */}
        <div style={styles.statusStrip}>
          {badge('Mode', mode)}
          {badge('Bridge', sensors.bridge)}
          {badge('Road', sensors.road)}
          {badge('Boat', sensors.boat)}
          <span style={styles.badge}><strong>Last ACK:</strong>&nbsp;{lastAck}</span>
        </div>

        {/* Controls */}
        <section style={styles.section}>
          <div style={styles.row}>
            <BigBtn label={`Auto (${CMD.AUTO})`} onClick={() => sendCode(CMD.AUTO)} disabled={busy || disabledControls} />
            <BigBtn label={`Manual (${CMD.MANUAL})`} onClick={() => sendCode(CMD.MANUAL)} disabled={busy || disabledControls} />
            <BigBtn label={`Stop (${CMD.STOP})`} onClick={() => sendCode(CMD.STOP)} disabled={busy || disabledControls} />
          </div>

          <div style={styles.row}>
            <BigBtn
              label={`Forward (${CMD.FORWARD})`}
              onClick={() => sendCode(CMD.FORWARD)}
              primary
              disabled={busy || disabledControls || interlockMoveDisabled}
              title={interlockMoveDisabled ? 'Blocked by interlock: switch to MANUAL' : ''}
            />
            <BigBtn
              label={`Backward (${CMD.BACKWARD})`}
              onClick={() => sendCode(CMD.BACKWARD)}
              disabled={busy || disabledControls || interlockMoveDisabled}
              title={interlockMoveDisabled ? 'Blocked by interlock: switch to MANUAL' : ''}
            />
          </div>
        </section>

        {/* Sensors (placeholders; wire later when Mech exposes endpoints) */}
        <section style={styles.tiles}>
          <Tile title="Ultrasonic" value="— cm" />
          <Tile title="Load Cell" value="— g" />
          <Tile title="Limit Switch" value="—" />
        </section>

        {/* Log */}
        <section>
          <div style={styles.logHeader}>
            <strong>Command Log</strong>
            <small style={{ opacity: .7 }}> newest first</small>
          </div>
          <LogView entries={log} />
        </section>
      </div>
    </div>
  );
}

/** === Components === */

function BigBtn(props: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; title?: string }) {
  const base = props.primary ? styles.primaryBtn : styles.ghostBtn;
  return (
    <button onClick={props.onClick} disabled={props.disabled} style={base} title={props.title}>
      {props.label}
    </button>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={styles.dotWrap}>
      <span style={{ ...styles.dot, background: ok ? '#20c997' : '#b00020' }} />
      <span>{label}</span>
    </span>
  );
}

function Tile({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 13, opacity: .8 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function LogView({ entries }: { entries: LogEntry[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // keep height stable; content overflows scroll
    if (boxRef.current) boxRef.current.scrollTop = 0;
  }, [entries.length]);

  return (
    <div ref={boxRef} style={styles.logBox} aria-live="polite">
      {entries.length === 0 ? (
        <div style={{ opacity: .7 }}>No commands yet.</div>
      ) : (
        entries.map((e, i) => (
          <div key={i} style={styles.logRow}>
            <span style={styles.logTime}>{e.t}</span>
            <span style={styles.logMs}>{e.ms}ms</span>
            <span style={styles.logCode}>code={e.code}</span>
            <span style={{ color: e.ok ? '#20c997' : '#ff6b6b' }}>{e.ok ? 'ok' : 'err'}</span>
            {e.reply ? <span style={styles.logReply}>reply: {e.reply}</span> : null}
          </div>
        ))
      )}
    </div>
  );
}

/** === Styles === */
const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'system-ui, Segoe UI, Arial', background: '#0b0f14', color: '#fff', minHeight: '100dvh' },
  wrap: { maxWidth: 920, margin: '0 auto', padding: 20, display: 'grid', gap: 16 },
  estopBar: { position: 'sticky', top: 0, zIndex: 50, background: '#141a22', padding: '8px 12px', borderBottom: '1px solid #202834' },
  estopBtn: { width: '100%', padding: '12px 16px', border: 0, borderRadius: 12, fontWeight: 800, background: '#b00020', color: '#fff' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  switchLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: .9 },
  statusStrip: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge: { fontSize: 12.5, background: '#1a212c', border: '1px solid #2a3545', borderRadius: 999, padding: '6px 10px' },
  section: { display: 'grid', gap: 10 },
  row: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  primaryBtn: { padding: '14px 16px', border: 0, borderRadius: 12, fontWeight: 700, background: '#ff7a1a', color: '#111', minWidth: 160 },
  ghostBtn: { padding: '14px 16px', borderRadius: 12, fontWeight: 700, background: '#1a212c', color: '#eaeff7', border: '1px solid #2a3545', minWidth: 160 },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 },
  card: { background: '#0f141b', border: '1px solid #223042', borderRadius: 12, padding: 12 },
  logHeader: { display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 },
  logBox: { background: '#0f141b', border: '1px solid #223042', borderRadius: 12, padding: 12, maxHeight: 280, overflow: 'auto' },
  dotWrap: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#1a212c', border: '1px solid #2a3545', borderRadius: 999, fontSize: 12.5 },
  dot: { width: 8, height: 8, borderRadius: 999, display: 'inline-block' },
  logRow: { display: 'grid', gap: 10, gridTemplateColumns: 'auto auto auto auto 1fr', borderBottom: '1px dashed #1f2a39', padding: '6px 0' },
  logTime: { opacity: .8 },
  logMs: { opacity: .8 },
  logCode: { fontWeight: 600 },
  logReply: { opacity: .9 },
};

/** === Utils === */
function ts(epochMs: number) {
  const d = new Date(epochMs);
  return d.toLocaleTimeString();
}

function mockReply(code: number) {
  switch (code) {
    case CMD.FORWARD: return 'ACK FORWARD';
    case CMD.BACKWARD: return 'ACK BACKWARD';
    case CMD.STOP: return 'ACK STOP';
    case CMD.AUTO: return 'ACK AUTO';
    case CMD.MANUAL: return 'ACK MANUAL';
    case CMD.ESTOP: return 'ACK ESTOP';
    default: return 'ACK';
  }
}
