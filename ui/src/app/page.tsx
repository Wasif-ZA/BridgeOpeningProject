import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Project Demonstration | Bridge Opening Project",
  description: "Overview of how the Bridge Opening Project works end-to-end.",
};

export default function DemoPage() {
  return (
    <div style={styles.page}>
      <style>{`
        :root{
          --bp:#061a2b;          /* blueprint base */
          --ink:#d9f2ff;         /* blueprint text */
          --muted:#8fb6c8;       /* blueprint secondary */
          --panel:#041625;       /* panel base */
          --panel2:#03101c;      /* darker */
          --line:#1c3b52;        /* strokes */
          --accent:#ffd400;      /* hazard */
          --accent2:#00e5ff;     /* cyan */
          --danger:#ff3b3b;
        }

        /* Blueprint background */
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

        /* Grain */
        .grain {
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 3px 3px;
          mix-blend-mode: overlay;
          opacity: 0.35;
        }

        /* Panel frame */
        .panel {
          position: relative;
          border: 1px solid rgba(0,229,255,0.18);
          background: linear-gradient(180deg, rgba(4,22,37,0.92), rgba(3,16,28,0.92));
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.45) inset,
            0 10px 0 rgba(0,0,0,0.25),
            0 18px 50px rgba(0,0,0,0.45);
          border-radius: 12px;
          overflow: hidden;
        }
        .panel:before{
          content:"";
          position:absolute;
          inset:10px;
          border: 1px dashed rgba(255,255,255,0.08);
          pointer-events:none;
          border-radius: 10px;
        }
        .bolt{
          width:10px;height:10px;border-radius:3px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(0,229,255,0.18);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.45) inset;
          position:absolute;
        }
        .b1{ top:12px; left:12px; }
        .b2{ top:12px; right:12px; }
        .b3{ bottom:12px; left:12px; }
        .b4{ bottom:12px; right:12px; }

        /* Engineering header strip */
        .strip{
          display:flex; align-items:center; justify-content:space-between;
          gap:12px;
          padding: 10px 12px;
          border: 1px solid rgba(0,229,255,0.18);
          background: linear-gradient(90deg, rgba(0,229,255,0.09), rgba(255,212,0,0.06));
        }
        .strip small{
          color: rgba(143,182,200,0.95);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 800;
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

        /* ✅ Hazard primary button (CLEAN: stripes ONLY on border) */
        a.hazard{
          position: relative;
          border-radius: 8px;
          padding: 12px 16px;
          text-decoration: none;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          gap: 10px;

          border: 2px solid transparent;
          background:
            linear-gradient(180deg, rgba(255,212,0,1), rgba(255,212,0,0.92)) padding-box,
            repeating-linear-gradient(
              135deg,
              rgba(255,212,0,1) 0px,
              rgba(255,212,0,1) 10px,
              rgba(0,0,0,0.90) 10px,
              rgba(0,0,0,0.90) 20px
            ) border-box;

          color: #07121b;
          box-shadow:
            0 10px 0 rgba(0,0,0,0.35),
            0 24px 50px rgba(0,0,0,0.35);
          transform: translateY(0);
          transition: transform 0.15s ease, filter 0.15s ease;
        }
        a.hazard:hover { transform: translateY(-1px); filter: brightness(1.03); }
        a.hazard:active { transform: translateY(0px); filter: brightness(0.97); }

        a.ghost {
          background: rgba(0,229,255,0.06);
          border: 1px solid rgba(0,229,255,0.22);
          transition: transform 0.15s ease, background 0.15s ease;
          border-radius: 8px;
        }
        a.ghost:hover{ transform: translateY(-1px); background: rgba(0,229,255,0.10); }
        a.ghost:active{ transform: translateY(0px); }

        /* Keypad */
        .keypad:hover { border-color: rgba(0,229,255,0.28); }
        .keycap {
          box-shadow:
            0 2px 0 rgba(255,255,255,0.05) inset,
            0 10px 0 rgba(0,0,0,0.45);
        }

        /* Link rows */
        a.row:hover { background: rgba(0,229,255,0.08); transform: translateY(-1px); }
        a.row:active { transform: translateY(0px); }

        /* Focus */
        a:focus-visible{ outline: 2px solid rgba(255,212,0,0.70); outline-offset: 3px; border-radius: 10px; }

        .draft-title {
          text-shadow: 0 0 18px rgba(0,229,255,0.12);
          letter-spacing: -0.02em;
        }
      `}</style>

      <div style={styles.bg} className="bp-grid" />
      <div style={styles.grain} className="grain" />

      <div style={styles.wrap}>
        <header style={styles.header}>
          <div style={styles.stampWrap}>
            <div style={styles.stamp}>
              <div style={styles.stampTop}>ENGINEERING DEMO</div>
              <div style={styles.stampMid}>BRIDGE OPENING PROJECT</div>
              <div style={styles.stampBot}>SYSTEM DOC • v1.0</div>
            </div>
          </div>

          <h1 style={styles.title} className="draft-title">
            Bridge Opening <span style={{ color: "var(--accent2)" }}>Control</span>{" "}
            Overview
          </h1>

          <p style={styles.subtitle}>
            Full-stack IoT control chain: <strong>Next.js</strong> (Edge) →{" "}
            <strong>ESP32</strong> (Gateway) → <strong>Arduino</strong> (Actuator)
          </p>

          <div style={styles.btnRow}>
            {/* ✅ className hazard does all the styling; inline style does NOT set background */}
            <Link href="/control" className="hazard" style={styles.btnPrimary}>
              <span style={{ fontSize: 18 }}>🎛️</span>
              <span>Launch Control Panel</span>
            </Link>

            <a
              href="https://github.com/Wasif-ZA/BridgeOpeningProject"
              target="_blank"
              rel="noreferrer"
              className="ghost"
              style={styles.btnSecondary}
            >
              <span>View Source Code</span>
              <span style={{ opacity: 0.85 }}>↗</span>
            </a>
          </div>

          <div style={styles.meterRow}>
            <Meter label="LINK" value="ONLINE" tone="cyan" />
            <Meter label="MODE" value="MANUAL INTERLOCK" tone="amber" />
            <Meter label="ACK" value="READY" tone="cyan" />
          </div>
        </header>

        {/* ARCHITECTURE */}
        <section style={styles.panel} className="panel">
          <div className="bolt b1" />
          <div className="bolt b2" />
          <div className="bolt b3" />
          <div className="bolt b4" />

          <div className="strip">
            <small>SECTION A • SYSTEM ARCHITECTURE</small>
            <div className="led">
              <span className="dot" />
              <span className="dot warn" />
              <span className="dot" />
            </div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.panelTitleRow}>
              <div style={styles.icon}>🏗️</div>
              <div>
                <h2 style={styles.h2}>Schematic Data Flow</h2>
                <p style={styles.desc}>From user input → edge → gateway → actuation.</p>
              </div>
            </div>

            <div style={styles.diagramFrame}>
              <ArchitectureSvg />
            </div>

            <div style={styles.badges}>
              <Badge icon="🌐" label="Frontend" value="Next.js App Router" />
              <Badge icon="⚡" label="Edge API" value="/api/cmd Proxy" />
              <Badge icon="📡" label="Gateway" value="ESP32 HTTP" />
              <Badge icon="⚙️" label="Driver" value="Arduino UNO" />
            </div>
          </div>
        </section>

        {/* COMMAND PROTOCOL */}
        <section style={styles.panel} className="panel">
          <div className="bolt b1" />
          <div className="bolt b2" />
          <div className="bolt b3" />
          <div className="bolt b4" />

          <div className="strip">
            <small>SECTION B • COMMAND PROTOCOL</small>
            <div className="led">
              <span className="dot warn" />
              <span className="dot" />
              <span className="dot warn" />
            </div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.panelTitleRow}>
              <div style={styles.icon}>🎮</div>
              <div>
                <h2 style={styles.h2}>Numeric Op-Codes</h2>
                <p style={styles.desc}>Firmware state machine receives 0–9 over UART.</p>
              </div>
            </div>

            <div style={styles.keypadGrid}>
              {[
                { code: 0, label: "STOP / IDLE", color: "rgba(143,182,200,0.9)" },
                { code: 1, label: "AUTO MODE", color: "rgba(0,229,255,0.95)" },
                { code: 2, label: "MANUAL MODE", color: "rgba(255,212,0,0.95)" },
                { code: 3, label: "EMERGENCY STOP", color: "rgba(255,59,59,0.95)" },
                { code: 4, label: "SYSTEM RESET", color: "rgba(189,147,249,0.95)" },
                { code: 5, label: "BRIDGE RAISE", color: "rgba(72,245,180,0.95)" },
                { code: 6, label: "BRIDGE LOWER", color: "rgba(255,163,87,0.95)" },
                { code: 7, label: "BOOM OPEN", color: "rgba(120,180,255,0.95)" },
                { code: 8, label: "BOOM CLOSE", color: "rgba(120,180,255,0.95)" },
                { code: 9, label: "SCALE RE-TARE", color: "rgba(255,120,205,0.95)" },
              ].map((cmd) => (
                <div key={cmd.code} style={styles.keypadCell} className="keypad">
                  <div
                    style={{
                      ...styles.keycap,
                      borderColor: cmd.color,
                      color: "var(--ink)",
                    }}
                    className="keycap"
                  >
                    <div style={styles.keycapTop}>{cmd.code}</div>
                    <div style={{ ...styles.keycapLine, background: cmd.color }} />
                  </div>
                  <div style={styles.keyLabel}>{cmd.label}</div>
                </div>
              ))}
            </div>

            <div style={styles.notice}>
              <div style={styles.noticeIcon}>⚠️</div>
              <div>
                <div style={styles.noticeTitle}>Manual Interlock</div>
                <div style={styles.noticeText}>
                  Commands <strong>5–9</strong> are ignored unless system is in{" "}
                  <strong>MANUAL (2)</strong> mode.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TWO COLUMN */}
        <div style={styles.twoCol}>
          <section style={styles.panel} className="panel">
            <div className="bolt b1" />
            <div className="bolt b2" />
            <div className="bolt b3" />
            <div className="bolt b4" />

            <div className="strip">
              <small>SECTION C • INTERACTION LOOP</small>
              <div className="led">
                <span className="dot" />
                <span className="dot" />
                <span className="dot warn" />
              </div>
            </div>

            <div style={styles.panelBody}>
              <h2 style={styles.h2}>📡 Request → Actuation → ACK</h2>

              <div style={styles.timeline}>
                {[
                  { title: "User Input", desc: "Click or Hotkey (0–9) on UI." },
                  { title: "Edge Proxy", desc: "POST /api/cmd validates payload." },
                  { title: "WiFi Request", desc: "Forwarded to ESP32 over HTTP." },
                  { title: "Serial Bus", desc: "ESP32 relays byte to UNO via UART." },
                  { title: "Actuation", desc: "UNO drives motors/relays." },
                  { title: "Feedback", desc: "ACK response bubbles back to UI." },
                ].map((step, i) => (
                  <div key={i} style={styles.tRow}>
                    <div style={styles.tIdx}>{String(i + 1).padStart(2, "0")}</div>
                    <div>
                      <div style={styles.tTitle}>{step.title}</div>
                      <div style={styles.tDesc}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <section style={styles.panel} className="panel">
              <div className="bolt b1" />
              <div className="bolt b2" />
              <div className="bolt b3" />
              <div className="bolt b4" />

              <div className="strip">
                <small>SECTION D • SIMULATION</small>
                <div className="led">
                  <span className="dot warn" />
                  <span className="dot warn" />
                  <span className="dot" />
                </div>
              </div>

              <div style={styles.panelBody}>
                <h2 style={styles.h2}>🧪 Mock Mode</h2>
                <p style={styles.p}>
                  No hardware connected? Enable <strong>Simulation Mode</strong> in the toolbar.
                </p>
                <p style={styles.small}>
                  The UI intercepts requests and returns synthetic ACK signals, letting you test
                  interface logic without the physical bridge.
                </p>
              </div>
            </section>

            <section style={styles.panel} className="panel">
              <div className="bolt b1" />
              <div className="bolt b2" />
              <div className="bolt b3" />
              <div className="bolt b4" />

              <div className="strip">
                <small>SECTION E • QUICK LINKS</small>
                <div className="led">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>

              <div style={styles.panelBody}>
                <div style={styles.linkList}>
                  <a
                    style={styles.linkRow}
                    className="row"
                    href="https://github.com/Wasif-ZA/BridgeOpeningProject/tree/main/ui"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>📦 UI Repository</span>
                    <span style={styles.arrow}>→</span>
                  </a>
                  <a
                    style={styles.linkRow}
                    className="row"
                    href="https://github.com/Wasif-ZA/BridgeOpeningProject/tree/main/Audrino"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>🔌 Firmware Source</span>
                    <span style={styles.arrow}>→</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* DEPLOYMENT */}
        <section style={styles.panel} className="panel">
          <div className="bolt b1" />
          <div className="bolt b2" />
          <div className="bolt b3" />
          <div className="bolt b4" />

          <div className="strip">
            <small>SECTION F • DEPLOYMENT GUIDE</small>
            <div className="led">
              <span className="dot" />
              <span className="dot warn" />
              <span className="dot" />
            </div>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.panelTitleRow}>
              <div style={styles.icon}>🚀</div>
              <div>
                <h2 style={styles.h2}>Bring-Up Steps</h2>
                <p style={styles.desc}>Env → flash → wiring → live control.</p>
              </div>
            </div>

            <div style={styles.steps}>
              <Step n="01" title="Environment">
                Set <code style={styles.code}>ESP32_BASE_URL</code> in{" "}
                <code style={styles.code}>.env.local</code> to the device static IP.
              </Step>
              <Step n="02" title="ESP32 Flash">
                Upload sketch from <code style={styles.code}>/Arduino/esp32</code>. Ensure Wi-Fi creds are correct.
              </Step>
              <Step n="03" title="UNO Upload">
                Flash the logic controller. Connect Tx/Rx pins between boards.
              </Step>
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          <div>Bridge Opening Project © {new Date().getFullYear()}</div>
          <div style={{ opacity: 0.7 }}>Blueprint/HMI theme • technical documentation page</div>
        </footer>
      </div>
    </div>
  );
}

