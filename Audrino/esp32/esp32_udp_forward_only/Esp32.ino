#include <WiFi.h>
#include <WebServer.h>

#define RXD2 16
#define TXD2 17

// ========= Config =========
static const bool USE_AP_MODE = true; // set to false to join your home Wi-Fi (STA)

// AP credentials
const char* AP_SSID = "BridgeControl-ESP32";
const char* AP_PASS = "bridge1234";

// STA credentials (only used if USE_AP_MODE == false)
const char* STA_SSID = "YOUR_WIFI";
const char* STA_PASS = "YOUR_PASSWORD";

// ========= Server =========
WebServer server(80);

// ---- Put INDEX_HTML BEFORE handleIndex() ----
static const char INDEX_HTML[] = R"HTML(
<!doctype html><meta name=viewport content="width=device-width,initial-scale=1">
<title>Bridge Control</title>
<style>
  body{font-family:system-ui,Arial;margin:0;background:#0b0f14;color:#fff}
  header{padding:16px 20px;background:#11161d;border-bottom:1px solid #202834}
  main{padding:20px;max-width:680px;margin:auto;display:grid;gap:12px}
  button{padding:12px 16px;border:0;border-radius:12px;cursor:pointer;font-weight:600}
  .row{display:flex;gap:10px;flex-wrap:wrap}
  .primary{background:#ff7a1a;color:#111}
  .ghost{background:#1a212c;color:#eaeff7;border:1px solid #2a3545}
  pre{white-space:pre-wrap;background:#0f141b;border:1px solid #223042;border-radius:12px;padding:12px;min-height:120px}
</style>
<header><h3>Bridge Control (ESP32)</h3></header>
<main>
  <div class=row>
    <button class=primary onclick="sendCmd('FORWARD')">Forward</button>
    <button class=ghost onclick="sendCmd('BACKWARD')">Backward</button>
    <button class=ghost onclick="sendCmd('STOP')">Stop</button>
    <button class=ghost onclick="sendCmd('STATUS')">Status</button>
  </div>
  <pre id=log>Ready…</pre>
</main>
<script>
async function sendCmd(op){
  const res = await fetch('/cmd', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({op})});
  const data = await res.json().catch(()=>({}));
  const log = document.getElementById('log');
  log.textContent = `[${new Date().toLocaleTimeString()}] ${op}\n`+JSON.stringify(data,null,2)+`\n\n`+log.textContent;
}
</script>
)HTML";

// ========= Helpers =========
String readLineSerial2(uint32_t timeout_ms=1000){
  String line; uint32_t t0=millis();
  while (millis()-t0 < timeout_ms){
    while (Serial2.available()){
      char c = (char)Serial2.read();
      if (c=='\n'){ line.trim(); return line; }
      line += c;
    }
    delay(2);
  }
  line.trim(); return line; // empty on timeout
}

// Minimal top-level string extractor: {"op":"FORWARD"}
String jsonGetString(const String& body, const char* key){
  int pos = 0;
  while (true){
    int q1 = body.indexOf('"', pos); if (q1 < 0) break;
    int q2 = body.indexOf('"', q1+1); if (q2 < 0) break;
    String k = body.substring(q1+1, q2);
    int colon = body.indexOf(':', q2+1); if (colon < 0) break;
    if (k == key){
      int vq1 = body.indexOf('"', colon+1); if (vq1 < 0) return "";
      int vq2 = body.indexOf('"', vq1+1); if (vq2 < 0) return "";
      return body.substring(vq1+1, vq2);
    }
    pos = q2+1;
  }
  return "";
}

void sendCORS(){
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ========= Handlers =========
void handleIndex(){
  server.send(200, "text/html", INDEX_HTML);
}

void handleOptions(){
  sendCORS();
  server.send(204);
}

void handleCmd(){
  sendCORS();
  if (server.method() != HTTP_POST){
    server.send(405, "application/json", "{\"ok\":false,\"reason\":\"use POST\"}");
    return;
  }
  String body = server.arg("plain");
  String op = jsonGetString(body, "op");
  if (op.length()==0){
    server.send(400, "application/json", "{\"ok\":false,\"reason\":\"missing op\"}");
    return;
  }

  // Forward to Nano
  Serial.print("[CMD] "); Serial.println(op);
  Serial2.print(op); Serial2.print('\n');

  // Wait reply (one line)
  String nano = readLineSerial2(1000);

  // Escape \ and " minimally
  nano.replace("\\","\\\\"); nano.replace("\"","\\\"");
  String json = String("{\"ok\":") + (nano.length()? "true":"false")
              + ",\"op\":\"" + op + "\",\"nano_reply\":\"" + nano + "\"}";
  server.send(200, "application/json", json);
}

// ========= Setup / Loop =========
void setup(){
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);

  delay(200);
  Serial.println("\n[ESP32] Booting…");

  if (USE_AP_MODE){
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.print("[AP] SSID: "); Serial.print(AP_SSID);
    Serial.print("  PASS: "); Serial.println(AP_PASS);
    Serial.print("Open: http://"); Serial.println(WiFi.softAPIP());
  } else {
    WiFi.mode(WIFI_STA);
    WiFi.begin(STA_SSID, STA_PASS);
    Serial.print("[STA] Connecting");
    for (int i=0;i<60 && WiFi.status()!=WL_CONNECTED;i++){ delay(250); Serial.print('.'); }
    Serial.println();
    if (WiFi.status()==WL_CONNECTED){
      Serial.print("[STA] IP: "); Serial.println(WiFi.localIP());
    } else {
      Serial.println("[STA] Failed; fallback to AP");
      WiFi.mode(WIFI_AP);
      WiFi.softAP(AP_SSID, AP_PASS);
      Serial.print("[AP] IP: "); Serial.println(WiFi.softAPIP());
    }
  }

  server.on("/", HTTP_GET, handleIndex);
  server.on("/cmd", HTTP_OPTIONS, handleOptions);
  server.on("/cmd", HTTP_POST, handleCmd);
  server.begin();
  Serial.println("[HTTP] Server started");
}

void loop(){
  server.handleClient();
}
