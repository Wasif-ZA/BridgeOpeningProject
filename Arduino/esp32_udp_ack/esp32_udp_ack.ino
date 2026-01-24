#include <WiFi.h>
#include <WiFiUDP.h>

// ===== Choose ONE =====
// A) ESP32 as Access Point (PC connects to it)
const char* AP_SSID = "ESP32_AP";
const char* AP_PASS = "esp32pass";

// B) Station mode (ESP joins router)
// const char* STA_SSID = "YourRouterSSID";
// const char* STA_PASS = "YourRouterPassword";

WiFiUDP udp;
const uint16_t PORT = 42100;

void setup() {
  Serial.begin(115200);
  delay(300);

  // --- AP mode (simple for testing)
  WiFi.mode(WIFI_AP);
  bool ok = WiFi.softAP(AP_SSID, AP_PASS);
  Serial.println(ok ? "[AP] started" : "[AP] failed");
  Serial.print("[AP] IP: "); Serial.println(WiFi.softAPIP());

  // --- Station mode (use instead of AP if needed)
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

static String tinyValue(const String& key, const String& json) {
  // naive: find "key": then read value (string or bare)
  String pat = "\"" + key + "\"";
  int i = json.indexOf(pat);
  if (i < 0) return "";
  i = json.indexOf(':', i);
  if (i < 0) return "";
  i++;
  while (i < (int)json.length() && isspace(json[i])) i++;
  if (i >= (int)json.length()) return "";
  if (json[i] == '"') {
    int j = json.indexOf('"', i + 1);
    if (j < 0) return "";
    return json.substring(i + 1, j);
  } else {
    int j = i;
    while (j < (int)json.length() && json[j] != ',' && json[j] != '}' && !isspace(json[j])) j++;
    return json.substring(i, j);
  }
}

void loop() {
  int size = udp.parsePacket();
  if (size > 0) {
    char buf[1500];
    int len = udp.read(buf, sizeof(buf) - 1);
    if (len <= 0) return;
    buf[len] = '\0';

    String body(buf);
    IPAddress rip = udp.remoteIP();
    uint16_t rport = udp.remotePort();

    Serial.print("Recv: "); Serial.println(body);

    String type = tinyValue("type", body);
    String response;

    if (type == "handshake") {
      response = String("{\"type\":\"handshake_ack\",\"ack\":true}");
    } else if (type == "command") {
      // minimal echo-ack
      String op = tinyValue("op", body);
      response = String("{\"type\":\"ack\",\"ack\":true,\"op\":\"") + op + "\"}";
    } else if (type == "ack") {
      // optional final ack from PC; just show it
      Serial.println("PC sent final ack.");
      return;
    } else {
      response = String("{\"type\":\"error\",\"ack\":false}");
    }

    udp.beginPacket(rip, rport);
    udp.write((const uint8_t*)response.c_str(), response.length());
    udp.endPacket();

    Serial.print("Sent: "); Serial.println(response);
  }
}
