package bridge.motion;

import bridge.state.Movement;

public class BridgeMovement {
    private Movement gate = Movement.stop;

    public String getGate() { return gate.name(); }
    public void setGate(Movement m) { gate = (m == null) ? Movement.stop : m; }
    public String gateStatus() { return "gate:" + gate.name(); }
}
