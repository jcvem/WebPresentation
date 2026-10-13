# Objects in Motion — Kinetic Artifact Monograph

An editorial-quality one-page presentation experiment demonstrating how a webpage can supersede traditional slide decks. Built with Vite, TypeScript, and procedural WebGL—with zero external 3D runtime models or heavyweight dependencies.

---

## Quickstart

### Prerequisites
- Node.js >= 18 (Tested on Node v24.1.0)
- npm >= 9

### Install & Run
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit test suite (Vitest)
npm run test

# Run deterministic headless Chrome browser smoke test
npm run smoke

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Architectural Structure

```
webPresentations/
├── index.html                   # Semantic HTML template with stage & landmarks
├── package.json                 # Scripts, dependencies (Vite, TS, Vitest, Puppeteer-core)
├── tsconfig.json                # Modern ES2022 TypeScript configuration
├── vite.config.ts               # Vite bundler & Vitest test runner setup
├── DESIGN.md                    # Art direction tokens, typography, and anti-slop rules
├── README.md                    # Setup guide and technical documentation
├── scripts/
│   └── smoke-test.mjs           # Deterministic browser automation smoke test
├── tests/
│   ├── slide-data.test.ts       # Validates slide registry integrity & 3D poses
│   ├── matrix-math.test.ts      # Validates 3D matrix math & lerp calculations
│   ├── presentation-controller.test.ts # Tests scroll snapping, keyboard nav, and ARIA state
│   └── recording.test.ts        # Tests MIME selection, state transitions, sequence timers, cancel, and URL cleanup
└── src/
    ├── main.ts                  # Application bootstrap and module coordination
    ├── vite-env.d.ts            # Client environment definitions
    ├── controller/
    │   └── presentation-controller.ts # Scroll-snap, keyboard, touch, hash, and reduced-motion controller
    ├── recorder/
    │   ├── types.ts             # Typed models for recording status, settings, results, and events
    │   ├── mime-utils.ts        # MIME selection, capability checks, formatters, and WebM header verification
    │   ├── composition-renderer.ts # Composition canvas drawing typography, metadata, reticles, and 3D canvas frames
    │   ├── presentation-recorder.ts # Orchestrator for deterministic slide timers, canvas stream, and MediaRecorder
    │   └── recording-panel.ts   # UI panel for HUD recording status, duration controls, and preview/export dialog
    ├── renderer/
    │   ├── math.ts              # 3D vector and 4x4 matrix operations
    │   ├── geometry.ts          # Procedural 3D mesh generator (rings, faceted core, needles)
    │   └── object-renderer.ts   # WebGL procedural renderer with 2D Canvas fallback
    ├── slides/
    │   └── slide-data.ts        # 6 curated exhibition slides & target 3D poses
    ├── ui/
    │   ├── header-controls.ts   # Responsive exhibition header, progress meter, nav buttons
    │   └── slide-view.ts        # Semantic HTML markup generation for slide layouts
    └── styles/
        ├── tokens.css           # Color tokens, typography stacks, spacing, and z-index layers
        ├── recorder.css         # Styling for recording HUD, duration control, and preview dialog
        └── main.css             # Architectural layout, responsiveness, and reduced motion
```

---

## Features & Highlights

### 1. Procedural 3D Object (No CDN or Model Files)
- A custom WebGL procedural shader and mesh generator renders **Instrument No. 04 — The Kinetic Armillary** in real-time.
- Consists of an outer extruded bezel, a nested biaxial gimbal ring, an articulated octahedral core prism, and precision reticle needles.
- Morphologically evolves on every slide:
  - *Plate 01 (Opening)*: Resting monolithic orientation with slow idle precession.
  - *Plate 02 (Form)*: Pitch tilts forward to reveal the concentric internal lattice.
  - *Plate 03 (Motion)*: Dynamic dual-axis precession demonstrating kinetic momentum decoupling.
  - *Plate 04 (System)*: Exploded view with radial expansion (+85%) presenting 3 labeled assemblies (A, B, C).
  - *Plate 05 (Application)*: Planar astrolabic alignment functioning as an optical horizon transducer.
  - *Plate 06 (Closing)*: Re-convergence into monolithic rest with immediate restart action.
