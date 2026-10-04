# Unlupa.id - System Architecture & Scene Contract

## 1. Design Philosophy & Creative Vision
Unlupa.id is an immersive, scrollytelling web application designed for sacred and systematic spaced repetition of Islamic knowledge (Al-Qur'an, Ruang Pribadi, Ruang Kelas) powered by the FSRS v6 algorithm.

Inspired by award-winning continuous WebGL architectures (such as igloo.inc), the experience does not slice content into disjointed HTML sections. Instead, it positions the user in a continuous, camera-driven 3D universe where interface elements are refracted and brought to life through the crystal of memory.

### Core Metaphor: The Architecture of Memory (Arsitektur Ingatan & FSRS)
- **Knowledge = Neural Memory Core & Synaptic Network (Inti Ingatan & Jaringan Sinapsis)**:
  - *Retained Memory (Hafalan Terjaga)*: Pure optical crystal core, interconnected neural synapses, action potential light pulses flowing between memory nodes, and rotating FSRS stability rings.
  - *Forgotten Knowledge (Lupa / Degradasi Ingatan)*: Synapses dim, fracture lines emerge, and particles dissolve into atmospheric mist (`uIntegrity < 1`).
  - *Timely Review (Muraja'ah Tepat Waktu - FSRS v6)*: Neural pathways and core ignite with warm golden illumination (`uGold = 1.0`), solidifying memory into long-term retention.

---

## 2. Directory & Module Structure
```
src/
├── config.ts                    # Single source of truth: tokens, colors, quality tiers, scene ranges
├── styles/
│   └── global.css               # Fonts (Hanken Grotesk & Amiri), virtual track, magnetic CTA
├── core/
│   ├── Engine.ts                # WebGLRenderer, PerspectiveCamera, ACES tone mapping, adaptive quality
│   ├── ScrollController.ts      # Lenis smooth scroll bridge, GSAP ticker, progress (0-1), velocity
│   ├── SceneManager.ts          # Lifecycle orchestration (init, enter, update, leave, dispose)
│   ├── PostFX.ts                # RenderPass -> UnrealBloomPass -> Custom Cinema Pass -> OutputPass
│   └── AppEngine.ts             # Orchestrator binding WebGL, DOM overlay, and scenes
├── world/
│   ├── Environment.ts           # Procedural 3-panel emissive PMREM HDRI, fog, fBm frost mist
│   ├── Crystal.ts               # Neural memory engram core, 68 synaptic nodes & axons, action potential pulses, 3 FSRS rings, 7 memory tablets
│   ├── BrainGeometry.ts         # Procedural cerebral cortex dual-hemisphere geometry generator
│   ├── ForgettingCurve.ts       # Ebbinghaus exponential decay tube, additive shader, luminous head, milestone pulse ring
│   ├── GridAxes.ts              # Guideline grid (100%, 75%, 50%, 25%, 0%), time milestones (20 Menit, 1 Hari, 1 Minggu, 1 Bulan)
│   ├── FallingMotes.ts          # Deterministic particles shedding from curve head, drifting down with harmonic turbulence
│   ├── Dust.ts                  # ~700 Points in 3D noise field, velocity reactive, radial dispersion (uDisperse)
│   └── BackdropText.ts          # CanvasTexture plane positioned behind crystal, physically refracted
├── scenes/
│   ├── Scene01Hero.ts           # 0.0-6.5s staged timeline, camera dolly, scramble text, scroll scrubbing
│   └── Scene02Masalah.ts        # [1/6, 2/6] Deterministic Ebbinghaus curve, crystal degradation, shard separation, milestone pulse
├── ui/
│   ├── Overlay.ts               # Semantic SEO H1, fixed top bar, hero typography block, Scene 2 projected labels, magnetic CTA
│   ├── ScrambleText.ts          # Mixed Latin & classical Arabic glyph scramble engine
│   └── Loader.ts                # 72px SVG ring loader with smooth exit fade
└── ARCHITECTURE.md              # Technical specifications and scene contracts
```

---

## 3. Scene Contract & Lifecycle API
Every scene in the Unlupa universe implements the `IScene` interface:

```typescript
export interface SceneContext {
  engine: Engine;
  crystal: Crystal;
  dust: Dust;
  backdropText: BackdropText;
  environment: Environment;
  overlay: Overlay;
  scrollController: ScrollController;
}

export interface IScene {
  id: string;
  range: [number, number]; // Normalized range within 0.0–1.0 (e.g. [0.0, 1/6])
  init(ctx: SceneContext): Promise<void>;
  enter(ctx: SceneContext): void;
  update(ctx: SceneContext, localProgress: number, dt: number, time: number): void;
  leave(ctx: SceneContext): void;
  dispose(ctx: SceneContext): void;
}
```

### Global Virtual Scroll Mapping (600vh total)
- **Scene 01 (Hero)**: `0.0000 – 0.1667` (0 – 1/6) — Awakening of the Neural Brain of Knowledge, optical text refraction.
- **Scene 02 (Masalah)**: `0.1667 – 0.3333` (1/6 – 2/6) — The Forgetting Curve & The Degradation of Knowledge.
  - Camera pans to `(-0.65, 0.1, 5.2)`, crystal moves to `(2.75, 0.15, 0)` with scale `0.82`.
  - ForgettingCurve: Exponential decay tube drawn from `s = 0.0` to `1.0` via `uDraw` (0.15–0.75 progress).
  - Crystal Integrity: Dynamically synchronized to retrievability $R(s)$, scaling from 1.0 down to 0.12.
  - Satellite Shard Separation: When $R < 0.5$, satellite tablets disperse outward and tilt.
  - Milestone Pulses: Deterministic micro-crack vibration and expanding pulse rings at $s = 0.12, 0.38, 0.66, 0.94$.
  - Falling Motes: ~200 deterministic particles shedding from curve head with harmonic turbulence.
  - Atmospheric Grading: EnvMap intensity 1.4 -> 0.6, core heartbeat pulse slows to 0.25 Hz.
  - Handoff to Scene 03 at progress `1.0` (`2/6` global): Crystal frozen in degraded state, ready for FSRS stabilization reset.
- **Scene 03 (Solusi)**: `0.3333 – 0.5000` (2/6 – 3/6) — FSRS v6 calculation, crystallization resets
- **Scene 04 (Tiga Ruang)**: `0.5000 – 0.6667` (3/6 – 4/6) — Shard triangulation into 3 thematic chambers
- **Scene 05 (Retrievability Ring)**: `0.6667 – 0.8333` (4/6 – 5/6) — Crystalline interactive memory ring
- **Scene 06 (Penutup)**: `0.8333 – 1.0000` (5/6 – 1.0) — Final synthesis & launch threshold

---

## 4. Shaders & Uniforms Contract

### `src/world/Crystal.ts`
- `uGrow` (0.0 to 1.0): Exponential growth along primary axes.
- `uIntegrity` (0.0 to 1.0):
  - At `1.0`: Pure pristine crystal.
  - At `< 0.98`: Procedural 3D noise cracks emerge, vertex normals jitter.
- `uDissolve` (0.0 to 1.0):
  - At `> 0.0`: 3D simplex noise discard threshold with ice-blue emissive edge burn.
- `uGold` (0.0 to 1.0):
  - Radial warm golden radiance (`#d4b06a`) emanating from the memory core.
- `uTime`: Running elapsed time for procedural micro-surface ripples and heartbeat core pulse.

### `src/core/PostFX.ts`
- `uAberration`: Chromatic aberration magnitude (idle: `0.0012`, intro peak: `0.014`, scroll response: `+ scrollVelocity * 0.0004`, capped at `0.006`).
- `uGrainAmount`: High-frequency film grain (`0.045`).
- `uVignetteDarkness`: Edge falloff (`0.35`).
- `uFrost`: Procedural fBm frost creeping from screen borders (0.0 = clear, 1.0 = full frost).

---

## 5. Physical Optical Refraction
Instead of a separate flat 2D title banner, `"UNLUPA"` is projected onto a dynamic CanvasTexture on a 3D plane at `z = -1.5` behind the crystal (`z = 0`).
Through `MeshPhysicalMaterial` transmission (`ior: 1.31`, `thickness: 1.6`, `roughness: 0.06`), the typography is physically refracted, enlarged, and faceted by the crystal faces.

---

## 6. Performance & Adaptive Quality Matrix
The engine continuously samples FPS over 60-frame rolling buffers:
- **HIGH (default)**: DPR capped at 2.0, transmission enabled, UnrealBloom on, 700 dust particles, 80 instanced shards.
- **MEDIUM (avg FPS < 45)**: DPR 1.5, bloom resolution 0.75x, 450 dust particles, 50 instanced shards.
- **LOW (avg FPS < 38)**: DPR 1.0, bloom off, transmission fallback, 200 dust particles, 25 instanced shards.
- **No WebGL**: Automatic fallback to clean, accessible typography card layout with high WCAG AA contrast.
- **`prefers-reduced-motion`**: Disables smooth scroll lerping and skips long camera dollies.
