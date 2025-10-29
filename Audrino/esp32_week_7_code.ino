// File: esp32_udp_ack.ino
#include <WiFi.h>
#include <WiFiUDP.h>

/* =========================
   Choose ONE network mode
   ========================= */

// --- A) ESP32 as Access Point (PC connects to this Wi-Fi) ---
const char* AP_SSID = "The internet is slow huh?";
const char* AP_PASS = "Aaa1974$";    // must be 8+ chars

// --- B) ESP32 joins your router (Station mode) ---
// const char* STA_SSID = "YourRouterSSID";
// const char* STA_PASS = "YourRouterPassword";

WiFiUDP udp;
const uint16_t PORT = 42100;

/* -------- tiny helpers (no JSON lib) -------- */
static String trimWS(String s) {
  s.trim(); return s;
}

// Extracts value of key "op" from a JSON-ish string:  ..."op":"VALUE"...
static String extractOp(const String& body) {
  const String key = "\"op\"";
  int i = body.indexOf(key);
  if (i < 0) return "";
  i = body.indexOf(':', i);
  if (i < 0) return "";
  i++;
  // skip whitespace
  while (i < (int)body.length() && isspace(body[i])) i++;
  if (i >= (int)body.length()) return "";
  if (body[i] == '\"') {
    int j = body.indexOf('\"', i + 1);
    if (j < 0) return "";
    return body.substring(i + 1, j);
  } else {
    // bare token
    int j = i;
    while (j < (int)body.length() && body[j] != ',' && body[j] != '}' && !isspace(body[j])) j++;
    return trimWS(body.substring(i, j));
  }
}

void setup() {
  Serial.begin(115200);
  delay(10000); // long delay before printing to ensure we see logs

  // ===== A) AP mode (simple to test) =====
  WiFi.mode(WIFI_AP);
  bool ok = WiFi.softAP(AP_SSID, AP_PASS);
  Serial.println(ok ? "[AP] started" : "[AP] failed");
  Serial.print("[AP] IP: "); Serial.println(WiFi.softAPIP());

  // ===== B) Station mode (use instead of AP if you prefer) =====
  /*
  WiFi.mode(WIFI_STA);
  WiFi.begin(STA_SSID, STA_PASS);
  Serial.print("Joining WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\n[STA] connected");
  Serial.print("[STA] IP: "); Serial.println(WiFi.localIP());
  */

  if (udp.begin(PORT)) {
    Serial.print("UDP listening on "); Serial.println(PORT);
  } else {
    Serial.println("udp.begin failed");
  }
}

void loop() {
  int size = udp.parsePacket();
  if (size <= 0) return;

  char buf[1500];
  int len = udp.read(buf, sizeof(buf) - 1);
  if (len <= 0) return;
  buf[len] = '\0';

  String body(buf);
  IPAddress rip = udp.remoteIP();
  uint16_t rport = udp.remotePort();

  Serial.print("Recv "); Serial.print(rip); Serial.print(":"); Serial.print(rport);
  Serial.print(" -> "); Serial.println(body);

  // Robust matching using simple substrings (no fragile JSON parse):
  String response;

  if (body.indexOf("\"type\":\"handshake\"") >= 0) {
    response = "{\"type\":\"handshake_ack\",\"ack\":true}";
  } else if (body.indexOf("\"type\":\"command\"") >= 0) {
    String op = extractOp(body);
    if (op.length() == 0) op = "UNKNOWN";
    response = String("{\"type\":\"ack\",\"ack\":true,\"op\":\"") + op + "\"}";
  } else if (body.indexOf("\"type\":\"ack\"") >= 0) {
    Serial.println("Note: PC sent final ack (no reply needed).");
    return;
  } else {
    response = "{\"type\":\"error\",\"ack\":false,\"reason\":\"unknown_type\"}";
  }

  udp.beginPacket(rip, rport);
  udp.write((const uint8_t*)response.c_str(), response.length());
  udp.endPacket();

  Serial.print("Sent: "); Serial.println(response);
}