# Team ALMOND — Sprint 2 Shared Contracts

> Applies with `docs/sprint2-role-workplan.md`. These contracts are the canonical
> integration boundary for all six roles.

## 1. Governance and canonical files

- Domain owners define semantics; Role 1 coordinates locations, integration, and
  release. Role 1 must not change another role's contract semantics alone.
- A breaking change needs the owning role and at least one consuming role to
  approve the PR. Additive optional fields may proceed with owner approval.
- Each role edits its owned files and consumes other domains through exports.
- Role 1 exclusively edits `package.json` and the lockfile. It lands the
  Expo-compatible Lottie dependency as an early isolated baseline; Role 2 owns
  animation code/assets and does not edit dependency files.
- TypeScript blocks below fix public names and shapes; imports are omitted for
  brevity. Implementations may add private types but must not reinterpret fields.

| Canonical target | Owner | Consumers |
| --- | --- | --- |
| `src/types/activity.types.ts`, `src/content/size-words/` | Role 3 | 1, 2, 4, 5, 6 |
| `src/types/visual.types.ts`, activity/mascot components, visual assets and manifests | Role 2 | 1, 3, 4, 5, 6 |
| `src/types/session.types.ts`, `src/types/metrics.types.ts`, `src/session/` | Role 3 | 1, 4, 5, 6 |
| `src/types/conversation.types.ts`, `src/conversation/` | Role 4 | 1, 2, 3, 5 |
| `src/types/speech.types.ts`, `src/services/speech/`, scoring utilities | Role 5 | 2, 3, 4, 6 |
| `src/types/reward.types.ts`, `src/types/report.types.ts`, `src/rewards/`, `src/reports/` | Role 6 | 1, 2, 3, 4 |
| routes, stack, Docker, CI | Role 1 | All |

The following Sprint 1 definitions are non-canonical and must be migrated, then
deleted or reduced to re-exports: `src/types/integration.types.ts`,
`src/types/scoring.types.ts`, `src/types/conversation.ts`, and
`src/types/dialogue.types.ts`. There must be one `SpeechAttempt`, one public
conversation contract, and one `ActivityDefinition`.

## 2. Global invariants

- IDs are stable and globally unique: `PromptId` includes its `ActivityId`.
- Domain data is serialisable. React Native asset objects stay in Role 2's asset
  manifest, not in activity/session records.
- Normalized rectangles use values from 0 to 1 and are relative to the displayed
  scene content box after aspect-fit, never the outer screen.
- Real reports accept only a `live` Azure session. Fixture attempts never mix
  with live attempts.
- Azure key/region values exist only in ignored local `.env.local` files. They
  are never committed, persisted in session data, logged, copied into a Docker
  image layer, or supplied as Docker build arguments.
- Rewards are engagement-based, idempotent, and fixed after Activities 1, 3, 5.
- UI never calculates Tier, metrics, rewards, timing, or persistence.
- `mascotState` describes behaviour, not rendering technology. Only Role 2's
  `MascotAnimator` selects Lottie or fallback; no consumer branches on its mode.
- Conversation never performs STT/TTS directly; it calls `SpeechAdapter`.
- Reports never infer events from activity scripts; they use recorded session
  events and selectors.

## 3. Activity and visual contracts

Role 2 owns these visual and asset types in `src/types/visual.types.ts`:

```ts
export type SceneAssetKey =
  | 'kitchen-bench' | 'park' | 'toy-box'
  | 'farmers-market' | 'beach-day';
export type SceneAspectRatio = '3:2' | '5:4';
export type FocusTargetId = `activity-${1 | 2 | 3 | 4 | 5}:${string}`;
export type MascotState =
  | 'idle' | 'speaking' | 'listening' | 'thinking' | 'success';
export type RewardEffectKind = 'coin' | 'sparkle' | 'confetti';

export interface NormalizedRect {
  x: number; y: number; width: number; height: number;
}

export interface FocusTarget {
  id: FocusTargetId;
  label: string;
  objectName: string;
  rect: NormalizedRect;
}

export interface SceneAssetManifestEntry {
  key: SceneAssetKey;
  source: ImageSourcePropType;
  aspectRatio: SceneAspectRatio;
  pixelWidth: number;
  pixelHeight: number;
  accessibilityLabel: string;
  sourceNote: string;
  focusTargets: readonly FocusTarget[];
}

export interface MascotAnimatorProps {
  state: MascotState;
  celebrationIntensity: 'gentle' | 'standard' | 'enhanced' | null;
  reducedMotion: boolean;
  accessibilityLabel: string;
}

export interface RewardEffectProps {
  effect: RewardEffectKind;
  intensity: 'gentle' | 'standard' | 'enhanced';
  playKey: string;
  reducedMotion: boolean;
  onComplete(): void;
}

export interface LoadingEffectProps {
  visible: boolean;
  reducedMotion: boolean;
  accessibilityLabel: string;
}
```

