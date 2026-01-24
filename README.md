# Bridge Opening Project
A portfolio-ready, full-stack IoT demonstration that controls a model opening bridge via a Next.js operator console and embedded firmware.

## Problem / Why
Opening bridges require coordination between traffic safety, operator intent, and mechanical actuation. This project demonstrates a clear, testable control chain that:
- provides a professional operator interface,
- enforces safety-minded interlocks at the UI layer, and
- integrates cleanly with ESP32 and Arduino firmware.

It is designed for engineering reviewers, recruiters, and teammates who want to understand both the product and the system design quickly.

## What it does (Features)
- Operator-friendly overview page that explains the system and bring-up steps.
- Dedicated control panel with manual vs. auto modes.
- Command logging with round-trip timing feedback.
- Connectivity heartbeat to surface online/offline state.
- API proxy that hides device URLs from the browser.
- Structured error responses for missing configuration and upstream failures.
- Embedded firmware folders for gateway and actuator roles.
- Lightweight UDP CLI for hardware diagnostics.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Backend / API layer:** Next.js Route Handlers (`/api/cmd` proxy)
- **Device / firmware:** ESP32 gateway + Arduino actuator sketches
- **Tooling:** ESLint (flat config), Node test runner, GitHub Actions CI

## Architecture Overview
![Architecture diagram placeholder](docs/assets/architecture-placeholder.png)

At a high level, the operator UI sends commands to a Next.js route handler, which validates input, applies timeouts, and forwards commands to the ESP32 gateway. The ESP32 then communicates with the Arduino actuator layer. A CLI in `scripts/udp_cli.py` provides a backup diagnostic path during bring-up. See `/docs/ARCHITECTURE.md` for more detail.

Key modules/services:
- `ui/src/app/` — operator UI routes
- `ui/src/app/api/cmd/route.ts` — device proxy and error handling
- `Arduino/` — ESP32 and Arduino sketches
- `scripts/udp_cli.py` — network diagnostics tool

## How to Run Locally
### Prereqs
- Node.js 20+
- npm 10+
- (Optional) ESP32 device reachable on your network

### Install
```bash
cd ui
npm install
```

### Run
```bash
cd ui
cp .env.example .env.local
npm run dev
```
Then open `http://localhost:3000`.

### Build / Test commands
```bash
cd ui
npm run lint
npm run test
npm run build
```

## Configuration
Copy the example environment file and update it for your device:

```bash
cd ui
cp .env.example .env.local
```

Required variables:
- `ESP32_BASE_URL` — Base URL of the ESP32 gateway (for example, `http://192.168.4.1`).

## Screenshots / Demo
Screenshots are documented but not committed as binaries in this environment. See `docs/assets/README.md` for capture steps and expected filenames.

- `docs/assets/screenshot-home.png`
- `docs/assets/screenshot-feature.png`

## Key Decisions (Engineering)
- Use a Next.js route handler as a proxy to keep device URLs out of the browser.
- Apply explicit request timeouts to avoid hanging the operator UI.
- Keep command codes numeric to align with embedded constraints.
- Gate bridge motion behind manual mode to communicate safety intent clearly.
- Provide a CLI fallback for hardware diagnostics when the UI is unavailable.

## Roadmap / Next Improvements
- Add hardware-in-the-loop test notes and simulated device responses.
- Extract shared command definitions into a single typed module.
- Add status polling endpoints for richer, live telemetry.
- Record a short demo GIF that shows a full open/close cycle.

## License
This project is available under the MIT License. See `LICENSE` for details.

## Contact
- GitHub: [@Wasif-ZA](https://github.com/Wasif-ZA)
- LinkedIn: Add your profile link here
