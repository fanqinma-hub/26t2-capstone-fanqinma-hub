# Activity screen integration contract

`ActivityScreen` is a Role 2 visual component. Its exported prop types live in
`src/components/activity/types.ts`; they deliberately describe renderable input,
not the team's domain model or runtime state machine.

## Required inputs

| Provider | Inputs supplied to the visual shell |
| --- | --- |
| Role 3 | Activity identity and title, scene asset key, prompt text, activity progress, and optional hotspots. Hotspot `x`, `y`, `width`, and `height` must be normalized values from 0 to 1. |
| Role 4 | A conversation state mapped to `ActivityScreenVisualState`. Role 4 owns timing, transitions, and any retry logic. |
| Role 5 | A voice-pipeline state mapped to `MicrophoneButtonState`, plus the microphone callback implementation. Role 5 owns recording, permissions, STT, and processing. |

## Role 2 responsibilities

Role 2 owns only responsive rendering: scene framing, dialogue, visible status,
microphone presentation, feedback, progress, and optional hotspot affordances.
The shell has no timers, domain rules, persistence, recording, STT, scoring,
rewards, reports, or conversation state-machine logic.

## Temporary fixture

`src/fixtures/activity-01.fixture.ts` is a development-only fixture for
`/activity/1`. Its copy, callbacks, and hotspot coordinates are mock values.
In particular, its hotspot coordinates have not been client-confirmed.

Role 3 must replace this fixture with official shared activity data before the
screen is treated as integrated. Until then, the Role 2 contribution is ready
for integration, but PROJ-4 is not fully complete.

## Sprint 1 demo adapter

For the Sprint 1 review route, `src/demo/useActivity1DemoFlow.ts` supplies the
same visual inputs through a deterministic timer and microphone-result demo.
It remains outside `ActivityScreen` so Roles 4 and 5 can replace timer events,
recording/STT and retry outcomes without redesigning the activity UI. See
`docs/sprint1-demo-adapters.md` for the full handover boundary.
