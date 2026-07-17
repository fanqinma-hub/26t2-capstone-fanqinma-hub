# Team ALMOND — Sprint 2 Role Workplan

> Unit: **Big, Small and Everything in Between!**
> Scope: Size Words only
> Status: requirements confirmed on 2026-07-17

Implementation boundaries are defined in
`docs/sprint2-shared-contracts.md`; both files must be followed together.

## 1. Sprint outcome

Deliver a frontend-only, Dockerised five-activity Size Words learning unit that:

- runs its real demo from `docker compose up` in same-machine Chrome via
  `localhost`;
- uses Azure Speech for speech-to-text and Kool's text-to-speech;
- classifies Size Words with deterministic transcript rules;
- awards exactly three engagement coins;
- persists the local unit session with AsyncStorage;
- generates parent and therapist reports from that session; and
- supports frontend PDF download and share without a backend or LLM.

The target unit duration is 5–10 minutes for children aged 6–8. It assesses
expressive Size Word vocabulary in connected speech, not articulation or phoneme
accuracy.

## 2. Source of truth and fixed decisions

When sources conflict, use this order:

1. latest client email and confirmed fourth-meeting decisions;
2. the updated `Team ALMOND TASKS.xlsx` Size Words requirements;
3. third-meeting notes where they do not conflict with later information;
4. Sprint 1 flow and role documents;
5. current code only as the implementation baseline.

The following decisions are closed for Sprint 2:

- Only the Size Words feature package is in scope.
- There is no backend, database, Supabase connection, authentication, account,
  child profile, chat, or complete therapist dashboard.
- The whole Size Words unit is deterministic and uses no LLM, including its
  conversation, scoring, rewards, summaries, and reports.
- Azure Speech is the only real-demo STT and TTS provider.
- Pronunciation Assessment is not called for this unit and does not appear in
  Tier logic or reports.
- The real acceptance platform is Docker + Chrome Web. Expo Go remains a UI
  compatibility path and may use mocks; it is not the real Azure/PDF acceptance
  platform.
- Coins are granted only after Activities 1, 3, and 5. Tier 3 may strengthen the
  celebration but never grants another coin.
- Activity 4's visible `BIG/MEDIUM/SMALL` labels will be removed. Activity 3/4
  retain their supplied 5:4 assets and the UI also supports 3:2 scenes.
- Mascot delivery is Lottie-first. Role 2 builds one cut-out master composition
  from the client-approved Kool artwork, with shared coordinates and segments for
  idle, listening, speaking, thinking, success, and controller-reachable
  transition paths. Shared bridge clips are allowed; no full state-pair matrix
  is required.
- Image-assisted work may separate or inpaint occluded parts, but it must derive
  from the approved artwork rather than independently redesigning body parts.
- Role 2 owns the visual acceptance gate. If the Lottie result has identity
  drift, visible seams, scale/anchor jumps, loop snaps, or is otherwise visually
  unconvincing, Role 2 switches the same mascot component to the approved raster
  pose + Reanimated fallback. Other roles continue using the same `mascotState`
  contract and do not branch on the selected renderer.
- Coin, sparkle, confetti, and loading remain separate Lottie effects. Existing
  Reanimated mic ripple/clue breathing need not be rewritten.
- The Azure key and region are never committed, even to the private repository.
  Live-demo values exist only in each authorised teammate's ignored
  `.env.local`; the team privately shares them only with people who need live
  Azure testing. Their exposure in the local browser bundle is an accepted
  small-team demo limitation, not a production credential design.
- No token broker or application backend is added. Before handoff, the team
  deletes or invalidates the locally used key in Azure and records the check.

## 3. Required stack and current gap

The client stack is non-negotiable:

| Area | Sprint 2 target |
| --- | --- |
| Runtime | React Native `0.81.5`, Expo `^54.0.21`, Node.js `20.19.x` |
| Language/routing | TypeScript `~5.9.2`, Expo Router `~6.0.13` |
| UI/state | React Native Paper `^5.14.5`, React Context API |
| Audio/storage | Expo AV `^16.0.7`, AsyncStorage `2.2.0` |
| Animation | Expo 54-compatible `lottie-react-native`; Reanimated fallback |
| Speech | Azure Speech SDK, current compatible release |
| Delivery | Docker, Docker Compose, Expo Go, GitHub Actions |

