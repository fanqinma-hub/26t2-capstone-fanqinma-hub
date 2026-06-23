import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { DimensionValue } from 'react-native';

import {
  FeedbackBubble,
  type FeedbackBubbleVariant,
  KoolDialogue,
  type KoolDialogueVariant,
  ListeningIndicator,
  type ListeningIndicatorState,
  MicrophoneButton,
  ProgressIndicator,
} from '@/components/child-ui';
import { ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

import type { ActivityHotspot, ActivityScreenProps, ActivityScreenVisualState } from './types';

export type ActivityScreenVisualStatePresentation = {
  dialogueVariant?: KoolDialogueVariant;
  feedbackVariant?: FeedbackBubbleVariant;
  listeningState?: ListeningIndicatorState;
  previewLabel: string;
  showHotspots?: boolean;
  showMicrophone?: boolean;
};

export const activityScreenVisualStatePresentation: Record<ActivityScreenVisualState, ActivityScreenVisualStatePresentation> = {
  prompt: { dialogueVariant: 'prompt', previewLabel: 'Ready for your answer' },
  listening: { dialogueVariant: 'prompt', listeningState: 'listening', previewLabel: 'Listening' },
  gentleCue: { dialogueVariant: 'gentle', listeningState: 'gentleCue', previewLabel: 'Here is a clue' },
  reprompt: { dialogueVariant: 'gentle', listeningState: 'reprompt', previewLabel: 'Try again' },
  tapHelpAvailable: {
    dialogueVariant: 'gentle',
    listeningState: 'tapHelpAvailable',
    previewLabel: 'Help is available',
    showHotspots: true,
  },
  finalListening: { dialogueVariant: 'prompt', listeningState: 'finalListening', previewLabel: 'One last try' },
  processing: { dialogueVariant: 'default', listeningState: 'processing', previewLabel: 'Thinking' },
  success: { feedbackVariant: 'success', previewLabel: 'Great work', showMicrophone: false },
  error: { feedbackVariant: 'error', previewLabel: 'Try again' },
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
  const presentation = activityScreenVisualStatePresentation[visualState];
  const isWideLayout = width >= 720;
  const showHotspots = Boolean(presentation.showHotspots && hotspots?.length && onHotspotPress);
  const showMicrophone = presentation.showMicrophone ?? true;
  const shownFeedback = presentation.feedbackVariant && feedback?.variant === presentation.feedbackVariant ? feedback : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <ProgressIndicator currentActivity={currentActivity} totalActivities={totalActivities} />
          </View>

          {presentation.dialogueVariant ? <KoolDialogue message={koolMessage} variant={presentation.dialogueVariant} /> : null}

          <View accessibilityLabel={`${title} picture`} style={styles.sceneFrame}>
            <Image accessible accessibilityLabel={`${title} scene`} resizeMode="contain" source={sceneSource} style={styles.sceneImage} />
            {showHotspots ? (
              <View style={styles.hotspotLayer}>
                {hotspots?.map((hotspot) => (
                  <HotspotOverlay key={hotspot.id} hotspot={hotspot} onPress={() => onHotspotPress?.(hotspot.id)} />
                ))}
              </View>
            ) : null}
          </View>

          {presentation.listeningState || showMicrophone ? (
            <View style={[styles.controls, isWideLayout && styles.controlsWide]}>
              {presentation.listeningState ? (
                <View style={styles.controlItem}>
                  <ListeningIndicator state={presentation.listeningState} />
                </View>
              ) : null}
              {showMicrophone ? (
                <View style={styles.controlItem}>
                  <MicrophoneButton onPress={onMicrophonePress} state={microphoneState} />
                </View>
              ) : null}
            </View>
          ) : null}

          {shownFeedback ? <FeedbackBubble message={shownFeedback.message} title={shownFeedback.title} variant={shownFeedback.variant} /> : null}

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
    pointerEvents: 'box-none',
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