Role 3 owns the serialisable unit/activity types in
`src/types/activity.types.ts` and imports visual identifiers only:

```ts
export type ActivityId =
  | 'activity-1' | 'activity-2' | 'activity-3'
  | 'activity-4' | 'activity-5';
export type PromptId = `${ActivityId}:${string}`;
export type TargetAdjective =
  | 'big' | 'small' | 'tiny' | 'huge' | 'gigantic' | 'medium';
export type SizeWordKeyword = TargetAdjective |
  'little' | 'large' | 'giant' | 'enormous' | 'teeny';
export type ResponseTier =
  | 'noun_only' | 'adjective_used' | 'rich_description';
export type RewardCheckpointId =
  | 'coin-after-activity-1'
  | 'coin-after-activity-3'
  | 'coin-after-activity-5';

export interface AcceptedResponseExamples {
  tier1: readonly string[];
  tier2: readonly string[];
  tier3: readonly string[];
}

export interface ActivityPromptDefinition {
  id: PromptId;
  sequence: number;
  kind: 'open';
  promptText: string;
  repromptText: string;
  helpText: string;
  recastText: string;
  targetAdjectives: readonly TargetAdjective[];
  expectedNouns: readonly string[];
  nounAliases: readonly string[];
  focusTargetIds: readonly FocusTargetId[];
  readinessEligible: boolean;
  acceptedExamples: AcceptedResponseExamples;
}

export interface ActivityDefinition {
  id: ActivityId;
  order: 1 | 2 | 3 | 4 | 5;
  title: string;
  sceneAssetKey: SceneAssetKey;
  runtimeSeconds: number;
  targetAdjectives: readonly TargetAdjective[];
  teachingTechnique: string;
  introText: string;
  prompts: readonly ActivityPromptDefinition[];
  rewardCheckpointId?: RewardCheckpointId;
}

export interface LearningUnitDefinition {
  id: 'size-words-unit';
  contentVersion: string;
  title: 'Big, Small and Everything in Between!';
  type: 'expressive_language';
  targetAge: { minimum: 6; maximum: 8 };
  expectedRuntimeMinutes: { minimum: 5; maximum: 10 };
  primaryWords: readonly ['big', 'small', 'tiny', 'huge', 'gigantic', 'medium'];
  activities: readonly ActivityDefinition[];
}
```

Role 2 exports `Readonly<Record<SceneAssetKey, SceneAssetManifestEntry>>`.
Activity 3/4 use `5:4`; Activity 1/2/5 use `3:2`. Activity 4 points to the
client original scene (the pumpkin placards read BIG, MEDIUM, and SMALL by
client decision).

The generic visual shell consumes this adapter only:

```ts
export type ChildVisualState =
  | 'prompt' | 'listening' | 'gentleCue' | 'reprompt'
  | 'tapHelpAvailable' | 'cluePresented' | 'finalListening'
  | 'processing' | 'feedback' | 'complete' | 'error';

export interface ActivityScreenViewModel {
  activityId: ActivityId;
  title: string;
  sceneAssetKey: SceneAssetKey;
  sceneAspectRatio: SceneAspectRatio;
  focusTargets: readonly FocusTarget[];
  activityProgress: { current: number; total: 5 };
  questionProgress: { current: number; total: number };
  visualState: ChildVisualState;
  koolMessage: string;
  statusLine?: string;
  mascotState: MascotState;
  microphoneState: 'idle' | 'listening' | 'processing' | 'disabled' | 'error';
  audioLevel: number;
  activeFocusTargetIds: readonly FocusTargetId[];
  showClueTargets: boolean;
  celebrationIntensity: 'gentle' | 'standard' | 'enhanced' | null;
  canBack: boolean;
  canSkip: boolean;
  canReplay: boolean;
  canContinue: boolean;
  canStartMicrophone: boolean;
  canStopMicrophone: boolean;
}

export interface ActivityScreenActions {
  onBack(): void;
  onReplay(): void;
  onMicrophoneStart(): void;
  onMicrophoneStop(): void;
  onClue(targetId: FocusTargetId): void;
  onSkip(): void;
  onContinue(): void;
}
```

