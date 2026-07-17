# Kool Lottie Mascot Implementation

This playbook applies the canonical contracts in
`docs/sprint2-shared-contracts.md`. It records implementation gates and does
not introduce another public API.

## 1. Scope and non-goals

- Public mascot states remain `idle`, `speaking`, `listening`, `thinking`, and
  `success`.
- `wave`, `breathe`, blink, mouth movement, enter/loop/exit, and neutral bridge
  clips are internal animation details.
- The primary renderer is one cut-out Lottie composition derived from the
  client-approved Kool artwork. The approved raster poses plus Reanimated are
  the visual fallback behind the same props.
- Sprint 2 does not add viseme/phoneme lip sync, a backend, remote animation
  hosting, independently redrawn full poses, or consumer-visible renderer
  selection.

## 2. Delivery gates

1. **Web baseline:** install the Lottie Web peer, align temporary baseline
   scaffolds/re-exports with the approved visual types, and make CI export the
   static Web bundle.
2. **Synthetic probe:** before producing the full rig, prove an embedded-raster
   test animation in Docker Chrome and one native target. Verify load, explicit
   sizing, segment playback, loop/exit, interruption, unmount, and failure UI.
3. **Asset batches:** generate and accept one batch at a time. Stop after a
   failed batch; do not accumulate identity or joint drift.
4. **Static assembly:** reproduce the approved neutral mascot before animating
   it. Reject visible proportion, colour, registration, or alpha-edge drift.
5. **Five-state rig:** implement controller-reachable enter/loop/exit paths via
   a shared neutral bridge, then test rapid state changes and reduced motion.
6. **Client direction gate:** send a 10–15 second, actual-size five-state rough
   recording beside the approved character sheet and record the client's
   feedback/approval before final motion polish. If no response arrives by the
   team-agreed date, record the team's decision before continuing.
7. **Release gate:** select Lottie only after Docker Chrome, static Web export,
   one native target, performance, accessibility, and visual QA pass.

## 3. Canonical source assets

The initial rig uses 15 accepted raster source assets. Mirrored runtime layers
do not increase this source count.

| Group | Assets | Count |
| --- | --- | ---: |
| Core | body, blank head | 2 |
| Arm rig | one upper arm; neutral, open-palm, listening, thinking forearms | 5 |
| Eyes/brows | neutral, blink, thinking-upward, happy-closed | 4 |
| Mouths | closed, small-open, medium-open, joyful-wide | 4 |

The single-side arm rig is mirrored by default. Generate the other side only if
the accepted composition shows materially incorrect handedness or lighting.
Generate a thoughtful mouth or elbow cover only after an assembled visual test
demonstrates that it is necessary.

Generation rules:

- the client character sheet is the identity, proportion, and palette authority;
- accepted production outputs are the geometry and registration authority;
- use a uniform `#FF00FF` background, never a baked checkerboard;
- preserve accepted originals and rejected/accepted decisions; and
- never upload the client mascot to a public/community animation workspace.

## 4. Asset registration and provenance

High-resolution generation files are masters, not runtime assets. Runtime PNGs
are lossless-alpha, tightly cropped, and downsampled for approximately twice the
largest rendered mascot size.

Every accepted runtime asset must have a manifest entry containing:

```ts
type MascotLayerManifestEntry = {
  key: string;
  sourceFile: string;
  pixelWidth: number;
  pixelHeight: number;
  canonicalCanvas: { width: number; height: number };
  cropOffset: { x: number; y: number };
  anchors: Readonly<Record<string, { x: number; y: number }>>;
  sourceNote: string;
  generationBatch: string;
  checksum: string;
};
```

Rejected outputs and reasons stay in a separate provenance/review log and are
never referenced by a runtime manifest. `canonicalCanvas`, `cropOffset`, and all
anchors use the same canonical pixel coordinate space. Lottie positions come
from those coordinates, never from the centre of a cropped bitmap. Shoulder,
elbow, face, eye, and mouth anchors must remain stable across variants.

## 5. Playback and runtime rules

- Use transforms and opacity only; avoid expressions, blur, complex mattes, and
  unsupported effects.
