Below is a **fully-commented, beginner-friendly Java skeleton** for the bridge control system.
Copy each file into the matching path inside your `src/` folder (package names included).
Every class is **minimal but runnable**, and each block explains *why it exists* and *how to extend it*.

> **Tip for true beginners:**
>
> 1. Create a new Gradle/Maven project in IntelliJ or VS Code.
> 2. Mirror the folder tree shown here (`bridge/`, `utils/`).
> 3. Paste each file.
> 4. Run `BridgeController`’s `main()` — you’ll see console output simulating the bridge.

---

## 1 ┃ `BridgeStateManager.java`

```java
package bridge;

/**
 * Keeps track of WHAT STATE the bridge is in.
 * Think of it as an on-screen status label 😊
 *
 * Add or rename states as needed.
 */
public class BridgeStateManager {

    /** All possible states for our opening bridge. */
    public enum State {
        IDLE,          // Waiting – no traffic, no boats
        OPENING,       // Motors lifting the deck
        OPEN,          // Fully open – boats may pass
        CLOSING,       // Motors lowering the deck
        CLOSED,        // Fully closed – cars/pedestrians may cross
        EMERGENCY      // Something went wrong – stop everything!
    }

    private State current = State.IDLE;

    /** Call this whenever you change what the bridge is doing. */
    public void updateState(State newState) {
        this.current = newState;
        System.out.println("[State] ➜ " + newState);
    }

    /** Ask the manager: “What’s the bridge doing right now?” */
    public State getCurrentState() {
        return current;
    }
}
```

---

## 2 ┃ `CommunicationHandler.java`

```java
package bridge;

/**
 * Generic interface for *any* comms class (UDP, TCP, Serial, etc.).
 * Having an interface lets you swap protocols later without
 * rewriting BridgeController.
 */
public interface CommunicationHandler {
    void sendMessage(String message) throws Exception;
    /** Optional: add a "listen" method if you need two-way traffic. */
}
```

---

## 3 ┃ `UDPCommunicationHandler.java`

```java
package bridge;

import java.net.*;

/**
 * A **tiny** UDP client. Perfect when both ends are on the same Wi-Fi network.
 * ► targetIP   : ESP32 or remote dashboard
 * ► targetPort : the port that other device is listening on
 *
 * For production you might add a listener thread for incoming packets.
 */
public class UDPCommunicationHandler implements CommunicationHandler {

    private final InetAddress targetAddress;
    private final int targetPort;
    private final DatagramSocket socket = new DatagramSocket();

    public UDPCommunicationHandler(String ip, int port) throws Exception {
        this.targetAddress = InetAddress.getByName(ip);
        this.targetPort = port;
    }

    @Override
    public void sendMessage(String message) throws Exception {
        byte[] buffer = message.getBytes();
        DatagramPacket packet =
            new DatagramPacket(buffer, buffer.length, targetAddress, targetPort);
        socket.send(packet);
        System.out.println("[UDP] Sent → " + message);
    }
}
```

---

## 4 ┃ `SensorHandler.java`

```java
package bridge;

/**
 * REPLACE the “return false;” lines with actual GPIO / Serial code
 * once you connect real sensors (IR, ultrasonic, limit switches).
 */
public class SensorHandler {

    /** Simulate boat detection (boat 50% chance every call). */
    public boolean isBoatDetected() {
        return Math.random() < 0.5;
    }

    /** Simulate obstacle on bridge deck. */
    public boolean isObstacleDetected() {
        return Math.random() < 0.1;  // rare event
    }
}
```

---

## 5 ┃ `MotorController.java`

```java
package bridge;

/**
 * Wraps ALL motor/servo commands.  In real hardware you’ll talk to
 * an ESP32 or a motor driver shield.  Here we just print messages.
 */
public class MotorController {

    public void openBridge() {
        System.out.println("[Motor] Lifting deck…");
        // TODO: send “OPEN” command over I²C / Serial / Wi-Fi
    }

    public void closeBridge() {
        System.out.println("[Motor] Lowering deck…");
        // TODO: send “CLOSE” command
    }

    public void stop() {
        System.out.println("[Motor] **EMERGENCY STOP**");
        // TODO: cut PWM / power
    }
}
```

---

## 6 ┃ `LEDController.java`

```java
package bridge;

/**
 * Controls LED indicators (or buzzers) so physical users know what’s up.
 * If you have an RGB LED, map colours to these methods.
 */
public class LEDController {

    public void showOpen()    { System.out.println("[LED] GREEN (Open)"); }
    public void showClosed()  { System.out.println("[LED] RED   (Closed)"); }
    public void showMoving()  { System.out.println("[LED] YELLOW(Busy)"); }
    public void showError()   { System.out.println("[LED] FLASH RED (Emergency)"); }
    public void allOff()      { System.out.println("[LED] OFF"); }
}
```

---

## 7 ┃ `HeartbeatService.java`

