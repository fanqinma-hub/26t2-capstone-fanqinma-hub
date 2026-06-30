# Sprint 1 requirements and integration boundary

This document records the frontend-slice boundary only. Private meeting notes,
email, transcripts and planning files remain outside the repository.

## Delivered in Sprint 1

| Requirement | Sprint 1 implementation |
| --- | --- |
| Entry experience | One activity card with a direct Start activity action. |
| Child interaction | Activity 1 scene, Kool dialogue, local TTS, press-and-hold voice answer (browser Web Speech API) with deterministic Tier 1/2/3 scoring on the transcript, coin reward popup, and question-mark clue trigger. |
| Activity scope | Activity 1 kitchen-scene demo only, running its multi-prompt conversation loop to the reward checkpoint. |
| Voice + scoring | Web Speech capture (`src/services/sprint1SpeechRecognition.ts`) feeding `classifyTier` via `src/utils/activity-response.ts`; a `SpeechAttempt` is written to the in-memory session. |
| Demo timing | Client-confirmed 3 / 6 / 10 / final-5-second values live in one Role 3 config; Role 4 owns transitions, cancellation and auto-advance. |
| Role 3 content | Activity 1 Size Words fixture, future `ActivityDefinition` screen adapter, accepted responses, hotspot/content mapping, and in-memory SessionContext. |

## Not represented as complete

- No login, backend, persistence, dynamic fetching, clinical conclusion, or real
  export/share is implemented.
- Voice recognition is demo-grade (browser Web Speech API, web/Chrome only). It
  is not production-grade, cross-browser, or native-hardened, and the
  `ISTTAdapter` Azure/native path is not yet wired into the live screen.
- Picture hotspots remain optional visual help and are not answer-recognition
  controls.
- `src/fixtures/report-demo.fixture.ts` remains a replaceable UI sample adapter
  for the polished report cards; the real captured session payload is surfaced
  alongside it rather than a fully generated report.
