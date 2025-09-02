package bridge.net;

import bridge.util.JsonUtil;

import java.io.IOException;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public class Server implements AutoCloseable {
    private final DatagramSocket socket;
    private final InetAddress espIp;
    private final int port;

    public Server(InetAddress espIp, int port) throws SocketException {
        this.espIp = espIp;
        this.port = port;
        this.socket = new DatagramSocket(port);
        this.socket.setReuseAddress(true);
        this.socket.setSoTimeout(2000);
    }

    public String getStatus() {
        return "Server(UDP) targeting " + espIp.getHostAddress() + ":" + port;
    }

    public void handshake() throws IOException {
        Map<String, Object> j = base("handshake");
        j.put("hello", "bridge");
        send(j);
        Map<String, String> reply = listen();
        if (!"true".equalsIgnoreCase(reply.getOrDefault("ack", "false"))) {
            throw new IOException("Handshake failed: " + reply);
        }
    }

    public void acknowledge() throws IOException {
        Map<String, Object> j = base("ack");
        j.put("ok", true);
        send(j);
    }

    public Map<String, String> listen() throws IOException {
        try {
            byte[] buf = new byte[1500];
            DatagramPacket p = new DatagramPacket(buf, buf.length);
            socket.receive(p);
            String body = new String(p.getData(), 0, p.getLength(), StandardCharsets.UTF_8);
            return JsonUtil.parseFlat(body);
        } catch (SocketTimeoutException e) {
            throw new IOException("listen() timed out");
        }
    }

    public String handleMessage(Map<String, String> msg) {
        return "handled:" + msg.getOrDefault("type", "unknown");
    }

    public void send(Map<String, ?> j) throws IOException {
        String text = JsonUtil.stringify(j);
        byte[] data = text.getBytes(StandardCharsets.UTF_8);
        socket.send(new DatagramPacket(data, data.length, espIp, port));
    }

    private static Map<String, Object> base(String type) {
        Map<String, Object> j = new LinkedHashMap<>();
        j.put("type", type);
        j.put("ts", Instant.now().toEpochMilli());
        return j;
    }

    @Override public void close() { socket.close(); }
}
