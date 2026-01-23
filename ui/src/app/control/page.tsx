'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

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

// Icons as simple SVG components
const IconWifi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const IconActivity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconArrowUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const IconArrowDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function BridgeControl() {
  /** --- UI State --- */
  const [online, setOnline] = useState(false);
  const [mock, setMock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastAck, setLastAck] = useState('-');
  const [mode, setMode] = useState<'AUTO' | 'MANUAL' | 'IDLE'>('IDLE');

  const [labels, setLabels] = useState<LabelMap>(DEFAULT_LABELS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LABELS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LabelMap>;
        setLabels(prev => ({ ...prev, ...parsed }));
      }
    } catch { }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LABELS_KEY, JSON.stringify(labels)); } catch { }
  }, [labels]);

  const [showLabelEditor, setShowLabelEditor] = useState(false);

  const [sensors] = useState({
    bridge: 'Idle',
    road: 'Clear',
    boat: 'Clear',
  });

  const interlockMoveDisabled = mode !== 'MANUAL';

  /** --- connectivity ping loop --- */
  useEffect(() => {
    let disposed = false;
    let delay = 4000;
    let inFlight = false;
    let timerId: number | undefined;

    const schedule = (ms: number) => {
      if (disposed) return;
      if (timerId) clearTimeout(timerId);
      timerId = window.setTimeout(run, ms);
    };

    const onVisibilityChange = () => {
      if (disposed) return;
      if (!document.hidden) schedule(0);
    };

    const run = async () => {
      if (disposed) return;

      if (document.hidden) {
        schedule(1000);
        return;
      }

      if (mock) {
        setOnline(true);
        delay = 4000;
        schedule(delay);
        return;
      }

      if (inFlight) {
        schedule(delay);
        return;
      }

      inFlight = true;
      const ctrl = new AbortController();
      const timeoutMs = 2500;
      const timeoutId = window.setTimeout(() => ctrl.abort(), timeoutMs);

      try {
        const r = await fetch('/api/cmd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: String(CMD.STOP) }),
          signal: ctrl.signal,
        });
        setOnline(r.ok);
        delay = 4000;
      } catch {
        setOnline(false);
        delay = Math.min(30000, Math.round(delay * 1.7));
      } finally {
        clearTimeout(timeoutId);
        inFlight = false;
        schedule(delay);
      }
    };

    schedule(0);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [mock]);

  /** --- core send (memoized) --- */
  const pushLog = useCallback((entry: LogEntry) => {
    setLog(prev => [entry, ...prev].slice(0, 500));
  }, []);

  const postSendSideEffects = useCallback((code: CodeNum, reply: string) => {
    setLastAck(reply || '-');
    switch (code) {
      case CMD.AUTO: setMode('AUTO'); break;
      case CMD.MANUAL: setMode('MANUAL'); break;
      case CMD.STOP: setMode('IDLE'); break;
      case CMD.ESTOP:
        break;
    }
  }, []);

  const sendCode = useCallback(async (code: CodeNum) => {
    if (busy) return;
    setBusy(true);
    const t0 = performance.now();
    const now = Date.now();

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
        body: JSON.stringify({ op: String(code) }),
      });

      const ms = Math.round(performance.now() - t0);
      const j = await res.json().catch(() => ({} as Record<string, unknown>));
      const ok = res.ok && (j?.ok ?? true);
      const reply: string =
        (j?.esp32 as Record<string, unknown>)?.nano_reply as string ??
        j?.nano_reply as string ??
        '';

      pushLog({ t: ts(now), epoch: now, code, ms, ok, reply });
      postSendSideEffects(code, reply);
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      pushLog({ t: ts(now), epoch: now, code, ms, ok: false, reply: String(e) });
    } finally {
      setBusy(false);
    }
  }, [busy, mock, pushLog, postSendSideEffects]);

  /** --- keyboard shortcuts --- */
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
  }, [busy, interlockMoveDisabled, sendCode]);



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
    a.href = url; a.download = `bridge-ui-log-${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const disabledControls = !online && !mock;

  const getModeColor = () => {
    switch (mode) {
      case 'AUTO': return 'var(--accent-cyan)';
      case 'MANUAL': return 'var(--accent-amber)';
      default: return 'var(--muted)';
    }
  };

  return (
    <div style={styles.page}>
      {/* Global theme + animations */}
      <style>{`
        :root{
          --bp:#061a2b;
          --ink:#d9f2ff;
          --muted:#8fb6c8;
          --panel:#041625;
          --panel2:#03101c;
          --line: rgba(0,229,255,0.18);
          --line2: rgba(255,255,255,0.08);

          --accent-cyan:#00e5ff;
          --accent-amber:#ffd400;
          --accent-danger:#ff3b3b;
          --accent-success:#2bfca7;

          --shadow: rgba(0,0,0,0.45);
        }

        /* blueprint background */
        .bp-grid {
          background:
            radial-gradient(circle at 20% 10%, rgba(0,229,255,0.10), transparent 40%),
            radial-gradient(circle at 85% 18%, rgba(255,212,0,0.10), transparent 45%),
            linear-gradient(transparent 31px, rgba(0,229,255,0.07) 32px),
            linear-gradient(90deg, transparent 31px, rgba(0,229,255,0.07) 32px),
            linear-gradient(transparent 7px, rgba(0,229,255,0.04) 8px),
            linear-gradient(90deg, transparent 7px, rgba(0,229,255,0.04) 8px);
          background-size: auto, auto, 32px 32px, 32px 32px, 8px 8px, 8px 8px;
        }

        .grain {
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 3px 3px;
          mix-blend-mode: overlay;
          opacity: 0.30;
        }

        /* panel frame */
        .panel{
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(4,22,37,0.92), rgba(3,16,28,0.92));
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.45) inset,
            0 10px 0 rgba(0,0,0,0.25),
            0 18px 50px rgba(0,0,0,0.45);
        }
        .panel:before{
          content:"";
          position:absolute;
          inset:10px;
          border: 1px dashed var(--line2);
          border-radius: 12px; /* ✅ fixes corner */
          pointer-events:none;
        }

        .bolt{
          width:10px;height:10px;border-radius:3px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--line);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.45) inset;
          position:absolute;
        }
        .b1{top:12px;left:12px}
        .b2{top:12px;right:12px}
        .b3{bottom:12px;left:12px}
        .b4{bottom:12px;right:12px}

        .strip{
          display:flex; align-items:center; justify-content:space-between;
          gap:12px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--line);
          background: linear-gradient(90deg, rgba(0,229,255,0.09), rgba(255,212,0,0.06));
        }
        .strip small{
          color: rgba(143,182,200,0.95);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 900;
          font-size: 11px;
        }
        .led { display:flex; gap:8px; align-items:center; }
        .dot{
          width:9px;height:9px;border-radius:999px;
          background: rgba(0,229,255,0.35);
          box-shadow: 0 0 12px rgba(0,229,255,0.35);
          border: 1px solid rgba(255,255,255,0.10);
        }
        .dot.warn{
          background: rgba(255,212,0,0.55);
          box-shadow: 0 0 12px rgba(255,212,0,0.35);
        }

        /* hazard button (clean stripes on border only) */
        .hazardBtn{
          border: 2px solid transparent;
          background:
            linear-gradient(180deg, rgba(255,212,0,1), rgba(255,212,0,0.92)) padding-box,
            repeating-linear-gradient(135deg, rgba(255,212,0,1) 0px, rgba(255,212,0,1) 10px, rgba(0,0,0,0.90) 10px, rgba(0,0,0,0.90) 20px) border-box;
          box-shadow: 0 10px 0 rgba(0,0,0,0.35), 0 24px 50px rgba(0,0,0,0.35);
        }

        .pressable{
          transform: translateY(0);
          transition: transform 0.12s ease, filter 0.12s ease;
        }
        .pressable:not(:disabled):hover{ transform: translateY(-1px); filter: brightness(1.03); }
        .pressable:not(:disabled):active{ transform: translateY(0); filter: brightness(0.97); }

        .softHover{ transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease; }
        .softHover:not(:disabled):hover{ transform: translateY(-1px); }
        .softHover:not(:disabled):active{ transform: translateY(0); }

        @keyframes pulseGlow {
          0%,100%{ box-shadow: 0 0 0 rgba(255,59,59,0.0), 0 10px 0 rgba(0,0,0,0.35); }
          50%{ box-shadow: 0 0 26px rgba(255,59,59,0.25), 0 10px 0 rgba(0,0,0,0.35); }
        }
      `}</style>

      {/* Background */}
      <div style={styles.bg} className="bp-grid" />
      <div style={styles.grain} className="grain" />

      {/* Emergency Stop Header */}
      <header style={styles.estopBar}>
        <div style={styles.estopBarInner}>
          <div style={styles.estopStripes} />
          <button
            onClick={() => sendCode(CMD.ESTOP)}
            className="pressable"
            style={{
              ...styles.estopBtn,
              opacity: busy || disabledControls ? 0.5 : 1,
              cursor: busy || disabledControls ? 'not-allowed' : 'pointer',
            }}
            disabled={busy || disabledControls}
            aria-label="Emergency Stop"
            title="Hotkey: 3"
          >
            <IconAlertTriangle />
            <span style={{ marginLeft: 8 }}>EMERGENCY STOP</span>
            <span style={styles.hotkeyBadge}>3</span>
          </button>
          <div style={styles.estopStripes} />
        </div>
      </header>

      <div style={styles.wrap}>
        {/* Header Panel */}
        <section className="panel" style={styles.panel}>
          <div className="bolt b1" /><div className="bolt b2" /><div className="bolt b3" /><div className="bolt b4" />
          <div className="strip">
            <small>CONTROL PANEL • UNO INTERFACE</small>
            <div className="led">
              <span className="dot" />
              <span className={`dot ${mode === 'MANUAL' ? 'warn' : ''}`} />
              <span className="dot" />
            </div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.headerTop}>
              <div>
                <h1 style={styles.title}>Bridge Control</h1>
                <p style={styles.subtitle}>Command + telemetry console</p>
              </div>

              <div style={styles.headerActions}>
                <StatusIndicator ok={online || mock} mock={mock} />

                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={mock}
                    onChange={e => setMock(e.target.checked)}
                    style={styles.toggleInput}
                  />
                  <span style={styles.toggleSwitch} className="softHover">
                    <span style={{
                      ...styles.toggleKnob,
                      transform: mock ? 'translateX(20px)' : 'translateX(2px)',
                    }} />
                  </span>
                  <span style={styles.toggleText}>Mock</span>
                </label>
              </div>
            </div>

            {/* Status Badges */}
            <div style={styles.statusRow}>
              <StatusBadge label="Mode" value={mode} color={getModeColor()} glow />
              <StatusBadge label="Bridge" value={sensors.bridge} />
              <StatusBadge label="Road" value={sensors.road} />
              <StatusBadge label="Boat" value={sensors.boat} />
              <StatusBadge label="Last ACK" value={lastAck} mono />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="panel" style={styles.panel}>
          <div className="bolt b1" /><div className="bolt b2" /><div className="bolt b3" /><div className="bolt b4" />
          <div className="strip">
            <small>SECTION A • MODE + SAFE ACTIONS</small>
            <div className="led"><span className="dot" /><span className="dot" /><span className="dot warn" /></div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.quickActions}>
              <ActionButton
                label={labels[1]}
                hotkey="1"
                onClick={() => sendCode(1)}
                disabled={busy || disabledControls}
                variant={mode === 'AUTO' ? 'active' : 'secondary'}
              />
              <ActionButton
                label={labels[2]}
                hotkey="2"
                onClick={() => sendCode(2)}
                disabled={busy || disabledControls}
                variant={mode === 'MANUAL' ? 'active' : 'secondary'}
              />
              <ActionButton
                label={labels[4]}
                hotkey="4"
                onClick={() => sendCode(4)}
                disabled={busy || disabledControls}
                variant="secondary"
              />
              <ActionButton
                label={labels[0]}
                hotkey="0"
                onClick={() => sendCode(0)}
                disabled={busy || disabledControls}
                variant="secondary"
              />
            </div>
          </div>
        </section>

        {/* Movement Controls */}
        <section className="panel" style={styles.panel}>
          <div className="bolt b1" /><div className="bolt b2" /><div className="bolt b3" /><div className="bolt b4" />
          <div className="strip">
            <small>SECTION B • MOVEMENT CONTROLS</small>
            <div className="led"><span className="dot warn" /><span className="dot" /><span className="dot" /></div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.sectionTitleRow}>
              <h3 style={styles.sectionTitle}>
                <IconActivity /> Movement
              </h3>
              {interlockMoveDisabled && (
                <span style={styles.lockBadge}>🔒 MANUAL mode required</span>
              )}
            </div>

            <div style={styles.movementGrid}>
              <MovementButton
                label={labels[5]}
                hotkey="5"
                icon={<IconArrowUp />}
                onClick={() => sendCode(5)}
                disabled={busy || disabledControls || interlockMoveDisabled}
                variant="raise"
              />
              <MovementButton
                label={labels[6]}
                hotkey="6"
                icon={<IconArrowDown />}
                onClick={() => sendCode(6)}
                disabled={busy || disabledControls || interlockMoveDisabled}
                variant="lower"
              />
              <MovementButton
                label={labels[7]}
                hotkey="7"
                onClick={() => sendCode(7)}
                disabled={busy || disabledControls || interlockMoveDisabled}
                variant="boom"
              />
              <MovementButton
                label={labels[8]}
                hotkey="8"
                onClick={() => sendCode(8)}
                disabled={busy || disabledControls || interlockMoveDisabled}
                variant="boom"
              />
            </div>
          </div>
        </section>

        {/* Keypad + Tools */}
        <section className="panel" style={styles.panel}>
          <div className="bolt b1" /><div className="bolt b2" /><div className="bolt b3" /><div className="bolt b4" />
          <div className="strip">
            <small>SECTION C • COMMAND KEYPAD</small>
            <div className="led"><span className="dot" /><span className="dot warn" /><span className="dot" /></div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.keypadHeader}>
              <h3 style={styles.sectionTitle}>Keypad (1–9)</h3>
              <div style={styles.keypadActions}>
                <button onClick={exportCSV} style={styles.smallBtn} className="softHover">Export CSV</button>
                <Link href="/" style={styles.smallBtn} className="softHover">Home</Link>
                <button
                  onClick={() => setShowLabelEditor(s => !s)}
                  style={styles.smallBtn}
                  className="softHover"
                >
                  {showLabelEditor ? 'Close' : 'Edit Labels'}
                </button>
              </div>
            </div>

            <div style={styles.keypadGrid}>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as CodeNum[]).map((c) => {
                const needsManual =
                  c === CMD.RAISE ||
                  c === CMD.LOWER ||
                  c === CMD.BOOMGATE_OPEN ||
                  c === CMD.BOOMGATE_CLOSE;
                const isDisabled = busy || disabledControls || (needsManual && interlockMoveDisabled);

                return (
                  <button
                    key={c}
                    className="softHover"
                    style={{
                      ...styles.keyBtn,
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      borderColor: needsManual ? 'rgba(255,212,0,0.22)' : 'rgba(0,229,255,0.18)',
                    }}
                    disabled={isDisabled}
                    title={needsManual && interlockMoveDisabled ? 'Requires MANUAL mode' : `Hotkey: ${c}`}
                    onClick={() => {
                      if (!isDisabled) void sendCode(c);
                    }}
                  >
                    <span style={styles.keyNum}>{c}</span>
                    <span style={styles.keyLabel} suppressHydrationWarning>
                      {labels[c]}
                    </span>
                  </button>
                );
              })}
            </div>

            {showLabelEditor && (
              <LabelEditor labels={labels} onChange={setLabels} />
            )}
          </div>
        </section>

        {/* Sensors */}
        <section className="panel" style={styles.panel}>
          <div className="bolt b1" /><div className="bolt b2" /><div className="bolt b3" /><div className="bolt b4" />
          <div className="strip">
            <small>SECTION D • SENSOR READINGS</small>
            <div className="led"><span className="dot" /><span className="dot" /><span className="dot" /></div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.sensorGrid}>
              <SensorTile title="Ultrasonic" value="—" unit="cm" icon="📡" />
              <SensorTile title="Load Cell" value="—" unit="g" icon="⚖️" />
              <SensorTile title="Limit Switch" value="—" unit="" icon="🔘" />
            </div>
          </div>
        </section>

        {/* Log */}
        <section className="panel" style={styles.panel}>
          <div className="bolt b1" /><div className="bolt b2" /><div className="bolt b3" /><div className="bolt b4" />
          <div className="strip">
            <small>SECTION E • COMMAND LOG</small>
            <div className="led"><span className="dot" /><span className="dot warn" /><span className="dot" /></div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.logHeader}>
              <h3 style={styles.sectionTitle}>Log</h3>
              <span style={styles.logMeta}>{log.length} entries · newest first</span>
            </div>
            <LogView entries={log} />
          </div>
        </section>

        {/* Bottom nav */}
        <div style={styles.bottomNav}>
          <Link href="/" style={styles.bottomLink} className="softHover">
            ← Project Demonstration
          </Link>
          <a
            href="https://github.com/Wasif-ZA/BridgeOpeningProject"
            target="_blank"
            rel="noreferrer"
            style={styles.bottomLink}
            className="softHover"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}

/** === Components === */

function StatusIndicator({ ok, mock }: { ok: boolean; mock: boolean }) {
  const color = ok ? 'var(--accent-success)' : 'var(--accent-danger)';
  return (
    <div style={{
      ...styles.statusIndicator,
      borderColor: color,
      boxShadow: ok
        ? '0 0 16px rgba(43,252,167,0.18)'
        : '0 0 16px rgba(255,59,59,0.18)',
    }}>
      <span style={{
        ...styles.statusDot,
        background: color,
      }} />
      <IconWifi />
      <span>{mock ? 'Mock' : ok ? 'Online' : 'Offline'}</span>
    </div>
  );
}

function StatusBadge({
  label,
  value,
  color,
  glow,
  mono
}: {
  label: string;
  value: string;
  color?: string;
  glow?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{
      ...styles.badge,
      borderColor: color || 'rgba(0,229,255,0.18)',
      boxShadow: glow && color ? `0 0 14px ${String(color)}33` : undefined,
    }}>
      <span style={styles.badgeLabel}>{label}</span>
      <span style={{
        ...styles.badgeValue,
        color: color || 'var(--ink)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' : undefined,
      }} suppressHydrationWarning>
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  hotkey,
  onClick,
  disabled,
  variant = 'secondary'
}: {
  label: string;
  hotkey: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'active';
}) {
  const baseStyle = variant === 'primary'
    ? styles.btnPrimary
    : variant === 'active'
      ? styles.btnActive
      : styles.btnSecondary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="softHover"
      style={{
        ...baseStyle,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={`Hotkey: ${hotkey}`}
    >
      <span>{label}</span>
      <span style={styles.hotkeyTag}>{hotkey}</span>
    </button>
  );
}

function MovementButton({
  label,
  hotkey,
  icon,
  onClick,
  disabled,
  variant
}: {
  label: string;
  hotkey: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant: 'raise' | 'lower' | 'boom';
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    raise: {
      background:
        'linear-gradient(180deg, rgba(16,185,129,0.95), rgba(5,150,105,0.85))',
      border: '1px solid rgba(43,252,167,0.25)',
    },
    lower: {
      background:
        'linear-gradient(180deg, rgba(245,158,11,0.95), rgba(217,119,6,0.85))',
      border: '1px solid rgba(255,212,0,0.25)',
    },
    boom: {
      background:
        'linear-gradient(180deg, rgba(99,102,241,0.95), rgba(79,70,229,0.85))',
      border: '1px solid rgba(0,229,255,0.18)',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pressable"
      style={{
        ...styles.movementBtn,
        ...variantStyles[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={disabled ? 'Requires MANUAL mode' : `Hotkey: ${hotkey}`}
    >
      {icon && <span style={styles.movementIcon}>{icon}</span>}
      <span style={styles.movementLabel}>{label}</span>
      <span style={styles.movementHotkey}>{hotkey}</span>
    </button>
  );
}

function SensorTile({ title, value, unit, icon }: { title: string; value: string; unit: string; icon: string }) {
  return (
    <div style={styles.sensorCard} className="softHover">
      <div style={styles.sensorIcon}>{icon}</div>
      <div style={styles.sensorInfo}>
        <span style={styles.sensorTitle}>{title}</span>
        <span style={styles.sensorValue}>
          {value}
          {unit && <span style={styles.sensorUnit}>{unit}</span>}
        </span>
      </div>
    </div>
  );
}

function LogView({ entries }: { entries: LogEntry[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = 0;
  }, [entries.length]);

  return (
    <div ref={boxRef} style={styles.logBox} aria-live="polite">
      {entries.length === 0 ? (
        <div style={styles.logEmpty}>No commands yet. Click a button or press 0-9.</div>
      ) : (
        entries.map((e, i) => (
          <div key={`${e.epoch}-${i}`} style={styles.logRow}>
            <span style={styles.logTime}>{e.t}</span>
            <span style={styles.logMs}>{e.ms}ms</span>
            <span style={styles.logCode}>CMD {e.code}</span>
            <span style={{
              ...styles.logStatus,
              color: e.ok ? 'var(--accent-success)' : 'var(--accent-danger)',
              background: e.ok ? 'rgba(43,252,167,0.10)' : 'rgba(255,59,59,0.10)',
              borderColor: e.ok ? 'rgba(43,252,167,0.20)' : 'rgba(255,59,59,0.20)',
            }}>
              {e.ok ? '✓ OK' : '✗ ERR'}
            </span>
            {e.reply && <span style={styles.logReply}>{e.reply}</span>}
          </div>
        ))
      )}
    </div>
  );
}

function LabelEditor({ labels, onChange }: { labels: LabelMap; onChange: (l: LabelMap) => void }) {
  return (
    <div style={styles.labelEditor}>
      <div style={styles.labelEditorHeader}>
        <span style={{ fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12, color: 'rgba(143,182,200,0.95)' }}>
          Edit Labels
        </span>
        <button onClick={() => onChange(DEFAULT_LABELS)} style={styles.resetBtn} className="softHover">
          Reset
        </button>
      </div>
      <div style={styles.labelGrid}>
        {(Object.keys(labels) as unknown as CodeNum[]).map((k) => (
          <label key={k} style={styles.labelRow}>
            <span style={styles.labelNum}>{k}</span>
            <input
              style={styles.labelInput}
              value={labels[k]}
              maxLength={24}
              onChange={(e) => onChange({ ...labels, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** === Styles === */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: 'var(--bp)',
    position: 'relative',
    overflowX: 'hidden',
    color: 'var(--ink)',
  },

  bg: { position: 'fixed', inset: 0, zIndex: 0 },
  grain: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' },

  wrap: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1000,
    margin: '0 auto',
    padding: '18px 16px 28px',
    display: 'grid',
    gap: 16,
  },

  panel: {},

  panelBody: { padding: 16 },

  // E-Stop Bar
  estopBar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    background: 'linear-gradient(180deg, rgba(3,16,28,0.92), rgba(3,16,28,0.78))',
    borderBottom: '1px solid rgba(255,59,59,0.35)',
    padding: '12px 16px',
  },
  estopBarInner: {
    maxWidth: 1000,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  estopStripes: {
    flex: 1,
    height: 10,
    background: 'repeating-linear-gradient(45deg, rgba(255,212,0,0.85), rgba(255,212,0,0.85) 10px, rgba(0,0,0,0.80) 10px, rgba(0,0,0,0.80) 20px)',
    borderRadius: 999,
    opacity: 0.55,
    border: '1px solid rgba(255,212,0,0.25)',
  },
  estopBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '12px 18px',
    border: '2px solid rgba(255,255,255,0.18)',
    borderRadius: 12,
    fontWeight: 950,
    fontSize: 13,
    background: 'linear-gradient(180deg, rgba(255,59,59,0.95), rgba(220,38,38,0.86))',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    animation: 'pulseGlow 2.0s infinite',
  },
  hotkeyBadge: {
    marginLeft: 10,
    padding: '2px 8px',
    background: 'rgba(0,0,0,0.30)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.10)',
  },

  // Header
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: '-0.02em',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: 13,
    color: 'rgba(143,182,200,0.95)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 800,
  },
  headerActions: { display: 'flex', alignItems: 'center', gap: 14 },

  // Status indicator
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.16)',
    border: '1px solid',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },

  // Toggle
  toggleLabel: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  toggleInput: { display: 'none' },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 999,
    position: 'relative' as const,
    background: 'rgba(0,229,255,0.08)',
    border: '1px solid rgba(0,229,255,0.18)',
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: 2,
    width: 20,
    height: 20,
    background: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  toggleText: {
    fontSize: 12,
    color: 'rgba(143,182,200,0.95)',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  // Status badges
  statusRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  badge: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 12,
    minWidth: 120,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: 'rgba(143,182,200,0.95)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.14em',
  },
  badgeValue: { fontSize: 14, fontWeight: 900 },

  // Quick actions
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    border: 0,
    borderRadius: 12,
    fontWeight: 950,
    fontSize: 13,
    letterSpacing: '0.10em',
    textTransform: 'uppercase' as const,
    background: 'linear-gradient(180deg, rgba(0,229,255,0.85), rgba(0,229,255,0.55))',
    color: '#041625',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: '0.10em',
    textTransform: 'uppercase' as const,
    background: 'rgba(0,0,0,0.14)',
    color: 'var(--ink)',
  },
  btnActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    border: '1px solid rgba(255,212,0,0.35)',
    borderRadius: 12,
    fontWeight: 950,
    fontSize: 13,
    letterSpacing: '0.10em',
    textTransform: 'uppercase' as const,
    background: 'rgba(255,212,0,0.10)',
    color: 'var(--accent-amber)',
    boxShadow: '0 0 18px rgba(255,212,0,0.10)',
  },
  hotkeyTag: {
    padding: '4px 8px',
    background: 'rgba(0,0,0,0.22)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 950,
    border: '1px solid rgba(0,229,255,0.18)',
  },

  // Movement
  sectionTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 950,
    letterSpacing: '0.10em',
    textTransform: 'uppercase' as const,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  lockBadge: {
    padding: '6px 10px',
    background: 'rgba(255,212,0,0.10)',
    border: '1px solid rgba(255,212,0,0.28)',
    borderRadius: 10,
    fontSize: 11,
    color: 'var(--accent-amber)',
    fontWeight: 900,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  movementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 12,
  },
  movementBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
    padding: '18px 16px',
    borderRadius: 14,
    color: '#fff',
    fontWeight: 950,
    letterSpacing: '0.10em',
    textTransform: 'uppercase' as const,
  },
  movementIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  movementLabel: { fontSize: 13 },
  movementHotkey: {
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 950,
    border: '1px solid rgba(255,255,255,0.10)',
  },

  // Keypad
  keypadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  keypadActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  smallBtn: {
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 10,
    color: 'rgba(217,242,255,0.92)',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  keypadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  keyBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: 6,
    padding: '14px 14px 12px',
    background: 'rgba(0,0,0,0.16)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 14,
    color: 'var(--ink)',
  },
  keyNum: {
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1,
    color: 'var(--accent-cyan)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  keyLabel: {
    fontSize: 12,
    color: 'rgba(143,182,200,0.95)',
    fontWeight: 900,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },

  // Label editor
  labelEditor: {
    marginTop: 14,
    padding: 14,
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 14,
  },
  labelEditorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetBtn: {
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(255,212,0,0.22)',
    borderRadius: 10,
    color: 'var(--accent-amber)',
    fontSize: 12,
    fontWeight: 950,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
  },
  labelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  labelRow: { display: 'flex', alignItems: 'center', gap: 10 },
  labelNum: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.18)',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 950,
    color: 'var(--accent-cyan)',
    border: '1px solid rgba(0,229,255,0.18)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  labelInput: {
    flex: 1,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.18)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 12,
    color: 'var(--ink)',
    fontSize: 13,
    outline: 'none',
  },

  // Sensors
  sensorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  sensorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px',
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 14,
  },
  sensorIcon: { fontSize: 28 },
  sensorInfo: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  sensorTitle: {
    fontSize: 12,
    color: 'rgba(143,182,200,0.95)',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  sensorValue: {
    fontSize: 22,
    fontWeight: 950,
    color: 'var(--ink)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  sensorUnit: { fontSize: 14, color: 'rgba(143,182,200,0.95)', marginLeft: 4 },

  // Log
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 10,
  },
  logMeta: { fontSize: 12, color: 'rgba(143,182,200,0.95)', letterSpacing: '0.06em' },
  logBox: { maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  logEmpty: { textAlign: 'center' as const, padding: '28px 16px', color: 'rgba(143,182,200,0.95)' },
  logRow: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto auto 1fr',
    gap: 12,
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(0,229,255,0.14)',
    borderRadius: 12,
    fontSize: 13,
  },
  logTime: { color: 'rgba(143,182,200,0.95)', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
  logMs: { color: 'rgba(143,182,200,0.95)', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
  logCode: { fontWeight: 950, fontSize: 12, letterSpacing: '0.06em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
  logStatus: {
    padding: '3px 8px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    border: '1px solid transparent',
  },
  logReply: { color: 'rgba(217,242,255,0.86)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },

  bottomNav: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  bottomLink: {
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.14)',
    border: '1px solid rgba(0,229,255,0.18)',
    borderRadius: 12,
    color: 'rgba(217,242,255,0.92)',
    textDecoration: 'none',
    fontWeight: 900,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    fontSize: 12,
  },
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
