import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';

import { ActivityScreen } from '@/components/activity';
import { appRoutes } from '@/config/app-config';
import { clientUiAssets } from '@/constants/client-assets';
import type { Activity1DemoState } from '@/demo/useActivity1DemoFlow';
import { useActivity1DemoFlow } from '@/demo/useActivity1DemoFlow';
import {
  activity01Definition,
  activity01DevelopmentFixture,
  activity01SessionSeed,
  toActivity01DemoCopy,
} from '@/fixtures/activity-01.fixture';
import { primeKoolVoice, speakKoolPrompt, stopKoolSpeech } from '@/services/koolSpeech';
import { createAudioLevelMeter, type AudioLevelMeter } from '@/services/sprint1AudioLevel';
import {
  captureManualFallback,
  startSprint1Capture,
  type Sprint1CaptureHandle,
  type Sprint1SpeechAlternative,
} from '@/services/sprint1SpeechRecognition';
import { useSession } from '@/session';
import { BrandColors, Radii, scale, SemanticColors, Spacing, Typography } from '@/theme';
import type { TranscriptSource } from '@/types/session.types';
import { buildActivitySpeechAttempt, formatResponseTier } from '@/utils/activity-response';

const developmentStates: Activity1DemoState[] = [
  'prompt',
  'listening',
  'gentleCue',
  'reprompt',
  'tapHelpAvailable',
  'cluePresented',
  'finalListening',
  'processing',
  'success',
  'retry',
  'complete',
];

