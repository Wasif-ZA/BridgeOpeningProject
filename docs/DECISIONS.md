# Engineering Decisions Log

## 1) Use a Next.js route handler as the device proxy
- **Decision:** Device communication goes through `ui/src/app/api/cmd/route.ts`.
- **Why:** Keeps device IPs out of the browser, centralizes timeouts, and provides consistent error responses.
- **Trade-off:** Adds an extra hop, but the benefits in safety and observability outweigh the minor latency.

## 2) Keep command codes numeric and shared across layers
- **Decision:** The UI uses numeric codes (`0-9`) that map directly to firmware behavior.
- **Why:** Numeric codes are easy to parse on microcontrollers and reduce payload size.
- **Trade-off:** Requires careful documentation and alignment across the UI and firmware repositories.

## 3) Favor explicit safety interlocks in the UI
- **Decision:** Bridge movement actions are gated by manual mode in the UI.
- **Why:** It communicates intent clearly to operators and mirrors how physical interlocks work.
- **Trade-off:** Additional UI state management, but it reduces the chance of accidental commands.

## 4) Provide a CLI for hardware bring-up
- **Decision:** Maintain a lightweight UDP CLI in `scripts/udp_cli.py`.
- **Why:** It provides a fast diagnostic path when the UI is unavailable or when debugging network issues.
- **Trade-off:** Another tool to maintain, but it is small and high leverage for hardware integration.
