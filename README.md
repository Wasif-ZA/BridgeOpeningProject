<p align="center">
  <a href="#quickstart"><strong>Quickstart</strong></a> &middot;
  <a href="#how-it-works"><strong>How it works</strong></a> &middot;
  <a href="#configuration"><strong>Configuration</strong></a> &middot;
  <a href="#docs"><strong>Docs</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/UI-Next.js%2015-000000" alt="Next.js 15">
  <img src="https://img.shields.io/badge/firmware-ESP32%20%2B%20Arduino-00979D" alt="ESP32 and Arduino">
  <img src="https://img.shields.io/badge/hardware-optional%20(mock%20mode)-1a7f64" alt="Mock mode, no hardware needed">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT">
</p>

<br>

# The Bridge Opening Project opens a model bridge from a browser.

An operator console in Next.js, an ESP32 gateway and an Arduino that moves the bridge.

**If the bridge is the _drawbridge_, this is the _bridge keeper's desk_.**

The operator sends a command from the console. A Next.js route checks it, adds a timeout, and
forwards it to the ESP32. The ESP32 passes it to the Arduino, which drives the motors. Bridge
motion only works in manual mode.

**Run the whole console with no hardware: switch on Mock.**

|        | Step          | Example                                          |
| ------ | ------------- | ------------------------------------------------ |
| **01** | Install       | _`cd ui && npm install`_                         |
| **02** | Run           | _`cp .env.example .env.local && npm run dev`_    |
| **03** | Try it        | _Open `/control`, switch on **Mock**, send a command._ |

> [!TIP]
> **🌉 Or hand it to your agent.** Paste this into Claude Code or Codex:
>
> ```text
> Clone https://github.com/Wasif-ZA/BridgeOpeningProject, run `npm install` in ui/,
> copy .env.example to .env.local, run `npm run dev`, and open /control with Mock on.
> ```

<br>

## Problems it solves

| Without it | With it |
| --- | --- |
| ❌ The browser talks straight to the device, and its address leaks. | ✅ `/api/cmd` proxies every command; the device URL stays on the server. |
| ❌ A dead device hangs the operator screen. | ✅ Requests time out, and a heartbeat shows online or offline. |
| ❌ Any input reaches the firmware. | ✅ `op` must be a command code `0` to `9`, or the proxy returns 400. |
| ❌ You cannot demo without the bridge on the desk. | ✅ Mock mode returns simulated `ACK` replies in the browser. |
| ❌ The UI is down during bring-up. | ✅ `scripts/udp_cli.py` sends commands over UDP directly. |

<br>

## How it works

```
Operator console (ui/src/app)
        │
        ▼
/api/cmd proxy        validates op 0-9, applies a timeout
        │             400 bad input, 500 no config, 502 upstream failure
        ▼
ESP32 gateway (Arduino/)
        │
        ▼
Arduino actuator  ──▶  bridge motors

scripts/udp_cli.py  ──UDP──▶  ESP32   (backup path for diagnostics)
```

<details>
<summary>Open: the console</summary>

- An overview page that explains the system and the bring-up steps.
- A control panel with manual and auto modes. Motion is gated behind manual.
- A command log with round-trip timing.
- A connectivity heartbeat.

Stack: Next.js 15 (App Router), React 19, TypeScript, ESLint flat config, Node's built-in test
runner (`tests/cmd-route.test.mjs` covers the proxy), GitHub Actions CI.

</details>

<br>

## Quickstart

Node.js 22.18+ (the tests import TypeScript through Node's type stripping) and npm 10+.

```bash
git clone https://github.com/Wasif-ZA/BridgeOpeningProject
cd BridgeOpeningProject/ui
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Configuration

| Variable | Meaning |
| --- | --- |
| `ESP32_BASE_URL` | The ESP32 gateway, for example `http://192.168.4.1`. Needed for live mode. Unset, `/api/cmd` returns 500 and the console shows Offline unless Mock is on. |

## Roadmap

- ⬜ Hardware-in-the-loop test notes and server-side simulated replies
- ⬜ One typed module for the command codes
- ⬜ Status polling for live telemetry
- ⬜ A demo GIF of a full open and close

## Docs

1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): the control chain in detail.
2. [`docs/DECISIONS.md`](docs/DECISIONS.md): why the proxy, timeouts and numeric codes.
3. [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md): the project at a glance.
4. [`docs/assets/README.md`](docs/assets/README.md): how to capture screenshots.

Tests: `npm run lint`, `npm run test`, `npm run build` in `ui/`.

## License

MIT. See [`LICENSE`](LICENSE).
