import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ActivityScreen } from '@/components/activity';
import { SessionStateInspector } from '@/components/dev';
import { createDevelopmentMockAttempt } from '@/demo/createDevelopmentMockAttempt';
import type { Activity1DemoOutcome, Activity1DemoState } from '@/demo/useActivity1DemoFlow';
import { useActivity1DemoFlow } from '@/demo/useActivity1DemoFlow';
import {
  activity01Definition,
  activity01DevelopmentFixture,
  activity01SessionSeed,
  toActivity01DemoCopy,
} from '@/fixtures/activity-01.fixture';
import { speakKoolPrompt, stopKoolSpeech } from '@/services/koolSpeech';
import { useSession } from '@/session';
import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

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
    id?: string | string[];
    demoState?: string | string[];
    outcome?: string | string[];
  }>();

  const router = useRouter();
  const { dispatch, resetSession } = useSession();

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);

  const sessionStartedRef = useRef(false);
  const sessionCompletedRef = useRef(false);
  const scaffoldUsedRef = useRef(false);

  const activityId = firstParam(params.id);
  const requestedState = asDemoState(firstParam(params.demoState));
  const outcome: Activity1DemoOutcome =
    firstParam(params.outcome) === 'retry' ? 'retry' : 'success';

  const prompt = activity01Definition.prompts[selectedPromptIndex];
  const demoCopy = useMemo(() => toActivity01DemoCopy(prompt), [prompt]);

  const startSession = useCallback(() => {
    const startedAt = new Date().toISOString();

    scaffoldUsedRef.current = false;
    sessionCompletedRef.current = false;

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

    dispatch({
      type: 'OPEN_PROMPT',
      activityId: activity01SessionSeed.activityId,
      promptId: prompt.id,
      promptText: prompt.koolPrompt,
      openedAt: startedAt,
    });
  }, [dispatch, prompt]);

  const handleResetSession = useCallback(() => {
    resetSession();
    startSession();
  }, [resetSession, startSession]);

  const handleMockOutcome = useCallback(
    (resolvedOutcome: Activity1DemoOutcome) => {
      const timestamp = new Date().toISOString();

      dispatch({
        type: 'RECORD_ATTEMPT',
        attempt: createDevelopmentMockAttempt({
          activityId: activity01SessionSeed.activityId,
          id: `${prompt.id}-${Date.now()}`,
          outcome: resolvedOutcome,
          prompt,
          scaffoldUsed: scaffoldUsedRef.current,
          timestamp,
        }),
      });
    },
    [dispatch, prompt],
  );

  const demo = useActivity1DemoFlow({
    initialState: requestedState ?? 'prompt',
    outcome,
    copy: demoCopy,
    onOutcomeResolved: handleMockOutcome,
  });

  const handleSelectQuestion = useCallback(
    (questionId: string) => {
      const nextPromptIndex = activity01Definition.prompts.findIndex(
        (candidate) => candidate.id === questionId,
      );

      if (nextPromptIndex < 0) return;

      const nextPrompt = activity01Definition.prompts[nextPromptIndex];
      const openedAt = new Date().toISOString();

      setSelectedPromptIndex(nextPromptIndex);

      scaffoldUsedRef.current = false;
      sessionCompletedRef.current = false;

      dispatch({
        type: 'OPEN_PROMPT',
        activityId: activity01SessionSeed.activityId,
        promptId: nextPrompt.id,
        promptText: nextPrompt.koolPrompt,
        openedAt,
      });

      demo.selectDevelopmentState('prompt');
    },
    [demo, dispatch],
  );

  const handleHelpPress = useCallback(() => {
    if (demo.state !== 'tapHelpAvailable') return;

    scaffoldUsedRef.current = true;

    dispatch({
      type: 'MARK_SCAFFOLD_USED',
      promptId: prompt.id,
    });

    demo.onHelpPress();
  }, [demo, dispatch, prompt.id]);

  useEffect(() => {
    if (sessionStartedRef.current) return;

    sessionStartedRef.current = true;
    startSession();
  }, [startSession]);

  useEffect(() => {
    if (demo.state !== 'complete' || sessionCompletedRef.current) return;

    sessionCompletedRef.current = true;

    dispatch({
      type: 'COMPLETE_SESSION',
      completedAt: new Date().toISOString(),
    });
  }, [demo.state, dispatch]);

  useEffect(() => {
    if (!demo.isSpeaking) {
      stopKoolSpeech();
      return undefined;
    }

    let isCurrentSpeech = true;

    // Kool is speaking, so this period should not count as child silence.
    demo.pauseFlowTimer();

    void speakKoolPrompt(demo.message, {
      onDone: () => {
        if (!isCurrentSpeech) return;

        // Kool has finished speaking, transition to listening phase and resume the silence timer.
        demo.startListeningAfterKoolSpeech();
        demo.resumeFlowTimer();
      },
      onError: () => {
        if (!isCurrentSpeech) return;

        // If TTS fails, transition to listening phase and resume the silence timer.
        demo.startListeningAfterKoolSpeech();
        demo.resumeFlowTimer();
      },
    });

    return () => {
      isCurrentSpeech = false;
      stopKoolSpeech();
    };
  }, [
    demo.isSpeaking,
    demo.message,
    demo.pauseFlowTimer,
    demo.resumeFlowTimer,
    demo.startListeningAfterKoolSpeech,
  ]);

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
    <ActivityScreen
      {...activity01DevelopmentFixture}
      activeHotspotId={demo.isHighlightingHelp ? prompt.hotspotId : undefined}
      completeActionLabel="View demo report"
      developmentControls={
        <View style={styles.developmentStack}>
          <DevelopmentStatePicker onSelect={demo.selectDevelopmentState} />
          <SessionStateInspector
            activeQuestionId={prompt.id}
            onResetSession={handleResetSession}
            onSelectQuestion={handleSelectQuestion}
            questions={activity01Definition.prompts}
          />
        </View>
      }
      isKoolSpeaking={demo.isSpeaking}
      koolMessage={demo.message}
      mascotState={demo.mascotState}
      microphoneState={demo.microphoneState}
      onCompletePress={() => router.push('/report?from=activityComplete')}
      onHotspotPress={handleHelpPress}
      onMicrophonePress={demo.onMicrophonePress}
      hotspots={demo.isHelpAvailable ? activity01DevelopmentFixture.hotspots : undefined}
      statusLine={demo.statusLine}
      visualState={demo.visualState}
    />
  );
}

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
  developmentStack: {
    gap: Spacing.two,
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
});