The repository currently uses Expo 56 / RN 0.85 / TypeScript 6 / Router 56, has
no Paper, AsyncStorage, connected Azure SDK, or Lottie mascot pipeline, and
contains only an unverified development Docker shell. Role 1 owns alignment to
the table above. Do not move to Node 22 or `expo-audio`. Supabase JS is excluded
because Team ALMOND does not build a Supabase connection. Docker pins an exact
Node 20.19 patch release because Expo SDK 54 requires Node 20.19.x or later
within the agreed Node 20 line.

## 4. Parallel delivery model

All six roles begin in parallel. Nobody waits for a finished downstream feature:

- Role 1 immediately aligns the stack and Docker environment.
- Role 2 first runs the Lottie mascot feasibility/visual gate, then
  imports Activities 3–5 and builds UI contracts with fixtures.
- Roles 3–6 immediately build against shared TypeScript contracts and mocks.
- Role 1 exclusively edits `package.json` and the lockfile, landing the
  Expo-compatible Lottie dependency as an early isolated baseline. Role 2 starts
  the artwork/layer/animation work in parallel and does not edit dependency files.
- Role 1 also lands the credential-empty environment template, ignore rules,
  and Docker local-environment wiring early so Role 5 can test live Azure without
  any secret entering Git.
- The mascot spike never blocks another lane: all consumers target the stable
  `mascotState` values while Role 2 owns the renderer and fallback internally.
- Contract changes are announced early and kept backward-compatible where
  possible; short-lived adapters are preferred over blocking another role.
- Role 1 owns final integration, regression fixes, demo assembly, and handoff.
- Role 2 is an early feature owner, not the final cleanup owner.

The team-approved definitions in `docs/sprint2-shared-contracts.md` are the
canonical boundary. Each domain owner implements its section; Role 1 coordinates
locations and merges but cannot change another role's semantics alone. This is a
coordination point, not a sequential phase gate.

## 5. Shared implementation contracts

### Activity registry

One Size Words registry drives the generic activity route. Each activity defines
its id, order, title, scene asset key, prompts, target words, focus target ids,
clue/recast copy, accepted noun aliases, and optional reward checkpoint. Role 2's
asset manifest owns scene source, aspect ratio, accessibility description, and
hotspot geometry. Do not create copied Activity 2–5 screens.

| Activity | Scene | Primary Size Words | Coin after completion |
| --- | --- | --- | --- |
| 1 | Kitchen Bench | big, tiny | Yes |
| 2 | Park | huge, small | No |
| 3 | Toy Box | gigantic, tiny | Yes |
| 4 | Farmer's Market | medium, big, small | No |
| 5 | Beach Day | all six primary words | Yes |

The six primary report words are `big`, `small`, `tiny`, `huge`, `gigantic`, and
`medium`. Recognition may also accept `little`, `large`, `giant`, `enormous`, and
`teeny`, plus natural comparative/superlative forms.

All session events, speech/controller adapters, reward order, metrics, report
fields, formulas, and value export names are defined only in
`docs/sprint2-shared-contracts.md`. Roles must not recreate them locally.

## 6. Role workstreams

### Role 1 — Yufan: Platform, integration, and release

Start now:

- align Expo/RN/TypeScript/Router/Paper/Expo AV/AsyncStorage to the required stack;
- pin an exact Node 20.19.x Docker base, replace floating global Expo installs,
  and use the project-local CLI with `npm ci`;
- make `docker compose up` serve the Chrome demo on same-machine `localhost`
  without a personal LAN IP;
- commit `.env.example` with mock mode and blank credentials, ignore
  `.env`/`.env.local`/`.env.*.local` in
  both `.gitignore` and `.dockerignore`, and wire Docker Compose to read the
  host's `.env.local` at container runtime rather than a Docker build argument;
- add a CI secret scan and verify `git check-ignore -q .env.local` before live
  credentials are used; CI creates its untracked mock `.env.local` by copying
  `.env.example` before Docker checks;
- add the Expo 54-compatible `lottie-react-native` dependency in an early,
  isolated `package.json`/lockfile baseline; and
- scaffold and merge the approved canonical contract exports so every role can
  develop with mocks, without redefining their semantics.

Own:

- generic unit/activity routes and feature-package boundary;
- credential-empty Azure environment template, local setup instructions,
  secret-exclusion checks, and the handoff revocation checklist;
- explicit speech-mode selection: `mock` starts a fixture session; only a
  successfully initialised `azure` adapter starts a live session; invalid mode or
  configuration starts no session and shows configuration-unavailable UI;