```java
package bridge;

import java.util.concurrent.*;

/**
 * Pings the remote dashboard every few seconds so both sides know
 * the link is healthy.  Calls a callback if acknowledgements stop.
 */
public class HeartbeatService {

    private final ScheduledExecutorService exec =
        Executors.newSingleThreadScheduledExecutor();

    public interface TimeoutListener {
        void onTimeout();
    }

    public void start(Runnable sendBeat, TimeoutListener timeoutListener) {
        final int[] missed = {0};

        exec.scheduleAtFixedRate(() -> {
            sendBeat.run();        // send heartbeat packet
            missed[0]++;
            if (missed[0] > 3) {   // 3 missed beats = ~6 s with default period
                timeoutListener.onTimeout();
                missed[0] = 0;     // reset counter
            }
        }, 0, 2, TimeUnit.SECONDS);
    }

    /** Call this whenever an ACK is received from dashboard. */
    public void ackReceived() { /* reset logic could live here */ }

    public void stop() { exec.shutdown(); }
}
```

---

## 8 ┃ `JSONProcessor.java`

```java
package utils;

import org.json.JSONObject;

/** Tiny helper: encode/decode JSON strings. */
public class JSONProcessor {

    public static String encode(String sender, String type, String body) {
        JSONObject obj = new JSONObject();
        obj.put("sender", sender);
        obj.put("type",   type);
        obj.put("body",   body);
        return obj.toString();
    }

    public static JSONObject decode(String raw) {
        return new JSONObject(raw);
    }
}
```

---

## 9 ┃ `BridgeController.java`  (Brain of the system)

```java
package bridge;

import bridge.BridgeStateManager.State;
import utils.JSONProcessor;

public class BridgeController {

    /* ── CONFIG (change these to match your network) ───────────── */
    private static final String DASHBOARD_IP   = "192.168.4.2";
    private static final int    DASHBOARD_PORT = 5000;
    /* ──────────────────────────────────────────────────────────── */

    /* Core modules */
    private final BridgeStateManager state = new BridgeStateManager();
    private final SensorHandler      sensors = new SensorHandler();
    private final MotorController    motor   = new MotorController();
    private final LEDController      leds    = new LEDController();
    private final CommunicationHandler comms;

    public BridgeController() throws Exception {
        this.comms = new UDPCommunicationHandler(DASHBOARD_IP, DASHBOARD_PORT);
        startHeartbeat(); // optional watchdog
    }

    /** Heartbeat → dashboard every 2 s. */
    private void startHeartbeat() {
        new HeartbeatService().start(
            () -> {
                try {
                    String hb = JSONProcessor.encode("bridge", "HEARTBEAT", state.getCurrentState().toString());
                    comms.sendMessage(hb);
                } catch (Exception e) { e.printStackTrace(); }
            },
            () -> {
                System.out.println("[Heartbeat] Dashboard not responding!");
                emergencyStop();
            }
        );
    }

    /* ── STATE TRANSITIONS ────────────────────────────────────── */

    private void openBridge() {
        state.updateState(State.OPENING);
        leds.showMoving();
        motor.openBridge();

        // Simulate time to fully open
        sleep(3000);

        state.updateState(State.OPEN);
        leds.showOpen();
    }

    private void closeBridge() {
        state.updateState(State.CLOSING);
        leds.showMoving();
        motor.closeBridge();

        sleep(3000);

        state.updateState(State.CLOSED);
        leds.showClosed();
    }

    private void emergencyStop() {
        state.updateState(State.EMERGENCY);
        motor.stop();
        leds.showError();
    }

    /* ── MAIN LOOP ────────────────────────────────────────────── */

    public void run() {
        leds.showClosed(); // initial indication

        while (true) {
            // 1. EMERGENCY FIRST
            if (sensors.isObstacleDetected()) {
                System.out.println("[Sensor] Obstacle! Emergency halt.");
                emergencyStop();
                break;
            }

            // 2. Handle boat arrival
            if (sensors.isBoatDetected() && state.getCurrentState() == State.CLOSED) {
                System.out.println("[Sensor] Boat detected → Opening bridge.");
                openBridge();
            }

            // 3. Close bridge once boat passes
            if (!sensors.isBoatDetected() && state.getCurrentState() == State.OPEN) {
                System.out.println("[Sensor] Waterway clear → Closing bridge.");
                closeBridge();
            }

            sleep(500); // loop every 0.5 s
        }
    }

    /* Utility sleep */
    private static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }

    /* ENTRY POINT */
    public static void main(String[] args) {
        try {
            BridgeController controller = new BridgeController();
            controller.run();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

### How to Extend

1. **Replace sensor stubs** in `SensorHandler` with GPIO library calls (e.g., Pi4J, Firmata, or Serial read from ESP32).
2. **Swap UDP for WebSocket** by writing `WebSocketCommunicationHandler` implementing the same interface.
3. **Add listener thread** inside `UDPCommunicationHandler` if you need to process *incoming* commands from the Remote UI (`OPEN_MANUAL`, `EMERGENCY_STOP`, …).
4. **Integrate real motor driver**: in `MotorController`, send commands over Serial (`"OPEN\n"`), or control GPIO pins directly if Java runs on a Raspberry Pi.
5. **UI side**: simple Flask/React app that receives status packets and sends commands back.

---

You now have a **clean, readable bridge-control skeleton**—simple enough for a beginner yet modular enough for an expert to expand.
Happy coding! 🎉
    * ESP32 side: single loop with async callbacks for incoming UDP packets.
    * Use `ScheduledExecutorService` for periodic tasks like heartbeats.