Role 4 alone creates the view-model. Role 1 only injects dependencies and renders
Role 2's component; no route constructs UI state or contains activity-specific
branches.

`audioLevel` is clamped from 0 to 1. `activeFocusTargetIds` must be a subset of
the supplied `focusTargets`; Role 2 owns the target ids and geometry, while Role
3 prompt definitions only reference those ids.

`MascotAnimator` is a renderer boundary owned by Role 2. Its primary
implementation is one Lottie cut-out master composition built from the
client-approved Kool artwork. All state clips and controller-reachable transition
paths share one canvas, anchor, scale, layer pack, and coordinate system; shared
bridge clips are allowed and a full state-pair transition matrix is not required.
Image-assisted work may separate existing parts and inpaint hidden pixels; it
must not independently redesign the mascot or introduce a second visual identity.

The release selects exactly one renderer through Role 2-owned configuration; it
is not a view-model field or a runtime choice for consumers. Role 2 selects
`lottie-cutout` only after the five states and controller-reachable paths pass
visual QA in Docker Chrome and one native target: approved identity and colours
are preserved; repeated transitions show no visible seams, transparent fringe,
drift, anchor/scale jumps, or loop snaps; and reduced-motion output remains
understandable. If Role 2 judges the result visually unconvincing, the component
switches to `raster-reanimated`, using normalised client-approved poses,
crossfades, and micro-motion. Props, state semantics, layout footprint, tests,
and consuming code remain unchanged in either mode.

Regardless of the selected release renderer, `MascotAnimator` reserves its
layout footprint and may show an approved poster/raster internally while Lottie
loads or after a renderer failure. This fail-safe is not a consumer-visible mode
and does not change public props, speech mode, or conversation state.

Role 2 records the selected mode in its PR checklist with a screenshot or short
recording from Docker Chrome and one native target. Role 1 owns the early,
isolated `lottie-react-native` dependency/lockfile baseline, including required
Web renderer peers and a static Web export smoke check; Role 2 does not edit
those files.

`RewardEffect` and `LoadingEffect` are Role 2-owned presentational Lottie
components. `RewardEffect` never decides whether a coin was earned or which
intensity applies: Role 6's `RewardOverlay` supplies those props and owns reward
policy/layout. Role 1 supplies `LoadingEffect.visible` from route/hydration state.
Role 6 and Role 1 do not recreate animation assets. Existing Reanimated mic
ripple and clue breathing stay inside Role 2's activity UI.

All Size Words prompts accept a valid child utterance without correctness
penalty. `readinessEligible` only controls the separate open-prompt readiness
denominator. `acceptedExamples` are fixtures/tests, not hard-coded recognition
allowlists.

## 4. Speech and classification contracts

```ts
export type SpeechOperationId = string;
export type SpeechErrorCode =
  | 'permission_denied' | 'no_match' | 'cancelled'
  | 'timeout' | 'network' | 'service' | 'unsupported' | 'configuration';
export type DeliveryKind =
  | 'prompt' | 'reprompt' | 'clue' | 'model' | 'recast' | 'replay';
export type DeliveryStatus = 'delivered' | 'failed' | 'cancelled';

export interface RecognitionResult {
  operationId: SpeechOperationId;
  transcript: string;
  normalizedTranscript: string;
  confidence: number | null;
  status: 'captured' | 'no_match';
  source: 'azure' | 'mock';
}

export interface DeliveryResult {
  operationId: SpeechOperationId;
  kind: DeliveryKind;
  text: string;
  words: readonly SizeWordKeyword[];
  primaryWords: readonly TargetAdjective[];
  status: DeliveryStatus;
  errorCode: SpeechErrorCode | null;
  completedAt: string;
}

export interface SpeechFailure {
  operationId: SpeechOperationId;
  code: SpeechErrorCode;
  message: string;
}

export type SpeechOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; failure: SpeechFailure };

export interface SpeechAdapter {
  readonly capability: 'live-azure' | 'mock';
  startListening(input: {
    operationId: SpeechOperationId;
    locale: 'en-AU';
    onAudioLevel?(level: number): void;
    onPartialTranscript?(transcript: string): void;
  }): Promise<SpeechOutcome<void>>;
  stopListening(operationId: SpeechOperationId):
    Promise<SpeechOutcome<RecognitionResult>>;
  speak(input: {
    operationId: SpeechOperationId;
    text: string;
    kind: DeliveryKind;
    words: readonly SizeWordKeyword[];
    primaryWords: readonly TargetAdjective[];
  }): Promise<SpeechOutcome<DeliveryResult>>;
  cancel(operationId?: SpeechOperationId): Promise<void>;
  stopAll(): Promise<void>;
}

export interface AzureSpeechRuntimeConfig {
  subscriptionKey: string;
  region: string;
  source: 'env-local';
}

export type SpeechRuntimeMode = 'mock' | 'azure';

export type SpeechAdapterInitResult =
  | { ok: true; adapter: SpeechAdapter }
  | { ok: false; code: 'configuration'; message: string };

export type CreateLiveAzureSpeechAdapter = (
  config: AzureSpeechRuntimeConfig,
) => SpeechAdapterInitResult;

export interface TierResult {
  tier: ResponseTier;
  detectedKeywords: readonly SizeWordKeyword[];
  detectedPrimaryWords: readonly TargetAdjective[];
  matchedVariants: readonly {
    heard: string;
    canonical: SizeWordKeyword;
    primaryEquivalent: TargetAdjective;
    similarity: number;
  }[];
}

export type ClassifySizeWords = (input: {
  prompt: ActivityPromptDefinition;
  transcript: string;
}) => TierResult;
```