- Interactive pointer drag: Readers can click and drag or touch-tilt the artifact to explore spatial depth, with elastic spring return.
- Lightweight: Entire production bundle is under 15 kB gzipped with zero external 3D runtime libraries.

### 2. Scroll-as-Slide Behavior
- Native CSS scroll-snap (`scroll-snap-type: y mandatory`) ensures crisp, non-jarring slide boundaries.
- No scroll-hijacking traps: Users retain native scroll controls, trackpad swipes, or mouse wheels.
- An accessible toggle (`SNAP: ON/OFF`) allows readers to switch to free, unconstrained scrolling at any time.
- Deep linking: Hash navigation directly maps to `#opening`, `#form`, `#motion`, `#system`, `#application`, `#closing`.

### 3. Keyboard & Assistive Technology Accessibility
- Keyboard navigation:
  - `↓`, `PageDown`, `Space`, `j`: Advance to next slide
  - `↑`, `PageUp`, `Shift+Space`, `k`: Return to previous slide
  - `Home`: Jump to first slide
  - `End`: Jump to last slide
  - `r`: Restart presentation
  - `m`: Toggle reduced motion
- Live region (`#slide-announcer` with `aria-live="polite"`): Announces current slide number, title, and thesis to assistive technology.
- Skip link (`Skip to main presentation`) for immediate keyboard focus traversal.
- Full compliance with `prefers-reduced-motion`: Halts idle rotation, disables smooth animation jarring, and facilitates instantaneous transitions.
- Fully responsive across desktop (1440px), tablet (768px), and mobile (390px) with **0 horizontal overflow**.

### 4. Slide-by-Slide Presentation Recording & Video Export
- **One-Click Export Control**: Accessible `Record presentation` button (`#btn-hdr-record`) in the persistent header navigation rail with duration selector (`3.5s`, `5.0s`, `2.0s`).
- **Real-Time Offscreen Stage Composition**: Captures high-fidelity 1280×720 (or configured) composite video frames directly via `HTMLCanvasElement.captureStream(30)`:
  - Draws editorial typography, catalog metadata, plate index, and dynamic progress bar.
  - Draws real-time WebGL frames of the 3D procedural kinetic armillary with continuous rotations and structural transformations.
  - Smooth alpha cross-fade between outgoing and incoming plates during transitions.
- **Deterministic Slide Sequence**:
  - Automatically begins from Plate 01 (`#opening`).
  - Advances through all 6 plates in strict sequence on deterministic timers.
  - Automatically completes after Plate 06 or allows manual stop at any time.
- **Robust Media Encoding**:
  - Leverages native `MediaRecorder` with prioritized MIME selection (`video/webm;codecs=vp9`, `video/webm;codecs=vp8`, `video/webm`, `video/mp4;codecs=avc1`).
  - Generates valid EBML/WebM container headers (`0x1A 0x45 0xDF 0xA3`) with non-zero binary payload.
- **In-Memory Management & Privacy**:
  - Zero external tracking, zero server uploads; recordings are stored in memory via Blob URLs.
  - Object URLs are safely revoked upon reset, panel close, or new recording initiation.
- **Interactive Completion Dialog**:
  - Displays `<video>` preview, duration (e.g. `00:21`), file size (e.g. `1.4 MB`), and format metadata.
  - `Download video` anchor and `Record again` loop action.
- **Non-Destructive Cancellation**:
  - `Cancel` halts all active media streams and timers, and restores the user's previously viewed slide index and reduced-motion preference.
- **Graceful Unsupported Handling**:
  - In environments lacking `MediaRecorder` or canvas stream capture, the control is clearly disabled with an explanatory status message rather than fabricating a download.
