#!/usr/bin/env python3
import argparse
import json
import socket
import sys
import time

DEFAULT_IP = "192.168.4.1"
DEFAULT_PORT = 42100
DEFAULT_TIMEOUT = 2.0

HELP_TEXT = """
Type an operation name and press Enter to send:
  FORWARD            -> {"type":"command","op":"FORWARD"}
  SET_SPEED {"left":200,"right":150}
                      -> {"type":"command","op":"SET_SPEED","args":{"left":200,"right":150}}

Slash-commands:
  /handshake         -> sends {"type":"handshake"}
  /ping              -> quick forward/ack test (FORWARD then STOP)
  /raw <text>        -> sends raw text exactly as typed
  /timeout <sec>     -> set receive timeout (e.g. /timeout 5)
  /target <ip:port>  -> change target (e.g. /target 192.168.4.1:42100)
  /help              -> show this help
  /quit              -> exit
"""

def now_ms():
    return int(time.perf_counter() * 1000)

def send_and_recv(sock: socket.socket, target, payload: str, retries: int = 0):
    """Send one UDP datagram and wait for one reply, with optional retries."""
    attempt = 0
    while True:
        try:
            t0 = time.perf_counter()
            sock.sendto(payload.encode("utf-8"), target)
            data, addr = sock.recvfrom(4096)
            dt = (time.perf_counter() - t0) * 1000.0
            print(f"[RECV {addr[0]}:{addr[1]} | {dt:.1f} ms] {data.decode('utf-8', errors='replace')}")
            return True
        except socket.timeout:
            if attempt < retries:
                attempt += 1
                print(f"[TIMEOUT] No response. Retrying {attempt}/{retries}…")
                continue
            print("[TIMEOUT] No response received.")
            return False
        except OSError as e:
            print(f"[SOCKET ERROR] {e}")
            return False

def parse_args_json(maybe_json: str):
    maybe_json = maybe_json.strip()
    if not maybe_json:
        return None
    try:
        obj = json.loads(maybe_json)
        if not isinstance(obj, dict):
            print("[WARN] Extra JSON after op should be an object; ignoring.")
            return None
        return obj
    except json.JSONDecodeError:
        print("[WARN] Could not parse trailing JSON; ignoring.")
        return None

def interactive_loop(sock, target):
    print("Starting UDP CLI. /help for commands.\n")
    while True:
        try:
            line = input("> ").strip()
        except EOFError:
            print()
            break
        if not line:
            continue

        # Slash commands
        if line.startswith("/"):
            parts = line.split(maxsplit=1)
            cmd = parts[0].lower()

            if cmd == "/quit":
                break

            elif cmd == "/help":
                print(HELP_TEXT)

            elif cmd == "/handshake":
                payload = json.dumps({"type": "handshake"})
                print(f"[SEND] {payload}")
                send_and_recv(sock, target, payload, retries=1)

            elif cmd == "/ping":
                # quick path test: FORWARD then STOP
                for p in [
                    json.dumps({"type": "command", "op": "FORWARD"}),
                    json.dumps({"type": "command", "op": "STOP"}),
                ]:
                    print(f"[SEND] {p}")
                    send_and_recv(sock, target, p, retries=1)

            elif cmd == "/raw":
                if len(parts) == 1 or not parts[1]:
                    print("Usage: /raw <text>")
                    continue
                payload = parts[1]
                print(f"[SEND RAW] {payload}")
                send_and_recv(sock, target, payload, retries=0)

            elif cmd == "/timeout":
                if len(parts) == 1:
                    print(f"Current timeout: {sock.gettimeout()}s")
                    continue
                try:
                    new_t = float(parts[1])
                    sock.settimeout(new_t)
                    print(f"Timeout set to {new_t}s")
                except ValueError:
                    print("Usage: /timeout <seconds>")

            elif cmd == "/target":
                if len(parts) == 1:
                    print("Usage: /target <ip:port>")
                    continue
                try:
                    ip_port = parts[1]
                    ip, port_str = ip_port.split(":")
                    target = (ip.strip(), int(port_str.strip()))
                    print(f"Target set to {target[0]}:{target[1]}")
                except Exception:
                    print("Usage: /target <ip:port> (e.g., /target 192.168.4.1:42100)")

            else:
                print("Unknown command. Try /help.")
            continue

        # Normal command: "op" or "op {json}"
        if "{" in line and line.rstrip().endswith("}"):
            first_space = line.find(" ")
            if first_space == -1:
                op = line
                extra = None
            else:
                op = line[:first_space].strip()
                extra = parse_args_json(line[first_space + 1 :])
        else:
            op = line
            extra = None

        if not op:
            print("[WARN] Empty operation.")
            continue

        payload_dict = {"type": "command", "op": op}
        if extra:
            payload_dict["args"] = extra

        payload = json.dumps(payload_dict, separators=(",", ":"))
        print(f"[SEND] {payload}")
        send_and_recv(sock, target, payload, retries=0)

def main():
    ap = argparse.ArgumentParser(description="ESP32 UDP CLI")
    ap.add_argument("--ip", default=DEFAULT_IP, help=f"ESP32 IP (default {DEFAULT_IP})")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"ESP32 port (default {DEFAULT_PORT})")
    ap.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help=f"Receive timeout seconds (default {DEFAULT_TIMEOUT})")
    ap.add_argument("--no-handshake", action="store_true", help="Skip automatic handshake on start")
    ap.add_argument("--send", help='Send one command then exit, e.g. --send \'SET_SPEED {"left":200,"right":150}\'')
    args = ap.parse_args()

    target = (args.ip, args.port)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(args.timeout)

    print(f"Target: {target[0]}:{target[1]}  |  Timeout: {args.timeout}s")

    # Optional initial handshake
    if not args.no_handshake:
        hs = json.dumps({"type": "handshake"})
        print(f"[SEND] {hs}")
        send_and_recv(sock, target, hs, retries=1)
        print()

    # Non-interactive single send (useful for scripts)
    if args.send:
        line = args.send.strip()
        # parse as in interactive
        if "{" in line and line.rstrip().endswith("}"):
            first_space = line.find(" ")
            if first_space == -1:
                op = line
                extra = None
            else:
                op = line[:first_space].strip()
                extra = parse_args_json(line[first_space + 1 :])
        else:
            op = line
            extra = None

        if not op:
            print("[WARN] Empty operation.")
            return

        payload_dict = {"type": "command", "op": op}
        if extra:
            payload_dict["args"] = extra
        payload = json.dumps(payload_dict, separators=(",", ":"))
        print(f"[SEND] {payload}")
        send_and_recv(sock, target, payload, retries=0)
        return

    # Interactive mode
    try:
        interactive_loop(sock, target)
    finally:
        sock.close()
        print("Bye.")

if __name__ == "__main__":
    main()
