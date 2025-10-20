'use client';

import { useState } from 'react';

const CMD = {
  FORWARD: 5,
  BACKWARD: 6,
  STOP: 0,
  AUTO: 1,
  MANUAL: 2,
  EMERGENCY_STOP: 9,
} as const;

export default function Home() {
  const [log, setLog] = useState('Ready…');
  const [custom, setCustom] = useState<string>('');

  async function sendCode(code: number | string) {
    const asString = String(code);           // ensure it's a string
    const t0 = Date.now();
    try {
      const r = await fetch('/api/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ESP32 expects {"op": "<number>"} -> forwards "<number>\\n"
        body: JSON.stringify({ op: asString }),
      });
      const data = await r.json();
      setLog(prev =>
        `[${new Date().toLocaleTimeString()}] code=${asString} (${Date.now()-t0}ms)\n` +
        JSON.stringify(data, null, 2) + '\n\n' + prev
      );
    } catch (e: any) {
      setLog(prev => `[${new Date().toLocaleTimeString()}] code=${asString}\nERR ${String(e)}\n\n` + prev);
    }
  }

  return (
    <div style={{ fontFamily:'system-ui,Arial', background:'#0b0f14', color:'#fff', minHeight:'100dvh' }}>
      <header style={{ padding:'16px 20px', background:'#11161d', borderBottom:'1px solid #202834' }}>
        <h2 style={{ margin:0 }}>Bridge Control</h2>
      </header>

      <main style={{ padding:20, maxWidth:680, margin:'0 auto', display:'grid', gap:12 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={() => sendCode(CMD.FORWARD)}        style={btn('primary')}>Forward = {CMD.FORWARD}</button>
          <button onClick={() => sendCode(CMD.BACKWARD)}       style={btn()}>Backward = {CMD.BACKWARD}</button>
          <button onClick={() => sendCode(CMD.STOP)}           style={btn()}>Stop = {CMD.STOP}</button>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={() => sendCode(CMD.AUTO)}           style={btn()}>Auto = {CMD.AUTO}</button>
          <button onClick={() => sendCode(CMD.MANUAL)}         style={btn()}>Manual = {CMD.MANUAL}</button>
          <button onClick={() => sendCode(CMD.EMERGENCY_STOP)} style={btn()}>E-Stop = {CMD.EMERGENCY_STOP}</button>
        </div>

        {/* Send any number manually */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter code (e.g., 5)"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d-]/g,''))}
            style={{ padding:'10px 12px', borderRadius:10, border:'1px solid #2a3545', background:'#0f141b', color:'#eaeff7' }}
          />
          <button onClick={() => custom && sendCode(custom)} style={btn()}>Send</button>
        </div>

        <pre style={{ whiteSpace:'pre-wrap', background:'#0f141b', border:'1px solid #223042',
                      borderRadius:12, padding:12, minHeight:160 }}>
{log}
        </pre>
      </main>
    </div>
  );
}

function btn(kind: 'primary' | 'ghost' = 'ghost'): React.CSSProperties {
  return {
    padding:'12px 16px',
    border:0,
    borderRadius:12,
    cursor:'pointer',
    fontWeight:600,
    background: kind==='primary' ? '#ff7a1a' : '#1a212c',
    color: kind==='primary' ? '#111' : '#eaeff7',
    borderColor:'#2a3545',
    borderWidth: kind==='primary' ? 0 : 1,
    borderStyle:'solid',
  };
}