// States where the child is expected to speak, so press-and-hold may capture.
// Kool-speaking states (prompt/reprompt/cluePresented) are intentionally
// excluded — the mic is disabled while Kool talks.
const holdCaptureStates: Activity1DemoState[] = [
  'listening',
  'gentleCue',
  'tapHelpAvailable',
  'finalListening',
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asDemoState(value: string | undefined): Activity1DemoState | undefined {
  return developmentStates.includes(value as Activity1DemoState)
    ? (value as Activity1DemoState)
    : undefined;
}

function DevelopmentStatePicker({
  onSelect,
}: {
  onSelect: (state: Activity1DemoState) => void;
}) {
  if (!__DEV__) return null;

  return (
    <View
      accessibilityLabel="Development-only Activity 1 state controls"
      style={styles.developmentControls}>
      <Text style={styles.developmentTitle}>Demo controls</Text>
      <View style={styles.developmentButtons}>
        {developmentStates.map((state) => (
          <Pressable
            key={state}
            onPress={() => onSelect(state)}
            style={styles.developmentButton}>
            <Text style={styles.developmentButtonText}>{state}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ActivityRoute() {
  const params = useLocalSearchParams<{
    devControls?: string | string[];
    id?: string | string[];
    demoState?: string | string[];
  }>();

  const router = useRouter();
  const { dispatch } = useSession();

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [speechStatusLine, setSpeechStatusLine] = useState<string | null>(null);
  const [isCapturingSpeech, setIsCapturingSpeech] = useState(false);
  const [resultTierLabel, setResultTierLabel] = useState<string | null>(null);

  const sessionStartedRef = useRef(false);
  const sessionCompletedRef = useRef(false);
  const rewardCheckpointTriggeredRef = useRef(false);
  const scaffoldUsedRef = useRef(false);
  const autoAdvanceHandlerRef = useRef<(() => void) | null>(null);
  const routeTimerIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const captureHandleRef = useRef<Sprint1CaptureHandle | null>(null);
  const audioMeterRef = useRef<AudioLevelMeter | null>(null);
  const micLevel = useSharedValue(0);

  const stopAudioMeter = useCallback(() => {
    audioMeterRef.current?.stop();
    audioMeterRef.current = null;
    micLevel.set(0);
  }, [micLevel]);

  const activityId = firstParam(params.id);
  const requestedState = asDemoState(firstParam(params.demoState));
  const showDevelopmentControls = firstParam(params.devControls) === '1';

  const prompt = activity01Definition.prompts[selectedPromptIndex];
  const isLastPrompt = selectedPromptIndex === activity01Definition.prompts.length - 1;
  const promptProgressLine = `Question ${selectedPromptIndex + 1} of ${activity01Definition.prompts.length}`;
  const demoCopy = useMemo(() => toActivity01DemoCopy(prompt), [prompt]);

  // Tap-to-help points the child at the one object Kool is asking about, not
  // every object in the scene.
  const promptHotspot = useMemo(
    () =>
      activity01DevelopmentFixture.hotspots.find(
        (spot) => spot.id === prompt.hotspotId,
      ),
    [prompt.hotspotId],
  );

  const clearRouteTimers = useCallback(() => {
    routeTimerIds.current.forEach((timerId) => clearTimeout(timerId));
    routeTimerIds.current = [];
  }, []);

  const scheduleRouteTimer = useCallback((callback: () => void, delayMs: number) => {
    const timerId = setTimeout(() => {
      routeTimerIds.current = routeTimerIds.current.filter((candidate) => candidate !== timerId);
      callback();
    }, delayMs);
    routeTimerIds.current.push(timerId);
  }, []);

  const openPromptRecord = useCallback(
    (nextPrompt: typeof prompt, openedAt: string) => {
      dispatch({
        type: 'OPEN_PROMPT',
        activityId: activity01SessionSeed.activityId,
        promptId: nextPrompt.id,
        promptText: nextPrompt.koolPrompt,
        openedAt,
      });
    },
    [dispatch],
  );

  const startSession = useCallback(() => {
    const startedAt = new Date().toISOString();
    const firstPrompt = activity01Definition.prompts[0];

    scaffoldUsedRef.current = false;
    sessionCompletedRef.current = false;
    rewardCheckpointTriggeredRef.current = false;
    clearRouteTimers();
    setSelectedPromptIndex(0);
    setSpeechStatusLine(null);
    setShowRewardModal(false);

    dispatch({
      type: 'START_SESSION',
      sessionId: `activity-1-${Date.now()}`,
      unitId: activity01SessionSeed.unitId,
      contentVersion: activity01SessionSeed.contentVersion,
      startedAt,
    });

    dispatch({
      type: 'SET_ACTIVE_ACTIVITY',
      activityId: activity01SessionSeed.activityId,
    });

    openPromptRecord(firstPrompt, startedAt);
  }, [clearRouteTimers, dispatch, openPromptRecord]);

  const demo = useActivity1DemoFlow({
    initialState: requestedState ?? 'intro',
    copy: demoCopy,
    onAutoAdvance: () => autoAdvanceHandlerRef.current?.(),
  });

  const advanceToPrompt = useCallback(
    (nextPromptIndex: number) => {
      const nextPrompt = activity01Definition.prompts[nextPromptIndex];
      if (!nextPrompt) return;

      scaffoldUsedRef.current = false;
      setSpeechStatusLine(null);
      setResultTierLabel(null);
      setSelectedPromptIndex(nextPromptIndex);
      openPromptRecord(nextPrompt, new Date().toISOString());
      demo.selectDevelopmentState('prompt');
    },
    [demo, openPromptRecord],
  );

  const completeActivityAfterReward = useCallback(() => {
    setShowRewardModal(false);
    demo.selectDevelopmentState('complete');
  }, [demo]);

  const triggerCoinCheckpoint = useCallback(() => {
    if (rewardCheckpointTriggeredRef.current) return;
    rewardCheckpointTriggeredRef.current = true;

    const coinMessage = activity01Definition.rewardCheckpoint?.koolMessage;
    if (coinMessage) {
      void speakKoolPrompt(coinMessage);
    }
    setShowRewardModal(true);
  }, []);

  const handleSpeechAttemptResult = useCallback(
    (
      transcript: string,
      source: TranscriptSource,
      confidence: number | null,
      alternatives: readonly Sprint1SpeechAlternative[] = [],
    ) => {
      const timestamp = new Date().toISOString();
      const result = buildActivitySpeechAttempt({
        activityId: activity01SessionSeed.activityId,
        alternatives,
        confidence,
        id: `${prompt.id}-${Date.now()}`,
        prompt,
        scaffoldUsed: scaffoldUsedRef.current,
        source,
        timestamp,
        transcript,
      });
      const transcriptLabel = transcript.trim() ? `"${transcript.trim()}"` : 'no clear words';
      const tierLabel = formatResponseTier(result.attempt.tier);

      dispatch({
        type: 'RECORD_ATTEMPT',
        attempt: result.attempt,
      });

      if (!result.accepted) {
        setResultTierLabel(null);
        setSpeechStatusLine(`Heard ${transcriptLabel}.`);
        // Kool speaks the retry line; she re-asks the same prompt when she
        // finishes (handled in handleKoolSpeechDone).
        demo.selectDevelopmentState('retry');
        return;
      }

      setResultTierLabel(tierLabel);
      setSpeechStatusLine(`Heard ${transcriptLabel}`);
      // Kool speaks the recast; advancing / the coin happens when she finishes.
      demo.selectDevelopmentState('success');
    },
    [demo, dispatch, prompt],
  );

  // Shared "keep the demo moving" path for both silence auto-advance and the
  // manual Skip button. Records a clearly non-scoring (cancelled) attempt for
  // the current prompt, then moves on to the next prompt or the coin/report.
  const advancePastCurrentPrompt = useCallback(
    (statusLine: string, idSuffix: string) => {
      captureHandleRef.current?.abort();
      captureHandleRef.current = null;
      stopAudioMeter();
      setIsCapturingSpeech(false);
      clearRouteTimers();
      demo.clearTimers();

      const timestamp = new Date().toISOString();
      const result = buildActivitySpeechAttempt({
        activityId: activity01SessionSeed.activityId,
        confidence: null,
        id: `${prompt.id}-${idSuffix}-${Date.now()}`,
        prompt,
        scaffoldUsed: scaffoldUsedRef.current,
        source: 'web',
        timestamp,
        transcript: '',
      });

      dispatch({
        type: 'RECORD_ATTEMPT',
        attempt: {
          ...result.attempt,
          status: 'cancelled',
        },
      });

      setResultTierLabel(null);
      setSpeechStatusLine(statusLine);

      if (isLastPrompt) {
        scheduleRouteTimer(triggerCoinCheckpoint, 700);
        return;
      }

      scheduleRouteTimer(() => {
        advanceToPrompt(selectedPromptIndex + 1);
      }, 900);
    },
    [
      advanceToPrompt,
      clearRouteTimers,
      demo,
      dispatch,
      isLastPrompt,
      prompt,
      scheduleRouteTimer,
      selectedPromptIndex,
      stopAudioMeter,
      triggerCoinCheckpoint,
    ],
  );

  const handleSilentAutoAdvance = useCallback(() => {
    advancePastCurrentPrompt('No answer heard. Moving on.', 'silent');
  }, [advancePastCurrentPrompt]);

  const handleSkipPress = useCallback(() => {
    advancePastCurrentPrompt('Skipped. Moving on.', 'skip');
  }, [advancePastCurrentPrompt]);

  useEffect(() => {
    autoAdvanceHandlerRef.current = handleSilentAutoAdvance;
  }, [handleSilentAutoAdvance]);

  // Press-and-hold to talk: capture starts on press, stops on release. Holding
  // the whole utterance window is what stops Chrome truncating the noun.
  const handleHoldStart = useCallback(() => {
    if (isCapturingSpeech || captureHandleRef.current) return;
    if (!holdCaptureStates.includes(demo.state)) return;

    clearRouteTimers();
    demo.pauseFlowTimer();
    captureHandleRef.current = startSprint1Capture();

    // Cosmetic mic waveform: drive it from the live audio level while holding.
    const meter = createAudioLevelMeter((level) => {
      micLevel.set(level);
    });
    audioMeterRef.current = meter;
    void meter.start();

    setIsCapturingSpeech(true);
    setResultTierLabel(null);
    setSpeechStatusLine('Listening… keep talking, then let go.');
  }, [clearRouteTimers, demo, isCapturingSpeech, micLevel]);

  const handleHoldEnd = useCallback(async () => {
    const handle = captureHandleRef.current;
    if (!handle) return;
    captureHandleRef.current = null;
    stopAudioMeter();

    demo.selectDevelopmentState('processing');

    try {
      const speechResult = await handle.stop();
      setIsCapturingSpeech(false);

      if (!speechResult.transcript.trim()) {
        setSpeechStatusLine('I didn’t catch that. Hold the button and tell me.');
        demo.selectDevelopmentState('listening');
        return;
      }

      handleSpeechAttemptResult(
        speechResult.transcript,
        speechResult.source,
        speechResult.confidence,
        speechResult.alternatives,
      );
    } catch (error) {
      setIsCapturingSpeech(false);

      // Dev-only typed fallback so a flaky mic never blocks an inspection run.
      const fallback = captureManualFallback({ allowManualFallback: showDevelopmentControls });
      if (fallback) {
        handleSpeechAttemptResult(
          fallback.transcript,
          fallback.source,
          fallback.confidence,
          fallback.alternatives,
        );
        return;
      }

      const message = error instanceof Error ? error.message : 'Speech recognition is unavailable.';
      demo.selectDevelopmentState('retry');
      setSpeechStatusLine(`${message} Use Chrome web for the most stable Sprint 1 voice demo.`);
    }
  }, [demo, handleSpeechAttemptResult, showDevelopmentControls, stopAudioMeter]);

  const handleHelpPress = useCallback(() => {
    if (demo.state !== 'tapHelpAvailable') return;

    scaffoldUsedRef.current = true;

    dispatch({
      type: 'MARK_SCAFFOLD_USED',
      promptId: prompt.id,
    });

    demo.onHelpPress();
  }, [demo, dispatch, prompt.id]);

  // What happens after each Kool line finishes depends on what she just said.
  const handleKoolSpeechDone = useCallback(() => {
    const currentState = demo.state;

    if (currentState === 'intro') {
      // Intro greeting done — begin the first question.
      demo.selectDevelopmentState('prompt');
      return;
    }

    if (currentState === 'success') {
      // Recast done — let it land for a beat, then advance (or show the coin).
      scheduleRouteTimer(() => {
        if (isLastPrompt) {
          triggerCoinCheckpoint();
        } else {
          advanceToPrompt(selectedPromptIndex + 1);
        }
      }, 500);
      return;
    }

    if (currentState === 'retry') {
      // Retry line done — re-ask the same prompt.
      setSpeechStatusLine(null);
      demo.selectDevelopmentState('prompt');
      return;
    }

    // prompt / reprompt / cluePresented: Kool finished asking, start listening.
    demo.startListeningAfterKoolSpeech();
    demo.resumeFlowTimer();
  }, [
    advanceToPrompt,
    demo,
    isLastPrompt,
    scheduleRouteTimer,
    selectedPromptIndex,
    triggerCoinCheckpoint,
  ]);

  const koolSpeechDoneRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    koolSpeechDoneRef.current = handleKoolSpeechDone;
  }, [handleKoolSpeechDone]);

  const { isSpeaking: isDemoSpeaking, message: demoMessage, pauseFlowTimer } = demo;

  useEffect(() => {
    if (sessionStartedRef.current) return;

    sessionStartedRef.current = true;
    startSession();
  }, [startSession]);

  useEffect(() => clearRouteTimers, [clearRouteTimers]);

  useEffect(() => {
    // Resolve a natural TTS voice early so Kool's first line already sounds warm.
    primeKoolVoice();
  }, []);

  useEffect(
    () => () => {
      captureHandleRef.current?.abort();
      captureHandleRef.current = null;
      stopAudioMeter();
    },
    [stopAudioMeter],
  );

  useEffect(() => {
    if (demo.state !== 'complete' || sessionCompletedRef.current) return;

    sessionCompletedRef.current = true;

    dispatch({
      type: 'COMPLETE_SESSION',
      completedAt: new Date().toISOString(),
    });
  }, [demo.state, dispatch]);

  useEffect(() => {
    if (!isDemoSpeaking) {
      stopKoolSpeech();
      return undefined;
    }

    let isCurrentSpeech = true;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    // Kool is speaking, so this period should not count as child silence.
    pauseFlowTimer();

    const settle = () => {
      if (!isCurrentSpeech) return;
      isCurrentSpeech = false;
      clearTimeout(fallbackTimer);
      // Branch on the current state (intro/prompt/recast/retry) to decide what
      // comes after the line finishes.
      koolSpeechDoneRef.current();
    };

    // Safety net: web TTS sometimes never reports completion; keep the flow moving.
    fallbackTimer = setTimeout(settle, 8000);

    void speakKoolPrompt(demoMessage, { onDone: settle, onError: settle });

    return () => {
      isCurrentSpeech = false;
      clearTimeout(fallbackTimer);
      stopKoolSpeech();
    };
  }, [demoMessage, isDemoSpeaking, pauseFlowTimer]);

  const activityStatusLine = speechStatusLine
    ? `${promptProgressLine} · ${speechStatusLine}`
    : demo.statusLine
      ? `${promptProgressLine} · ${demo.statusLine}`
      : promptProgressLine;
  // Only show the live "Listening…" mic while actually holding. When the child
  // is merely expected to speak, show the "Hold to talk" ready state so the mic
  // never looks like it is recording when it is not.
  const microphoneState = isCapturingSpeech
    ? 'listening'
    : holdCaptureStates.includes(demo.state)
      ? 'idle'
      : demo.microphoneState;

  if (activityId !== '1') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.notFound}>
          <Text accessibilityRole="header" style={styles.title}>
            Activity not found
          </Text>
          <Text style={styles.message}>This activity is not available yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <ActivityScreen
        {...activity01DevelopmentFixture}
        activeHotspotId={demo.isHighlightingHelp ? prompt.hotspotId : undefined}
        completeActionLabel="View demo report"
        developmentControls={showDevelopmentControls ? <DevelopmentStatePicker onSelect={demo.selectDevelopmentState} /> : undefined}
        isKoolSpeaking={demo.isSpeaking}
        koolMessage={demo.message}
        mascotState={demo.mascotState}
        microphoneState={microphoneState}
        onBackPress={() => router.replace(appRoutes.home)}
        onCompletePress={() => router.push(appRoutes.reportFromActivityComplete)}
        onHotspotPress={handleHelpPress}
        onMicrophonePressIn={handleHoldStart}
        onMicrophonePressOut={handleHoldEnd}
        onSkipPress={handleSkipPress}
        hotspots={demo.isHelpAvailable && promptHotspot ? [promptHotspot] : undefined}
        statusLine={activityStatusLine}
        tierBadge={resultTierLabel ?? undefined}
        audioLevel={micLevel}
        visualState={demo.visualState}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setShowRewardModal(false)}
        transparent
        visible={showRewardModal}>
        <View style={styles.rewardOverlay}>
          <View
            accessibilityLabel={`Reward unlocked. ${activity01Definition.rewardCheckpoint?.koolMessage}`}
            accessibilityRole="alert"
            style={styles.rewardCard}>
            <Image
              accessible={false}
              resizeMode="contain"
              source={clientUiAssets.successCelebration.source}
              style={styles.rewardIcon}
            />
            <Text style={styles.rewardTitle}>Coin earned!</Text>
            <Pressable
              accessibilityRole="button"
              onPress={completeActivityAfterReward}
              style={styles.rewardButton}>
              <Text style={styles.rewardButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const rewardImageHeight = scale(220);

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  notFound: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
  developmentControls: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.medium,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.two,
  },
  developmentTitle: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  developmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  developmentButton: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.small,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.two,
  },
  developmentButtonText: {
    color: SemanticColors.primaryText,
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 14,
    lineHeight: 18,
  },
  rewardOverlay: {
    alignItems: 'center',
    backgroundColor: SemanticColors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  rewardCard: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.tangerine,
    borderRadius: Radii.large,
    borderWidth: 3,
    gap: Spacing.two,
    maxWidth: 360,
    padding: Spacing.three,
    width: '100%',
  },
  rewardIcon: {
    aspectRatio: 281 / 510,
    height: rewardImageHeight,
  },
  rewardTitle: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
    textAlign: 'center',
  },
  rewardButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  rewardButtonText: {
    ...Typography.button,
    color: SemanticColors.primaryText,
  },
});