- route/hydration loading UI that consumes Role 2's presentational
  `LoadingEffect` without adding animation policy to routes;
- Docker health/startup documentation and GitHub Actions checks;
- integration of all role branches, regression fixes, demo seed/reset, and final
  release evidence.

Done when a clean checkout can copy `.env.example` to `.env.local`, start through
Docker, and use mock mode with blank values or live Azure with privately supplied
values; all dependency/secret checks pass, the activity/report routes work, and
no real credential is tracked or copied into a Docker image layer.

### Role 2 — Zhuo: Child experience, assets, and visual system

Start first, in parallel with Role 1:

- build and visually test the mascot animation spike before the remaining Role 2
  work: derive a transparent cut-out layer pack from the client artwork, generate
  one Lottie master composition, and cover all five `mascotState` values plus the
  controller-reachable transition paths;
- record the visual-gate result and select either `lottie-cutout` or
  `raster-reanimated` behind the same component contract; include a Docker Chrome
  and one native-target screenshot or short recording in the Role 2 PR checklist;
- then import the supplied Activity 3/4/5 assets with stable names,
  source notes, dimensions, and an asset manifest;
- remove the answer labels from Activity 4 without regenerating its main scene;
- verify Activity 2 alongside 3–5 for target visibility, hotspot coordinates,
  answer leakage, and copyright/source notes; and
- expose typed scene/focus props and fixture data so other roles can integrate
  before real content and speech are ready.

Own:

- responsive 5:4 and 3:2 scene layout with normalised hotspot geometry;
- multiple-target spotlight: dim non-target objects and highlight the requested
  target without obscuring it;
- two-level progress (`Activity x of 5`, `Question x of y`), clue, Replay,
  listening, retry, Skip, Back, and accessible states using React Native Paper;
- one `MascotAnimator` with fixed anchor/size and no renderer-specific branches
  outside Role 2: prefer the shared-canvas Lottie cut-out rig and retain the
  normalised raster pose + Reanimated crossfade/micro-motion fallback;
- presentational `RewardEffect` and `LoadingEffect` Lottie components: Role 6
  supplies reward policy/intensity/layout and Role 1 supplies loading visibility;
- the existing Reanimated mic ripple/clue breathing; and
- phone/tablet/web visual and accessibility QA.

Done when Activities 1–5 render from the same component contract, scenes do not
leak answers, the selected mascot renderer covers all five states without visible
identity drift, seams, anchor/scale jumps, or loop snaps in Docker Chrome and one
native target, and fixtures demonstrate every child-facing state without Azure
or report code. The selected mode and visual-gate evidence are recorded. Final
integration cleanup is not Role 2's responsibility.

### Role 3 — Weidu: Content, session, and derived data

Start now with fixture assets/contracts:

- encode Activities 2–5 and consolidate Activity 1 into one typed registry;
- define prompts, targets, noun aliases, focus geometry references, clues,
  recasts, and checkpoints; and
- implement the versioned Context + AsyncStorage session and hydration/reset.

Own:

- compound prompt identity and activity lifecycle/duration events;
- speech attempts, scaffold/replay, delivery/model/recast, and reward records;
- attempt-status policy and selectors for all report metrics;
- content version, delivered copy, monotonic attempt number, Activity 5
  generalisation, and the open-prompt readiness denominator;
- fixture factories for low/medium/high participation and Azure failure cases;
- migration/fallback for invalid stored data without crashing the demo.

Done when a reload resumes the local unit, reset is deterministic, all report
metrics can be generated from fixtures or real attempts, and Activity 1–5 data
contains no screen-specific logic.

### Role 4 — Yaqi: Conversation flow, timing, and child safety

Start now against mocked speech and session adapters.

Own:

- one canonical controller used by both runtime and tests;
- prompt → TTS → listening → staged silence help → evaluation → recast/celebrate
  → next prompt transitions;
- the fixed 3s → 6s → 10s → 5s silence schedule, with TTS pausing the timer;
- clue and Replay timing semantics without duplicate attempt/progress/reward;
- safe no-response, no-match, permission, offline, service-error, Skip, Back,
  retry, and unmount behaviour;
- cancellation and stale-callback protection across rapid taps/navigation;
- short, encouraging, non-judgmental copy for every Tier and error path.

Done when fake-timer tests cover the full state graph and the same controller is
used in the real generic activity screen.