Role 5 supplies `live-azure` for Docker Chrome and `mock` for Expo Go/tests.
Only Azure produces a successful live result. Classification is deterministic,
case-insensitive, prompt-aware, and uses the confirmed fuzzy threshold `> 0.65`.
Pronunciation Assessment is not called.

The only credential environment names are `EXPO_PUBLIC_AZURE_SPEECH_KEY` and
`EXPO_PUBLIC_AZURE_SPEECH_REGION`; Role 1 and Role 5 use no alternatives. The
non-secret `EXPO_PUBLIC_SPEECH_MODE` is exactly `mock` or `azure`. Credentials
are intentionally visible in the local browser bundle for this small-team demo,
but must originate only from `.env.local`. No token broker or backend is added.

Role 1 owns environment loading and passes `AzureSpeechRuntimeConfig` to Role
5's `createLiveAzureSpeechAdapter` only when mode is `azure`. Role 5 validates
both values before creating an Azure recognizer or synthesizer. Missing/blank
values return the failed `SpeechAdapterInitResult`; no Azure object is created.
Role 1 shows configuration-unavailable UI for that result. Missing/invalid
`EXPO_PUBLIC_SPEECH_MODE` is the same configuration-unavailable state. Mode
`mock` explicitly creates `createMockSpeechAdapter`; the app never silently
changes an Azure session to mock or counts a mock attempt as live.

Speech runtime initialisation must finish before Role 1 dispatches
`UNIT_STARTED`. The mapping is fixed: `mock` uses the mock adapter and
`UNIT_STARTED.mode = 'fixture'`; only `azure` plus a successful
`SpeechAdapterInitResult` uses the live adapter and `UNIT_STARTED.mode = 'live'`.
Missing/invalid mode or failed Azure initialisation dispatches no `UNIT_STARTED`
and creates no session. Role 3 continues rejecting any attempt source that does
not match the persisted session mode.

The repository commits `.env.example` with mock mode and empty credentials only:

```dotenv
EXPO_PUBLIC_SPEECH_MODE=mock
EXPO_PUBLIC_AZURE_SPEECH_KEY=
EXPO_PUBLIC_AZURE_SPEECH_REGION=
```

Both `.gitignore` and `.dockerignore` include `.env`, `.env.local`, and
`.env.*.local`. Docker Compose reads the host `.env.local` at container runtime;
the Dockerfile must not declare the key as `ARG` or `ENV`. CI runs secret scanning,
`git check-ignore -q .env.local` must succeed, and `.env.local` must not appear in
`git ls-files`. Before Docker checks, CI copies `.env.example` to an untracked
`.env.local` and uses its explicit mock mode, so CI requires no real key. Only
teammates who need live testing receive the key privately. Before handoff, the
key is invalidated/deleted in Azure, local containers are stopped, and all local
copies plus generated web bundles/caches containing it are removed.

Only one speech operation may be active. `cancel` and `stopAll` are idempotent;
late results from an old `operationId` are ignored.

Role 4 calls `startListening`, then `stopListening` to obtain the final result.
`cancel` discards an operation without creating a valid utterance.

Adapter failures are normalised to `SpeechFailure` before Role 4 receives
`SPEECH_FAILED`. Azure recognition confidence remains on `RecognitionResult`;
fuzzy-match similarity remains on `matchedVariants` and is never reported as
Azure confidence. In a fixture session, a captured mock result is stored with
attempt status `mocked`, never `captured`.

## 5. Conversation contract

