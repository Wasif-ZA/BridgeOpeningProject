# Architecture Overview

This project demonstrates an end-to-end bridge opening control system that spans a web UI, an API proxy, and embedded firmware.

```text
[Operator]
   │
   ▼
Next.js UI (`ui/src/app`)
   │  POST /api/cmd
   ▼
API Proxy (`ui/src/app/api/cmd/route.ts`)
   │  POST { op }
   ▼
ESP32 Gateway (`Arduino/esp32_gateway*`)
   │  serial / control frames
   ▼
Arduino Actuator (`Arduino/uno`)
```

## Major Components

### 1) Operator UI (Next.js)
- Location: `ui/src/app/`
- Purpose: Provide an HMI-style interface for bridge status and operator commands.
- Key routes:
  - `/` – system overview and bring-up steps
  - `/control` – control panel with command logging and safety interlocks

### 2) API Proxy (Next.js Route Handler)
- Location: `ui/src/app/api/cmd/route.ts`
- Purpose: Keep device URLs out of the browser and centralize timeout + error handling.
- Behavior:
  - Validates `op`
  - Reads `ESP32_BASE_URL` from environment
  - Forwards the command to `${ESP32_BASE_URL}/cmd`
  - Returns structured JSON responses for UI consumption

### 3) ESP32 Gateway Firmware
- Location: `Arduino/esp32_gateway`, `Arduino/esp32_gateway_udp_ack`
- Purpose: Accept network commands and translate them into actuator-friendly signals.

### 4) Arduino Actuator Firmware
- Location: `Arduino/uno`
- Purpose: Own the lowest-level motor/servo control and safety logic.

### 5) Local Tooling / Diagnostics
- Location: `scripts/udp_cli.py`
- Purpose: Provide a quick CLI to validate UDP connectivity and command responses during bring-up.

## Data Flow Notes

1. Operators interact with the Next.js UI.
2. The UI calls `/api/cmd` with a numeric command code.
3. The API proxy validates and forwards to the ESP32 gateway.
4. The ESP32 relays the command to the Arduino actuator layer.
5. Responses are surfaced back to the UI and recorded in the command log.

## Integration Points
- **Environment variable:** `ESP32_BASE_URL` (required for API proxy).
- **Network:** UI runtime must be able to reach the ESP32 over the configured IP.
- **Firmware alignment:** Numeric command codes must stay aligned between UI and firmware.
