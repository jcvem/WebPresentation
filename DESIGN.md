# Design Specification — Objects in Motion

## 1. Concept & Exhibition Direction
*Objects in Motion* demonstrates how a modern web document can supersede the traditional slide deck format. Rather than treating presentation content as a sequence of disconnected, static billboard pages, the document functions as an editorial gallery space centered around a continuous spatial subject: **Instrument No. 04 — The Kinetic Armillary**.

As the reader scrolls or uses keyboard navigation, the presentation advances with smooth snapping while the central 3D artifact undergoes structural transformation—from quiet resting monolith to revealed internal geometry, kinetic phase decoupling, an exploded three-part assembly, and planar optical alignment.

---

## 2. Color System & Material Palette

The aesthetic draws inspiration from industrial precision instruments, archival exhibition catalogs, and physical kinetic sculpture rather than web software dashboards.

| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-primary` | `#090a0d` | Deep obsidian graphite canvas base |
| `--bg-surface` | `#111317` | Secondary surface background (dialogs, cards) |
| `--bg-elevated` | `#181a20` | Keyboard badge and high-contrast chips |
| `--text-primary` | `#f0eee9` | Warm bone/chalk primary editorial headlines |
| `--text-secondary` | `#8e94a0` | Muted titanium secondary body typography |
| `--text-tertiary` | `#525866` | Hairline indexes, plate numbers, and datum codes |
| `--accent` | `#e05a36` | Restrained cadmium cinnabar (indicators, active marks) |
| `--accent-hover` | `#f16843` | Interactive hover state for primary action button |
| `--accent-muted` | `rgba(224, 90, 54, 0.14)` | Translucent cadmium backing for badge indicators |
| `--hairline` | `rgba(255, 255, 255, 0.09)` | Architectural structural division lines |
| `--hairline-strong`| `rgba(255, 255, 255, 0.20)` | Active borders and callout outlines |

---

## 3. Typography Architecture

> [!IMPORTANT]
> Standard boilerplate fonts (Inter, Roboto, Arial) are strictly prohibited. The typography pairing is art-directed to balance sculptural display geometry with technical instrument typography.

- **Display Typeface**: `Syne` (weights 500, 700, 800)
  - Purpose: Slide headings, catalog titles, brand identity.
  - Characteristics: Wide, architectural proportions, sharp diagonal cuts, sculpted uppercase posture.
- **Body Typeface**: `Space Grotesk` (weights 400, 500, 600)
  - Purpose: Editorial theses, explanatory narratives, sequence descriptions.
  - Characteristics: Distinctive optical rhythm, geometric apertures, high editorial legibility.
- **Monospace Specification**: `JetBrains Mono` / `SF Mono` / `Menlo`
  - Purpose: Plate counters (`01 / 06`), technical datum metadata, keyboard key indications (`<kbd>`).

---

## 4. Anti-Slop Design Principles

To preserve the exhibition-grade feel, this implementation enforces strict anti-slop rules:

1. **No SaaS Gradients**: No purple-to-violet, indigo, or neon gradient backgrounds. The palette is grounded in obsidian and physical materials.
2. **No Neon Glow / Bloom**: No `box-shadow: 0 0 25px #00ffff` or artificial cybernetic glows.
3. **No Glassmorphism**: No frosted semi-transparent glass cards (`backdrop-filter: blur(...)`) competing with the spatial subject.
4. **No Excessive Rounded Corners**: No generic 24px/32px pill cards. Borders are razor-sharp (0px to 2px) to reflect precision machining.
5. **No Decorative Emojis**: Icons are functional SVGs only (chevrons, cross-axis reticles, restart loops).
6. **No Corporate Filler**: No "seamless synergies", "AI-powered scale", fake testimonial avatars, or lorem ipsum. All copy reflects genuine mechanical and spatial inquiry.

---

## 5. 3D Kinetic Subject: The Kinetic Armillary

The 3D subject is a real, browser-rendered WebGL procedural object constructed without external runtime models or bloated dependencies:

- **Outer Bezel**: 40-segment chamfered titanium ring with engraved calibration notches.
- **Biaxial Gimbal**: Nested secondary ring mounted on perpendicular pivot pins.
- **Faceted Core**: Octahedral prism split horizontally into upper and lower hemispheres.
- **Coordinate Reticle & Needles**: Precision vernier needles and satellite node markers.

### Slide Evolution States:
1. **Slide 01 (Opening)**: Resting orientation, quiet 12° axial tilt, slow idle precession.
2. **Slide 02 (Form)**: Pitch tilts forward, equatorial gap opens to reveal the internal faceted lattice.
3. **Slide 03 (Motion)**: Dual-axis precession with out-of-phase gyroscopic rotation.
4. **Slide 04 (System)**: Exploded topology: outer bezel expands radially (+85%), gimbal offsets, and core splits vertically to expose labeled assemblies A, B, and C.
5. **Slide 05 (Application)**: All rings snap into unified planar alignment, transforming into an optical sighting astrolabe with calibrated vernier needles.
6. **Slide 06 (Closing)**: The artifact returns to resolved equilibrium at rest, offering immediate restart or free scroll exploration.

---

## 6. Interaction & Accessibility

- **Scroll Snapping**: CSS scroll-snap (`scroll-snap-type: y mandatory`) provides native, fluid scrolling without hijacking or trapping the user.
- **Free Scroll Fallback**: An accessible header toggle (`SNAP: ON/OFF`) allows users to disable snapping for free unconstrained scrolling.
- **Keyboard Navigation**:
  - `↓` / `Space` / `j`: Next slide
  - `↑` / `Shift+Space` / `k`: Previous slide
  - `Home` / `End`: First / Last slide
  - `r`: Restart presentation
  - `m`: Toggle reduced motion
- **Reduced Motion Support**:
  - Respects the operating system `prefers-reduced-motion` media query automatically.
  - Provides a manual header toggle (`MOTION: FLUID / REDUCED`).
  - In reduced-motion mode, idle rotations cease, transition speeds snap immediately or gently ease without vestibular disorientation, and scroll behavior becomes instantaneous.
- **Screen Reader Announcements**:
  - Non-intrusive live region (`#slide-announcer` with `aria-live="polite"`) speaks current slide number, title, and thesis on change.
