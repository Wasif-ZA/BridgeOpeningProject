package bridge.traffic;

public class Traffic {
    private TrafficLight light;

    public Traffic(TrafficLight initial) {
        this.light = (initial == null) ? TrafficLight.red : initial;
    }

    public TrafficLight getTraffic() { return light; }
    public void setTraffic(TrafficLight next) { this.light = (next == null) ? light : next; }

    public String ledState() {
        return switch (light) {
            case green -> "LED:GREEN";
            case yellow -> "LED:YELLOW";
            case red -> "LED:RED";
        };
    }
}