/* ========= Subcomponents ========= */

function Meter({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "amber";
}) {
  const color = tone === "amber" ? "var(--accent)" : "var(--accent2)";
  return (
    <div style={styles.meter}>
      <div style={styles.meterLabel}>{label}</div>
      <div style={{ ...styles.meterValue, borderColor: color, color }}>{value}</div>
    </div>
  );
}

function Badge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={styles.badge}>
      <div style={styles.badgeIcon}>{icon}</div>
      <div>
        <div style={styles.badgeLabel}>{label}</div>
        <div style={styles.badgeValue}>{value}</div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNum}>{n}</div>
      <div>
        <div style={styles.stepTitle}>{title}</div>
        <div style={styles.stepText}>{children}</div>
      </div>
    </div>
  );
}

function ArchitectureSvg() {
  return (
    <svg role="img" aria-label="System diagram" viewBox="0 0 880 160" width="100%" height="160">
      <defs>
        <filter id="bpGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d="M 210,80 L 270,80" stroke="rgba(0,229,255,0.22)" strokeWidth="2" />
      <path d="M 450,80 L 510,80" stroke="rgba(0,229,255,0.22)" strokeWidth="2" />
      <path d="M 670,80 L 730,80" stroke="rgba(0,229,255,0.22)" strokeWidth="2" />

      <path d="M 210,80 L 270,80" stroke="rgba(0,229,255,0.95)" strokeWidth="2" strokeDasharray="5 5" className="animate-flow" />
      <path d="M 450,80 L 510,80" stroke="rgba(255,212,0,0.95)" strokeWidth="2" strokeDasharray="5 5" className="animate-flow" />
      <path d="M 670,80 L 730,80" stroke="rgba(72,245,180,0.95)" strokeWidth="2" strokeDasharray="5 5" className="animate-flow" />

      <Node x={30} w={180} title="Web UI" sub="Next.js Client" accent="rgba(0,229,255,0.95)" />
      <Node x={270} w={180} title="Edge API" sub="/api/cmd Proxy" accent="rgba(189,147,249,0.95)" />
      <Node x={510} w={160} title="ESP32" sub="HTTP Gateway" accent="rgba(255,212,0,0.95)" />
      <Node x={730} w={140} title="Arduino" sub="Hardware Control" accent="rgba(72,245,180,0.95)" />
    </svg>
  );
}

