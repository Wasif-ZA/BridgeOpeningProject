
---

# BladeRunner — Carriage Control System

**A full-stack implementation of a carriage control loop, bridging the gap between embedded firmware, Java-based control logic, and modern web operations.**

---

## The Engineering Challenge

Embedded systems often suffer from the "Black Box" problem: the hardware logic is isolated, making it difficult for stakeholders to visualize state changes, debug race conditions, or evaluate the system without physical access.

**BladeRunner** solves this by decoupling the control logic from the physical hardware. It introduces a high-fidelity simulation layer and a reactive web dashboard, allowing the entire control loop to be visualized, audited, and demonstrated in a browser environment.

This project serves as a proof-of-concept for:

* **Full-Stack Cohesion:** Integrating C++, Java, and TypeScript into a unified pipeline.
* **State Management:** Handling complex carriage transitions safely and predictably.
* **Developer Experience:** Reducing the time-to-understanding for new engineers and reviewers.

## System Architecture

BladeRunner operates as a multi-tier distributed system. Data flows from the operator to the simulated processor, and finally to the hardware layer.

```text
[ OPERATOR ]
     |
     v
[ OPERATIONS UI ]         <-- Next.js 16 Dashboard
     |                        (Visualizes state, issues commands)
     v
[ CONTROL PLANE ]         <-- Java (CCP)
     |                        (Parses JSON, manages state machine, UDP transport)
     v
[ HARDWARE LAYER ]        <-- ESP32 Firmware
     |                        (Executes physical actuation)
     v
[ PHYSICAL WORLD ]        <-- Motors / Sensors

```

For a deep dive into the data flow and component interaction, refer to [`docs/ARCHITECTURE.md`](https://www.google.com/search?q=docs/ARCHITECTURE.md).

## Technical Highlights

### 1. The Operations Dashboard (Frontend)

Built with **Next.js 16**, **React 19**, and **Tailwind CSS**, the UI is not just a mockup—it is a functional control surface.

* **Real-time Visualization:** Displays the current state of the carriage (Open, Closed, Moving, Locked).
* **Command Interface:** meaningful abstraction of complex binary commands into user-friendly controls.
* **Modern Stack:** Utilizes server-side rendering and rigorous TypeScript typing.

### 2. The Control Processor (Backend)

Written in **Java (JDK 11+)**, this layer acts as the brain of the operation.

* **UDP Networking:** Implements low-latency message handling.
* **JSON Serialization:** robust encoding/decoding of command packets using `org.json`.
* **State Machine:** Explicitly models valid transitions to prevent illegal hardware states.

### 3. The Embedded Layer (Firmware)

Targeting the **ESP32**, the firmware layer translates high-level logic into electrical signals.

* **C/C++ Integration:** Scaffolding for hardware interrupts and GPIO management.

## Engineering Standards & Documentation

This repository is structured to mimic a production-grade engineering environment. A key focus was placed on **traceability** and **onboarding speed**.

* **Decision Logs:** All major architectural choices are recorded in [`docs/DECISIONS.md`](https://www.google.com/search?q=docs/DECISIONS.md). This tracks the *why* behind the *how*, covering trade-offs between protocols and stack choices.
* **CI/CD:** GitHub Actions pipelines ensure the web surface remains buildable and lint-free on every commit.
* **Clean Architecture:** Distinct separation of concerns between the UI, Logic, and Hardware layers allows for independent testing and scaling.

## Quick Start (Local Simulation)

### Prerequisites

* **Node.js 20+**
* **Java JDK 11+**

### 1. Launch the Operations UI

The UI acts as the entry point for the simulation.

```bash
npm --prefix website/code ci
npm --prefix website/code run dev

```

> Access the dashboard at **http://localhost:3000**

### 2. Compile the Control Processor

To run the backend simulation logic:

```bash
cd CCP
javac -cp "lib/json-20240303.jar" *.java

```

### 3. Verify System Integrity

Run the test suite to ensure the frontend logic is sound.

```bash
npm --prefix website/code run test

```

## Future Roadmap

* **Protocol Hardening:** implementing a shared schema validation between Java and TypeScript to ensure type safety across the network boundary.
* **Simulation Expansion:** Extending the Java layer to simulate hardware faults (e.g., door obstructions) for better stress testing.
* **Telemetry:** Adding a time-series log of events to the UI for post-incident analysis.

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Wasif Zaman**

* **GitHub:** [@Wasif-ZA](https://github.com/Wasif-ZA)
* **LinkedIn:** [Wasif Zaman](https://www.linkedin.com/in/wasif-zaman-4228b5245/)
* **Email:** wasif.zaman1@gmail.com