Role 4 owns one controller and exposes snapshots/events; its internal reducer is
not imported by UI, speech, or reports.

```ts
export type ConversationPhase =
  | 'idle' | 'prompting' | 'listening' | 'gentleCue'
  | 'reprompting' | 'tapToHelp' | 'finalListening'
  | 'processing' | 'feedback' | 'complete' | 'error';

export interface ConversationSnapshot {
  activityId: ActivityId;
  promptId: PromptId | null;
  operationId: SpeechOperationId | null;
  phase: ConversationPhase;
  scaffoldStage: 0 | 1 | 2 | 3;
  viewModel: ActivityScreenViewModel;
}

export type ConversationEvent =
  | { type: 'START_PROMPT'; activityId: ActivityId; promptId: PromptId }
  | { type: 'TTS_SETTLED'; result: DeliveryResult }
  | { type: 'TIMER_ELAPSED'; elapsedMs: number }
  | { type: 'REPLAY_REQUESTED' }
  | { type: 'CLUE_REQUESTED'; targetId: FocusTargetId }
  | { type: 'MICROPHONE_STARTED' }
  | { type: 'MICROPHONE_STOPPED' }
  | { type: 'RECOGNITION_SETTLED'; result: RecognitionResult }
  | { type: 'SPEECH_FAILED'; failure: SpeechFailure }
  | { type: 'SKIP_REQUESTED' }
  | { type: 'BACK_REQUESTED' }
  | { type: 'CONTINUE_REQUESTED' }
  | { type: 'UNMOUNTED' };

export interface ConversationControllerDeps {
  activity: ActivityDefinition;
  scene: SceneAssetManifestEntry;
  speech: SpeechAdapter;
  classifySizeWords: ClassifySizeWords;
  sessionDispatch: SessionDispatch;
  getCelebrationIntensity(tier: ResponseTier):
    'gentle' | 'standard' | 'enhanced';
  now(): string;
  onBackReady(): void;
  onActivityCompletedReady(
    activityId: ActivityId,
    completedAt: string,
  ): Promise<void>;
}

export interface ConversationControllerResult {
  snapshot: ConversationSnapshot;
  actions: ActivityScreenActions;
}

export declare function useConversationController(
  deps: ConversationControllerDeps,
): ConversationControllerResult;
```

Timing is fixed: cue after 3s, reprompt after the next 6s, tap-to-help after the
next 10s, then a final 5s window. TTS pauses silence timing. Replay records one
tap but creates no prompt, attempt, progress, or reward. Back, Skip, error, and
unmount stop speech and timers before transition.

`TIMER_ELAPSED.elapsedMs` is accumulated unpaused silence within the current
listening window. It excludes TTS time and resets when that window changes.

`scaffoldStage` is `0` for the initial prompt/gentle cue, `1` after reprompt,
`2` after tap-to-help, and `3` in the final listening window. Role 5 returns
speech/classification results to Role 4; only Role 4 records prompt, attempt, and
delivery events.

Role 4 calls `onBackReady` only after speech/timer cleanup. It calls
`onActivityCompletedReady` only after cleanup and persisted
`ACTIVITY_COMPLETED`; Role 1 performs navigation/reward orchestration only from
these callbacks and never navigates directly from controller phase changes.

## 6. Session, persistence, and rewards

