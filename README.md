---

<div align="center">

<img src="[https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=BladeRunner&fontSize=60&fontColor=fff&animation=fadeIn&fontAlignY=35&desc=Carriage%20Control%20System%20Prototype&descSize=20&descAlignY=60](https://www.google.com/search?q=https://capsule-render.vercel.app/api%3Ftype%3Dwaving%26color%3D0:0f0c29,50:302b63,100:24243e%26height%3D200%26section%3Dheader%26text%3DBladeRunner%26fontSize%3D60%26fontColor%3Dfff%26animation%3DfadeIn%26fontAlignY%3D35%26desc%3DCarriage%2520Control%2520System%2520Prototype%26descSize%3D20%26descAlignY%3D60)"/>

<a href="[https://git.io/typing-svg](https://git.io/typing-svg)"><img src="[https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&duration=3000&pause=1000&color=A855F7&center=true&vCenter=true&multiline=true&repeat=true&width=700&height=80&lines=Closing+the+gap+between+hardware+and+operations.;Visualizing+embedded+state+in+real-time](https://www.google.com/search?q=https://readme-typing-svg.demolab.com%3Ffont%3DJetBrains%2BMono%26weight%3D600%26size%3D22%26duration%3D3000%26pause%3D1000%26color%3DA855F7%26center%3Dtrue%26vCenter%3Dtrue%26multiline%3Dtrue%26repeat%3Dtrue%26width%3D700%26height%3D80%26lines%3DClosing%2Bthe%2Bgap%2Bbetween%2Bhardware%2Band%2Boperations.%3BVisualizing%2Bembedded%2Bstate%2Bin%2Breal-time)." alt="Typing SVG" /></a>

<p>
<img src="[https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white](https://www.google.com/search?q=https://img.shields.io/badge/Next.js_16-000000%3Fstyle%3Dfor-the-badge%26logo%3Dnextdotjs%26logoColor%3Dwhite)" alt="Next.js"/>
<img src="[https://img.shields.io/badge/Java_11+-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white](https://www.google.com/search?q=https://img.shields.io/badge/Java_11%2B-ED8B00%3Fstyle%3Dfor-the-badge%26logo%3Dopenjdk%26logoColor%3Dwhite)" alt="Java"/>
<img src="[https://img.shields.io/badge/ESP32_Firmware-E7352C?style=for-the-badge&logo=espressif&logoColor=white](https://www.google.com/search?q=https://img.shields.io/badge/ESP32_Firmware-E7352C%3Fstyle%3Dfor-the-badge%26logo%3Despressif%26logoColor%3Dwhite)" alt="ESP32"/>
<img src="[https://img.shields.io/badge/UDP_Networking-0052CC?style=for-the-badge&logo=internetexplorer&logoColor=white](https://www.google.com/search?q=https://img.shields.io/badge/UDP_Networking-0052CC%3Fstyle%3Dfor-the-badge%26logo%3Dinternetexplorer%26logoColor%3Dwhite)" alt="UDP"/>
</p>

<p>
<a href="#how-to-run-locally">
<img src="[https://img.shields.io/badge/Quick_Start-00C853?style=for-the-badge](https://www.google.com/search?q=https://img.shields.io/badge/Quick_Start-00C853%3Fstyle%3Dfor-the-badge)" alt="Quick Start"/>
</a>
<a href="docs/ARCHITECTURE.md">
<img src="[https://img.shields.io/badge/Architecture_Docs-0A66C2?style=for-the-badge](https://www.google.com/search?q=https://img.shields.io/badge/Architecture_Docs-0A66C2%3Fstyle%3Dfor-the-badge)" alt="Docs"/>
</a>
<a href="LICENSE">
<img src="[https://img.shields.io/badge/License-MIT-EA4335?style=for-the-badge](https://www.google.com/search?q=https://img.shields.io/badge/License-MIT-EA4335%3Fstyle%3Dfor-the-badge)" alt="License"/>
</a>
</p>

</div>

---

## System Overview

<img align="right" src="[https://github-readme-stats.vercel.app/api/pin/?username=Wasif-ZA&repo=BladeRunner&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=A855F7&text_color=ffffff](https://www.google.com/search?q=https://github-readme-stats.vercel.app/api/pin/%3Fusername%3DWasif-ZA%26repo%3DBladeRunner%26theme%3Dtokyonight%26hide_border%3Dtrue%26bg_color%3D0D1117%26title_color%3DA855F7%26text_color%3Dffffff)" width="300"/>

BladeRunner bridges the "demo gap" in embedded systems. It packages firmware logic, a Java-based control simulation, and a Next.js web interface into a single, reviewable repository.

```typescript
const SystemDefinition = {
  problem: "Embedded logic is often invisible and hard to demo.",
  
  solution: {
    frontend: "Next.js 16 Operations Dashboard",
    control: "Java Packet Processor (UDP/JSON)",
    hardware: "ESP32 Firmware Logic"
  },

  targetAudience: [
    "Systems Engineers",
    "Hardware/Software Integrators",
    "Technical Reviewers"
  ]
};

```

