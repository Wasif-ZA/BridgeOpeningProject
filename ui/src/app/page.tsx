'use client';

import { useEffect, useRef, useState } from 'react';

/** === Numeric command map (matches Arduino switch) ===
 *  0 is reserved for STOP/Ping.
 */
const CMD = {
  STOP: 0,
  AUTO: 1,
  MANUAL: 2,
  ESTOP: 3,
  RESET: 4,
  RAISE: 5,
  LOWER: 6,
  BOOMGATE_OPEN: 7,
  BOOMGATE_CLOSE: 8,
  RETARE: 9,
} as const;

type CodeNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type LogEntry = {
  t: string;     // human time
  epoch: number; // ms epoch
  code: number;  // numeric op
  ms: number;    // round-trip
  ok: boolean;   // request ok
  reply: string; // nano_reply if present
};

type LabelMap = Record<CodeNum, string>;

const DEFAULT_LABELS: LabelMap = {
  0: 'STOP / Ping',
  1: 'AUTO',
  2: 'MANUAL',
  3: 'E-STOP',
  4: 'RESET',
  5: 'RAISE',
  6: 'LOWER',
  7: 'BOOM OPEN',
  8: 'BOOM CLOSE',
  9: 'RE-TARE',
};

const LABELS_KEY = 'bridge-ui-labels-v1';

