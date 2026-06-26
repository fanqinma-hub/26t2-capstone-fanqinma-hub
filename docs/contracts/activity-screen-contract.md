# Activity screen integration contract

`ActivityScreen` is a Role 2 visual component. Its exported prop types live in
`src/components/activity/types.ts`; they deliberately describe renderable input,
not the team's domain model or runtime state machine.

## Required inputs

| Provider | Inputs supplied to the visual shell |
| --- | --- |
| Role 3 | `ActivityDefinition` and the screen adapter in `src/fixtures/activity-01.fixture.ts`: identity, scene asset, Size Words vocabulary, accepted responses, activity progress, and optional help hotspots. Hotspot coordinates are normalized from 0 to 1. |
| Role 4 | A conversation state mapped to `ActivityScreenVisualState`. Role 4 owns timing, transitions, and any retry logic. |
| Role 5 | A voice-pipeline state mapped to `MicrophoneButtonState`, plus the microphone callback implementation. Role 5 owns recording, permissions, STT, and processing. |

## Role 2 responsibilities

Role 2 owns only responsive rendering: scene framing, dialogue, visible status,
microphone presentation, feedback, progress, and optional hotspot affordances.
The shell has no timers, domain rules, persistence, recording, STT, scoring,
rewards, reports, or conversation state-machine logic.

## Shared Activity 1 content

`src/fixtures/activity-01.fixture.ts` contains the Activity 1 source data and
the `toActivityScreenContent` adapter. It provides structured prompts,
accepted-response examples, target size adjectives, and mappings to the
watermelon, strawberry, cooking-pot and teacup hotspots.

The original watermelon hotspot remains an optional clue affordance. It does
not identify or submit the child's answer. The fixture also exports
`activity01SessionSeed`, which Activity 1 uses to initialise the shared
in-memory SessionContext.

The SessionContext records the active activity/prompt, scaffold use, complete
transcript, detected size words, response tier, target adjective and
confidence. It does not store raw audio or raw Azure payloads, and it does not
control the Role 2 UI.

## Sprint 1 demo adapter

For the Sprint 1 review route, `src/demo/useActivity1DemoFlow.ts` supplies the
same visual inputs through a deterministic timer and microphone-result demo.
It remains outside `ActivityScreen` so Roles 4 and 5 can replace timer events,
recording/STT and retry outcomes without redesigning the activity UI. See
`docs/sprint1-demo-adapters.md` for the full handover boundary.