<br clear="right"/>

---

## Architecture Layers

<div align="center">

BladeRunner is organized as a multi-tier distributed system. Data flows from the operator to the simulated processor, and finally to the hardware layer.

<table>
<tr>
<td width="33%" valign="top">

<h3 align="center">1. Operations UI</h3>

<div align="center">
<img src="[https://img.shields.io/badge/User_Interface-000000?style=flat-square&logo=nextdotjs](https://www.google.com/search?q=https://img.shields.io/badge/User_Interface-000000%3Fstyle%3Dflat-square%26logo%3Dnextdotjs)"/>
</div>

**Path:** `website/code/`

The entry point for the operator. It visualizes the carriage state and issues commands via API.

* **Next.js 16 & React 19**
* **Tailwind CSS** Styling
* Real-time State Visualization
* Command Abstraction

</td>
<td width="33%" valign="top">

<h3 align="center">2. Control Plane</h3>

<div align="center">
<img src="[https://img.shields.io/badge/Business_Logic-ED8B00?style=flat-square&logo=openjdk](https://www.google.com/search?q=https://img.shields.io/badge/Business_Logic-ED8B00%3Fstyle%3Dflat-square%26logo%3Dopenjdk)"/>
</div>

**Path:** `CCP/`

The "brain" of the system. It handles command parsing, state validation, and network transport.

* **Java (JDK 11+)**
* **UDP** Message Transport
* **JSON** Serialization (`org.json`)
* Finite State Machine

</td>
<td width="33%" valign="top">

<h3 align="center">3. Hardware</h3>

<div align="center">
<img src="[https://img.shields.io/badge/Embedded_Layer-E7352C?style=flat-square&logo=espressif](https://www.google.com/search?q=https://img.shields.io/badge/Embedded_Layer-E7352C%3Fstyle%3Dflat-square%26logo%3Despressif)"/>
</div>

**Path:** `ESP/`

The execution layer. Responsible for translating logic into electrical signals for motors/sensors.

* **C / C++** Toolchain
* **ESP32** Architecture
* Hardware Interrupts
* GPIO Management

</td>
</tr>
</table>

</div>

---

## How to Run Locally

<div align="center">

### Prerequisites

</div>

### 1. Install & Launch UI

The web interface acts as the primary control surface.

```bash
# Install dependencies
npm --prefix website/code ci

# Run the development server
npm --prefix website/code run dev

```

> **Access:** http://localhost:3000

### 2. Compile Control Processor

Build the Java backend to handle simulation logic.

```bash
cd CCP
javac -cp "lib/json-20240303.jar" *.java

```

### 3. Verification

Run the test suite to ensure system integrity.

```bash
npm --prefix website/code run test

```

---

## Engineering Roadmap

```text
╔══════════════════════════════════════════════════════════════════╗
║                        PROJECT STATUS LOG                        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   1. Architecture Design       ████████████████████  100% DONE   ║
║   2. UI Implementation         ████████████████████  100% DONE   ║
║   3. Control Logic (Java)      ████████████████░░░░  80%  ACTIVE ║
║   4. Firmware Integration      ████████████░░░░░░░░  60%  ACTIVE ║
║   5. Shared Schema Validation  ░░░░░░░░░░░░░░░░░░░░  0%   PLANNED║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

```

**Key Architectural Decisions:**

* **Monorepo Structure:** Consolidated documentation and code for better traceability.
* **CI/CD Pipeline:** GitHub Actions ensure the web surface is buildable on every commit.
* **Decision Logging:** All trade-offs recorded in [`docs/DECISIONS.md`](https://www.google.com/search?q=docs/DECISIONS.md).

---

<div align="center">

**BladeRunner Project** maintained by **[Wasif-ZA](https://github.com/Wasif-ZA)**

<a href="[https://github.com/Wasif-ZA](https://github.com/Wasif-ZA)">
<img src="[https://img.shields.io/badge/View_GitHub_Profile-181717?style=for-the-badge&logo=github&logoColor=white](https://www.google.com/search?q=https://img.shields.io/badge/View_GitHub_Profile-181717%3Fstyle%3Dfor-the-badge%26logo%3Dgithub%26logoColor%3Dwhite)"/>
</a>
<a href="[https://www.linkedin.com/in/wasif-zaman-4228b5245/](https://www.linkedin.com/in/wasif-zaman-4228b5245/)">
<img src="[https://img.shields.io/badge/Connect_on_LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white](https://www.google.com/search?q=https://img.shields.io/badge/Connect_on_LinkedIn-0A66C2%3Fstyle%3Dfor-the-badge%26logo%3Dlinkedin%26logoColor%3Dwhite)"/>
</a>





<img src="[https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=100&section=footer](https://www.google.com/search?q=https://capsule-render.vercel.app/api%3Ftype%3Dwaving%26color%3D0:0f0c29,50:302b63,100:24243e%26height%3D100%26section%3Dfooter)"/>

</div>