### Role 5 — Fanqin: Azure Speech and deterministic Tier scoring

Start now behind the speech adapter; Role 4 and Role 2 use its mock immediately.

Own:

- browser Azure Speech SDK STT and TTS for the Docker + Chrome demo;
- explicit `EXPO_PUBLIC_SPEECH_MODE=mock|azure` selection and exact local-only
  `EXPO_PUBLIC_AZURE_SPEECH_KEY` and
  `EXPO_PUBLIC_AZURE_SPEECH_REGION` configuration, with clear unavailable/error
  handling when Azure mode has a blank credential;
- microphone permissions, start/stop/cancel, partial/final transcript, confidence,
  timeout, retry, and service-error mapping;
- Kool voice selection and replay with protection against repeated taps;
- a child-friendly `en-AU` Azure Neural voice with fixed rate, pitch, and volume,
  followed by one team listening check for the “less robotic” client feedback;
- Size Word normalisation, fuzzy matching, Tier 1/2/3 classification, natural
  comparative forms, and false-positive tests;
- an Expo Go mock adapter and clear UI capability flag; and
- Expo AV use for compatible app-side audio lifecycle/non-speech playback without
  replacing Azure as Kool's real voice.

Do not call Pronunciation Assessment and do not use Web Speech or `expo-speech`
as the successful demo provider. Done when a Docker Chrome session records a
child utterance, obtains an Azure transcript, classifies it, plays Azure TTS, and
recovers cleanly from denied permission or Azure failure.

### Role 6 — Yuxuan: Rewards, reports, PDF, and QA

Start now using Role 3 fixture sessions.

Own:

- idempotent engagement coins only at Activity 1/3/5 and a three-coin summary;
- Tier-aware celebration intensity without correctness-based reward changes;
- reward overlay policy/layout that consumes Role 2's presentational
  `RewardEffect`; Role 6 does not recreate coin/confetti/sparkle animation assets;
- parent and therapist report views from the shared report model;
- editable note/next-step fields and 3–4 deterministic summary scenarios;
- frontend HTML template, PDF generation, download, share/fallback, and visual QA;
- automated end-to-end paths for low, medium, high, skipped, restored, and Azure
  failure sessions;
- a usability-test script; execute it and collect evidence only after the
  team/client arranges approved participants. Do not recruit or record children
  without the required approval and consent.

Done when the third coin leads to a report generated from the same persisted
session, screen and PDF numbers match, and download/share behaviour is verified
in Docker Chrome.

## 7. Integration rule

Ownership and export names come from the Shared Contracts file. Mock/fixture
adapters remain available so a delayed lane never blocks another role's PR.

## 8. Sprint 2 definition of done

Sprint 2 is complete only when all of the following are demonstrated:

- a clean private-repository checkout runs with `docker compose up` and opens in
  same-machine Chrome through `localhost` after the documented `.env.local`
  setup;
- dependency versions match the required Expo 54 stack;
- Activities 1–5 run through one generic flow with correct scenes and progress;
- real Azure STT/TTS works in Docker Chrome using the ignored local demo key;
- `.env.example` contains no credential values; `.env.local` is ignored by Git
  and Docker, no key is present in tracked files/history or a Docker image layer,
  and the CI secret scan passes;
- keyword/Tier logic is deterministic and contains no phoneme scoring or LLM;
- Replay/clue/Skip/Back/error paths do not duplicate attempts, progress, or coins;
- exactly three coins are issued after Activities 1, 3, and 5;
- session reload/resume and reset work through AsyncStorage;
- parent and therapist reports use real unit-session data and matching metrics;
- report editing, PDF download, and share/fallback work in Docker Chrome;
- automated tests cover controller, scoring, selectors, persistence, rewards, and
  representative end-to-end scenarios;
- visual/accessibility QA covers 5:4 and 3:2 scenes plus phone/tablet/web layouts;
- Role 2's recorded visual gate selects one mascot renderer; every state and
  controller-reachable transition path uses the same `MascotAnimator` contract,
  and the chosen path has no visible identity drift, seams, anchor/scale jumps,
  or loop snaps;
- no backend, Supabase connection, authentication, LLM, or complete dashboard was
  added; and
- before handoff, the locally used Azure demo key is deleted or invalidated in
  Azure, local copies and generated bundles/caches containing it are removed,
  local containers are stopped, and the team records that this was completed.
