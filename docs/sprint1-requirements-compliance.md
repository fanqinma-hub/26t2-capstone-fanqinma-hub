# Sprint 1 requirements and integration boundary

This document records the frontend-slice boundary only. Private meeting notes,
email, transcripts and planning files remain outside the repository.

## Delivered in Sprint 1

| Requirement | Sprint 1 implementation |
| --- | --- |
| Entry experience | One `Big, Small and Everything in Between!` card with a direct Start activity action and no level selection. |
| Child interaction | Larger child-readable type, animated Kool beside the bottom conversation area, visible dialogue, local TTS, microphone presentation, and a question-mark clue trigger. |
| Activity scope | Deterministic Activity 1 kitchen-scene demo only. Activities 2–5 are not implemented; client scene assets for Activities 3–5 remain pending. |
| Demo timing | Central 3/6/10-second cue timing, help path, five-second final listening window, and teardown-safe timers. |
| Report shell | Clearly labelled demo-session, Activity 1 sample data with separate Parent/Therapist views, editable therapist note, and disabled Download/Share controls. |

## Not represented as complete

- No login, backend, persistence, dynamic fetching, recording, STT, transcript,
  scoring, clinical conclusion, NDIS submission, real export/share, or final
  five-activity report is implemented.
- `src/fixtures/activity-01.fixture.ts` and
  `src/fixtures/report-demo.fixture.ts` are replaceable sample adapters.
- Roles 3–6 replace activity data, conversation/voice events, and report data
  without requiring a redesign of `ActivityScreen` or the report shell. See
  `docs/sprint1-demo-adapters.md` and `docs/contracts/activity-screen-contract.md`.
