package bridge.controller;

import bridge.net.Server;
import bridge.state.Override;
import bridge.traffic.Traffic;
import bridge.traffic.TrafficLight;

import java.net.InetAddress;
import java.util.LinkedHashMap;
import java.util.Map;

public class BridgeController {
    private final Server server;
    private final Override override;
    private final Traffic traffic;

    public BridgeController(Server server, Override override, Traffic traffic) {
        this.server = server;
        this.override = override;
        this.traffic = traffic;
    }

    public void runOnce() throws Exception {
        System.out.println("Status: " + server.getStatus());
        server.handshake();

        Map<String, Object> cmd = new LinkedHashMap<>();
        cmd.put("type", "command");
        cmd.put("op", "PING");
        cmd.put("traffic", traffic.getTraffic().name());
        cmd.put("override", override.getStatus());

        server.send(cmd);
        System.out.println("Sent: " + cmd);

        var reply = server.listen();
        System.out.println("Reply: " + reply);

        server.acknowledge();
    }

    public static void main(String[] args) throws Exception {
     InetAddress espIp = InetAddress.getByName("192.168.4.1"); // or your STA IP

        int port = 42100;

        try (Server s = new Server(espIp, port)) {
            BridgeController c = new BridgeController(s, new Override(), new Traffic(TrafficLight.red));
            c.runOnce();
        }
    }
}
