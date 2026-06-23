import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { DimensionValue } from 'react-native';

import {
  FeedbackBubble,
  KoolDialogue,
  type KoolDialogueVariant,
  ListeningIndicator,
  type ListeningIndicatorState,
  MicrophoneButton,
  ProgressIndicator,
} from '@/components/child-ui';
import { ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

import type { ActivityHotspot, ActivityScreenProps, ActivityScreenVisualState } from './types';

type VisualStatePresentation = {
  dialogueVariant: KoolDialogueVariant;
  listeningState?: ListeningIndicatorState;
  statusText: string;
};

const visualStatePresentation: Record<ActivityScreenVisualState, VisualStatePresentation> = {
  prompt: { dialogueVariant: 'prompt', statusText: 'Ready for your answer' },
  listening: { dialogueVariant: 'prompt', listeningState: 'listening', statusText: 'Listening' },
  gentleCue: { dialogueVariant: 'gentle', listeningState: 'gentleCue', statusText: 'Here is a clue' },
  reprompt: { dialogueVariant: 'gentle', listeningState: 'reprompt', statusText: 'Try again' },
  tapHelpAvailable: { dialogueVariant: 'gentle', listeningState: 'tapHelpAvailable', statusText: 'Help is available' },
  finalListening: { dialogueVariant: 'prompt', listeningState: 'finalListening', statusText: 'One last try' },
  processing: { dialogueVariant: 'default', listeningState: 'processing', statusText: 'Thinking' },
  success: { dialogueVariant: 'default', statusText: 'Great work' },
  error: { dialogueVariant: 'gentle', listeningState: 'error', statusText: 'Try again' },
};

function toPercentage(value: number): DimensionValue {
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
  return `${safeValue * 100}%` as DimensionValue;
}

function HotspotOverlay({ hotspot, onPress }: { hotspot: ActivityHotspot; onPress: () => void }) {
  return (
    <Pressable
      accessibilityHint="Double tap to ask for a clue about this part of the picture."
      accessibilityLabel={`Picture clue: ${hotspot.label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.hotspot,
        {
          height: toPercentage(hotspot.height),
          left: toPercentage(hotspot.x),
          top: toPercentage(hotspot.y),
          width: toPercentage(hotspot.width),
        },
        pressed && styles.hotspotPressed,
      ]}>
      <Text numberOfLines={2} style={styles.hotspotLabel}>
        {hotspot.label}
      </Text>
    </Pressable>
  );
}

export function ActivityScreen({
  activityId,
  title,
  sceneSource,
  koolMessage,
  currentActivity,
  totalActivities,
  visualState,
  microphoneState,
  feedback,
  hotspots,
  onMicrophonePress,
  onHotspotPress,
}: ActivityScreenProps) {
  const { width } = useWindowDimensions();
  const presentation = visualStatePresentation[visualState];
  const isWideLayout = width >= 720;
  const showHotspots = Boolean(hotspots?.length && onHotspotPress);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.status}>{presentation.statusText}</Text>
            <ProgressIndicator currentActivity={currentActivity} totalActivities={totalActivities} />
          </View>

          <KoolDialogue message={koolMessage} variant={presentation.dialogueVariant} />

          <View accessibilityLabel={`${title} picture`} style={styles.sceneFrame}>
            <Image accessible accessibilityLabel={`${title} scene`} resizeMode="contain" source={sceneSource} style={styles.sceneImage} />
            {showHotspots ? (
              <View pointerEvents="box-none" style={styles.hotspotLayer}>
                {hotspots?.map((hotspot) => (
                  <HotspotOverlay key={hotspot.id} hotspot={hotspot} onPress={() => onHotspotPress?.(hotspot.id)} />
                ))}
              </View>
            ) : null}
          </View>

          <View style={[styles.controls, isWideLayout && styles.controlsWide]}>
            {presentation.listeningState ? (
              <View style={styles.controlItem}>
                <ListeningIndicator state={presentation.listeningState} />
              </View>
            ) : null}
            <View style={styles.controlItem}>
              <MicrophoneButton onPress={onMicrophonePress} state={microphoneState} />
            </View>
          </View>

          {feedback ? <FeedbackBubble message={feedback.message} title={feedback.title} variant={feedback.variant} /> : null}

          <Text accessibilityLabel={`Activity identifier ${activityId}`} style={styles.activityIdentifier}>
            Activity {activityId}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    maxWidth: ComponentSizes.contentMaxWidth,
    width: '100%',
  },
  heading: {
    gap: Spacing.one,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
  },
  status: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
  },
  sceneFrame: {
    aspectRatio: 1.5,
    backgroundColor: SemanticColors.surface,
    borderColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.large,
    borderWidth: Spacing.half,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  sceneImage: {
    height: '100%',
    width: '100%',
  },
  hotspotLayer: {
    ...StyleSheet.absoluteFill,
  },
  hotspot: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 249, 241, 0.65)',
    borderColor: SemanticColors.focus,
    borderRadius: Radii.medium,
    borderWidth: Spacing.half,
    justifyContent: 'center',
    padding: Spacing.one,
    position: 'absolute',
  },
  hotspotPressed: {
    backgroundColor: 'rgba(255, 240, 217, 0.9)',
  },
  hotspotLabel: {
    ...Typography.label,
    color: SemanticColors.primaryText,
    textAlign: 'center',
  },
  controls: {
    gap: Spacing.two,
  },
  controlsWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
  },
  controlItem: {
    flex: 1,
  },
  activityIdentifier: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
});