```ts
export type IsoTimestamp = string;
export type SessionMode = 'live' | 'fixture';
export type AttemptStatus =
  | 'captured' | 'no_match' | 'cancelled' | 'error' | 'mocked';

export interface SpeechAttempt {
  id: string;
  activityId: ActivityId;
  promptId: PromptId;
  promptText: string;
  transcript: string;
  normalizedTranscript: string;
  confidence: number | null;
  status: AttemptStatus;
  source: 'azure' | 'mock';
  errorCode: SpeechErrorCode | null;
  tier: ResponseTier | null;
  detectedKeywords: readonly SizeWordKeyword[];
  detectedPrimaryWords: readonly TargetAdjective[];
  isSpontaneous: boolean;
  scaffoldStage: 0 | 1 | 2 | 3;
  createdAt: IsoTimestamp;
}

export interface DeliveryEvent {
  id: string;
  operationId: SpeechOperationId;
  activityId: ActivityId;
  promptId: PromptId;
  kind: DeliveryKind;
  text: string;
  words: readonly SizeWordKeyword[];
  primaryWords: readonly TargetAdjective[];
  status: DeliveryStatus;
  completedAt: IsoTimestamp;
}

export interface PromptRecord {
  activityId: ActivityId;
  promptId: PromptId;
  promptText: string;
  openedAt: IsoTimestamp;
  closedAt: IsoTimestamp | null;
  closeReason: 'answered' | 'skipped' | 'timed_out' | 'error' | null;
  terminalAttemptId: string | null;
  scaffoldTapCount: number;
  replayTapCount: number;
}

export interface ActivityRecord {
  activityId: ActivityId;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
  durationMs: number;
}

export type RewardGrant =
  | { checkpointId: 'coin-after-activity-1'; activityId: 'activity-1';
      grantedAt: IsoTimestamp }
  | { checkpointId: 'coin-after-activity-3'; activityId: 'activity-3';
      grantedAt: IsoTimestamp }
  | { checkpointId: 'coin-after-activity-5'; activityId: 'activity-5';
      grantedAt: IsoTimestamp };

export interface ReportMetadata {
  childName: string;
  childAge: number;
  therapistName: string;
  therapistNote: string;
  nextStep: string;
}

export interface SessionState {
  schemaVersion: 1;
  mode: SessionMode;
  sessionId: string;
  unitId: 'size-words-unit';
  contentVersion: string;
  unitAttemptNumber: number;
  status: 'in_progress' | 'completed';
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp | null;
  activeActivityId: ActivityId | null;
  activityRecords: readonly ActivityRecord[];
  promptRecords: readonly PromptRecord[];
  attempts: readonly SpeechAttempt[];
  deliveries: readonly DeliveryEvent[];
  rewards: readonly RewardGrant[];
  reportMetadata: ReportMetadata;
}

export interface SessionStoreState {
  hydrationStatus: 'loading' | 'ready' | 'error';
  hydrationError: string | null;
  session: SessionState | null;
}

export type SessionEvent =
  | { type: 'UNIT_STARTED'; payload: {
      sessionId: string; mode: SessionMode; contentVersion: string;
      startedAt: IsoTimestamp; reportMetadata: ReportMetadata;
    } }
  | { type: 'ACTIVITY_STARTED'; payload: {
      activityId: ActivityId; startedAt: IsoTimestamp;
    } }
  | { type: 'ACTIVITY_COMPLETED'; payload: {
      activityId: ActivityId; completedAt: IsoTimestamp;
    } }
  | { type: 'PROMPT_OPENED'; payload: {
      activityId: ActivityId; promptId: PromptId;
      promptText: string; openedAt: IsoTimestamp;
    } }
  | { type: 'PROMPT_CLOSED'; payload: {
      activityId: ActivityId; promptId: PromptId; closedAt: IsoTimestamp;
      closeReason: NonNullable<PromptRecord['closeReason']>;
      terminalAttemptId: string | null;
    } }
  | { type: 'SCAFFOLD_TAPPED'; payload: {
      activityId: ActivityId; promptId: PromptId; createdAt: IsoTimestamp;
    } }
  | { type: 'REPLAY_TAPPED'; payload: {
      activityId: ActivityId; promptId: PromptId; createdAt: IsoTimestamp;
    } }
  | { type: 'ATTEMPT_RECORDED'; payload: { attempt: SpeechAttempt } }
  | { type: 'DELIVERY_RECORDED'; payload: { delivery: DeliveryEvent } }
  | { type: 'REWARD_GRANTED'; payload: { grant: RewardGrant } }
  | { type: 'REPORT_METADATA_UPDATED'; payload: Partial<ReportMetadata> }
  | { type: 'UNIT_COMPLETED'; payload: { completedAt: IsoTimestamp } }
  | { type: 'SESSION_RESET' };

export type SessionDispatch = (event: SessionEvent) => Promise<void>;

export interface SessionContextValue {
  store: SessionStoreState;
  dispatch: SessionDispatch;
}
```

Role 3 exposes the exact `SessionContextValue` above. Role 4 produces all
activity, prompt, scaffold, replay, attempt, and delivery events. Role 1 produces
unit start/reset/completion and dispatches unchanged Role 6 reward-policy output.
Role 6 produces report-metadata updates. Role 3 alone mutates/persists state and
computes counters/durations.

AsyncStorage keys are fixed as
`@funwattle/size-words/session/v1` and
`@funwattle/size-words/attempt-counter/v1`. `UNIT_STARTED` assigns and persists
the previous counter plus one. `SESSION_RESET` clears current progress without
changing the last assigned number. Invalid stored session data is discarded and
resolves to `ready` with `session: null` without crashing.

