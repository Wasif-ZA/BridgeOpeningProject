package bridge.util;

import java.util.LinkedHashMap;
import java.util.Map;

public final class JsonUtil {
    private JsonUtil() {}

    public static String stringify(Map<String, ?> map) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        boolean first = true;
        for (var e : map.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append('"').append(escape(e.getKey())).append('"').append(':');
            Object v = e.getValue();
            if (v == null) {
                sb.append("null");
            } else if (v instanceof Number || v instanceof Boolean) {
                sb.append(v.toString());
            } else {
                sb.append('"').append(escape(String.valueOf(v))).append('"');
            }
        }
        sb.append('}');
        return sb.toString();
    }

    public static Map<String, String> parseFlat(String json) {
        Map<String, String> out = new LinkedHashMap<>();
        if (json == null) return out;
        json = json.trim();
        if (json.startsWith("{")) json = json.substring(1);
        if (json.endsWith("}")) json = json.substring(0, json.length() - 1);
        int i = 0;
        while (i < json.length()) {
            while (i < json.length() && (Character.isWhitespace(json.charAt(i)) || json.charAt(i) == ',')) i++;
            if (i >= json.length()) break;

            if (json.charAt(i) != '"') break;
            int kStart = ++i;
            while (i < json.length() && json.charAt(i) != '"') i++;
            String key = unescape(json.substring(kStart, i));
            i++;
            while (i < json.length() && (Character.isWhitespace(json.charAt(i)) || json.charAt(i) == ':')) i++;

            String val;
            if (i < json.length() && json.charAt(i) == '"') {
                int vStart = ++i;
                while (i < json.length() && json.charAt(i) != '"') i++;
                val = unescape(json.substring(vStart, i));
                i++;
            } else {
                int vStart = i;
                while (i < json.length() && ",}]".indexOf(json.charAt(i)) == -1) i++;
                val = json.substring(vStart, i).trim();
            }
            out.put(key, val);
        }
        return out;
    }

 private static String escape(String s) {
    return s.replace("\\", "\\\\")   // escape backslashes
            .replace("\"", "\\\"");  // escape quotes
}

private static String unescape(String s) {
    return s.replace("\\\"", "\"")   // unescape quotes
            .replace("\\\\", "\\");  // unescape backslashes
}

}
