import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ActivityScreen } from '@/components/activity';
import type { Activity1DemoOutcome, Activity1DemoState } from '@/demo/useActivity1DemoFlow';
import { useActivity1DemoFlow } from '@/demo/useActivity1DemoFlow';
import { activity01DevelopmentFixture } from '@/fixtures/activity-01.fixture';
import { speakKoolPrompt, stopKoolSpeech } from '@/services/koolSpeech';
import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

const developmentStates: Activity1DemoState[] = ['prompt', 'gentleCue', 'reprompt', 'tapHelpAvailable', 'listening', 'processing', 'success', 'retry', 'complete'];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asDemoState(value: string | undefined): Activity1DemoState | undefined {
  return developmentStates.includes(value as Activity1DemoState) ? (value as Activity1DemoState) : undefined;
}

function DevelopmentStatePicker({ onSelect }: { onSelect: (state: Activity1DemoState) => void }) {
  if (!__DEV__) return null;

  return (
    <View accessibilityLabel="Development-only Activity 1 state controls" style={styles.developmentControls}>
      <Text style={styles.developmentTitle}>Demo controls</Text>
      <View style={styles.developmentButtons}>
        {developmentStates.map((state) => (
          <Pressable key={state} onPress={() => onSelect(state)} style={styles.developmentButton}>
            <Text style={styles.developmentButtonText}>{state}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ActivityRoute() {
  const params = useLocalSearchParams<{ id?: string | string[]; demoState?: string | string[]; outcome?: string | string[] }>();
  const router = useRouter();
  const activityId = firstParam(params.id);
  const requestedState = asDemoState(firstParam(params.demoState));
  const outcome: Activity1DemoOutcome = firstParam(params.outcome) === 'retry' ? 'retry' : 'success';
  const demo = useActivity1DemoFlow({ initialState: requestedState ?? 'prompt', outcome });

  useEffect(() => {
    void speakKoolPrompt(demo.message);
    return stopKoolSpeech;
  }, [demo.message]);

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
      activeHotspotId={demo.isHighlightingHelp ? activity01DevelopmentFixture.hotspots[0].id : undefined}
      completeActionLabel="View demo report"
      developmentControls={<DevelopmentStatePicker onSelect={demo.selectDevelopmentState} />}
      isKoolSpeaking={demo.isSpeaking}
      koolMessage={demo.message}
      mascotState={demo.mascotState}
      microphoneState={demo.microphoneState}
      onCompletePress={() => router.push('/report')}
      onHotspotPress={demo.onHelpPress}
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
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
  },
  developmentButtonText: {
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    color: SemanticColors.primaryText,
  },
});