No stored session resolves to `{ hydrationStatus: 'ready', session: null }`.
Storage failure resolves to `error` with `hydrationError`; Role 1 must not start
a unit until the user retries or resets. A `captured`/`mocked` attempt has a
non-empty transcript and non-null Tier; other statuses have `tier: null`.
Live sessions contain only Azure attempts; fixture sessions contain only mock
attempts. Role 3 rejects events that would mix the two modes.

`isSpontaneous` is true only when no successful full-word `model` or `recast`
for that prompt completed before the attempt's `createdAt`. Duplicate delivery
events are rejected by `operationId`. Role 3 computes `durationMs` from the
recorded activity start/completion timestamps as non-negative wall-clock time,
including time away while that activity remains open.

Reward checkpoint mapping is immutable:

```ts
activity-1 -> coin-after-activity-1
activity-3 -> coin-after-activity-3
activity-5 -> coin-after-activity-5
```

Duplicate `REWARD_GRANTED` events for one checkpoint are ignored. Tier never
changes the number of coins.

Role 6 exports:

```ts
export type CelebrationIntensity = 'gentle' | 'standard' | 'enhanced';
export type GetPendingRewardGrant = (
  session: SessionState,
  activityId: ActivityId,
  grantedAt: IsoTimestamp,
) => RewardGrant | null;
export type GetCelebrationIntensity =
  (tier: ResponseTier) => CelebrationIntensity;
export interface RewardOverlayProps {
  grant: RewardGrant;
  earnedCoins: 1 | 2 | 3;
  onContinue(): void;
}
```

Intensity maps Tier 1 → `gentle`, Tier 2 → `standard`, Tier 3 → `enhanced`.
The integration order is fixed:

1. Role 4 dispatches and persists `ACTIVITY_COMPLETED`, cleans up, then calls
   `onActivityCompletedReady`.
2. In that callback, Role 1 calls `GetPendingRewardGrant` unchanged.
3. If non-null, Role 1 shows Role 6's reward UI. Continue dispatches the returned
   `REWARD_GRANTED` exactly once.
4. After the Activity 5 grant, Role 1 dispatches `UNIT_COMPLETED`, awaits
   persistence, then opens `/report?audience=parent`.
5. On restore, completed Activity 5 + existing final grant + incomplete unit
   goes directly through step 4. Completed Activity 1/3 + existing grant goes to
   the next activity.
6. Other activities without a pending grant continue to the next activity.

Role 1 owns only this orchestration. The checkpoint mapping and celebration
semantics remain Role 6's contract.

## 7. Report contract and formulas

Role 3 owns `src/types/metrics.types.ts` and session selectors:

```ts
export type WordLearningStatus = 'USED' | 'HEARD' | 'NOT_YET';

export interface WordEvidence {
  word: TargetAdjective;
  status: WordLearningStatus;
  examples: readonly string[];
  timesUsed: number;
  timesHeard: number;
}

export interface ActivityMetricsRow {
  activityId: ActivityId;
  scene: SceneAssetKey;
  promptsGiven: number;
  tier1: number;
  tier2: number;
  tier3: number;
  scaffoldsUsed: number;
}

export interface SessionMetrics {
  durationMs: number;
  totalUtterances: number;
  sizeWordUtterances: number;
  adjectiveUseRate: number | null;
  tierCounts: Record<ResponseTier, number>;
  scaffoldTaps: number;
  replayTaps: number;
  uniqueKeywords: readonly SizeWordKeyword[];
  wordEvidence: readonly WordEvidence[];
  readinessRate: number | null;
  activity5: { adjectiveUseRate: number | null; usedAllSix: boolean };
  activityRows: readonly ActivityMetricsRow[];
}

export type SelectSessionMetrics =
  (session: SessionState, unit: LearningUnitDefinition) => SessionMetrics;
```

Role 6 owns `src/types/report.types.ts`, report construction, and export:

```ts
export interface ReportViewModel {
  mode: SessionMode;
  header: {
    childName: string; childAge: number; therapistName: string;
    unitTitle: string; completionDate: string; durationMs: number;
    unitAttemptNumber: number;
  };
  parent: {
    scenarioId: 'low' | 'developing' | 'ready' | 'strong';
    starRating: 1 | 2 | 3 | 4 | 5;
    summaryText: string;
    wordCards: readonly WordEvidence[];
    therapistNote: string;
    homeTip: { label: '5-minute activity' | 'anytime'; text: string };
  };
  therapist: {
    totalUtterances: number;
    sizeWordUtterances: number;
    adjectiveUseRate: number | null;
    tierCounts: Record<ResponseTier, number>;
    scaffoldTaps: number;
    replayTaps: number;
    uniqueKeywords: readonly SizeWordKeyword[];
    wordStats: readonly WordEvidence[];
    readinessRate: number | null;
    activity5: { adjectiveUseRate: number | null; usedAllSix: boolean };
    activityRows: readonly ActivityMetricsRow[];
    nextStep: string;
    ndisContext: string;
  };
}

export type BuildReportViewModel = (input: {
  session: SessionState;
  unit: LearningUnitDefinition;
  metrics: SessionMetrics;
}) => ReportViewModel;

export interface ReportExportAdapter {
  downloadPdf(viewModel: ReportViewModel, audience: 'parent' | 'therapist'):
    Promise<void>;
  sharePdf(viewModel: ReportViewModel, audience: 'parent' | 'therapist'):
    Promise<'shared' | 'downloaded'>;
}
```

