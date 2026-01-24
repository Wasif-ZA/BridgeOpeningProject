# Bridge Opening Project — Portfolio Overview

## Elevator Pitch
A full-stack IoT demo that lets an operator control a model opening bridge through a polished web interface, with commands flowing through an API proxy to embedded firmware.

## What makes this repo "employer-grade"
- Clear separation between UI, API proxy, firmware, and diagnostics tooling.
- Documented architecture and decisions to show engineering reasoning.
- CI that runs lint, tests, and build for the UI.
- Screenshots and bring-up steps that make the project easy to evaluate quickly.

## Demo Story
1. Start the UI locally.
2. Point `ESP32_BASE_URL` at the gateway.
3. Use `/control` to send commands and verify acknowledgements.
4. Fall back to `scripts/udp_cli.py` for low-level diagnostics if needed.
