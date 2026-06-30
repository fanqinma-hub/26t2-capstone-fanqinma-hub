# Sprint 1 demo adapters

This document records the replaceable boundaries of the Sprint 1 frontend slice.
The web demo now performs real browser speech recognition (Chrome Web Speech API)
and runs the deterministic Tier 1/2/3 classifier on the transcript. It does not
yet provide production-grade/cross-browser/native STT, persistence, or dynamic
report generation — those remain replaceable behind the same contracts.

## Replaceable boundaries

| Future role | Current adapter | Replacement responsibility | UI that stays unchanged |
| --- | --- | --- | --- |
| Role 3 — activity content and session state | `src/fixtures/activity-01.fixture.ts`, `src/types/session.types.ts`, and `src/session/` | Activity 1 Size Words fixture, future `ActivityDefinition` adapter, accepted responses, hotspot/content mapping, and in-memory SessionContext | `ActivityScreen` scene and conversation layout |
| Role 4 — conversation timing | `src/demo/useActivity1DemoFlow.ts` | Conversation events, retry policy and completion events | `ActivityScreen` presentation props and `KoolMascot` states |
| Role 5 — voice pipeline | Browser STT capture in `src/services/sprint1SpeechRecognition.ts` plus transcript scoring in `src/utils/activity-response.ts` (calls `classifyTier`) | Production-grade/cross-browser/native recording + STT (e.g. the `ISTTAdapter` Azure/mock path and `voice-pipeline.service.ts`), tuned size-word detection and confidence | `MicrophoneButton` and visible Kool dialogue |
| Role 6 — reporting | `src/fixtures/report-demo.fixture.ts` | Session-derived report view model and approved export behaviour | Parent/Therapist report shell and editable note affordance |

## Demo-only behaviour

- Role 3 exposes the client-confirmed 3 / 6 / 10-second thresholds and
  five-second post-help window from one config file. Role 4 still owns timer
  cancellation, transitions and auto-advance behaviour.
- Activity 1 is a single-picture scene that now runs its multi-prompt
  conversation loop (advancing prompt to prompt to the reward checkpoint). It
  does not treat picture objects as answers.
- The question-mark hotspot remains help-only.
- `src/services/koolSpeech.ts` provides local Expo TTS. The speech bubble is
  still rendered when TTS is unavailable.
- The in-memory SessionContext records prompt and scaffold state. The
  press-and-hold microphone captures a real transcript through the browser Web
  Speech API and scores it with the deterministic tier classifier, then writes a
  `SpeechAttempt`. A dev-only typed fallback (`?devControls=1`) keeps inspection
  runs unblocked if the browser mic is unavailable. Production-grade/native STT
  replaces the capture source through the same contract.
- Development builds show a live Session State Inspector below the activity,
  including a test-only question picker, summary fields, the latest attempt
  and full JSON.
- No raw audio, raw Azure payload, persistence, clinical scoring or real child
  data is stored.