Role 3 owns `SelectSessionMetrics`. Role 6 consumes that result and owns
`BuildReportViewModel`, the four deterministic scenarios, HTML rendering, and
`ReportExportAdapter`. Screen and PDF receive the same `ReportViewModel`.

Selectors use these rules:

| Metric | Rule |
| --- | --- |
| Valid utterance | Live: Azure `captured` + non-empty transcript. Fixture: `mocked` + non-empty transcript. Modes never mix. |
| Total utterances | Count valid utterances |
| Size Word utterances | Valid utterances with `detectedKeywords.length > 0` |
| Duration | Sum completed `ActivityRecord.durationMs`; excludes gaps between activities |
| Tier 1 | Valid noun/other response without a Size Word; never `no_match` |
| Tier counts | Valid utterances grouped by `tier` |
| Adjective-use rate | Valid Tier 2/3 utterances ÷ all valid utterances |
| Readiness | Eligible open prompts with terminal Tier 2/3 response ÷ eligible open prompts with a valid terminal response |
| `USED` | Spontaneous valid use before a full-word model/recast for that prompt |
| `HEARD` | Successful model/recast delivery, with no spontaneous use |
| `NOT_YET` | Neither `USED` nor `HEARD` |
| Times used | Spontaneous valid utterances containing that primary word, once per utterance |
| Times heard | Successful `recast` delivery events only |
| Scaffold/replay taps | Sum the separate counts on `PromptRecord` |
| Unique keywords | Distinct detected primary words and accepted synonyms across valid utterances |
| Activity row | Opened prompts, terminal Tier counts, and summed scaffold taps for that activity |
| Activity 5 | Same valid-utterance rate within Activity 5; `usedAllSix` checks only the six primary words |

Prompt-aware synonym matching supplies `detectedPrimaryWords`, so the six parent
cards remain stable while therapist `uniqueKeywords` may include all accepted
synonyms. Zero denominators return `null`, not `NaN` or 100%. `no_match`,
`cancelled`, `error`, and Skip are excluded. Activity 5 generalisation is
separate from readiness. Fixture reports are available for Role 6 development,
but production download/share rejects any view-model whose mode is not `live`.
`wordEvidence` is always ordered `big`, `small`, `tiny`, `huge`, `gigantic`,
`medium`.

## 8. Routes and integration rules

- Role 1 owns route shells: `/activity/[id]` and
  `/report?audience=parent|therapist`; valid activity route ids are the five
  `ActivityId` values.
- Routes select registry data and connect controller/session adapters only. They
  contain no activity-specific content, scoring, report formulas, or visual
  implementation.
- Routes render loading/error UI until Role 3 reports hydration `ready`; they do
  not start or overwrite a session while hydration is pending.
- Role 2 does not edit route orchestration. Roles 3–6 export adapters/hooks for
  Role 1 to wire.
- All roles keep mock/fixture adapters until integration passes.
- Actual value export names are fixed:

| Role | Exports |
| --- | --- |
| 2 | `ActivityScreen`, `MascotAnimator`, `RewardEffect`, `LoadingEffect`, `sizeWordSceneAssets` |
| 3 | `sizeWordsUnit`, `SessionProvider`, `useSession`, `selectSessionMetrics` |
| 4 | `useConversationController` |
| 5 | `createLiveAzureSpeechAdapter`, `createMockSpeechAdapter`, `classifySizeWords` |
| 6 | `getPendingRewardGrant`, `getCelebrationIntensity`, `RewardOverlay`, `buildReportViewModel`, `reportExportAdapter` |

- Contract implementation is complete when `npx tsc --noEmit` passes and tests
  cover compound prompt identity, stale speech results, replay idempotency,
  fixed rewards, readiness, persistence, and matching screen/PDF metrics.
