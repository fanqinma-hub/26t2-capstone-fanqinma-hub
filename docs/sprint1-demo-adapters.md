# Sprint 1 demo adapters

This branch intentionally delivers a deterministic frontend demo, not speech
recognition, scoring, persistence, or report generation.

## Replaceable boundaries

| Future role | Current adapter | Replacement responsibility | UI that stays unchanged |
| --- | --- | --- | --- |
| Role 3 — activity content | `src/fixtures/activity-01.fixture.ts` | Official activity text, scene key and client-confirmed normalized hotspot bounds | `ActivityScreen` scene and conversation layout |
| Role 4 — conversation timing | `src/demo/useActivity1DemoFlow.ts` | Conversation events, retry policy and completion events | `ActivityScreen` presentation props and `KoolMascot` states |
| Role 5 — voice pipeline | Demo microphone sequence in `useActivity1DemoFlow.ts` | Recording permissions, STT, transcript handling and a mapped voice-pipeline state | `MicrophoneButton` and visible Kool dialogue |
| Role 6 — reporting | `src/fixtures/report-demo.fixture.ts` | Persisted/session-derived report view model and approved export behaviour | Parent/Therapist report shell and editable note affordance |

## Demo-only behaviour

- `activity1DemoTiming` centralises the 3 / 6 / 10-second cue flow, the
  five-second post-help listening window, and short deterministic microphone
  transitions.
- `src/services/koolSpeech.ts` provides local Expo TTS. The speech bubble is
  always rendered, including on platforms where TTS is unavailable. A request
  token prevents an earlier asynchronous stop from speaking stale copy after a
  newer state change or route leave.
- The development-only state picker is hidden when `__DEV__` is false. A
  reviewer can also use `/activity/1?demoState=success` or
  `/activity/1?demoState=retry`.
- No transcript, recording, child data, scoring result, clinical conclusion,
  report export, reward balance, or final learning-unit report is stored. The
  Activity 1 report route is explicitly sample/demo and non-clinical.