export default function BridgeControl() {
  /** --- UI State --- */
  const [online, setOnline] = useState(false);
  const [mock, setMock] = useState(false); // simulate when HW is away
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastAck, setLastAck] = useState('-');
  const [mode, setMode] = useState<'AUTO' | 'MANUAL' | 'IDLE'>('IDLE');

  // Hydration-safe labels: start with constants, then load localStorage after mount
  const [labels, setLabels] = useState<LabelMap>(DEFAULT_LABELS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LABELS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LabelMap>;
        setLabels(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LABELS_KEY, JSON.stringify(labels)); } catch {}
  }, [labels]);

  const [showLabelEditor, setShowLabelEditor] = useState(false);

  /** placeholders for future sensor tiles (wire to mech endpoints later) */
  const [sensors] = useState({
    bridge: 'Idle', // Open / Moving / Closed / Idle
    road: 'Clear',  // Clear / Blocked
    boat: 'Clear',  // Approaching / Cleared
  });

  /** manual interlock: movement (5/6/7/8) only in MANUAL */
  const interlockMoveDisabled = mode !== 'MANUAL';

  /** --- connectivity ping loop (StrictMode-safe, with abort + backoff, no log noise) --- */
  useEffect(() => {
    let disposed = false;
    let delay = 4000; // start period
    let inFlight = false;
    let timerId: number | undefined;

    const schedule = (ms: number) => {
      if (disposed) return;
      if (timerId) clearTimeout(timerId);
      timerId = window.setTimeout(run, ms);
    };

    const onVisibilityChange = () => {
      if (disposed) return;
      // when tab becomes visible, poke the loop immediately
      if (!document.hidden) schedule(0);
    };

    const run = async () => {
      if (disposed) return;

      // Avoid work when tab is hidden; check again soon
      if (document.hidden) {
        schedule(1000);
        return;
      }

      // Mock path: pretend healthy; fixed cadence
      if (mock) {
        setOnline(true);
        delay = 4000;
        schedule(delay);
        return;
      }

      if (inFlight) { // don't overlap requests
        schedule(delay);
        return;
      }

      inFlight = true;
      const ctrl = new AbortController();
      const timeoutMs = 2500;
      const timeoutId = window.setTimeout(() => ctrl.abort(), timeoutMs);

      try {
        // Use STOP as a no-op ping but call fetch directly (do NOT use sendCode -> no logging)
        const r = await fetch('/api/cmd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: String(CMD.STOP) }),
          signal: ctrl.signal,
        });
        setOnline(r.ok);
        // success → reset backoff
        delay = 4000;
      } catch {
        setOnline(false);
        // failure → exponential backoff (cap at 30s)
        delay = Math.min(30000, Math.round(delay * 1.7));
      } finally {
        clearTimeout(timeoutId);
        inFlight = false;
        schedule(delay);
      }
    };

    // kick off and subscribe to tab visibility
    schedule(0);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [mock]);

  /** --- keyboard shortcuts: press 1..9 to fire that code (0 = STOP) --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const num = Number(e.key) as CodeNum;
        const needsManual =
          num === CMD.RAISE ||
          num === CMD.LOWER ||
          num === CMD.BOOMGATE_OPEN ||
          num === CMD.BOOMGATE_CLOSE;
        if (needsManual && interlockMoveDisabled) return;
        void sendCode(num);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, interlockMoveDisabled]);

  /** --- core send (numeric only) --- */
  async function sendCode(code: CodeNum) {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    const now = Date.now();

    // mock path (for demos without hardware)
    if (mock) {
      await new Promise(r => setTimeout(r, 120));
      const ms = Math.round(performance.now() - t0);
      const reply = mockReply(code);
      // Log manual STOPs, but not ping (pings never reach here anyway)
      pushLog({ t: ts(now), epoch: now, code, ms, ok: true, reply });
      postSendSideEffects(code, reply);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: String(code) }),
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

  function postSendSideEffects(code: CodeNum, reply: string) {
    setLastAck(reply || '-');
    switch (code) {
      case CMD.AUTO: setMode('AUTO'); break;
      case CMD.MANUAL: setMode('MANUAL'); break;
      case CMD.STOP: setMode('IDLE'); break;
      case CMD.ESTOP:
        // If firmware latches e-stop, add a latched UI state here.
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
    <span style={styles.badge} suppressHydrationWarning>
      <strong style={{ opacity: .85 }}>{label}:</strong>&nbsp;{value}
    </span>
  );

  /** keypad order (1..9); 0 is provided in the toolbar as STOP/Ping */
  const keypadCodes: CodeNum[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div style={styles.page}>
      {/* Sticky E-Stop */}
      <header style={styles.estopBar}>
        <button
          onClick={() => sendCode(CMD.ESTOP)}
          style={styles.estopBtn}
          disabled={busy || disabledControls}
          aria-label="Emergency Stop"
          title="Hotkey: 3"
        >
          EMERGENCY STOP (3)
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
            <button onClick={() => sendCode(CMD.STOP)} style={styles.ghostBtn} disabled={busy || disabledControls} title="Hotkey: 0">
              <span suppressHydrationWarning>{labels[0]} (0)</span>
            </button>
            <button onClick={exportCSV} style={styles.ghostBtn}>Export CSV</button>
            <button onClick={() => setShowLabelEditor(s => !s)} style={styles.ghostBtn}>
              {showLabelEditor ? 'Close Labels' : 'Edit Labels'}
            </button>
          </div>
        </div>

        {/* Live status strip */}
        <div style={styles.statusStrip}>
          {badge('Mode', mode)}
          {badge('Bridge', sensors.bridge)}
          {badge('Road', sensors.road)}
          {badge('Boat', sensors.boat)}
          <span style={styles.badge} suppressHydrationWarning><strong>Last ACK:</strong>&nbsp;{lastAck}</span>
        </div>

        {/* QoL buttons */}
        <section style={styles.section}>
          <div style={styles.row}>
            <BigBtn label={`${labels[1]} (1)`} onClick={() => sendCode(1)} disabled={busy || disabledControls} />
            <BigBtn label={`${labels[2]} (2)`} onClick={() => sendCode(2)} disabled={busy || disabledControls} />
            <BigBtn label={`${labels[4]} (4)`} onClick={() => sendCode(4)} disabled={busy || disabledControls} />
          </div>

          <div style={styles.row}>
            <BigBtn
              label={`${labels[5]} (5)`}
              onClick={() => sendCode(5)}
              primary
              disabled={busy || disabledControls || interlockMoveDisabled}
              title={interlockMoveDisabled ? 'Blocked by interlock: switch to MANUAL' : 'Hotkey: 5'}
            />
            <BigBtn
              label={`${labels[6]} (6)`}
              onClick={() => sendCode(6)}
              disabled={busy || disabledControls || interlockMoveDisabled}
              title={interlockMoveDisabled ? 'Blocked by interlock: switch to MANUAL' : 'Hotkey: 6'}
            />
          </div>
        </section>

        {/* Numeric keypad 1..9 */}
        <section>
          <div style={styles.grid9}>
            {keypadCodes.map((c) => {
              const needsManual =
                c === CMD.RAISE ||
                c === CMD.LOWER ||
                c === CMD.BOOMGATE_OPEN ||
                c === CMD.BOOMGATE_CLOSE;
              return (
                <button
                  key={c}
                  style={styles.keyBtn}
                  disabled={busy || disabledControls || (needsManual && interlockMoveDisabled)}
                  title={(needsManual && interlockMoveDisabled) ? 'Blocked by interlock: switch to MANUAL' : `Hotkey: ${c}`}
                  onClick={() => {
                    if (needsManual && interlockMoveDisabled) return;
                    void sendCode(c);
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{c}</div>
                  <div style={{ fontSize: 12.5, opacity: .9, marginTop: 4 }} suppressHydrationWarning>
                    {labels[c]}
                  </div>
                </button>
              );
            })}
          </div>
          {showLabelEditor && (
            <LabelEditor labels={labels} onChange={setLabels} />
          )}
        </section>

        {/* Sensors (placeholders) */}
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

function LabelEditor({ labels, onChange }: { labels: LabelMap; onChange: (l: LabelMap) => void }) {
  return (
    <div style={styles.labelEditor}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Edit command labels (persisted)</div>
      <div style={styles.labelGrid}>
        {(Object.keys(labels) as unknown as CodeNum[]).map((k) => (
          <label key={k} style={styles.labelRow}>
            <span style={{ width: 28, textAlign: 'right', opacity: .8 }}>{k}</span>
            <input
              style={styles.labelInput}
              value={labels[k]}
              maxLength={24}
              onChange={(e) => onChange({ ...labels, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button style={styles.ghostBtn} onClick={() => onChange(DEFAULT_LABELS)}>Reset defaults</button>
      </div>
      <div style={{ fontSize: 12, opacity: .8, marginTop: 8 }}>
        Tip: Movement & boom (5/6/7/8) stay interlocked to MANUAL.
      </div>
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
  grid9: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 10, marginTop: 6 },
  keyBtn: { padding: 12, borderRadius: 12, background: '#121822', color: '#eaeff7', border: '1px solid #2a3545', textAlign: 'left' },
  labelEditor: { marginTop: 10, background: '#0f141b', border: '1px solid #223042', borderRadius: 12, padding: 12 },
  labelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 },
  labelRow: { display: 'flex', alignItems: 'center', gap: 8, background: '#0c1117', border: '1px solid #223042', borderRadius: 10, padding: '6px 8px' },
  labelInput: { flex: 1, background: 'transparent', color: '#eaeff7', border: '1px solid #2a3545', borderRadius: 8, padding: '6px 8px' },
};

/** === Utils === */
function ts(epochMs: number) {
  const d = new Date(epochMs);
  return d.toLocaleTimeString();
}

function mockReply(code: CodeNum) {
  switch (code) {
    case CMD.RAISE: return 'ACK RAISE';
    case CMD.LOWER: return 'ACK LOWER';
    case CMD.STOP: return 'ACK STOP';
    case CMD.AUTO: return 'ACK AUTO';
    case CMD.MANUAL: return 'ACK MANUAL';
    case CMD.ESTOP: return 'ACK ESTOP';
    case CMD.RESET: return 'ACK RESET';
    case CMD.RETARE: return 'ACK RETARE';
    case CMD.BOOMGATE_OPEN: return 'ACK BOOM OPEN';
    case CMD.BOOMGATE_CLOSE: return 'ACK BOOM CLOSE';
    default: return 'ACK';
  }
}