- Use 30 fps and named frame ranges in one typed segment registry; business code
  must not contain scattered magic frame numbers.
- Each state has `enter`, `loop`, and `exit`; exits restore mouth, eyes, head,
  breathing offset, and gesture before the neutral bridge.
- A generation token ignores stale or cancelled playback callbacks during rapid
  state changes, route changes, and background/resume events. A cancelled
  `onAnimationFinish(true)`, pause/stop event, or stale token never advances the
  next clip; only the current token's natural completion may advance it.
- `speaking` uses restrained closed/small/medium mouth movement from TTS start
  through settle/cancel. The joyful-wide mouth is reserved for success. No
  phoneme accuracy is claimed.
- `success` plays one burst and then holds a happy pose. Celebration intensity
  may vary surrounding effects but never the warmth or correctness of Kool's
  response.

For `lottie-react-native` 7.3.x Web:

- do not drive playback with `progress`;
- provide a fixed layout container and explicit `DotLottieReact` canvas/CSS
  sizing;
- never depend on `LottieView.play(startFrame, endFrame)` on Web; and
- hide playback differences behind Role 2-owned platform adapters.

The native adapter uses `lottie-react-native` and
`LottieView.play(startFrame, endFrame)`. The Web adapter uses
`@lottiefiles/dotlottie-react` directly and either its public `segment` prop or
`setSegment(startFrame, endFrame)` followed by `play()`. The synthetic probe
must prove both paths and normalise load, natural completion, cancellation, and
failure events for the controller.

Package local animation data only. Start with a JSON composition containing
embedded raster image entries (`e: 1` with inline base64/data URIs); the probe
must render them on Web and native without external image paths. Record an
explicit bundle-size, cold-load, and decoded-memory budget from the probe, then
apply it to the full rig before considering another package format.

## 6. Loading, fallback, and motion

`MascotAnimator` always reserves its final layout footprint and displays an
approved poster while Lottie loads. The poster remains until an adapter-specific
render-ready signal proven by the probe: the first `render` event on Web, and
`onAnimationLoaded` plus a probe-validated first-paint handoff on native. An
intentionally invalid-source probe must prove that load/render failure keeps the
poster or internal raster fallback. Consumers still receive the same props and
never branch on renderer mode.

Respect `reducedMotion` with a clear static representative frame for every
state. Without a separate pause control, non-essential ambient motion stops
after one cycle shorter than five seconds. During normal motion, allow only one
high-salience channel at a time:

- Kool TTS: mouth is primary; hand and scene motion are reduced;
- child listening: microphone feedback is primary; Kool holds the listening pose;
- clue: target highlight is primary; background mascot motion pauses; and
- reward: background mascot, microphone, and scene motion pause.

The wrapper is the only accessibility element; poster, Lottie canvas, and
fallback layers are hidden from the accessibility tree so renderer swaps cannot
duplicate announcements. Screen readers announce stable state meaning, not
blink, mouth, or breathing frames.

## 7. Verification evidence

- canonical typecheck, lint, Jest, Expo dependency check, and Web static export;
- Docker Chrome load plus Network check for missing JSON/image/WASM resources;
- one recording from the project's available Expo Go iOS or Android target;
- five representative reduced-motion frames;
- repeated normal and rapid five-state transitions with no seam, fringe, drift,
  stale completion, blank first frame, or loop snap;
- resize and DPR 1/2/3 checks at every supported mascot size; and
- a 15–20 minute soak covering tab hide/show, route exit/return, and failure UI.

## 8. Ownership and PR boundaries

- Role 1 owns the dependency/lockfile, Web export quality gate, Docker baseline,
  and alignment of temporary mascot scaffolds/re-exports to the approved
  contract.
- Role 2 retains ownership of canonical visual types and their semantics, and
  owns generated/cleaned layers, manifests, the playback adapter,
  `MascotAnimator`, visual evidence, and the renderer decision.
- The baseline PR contains no client animation assets or production mascot
  renderer. The Role 2 PR does not revise dependencies or public state semantics.