function Node({
  x,
  w,
  title,
  sub,
  accent,
}: {
  x: number;
  w: number;
  title: string;
  sub: string;
  accent: string;
}) {
  return (
    <g transform={`translate(${x}, 45)`} filter="url(#bpGlow)">
      <rect width={w} height="70" rx="6" fill="rgba(2,10,18,0.80)" stroke={accent} strokeWidth="1.5" />
      <rect x="8" y="8" width={w - 16} height="54" rx="4" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
      <text x={w / 2} y="30" textAnchor="middle" fill="#d9f2ff" fontSize="14" fontWeight="800">{title}</text>
      <text x={w / 2} y="50" textAnchor="middle" fill="rgba(143,182,200,0.95)" fontSize="11">{sub}</text>
    </g>
  );
}

/* ========= Styles ========= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--bp)",
    color: "var(--ink)",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    position: "relative",
    overflowX: "hidden",
  },

  bg: { position: "absolute", inset: 0, zIndex: 0 },
  grain: { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" },

  wrap: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1080,
    margin: "0 auto",
    padding: "44px 18px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    paddingBottom: 6,
  },

  stampWrap: { width: "100%", display: "flex", justifyContent: "center" },
  stamp: {
    width: "min(620px, 100%)",
    border: "2px solid rgba(255,212,0,0.65)",
    background: "rgba(0,0,0,0.18)",
    padding: "10px 12px",
    boxShadow: "0 12px 0 rgba(0,0,0,0.35)",
  },
  stampTop: {
    fontSize: 11,
    letterSpacing: "0.22em",
    color: "rgba(255,212,0,0.9)",
    fontWeight: 900,
  },
  stampMid: {
    marginTop: 4,
    fontSize: 14,
    letterSpacing: "0.08em",
    fontWeight: 900,
    color: "var(--ink)",
  },
  stampBot: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "rgba(143,182,200,0.95)",
    fontWeight: 800,
  },

  title: { margin: 0, fontSize: "clamp(26px, 3.4vw, 44px)", fontWeight: 900, lineHeight: 1.1 },
  subtitle: {
    margin: 0,
    maxWidth: 860,
    color: "var(--muted)",
    lineHeight: 1.7,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif',
    fontSize: 15,
  },

  btnRow: { marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 8, textDecoration: "none", fontWeight: 900 },
  btnSecondary: { display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 14px", textDecoration: "none", color: "var(--ink)", fontWeight: 800 },

  meterRow: { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  meter: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(0,0,0,0.16)", border: "1px solid rgba(0,229,255,0.18)" },
  meterLabel: { fontSize: 11, letterSpacing: "0.18em", fontWeight: 900, color: "rgba(143,182,200,0.95)" },
  meterValue: { padding: "4px 8px", border: "1px solid rgba(0,229,255,0.35)", fontWeight: 900, letterSpacing: "0.08em", fontSize: 11 },

  panel: { borderRadius: 10, overflow: "hidden" },
  panelBody: { padding: 16 },

  panelTitleRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  icon: { width: 40, height: 40, display: "grid", placeItems: "center", border: "1px solid rgba(0,229,255,0.22)", background: "rgba(0,229,255,0.06)", borderRadius: 6, fontSize: 18 },

  h2: {
    margin: 0,
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: "0.02em",
    color: "var(--ink)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif',
  },
  desc: { margin: "4px 0 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.6, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
  p: { margin: 0, color: "rgba(217,242,255,0.92)", lineHeight: 1.65, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
  small: { marginTop: 8, color: "var(--muted)", lineHeight: 1.6, fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },

  diagramFrame: { padding: "12px 10px", border: "1px solid rgba(0,229,255,0.18)", background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.12))" },

  badges: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginTop: 12 },
  badge: { display: "flex", gap: 10, alignItems: "center", padding: "10px 10px", border: "1px solid rgba(0,229,255,0.18)", background: "rgba(0,0,0,0.16)" },
  badgeIcon: { fontSize: 18 },
  badgeLabel: { fontSize: 11, letterSpacing: "0.18em", fontWeight: 900, color: "rgba(143,182,200,0.95)", textTransform: "uppercase" },
  badgeValue: { fontSize: 13, fontWeight: 800, color: "var(--ink)", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },

  keypadGrid: { marginTop: 6, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 },
  keypadCell: { padding: 10, border: "1px solid rgba(0,229,255,0.16)", background: "rgba(0,0,0,0.12)", transition: "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease" },
  keycap: { border: "1px solid rgba(0,229,255,0.22)", background: "linear-gradient(180deg, rgba(6,26,43,0.9), rgba(0,0,0,0.35))", borderRadius: 6, padding: "10px 10px 8px" },
  keycapTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 22, fontWeight: 950, letterSpacing: "0.02em" },
  keycapLine: { marginTop: 8, height: 3, borderRadius: 999, opacity: 0.9 },
  keyLabel: { marginTop: 8, fontSize: 12, color: "rgba(143,182,200,0.95)", fontWeight: 800, letterSpacing: "0.04em", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },

  notice: { marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start", padding: 12, border: "1px solid rgba(255,212,0,0.35)", background: "linear-gradient(90deg, rgba(255,212,0,0.10), rgba(0,0,0,0.12))" },
  noticeIcon: { fontSize: 18, lineHeight: 1 },
  noticeTitle: { fontWeight: 950, letterSpacing: "0.08em", color: "rgba(255,212,0,0.95)", textTransform: "uppercase", fontSize: 12 },
  noticeText: { marginTop: 4, color: "rgba(217,242,255,0.92)", lineHeight: 1.6, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif', fontSize: 13 },

  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18 },

  timeline: { marginTop: 10, display: "flex", flexDirection: "column", gap: 10 },
  tRow: { display: "grid", gridTemplateColumns: "56px 1fr", gap: 12, padding: "10px 10px", border: "1px solid rgba(0,229,255,0.14)", background: "rgba(0,0,0,0.12)" },
  tIdx: { fontWeight: 950, letterSpacing: "0.12em", color: "var(--accent2)", fontSize: 12, display: "flex", alignItems: "center" },
  tTitle: { fontWeight: 950, color: "var(--ink)", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
  tDesc: { marginTop: 3, color: "var(--muted)", fontSize: 13, lineHeight: 1.55, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },

  linkList: { display: "flex", flexDirection: "column", gap: 10 },
  linkRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 12px", border: "1px solid rgba(0,229,255,0.18)", background: "rgba(0,0,0,0.12)", color: "var(--ink)", textDecoration: "none", transition: "transform 0.15s ease, background 0.15s ease", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif', fontWeight: 700 },
  arrow: { color: "var(--muted)" },

  steps: { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 },
  step: { border: "1px solid rgba(0,229,255,0.16)", background: "rgba(0,0,0,0.12)", padding: 12, display: "grid", gridTemplateColumns: "54px 1fr", gap: 12, alignItems: "start" },
  stepNum: { fontWeight: 950, fontSize: 16, color: "var(--accent)", letterSpacing: "0.12em" },
  stepTitle: { fontWeight: 950, color: "var(--ink)", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
  stepText: { marginTop: 6, color: "var(--muted)", lineHeight: 1.6, fontSize: 13, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
  code: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace', background: "rgba(0,0,0,0.35)", border: "1px solid rgba(0,229,255,0.18)", padding: "2px 6px" },

  footer: { paddingTop: 14, borderTop: "1px solid rgba(0,229,255,0.16)", color: "var(--muted)", fontSize: 12, textAlign: "center", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif' },
};
