# Opening Bridge Project – **Systems Team Documentation**

*(Version 1.0 – 3 Aug 2025)*

---

## 1 │ Project Scope & Goals (Quick Recap)

* **Mission:** Build a sensor-driven, Wi-Fi–enabled opening bridge that

  * detects approaching boats/traffic,
  * signals & actuates the lift mechanism,
  * exposes a remote UI with full manual override.
* **Power / Budget:** 12 V 5 A supply, ≤ AUD 100 bill-of-materials (excl. base plate).
* **Delivery:** Prototype demo (Week 8) → Final build & in-person demonstration (Week 13).

---

## 2 │ Systems Team – Core Responsibilities

| # | Sub-System                  | Key Tasks                                                                             |
| - | --------------------------- | ------------------------------------------------------------------------------------- |
| 1 | **Sensor Integration**      | IR/ultrasonic boat detector, deck limit switches, bridge-up encoder, obstacle sensor. |
| 2 | **Control Logic**           | Decide when to open/close; manage states, timers, safety interlocks.                  |
| 3 | **Motor/Actuator Control**  | Drive motors/servos via motor shield or H-bridge; ensure smooth start/stop.           |
| 4 | **Communication Layer**     | JSON / UDP (or TCP/WebSocket) link between MCU ↔ Remote UI.                           |
| 5 | **Remote UI**               | Real-time dashboard: status LEDs, camera feed (optional), manual override buttons.    |
| 6 | **Safety / Override**       | E-stop, watchdog heartbeat, over-current & stall detection, obstacle stop.            |
| 7 | **Documentation & Testing** | Interface spec with Structures team, unit tests, integration logs.                    |

---

## 3 │ Reusable Components from `CCP.java`

| Component / Logic                            | How to Repurpose for Bridge                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `StateManager` enum & update logic           | Map to `BridgeStateManager` (`IDLE`, `OPENING`, `OPEN`, `CLOSING`, `CLOSED`, `EMERGENCY`).       |
| UDP `CommunicationHandler` & listener thread | Keep identical for MCU ↔ PC/Web UI messaging.                                                    |
| Heartbeat executor (`scheduleAtFixedRate`)   | Health-check remote UI & motor controller; auto-fail-safe after timeout.                         |
| JSON encoding/decoding via `JSONProcessor`   | Continue as lightweight protocol; adjust keys (`bridge_id`, `command`).                          |
| LED pattern helper                           | Reuse to drive status LEDs (Green = OPEN, Red = CLOSED, Yellow = MOVING, Flash Red = EMERGENCY). |
| `sendMessageToESP` / acknowledgement wait    | Retain for motor controller ACKs (e.g., “BRIDGE\_OPENED”).                                       |
| `onHazardDetected()`                         | Rename `onObstacleDetected()` – triggered by deck IR/ultrasonic sensor.                          |

---

## 4 │ Proposed Directory Structure & Skeleton Code

```
bridge-control-system/
├── README.md
├── .gitignore
├── diagrams/
│   └── system-architecture.png  (block diagram, interfaces)
└── src/
    ├── bridge/
    │   ├── BridgeController.java          // main orchestrator
    │   ├── BridgeStateManager.java        // enum + state machine
    │   ├── CommunicationHandler.java      // interface
    │   ├── UDPCommunicationHandler.java   // JSON/UDP implementation
    │   ├── SensorHandler.java             // boat, deck-limit, obstacle
    │   ├── MotorController.java           // open/close/stop bridge
    │   ├── LEDController.java             // visual feedback
    │   └── HeartbeatService.java          // watchdog & keep-alive
    └── utils/
        └── JSONProcessor.java             // encode/decode helpers
```

**Key class snippets**

```java
// BridgeStateManager.java
public enum State { IDLE, OPENING, OPEN, CLOSING, CLOSED, EMERGENCY }

public class BridgeStateManager {
    private State current = State.IDLE;
    public void update(State s){ current = s; System.out.println("State→" + s);} 
    public State get(){ return current; }
}
```

```java
// BridgeController.java  (core loop sketch)
while(true){
    if(sensorHandler.isBoatDetected() && state.get()!=State.OPEN){
        openBridge();
    }
    if(!sensorHandler.isBoatDetected() && state.get()==State.OPEN){
        closeBridge();
    }
    // handle UI commands, heartbeat, emergency, etc.
}
```

---

## 5 │ Implementation Considerations

1. **Concurrency & Threading**

   * Java side: single main loop + executor threads for UDP listener & heartbeat.
   * MCU side (ESP32): FreeRTOS tasks for motor control vs. network stack.

2. **Fail-Safe Defaults**

   * Loss of power ⇒ bridge remains *closed* (safe for pedestrians/vehicles).
   * Lost comm/heartbeat ⇒ EMERGENCY state → cut motor power, flash Red LED.

3. **Deterministic Timing**

   * Use limit switches/encoders to stop motor precisely, not time-only delays.

4. **Signal Integrity**

   * Opto-isolate sensor inputs; debounce mechanical switches in software.

5. **Budget Compliance**

   * Prefer PWM motor driver (L298N) + 12 V DC gear motor; keep BOM ≤ AUD 100.

---

## 6 │ Five Possible Coding Solutions (Architectural Options)

| #     | Stack                                                                                        | Highlights                                                              | Trade-offs                                                  |
| ----- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| **1** | **Java Back-End (PC/Raspberry Pi)** + **ESP32 Motor Node** (C++/Arduino)                     | Reuses most of the CCP logic verbatim; strong threading & file-logging. | Requires always-on computer; Java heavier on Pi.            |
| **2** | **Python Asyncio Server** + **ESP32**                                                        | Faster prototyping, rich UI via Flask + WebSockets.                     | Must rewrite CCP logic; GIL limits multi-threading.         |
| **3** | **Full ESP32-Only** (C++): bridge logic *on-board*, PC just a web dashboard served from ESP  | Lowest BOM, no external PC.                                             | Limited heap for complex UI; C++ harder to iterate quickly. |
| **4** | **Node.js (Express + Socket.io) Server** + **ESP32**                                         | Real-time dashboard, huge JS ecosystem, deploy on Pi.                   | Node event loop unfamiliar to some; potential latency.      |
| **5** | **Microservices Mix:** Java **State-Service**, Go **Comm-Service**, React UI, ESP32 hardware | Clear separation, each piece small & testable.                          | Overkill for student project; more repos & DevOps overhead. |

> **Recommendation for ENGG2000-3000:** Start with **Option 1** (Java + ESP32) – you can directly port CCP code, prove basic functionality fast, and scale down if needed.

---

## 7 │ Next Steps Checklist ✅

1. [ ] Fork/clone **`bridge-control-system`** repo and push skeleton classes.
2. [ ] Define JSON message schema (`command`, `state`, `timestamp`, etc.).
3. [ ] Integrate basic sensor mocks → toggle bridge LEDs & console logs.
4. [ ] Wire actual IR/ultrasonic sensor & L298N motor driver on breadboard.
5. [ ] Demo MVP to Structures team; confirm mechanical interface specs.
6. [ ] Document test results & update README + diagrams.

---



