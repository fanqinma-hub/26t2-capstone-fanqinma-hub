# Sprint 1 requirements and integration boundary

This document records the frontend-slice boundary only. Private meeting notes,
email, transcripts and planning files remain outside the repository.

## Delivered in Sprint 1

| Requirement | Sprint 1 implementation |
| --- | --- |
| Entry experience | One activity card with a direct Start activity action. |
| Child interaction | Existing Activity 1 scene, Kool dialogue, local TTS, microphone presentation, and question-mark clue trigger. |
| Activity scope | Deterministic Activity 1 kitchen-scene demo only. |
| Demo timing | Client-confirmed 3 / 6 / 10 / final-5-second values live in one Role 3 config; Role 4 owns transitions, cancellation and auto-advance. |
| Role 3 content | Activity 1 Size Words fixture, future `ActivityDefinition` screen adapter, accepted responses, hotspot/content mapping, and in-memory SessionContext. |

## Not represented as complete

- No login, backend, persistence, dynamic fetching, recording, STT, size-word
  classification, clinical conclusion, or real export/share is implemented.
- Picture hotspots remain optional visual help and are not answer-recognition
  controls.
- Conversation transitions remain Role 4 work and real speech recognition and
  tier classification remain Role 5 work. The development microphone only
  creates labelled mock `SpeechAttempt` data for integration testing.
- `src/fixtures/report-demo.fixture.ts` remains a replaceable UI sample adapter.
