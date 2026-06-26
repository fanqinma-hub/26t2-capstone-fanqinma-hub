# Sprint 1 demo adapters

This branch intentionally delivers a deterministic frontend demo, not speech
recognition, scoring, persistence, or report generation.

## Replaceable boundaries

| Future role | Current adapter | Replacement responsibility | UI that stays unchanged |
| --- | --- | --- | --- |
| Role 3 — activity content and session state | `src/fixtures/activity-01.fixture.ts`, `src/types/session.types.ts`, and `src/session/` | Activity 1 Size Words fixture, future `ActivityDefinition` adapter, accepted responses, hotspot/content mapping, and in-memory SessionContext | `ActivityScreen` scene and conversation layout |
| Role 4 — conversation timing | `src/demo/useActivity1DemoFlow.ts` | Conversation events, retry policy and completion events | `ActivityScreen` presentation props and `KoolMascot` states |
| Role 5 — voice pipeline | Mock microphone sequence in `useActivity1DemoFlow.ts` | Recording permissions, STT, size-word detection, tier classification and mapped voice-pipeline state | `MicrophoneButton` and visible Kool dialogue |
| Role 6 — reporting | `src/fixtures/report-demo.fixture.ts` | Session-derived report view model and approved export behaviour | Parent/Therapist report shell and editable note affordance |

## Demo-only behaviour

- Role 3 exposes the client-confirmed 3 / 6 / 10-second thresholds and
  five-second post-help window from one config file. Role 4 still owns timer
  cancellation, transitions and auto-advance behaviour.
- Activity 1 remains the original single-picture demo. It does not add a
  six-question loop or treat picture objects as answers.
- The question-mark hotspot remains help-only.
- `src/services/koolSpeech.ts` provides local Expo TTS. The speech bubble is
  still rendered when TTS is unavailable.
- The in-memory SessionContext records prompt and scaffold state. The
  development microphone uses a clearly labelled mock adapter to demonstrate
  `SpeechAttempt` writes; Role 5 replaces it with recording, STT and real tier
  classification through the same contract.
- Development builds show a live Session State Inspector below the activity,
  including a test-only question picker, summary fields, the latest attempt
  and full JSON.
- No raw audio, raw Azure payload, persistence, clinical scoring or real child
  data is stored.
