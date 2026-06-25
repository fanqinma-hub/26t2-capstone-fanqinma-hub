import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { DimensionValue } from 'react-native';

import { KoolDialogue, KoolMascot, type KoolDialogueVariant, type KoolMascotState, MicrophoneButton, ProgressIndicator } from '@/components/child-ui';
import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

import type { ActivityHotspot, ActivityScreenProps, ActivityScreenVisualState } from './types';

export type ActivityScreenVisualStatePresentation = {
  dialogueVariant?: KoolDialogueVariant;
  previewLabel: string;
  showHotspots?: boolean;
  showMicrophone?: boolean;
};

export const activityScreenVisualStatePresentation: Record<ActivityScreenVisualState, ActivityScreenVisualStatePresentation> = {
  prompt: { dialogueVariant: 'prompt', previewLabel: 'Ready for your answer' },
  listening: { dialogueVariant: 'prompt', previewLabel: 'Listening' },
  gentleCue: { dialogueVariant: 'gentle', previewLabel: 'Here is a clue' },
  reprompt: { dialogueVariant: 'gentle', previewLabel: 'Try again' },
  tapHelpAvailable: { dialogueVariant: 'gentle', previewLabel: 'Help is available', showHotspots: true },
  cluePresented: { dialogueVariant: 'gentle', previewLabel: 'Clue presented' },
  finalListening: { dialogueVariant: 'prompt', previewLabel: 'One last try' },
  processing: { dialogueVariant: 'default', previewLabel: 'Thinking' },
  success: { dialogueVariant: 'prompt', previewLabel: 'Great work', showMicrophone: false },
  retry: { dialogueVariant: 'gentle', previewLabel: 'Try again' },
  complete: { dialogueVariant: 'prompt', previewLabel: 'Activity complete', showMicrophone: false },
  error: { dialogueVariant: 'gentle', previewLabel: 'Try again' },
};

const mascotByVisualState: Record<ActivityScreenVisualState, KoolMascotState> = {
  prompt: 'speaking',
  listening: 'listening',
  gentleCue: 'speaking',
  reprompt: 'speaking',
  tapHelpAvailable: 'idle',
  cluePresented: 'speaking',
  finalListening: 'speaking',
  processing: 'thinking',
  success: 'success',
  retry: 'retry',
  complete: 'success',
  error: 'retry',
};

function toPercentage(value: number): DimensionValue {
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
  return `${safeValue * 100}%` as DimensionValue;
}

function HotspotOverlay({ hotspot, onPress }: { hotspot: ActivityHotspot; onPress: () => void }) {
  return (
    <Pressable
      accessibilityHint="Double tap to ask Kool for a clue about this part of the picture."
      accessibilityLabel={`Picture clue: ${hotspot.label}`}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hotspot,
        {
          left: toPercentage(hotspot.x + hotspot.width / 2),
          top: toPercentage(hotspot.y + hotspot.height / 2),
        },
        pressed && styles.hotspotPressed,
      ]}>
      <Text style={styles.hotspotQuestion}>?</Text>
    </Pressable>
  );
}

function HighlightedObject({ hotspot }: { hotspot: ActivityHotspot }) {
  return (
    <View
      style={[
        styles.objectHighlight,
        {
          height: toPercentage(hotspot.height),
          left: toPercentage(hotspot.x),
          top: toPercentage(hotspot.y),
          width: toPercentage(hotspot.width),
          pointerEvents: 'none',
        },
      ]}
    />
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
  mascotState,
  isKoolSpeaking,
  statusLine,
  hotspots,
  activeHotspotId,
  onMicrophonePress,
  onHotspotPress,
  onCompletePress,
  completeActionLabel = 'View demo report',
  developmentControls,
}: ActivityScreenProps) {
  const presentation = activityScreenVisualStatePresentation[visualState];
  const showHotspots = Boolean(presentation.showHotspots && hotspots?.length && onHotspotPress);
  const showMicrophone = presentation.showMicrophone ?? true;
  const resolvedMascotState = mascotState ?? mascotByVisualState[visualState];

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

          <View accessibilityLabel={`${title} picture`} style={styles.sceneFrame}>
            <Image accessible accessibilityLabel={`${title} scene`} resizeMode="contain" source={sceneSource} style={styles.sceneImage} />
            {activeHotspotId
              ? hotspots?.filter((hotspot) => hotspot.id === activeHotspotId).map((hotspot) => <HighlightedObject hotspot={hotspot} key={hotspot.id} />)
              : null}
            {showHotspots ? (
              <View style={styles.hotspotLayer}>
                {hotspots?.map((hotspot) => (
                  <HotspotOverlay key={hotspot.id} hotspot={hotspot} onPress={() => onHotspotPress?.(hotspot.id)} />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.conversationZone}>
            <KoolMascot isSpeaking={isKoolSpeaking} size="medium" state={resolvedMascotState} />
            <View style={styles.conversationCopy}>
              {presentation.dialogueVariant ? <KoolDialogue message={koolMessage} variant={presentation.dialogueVariant} /> : null}
              {statusLine ? <Text accessibilityLiveRegion="polite" style={styles.statusLine}>{statusLine}</Text> : null}
              {showMicrophone ? (
                <View style={styles.microphoneControl}>
                  <MicrophoneButton layout="primary" onPress={onMicrophonePress} state={microphoneState} />
                </View>
              ) : null}
            </View>
          </View>

          {visualState === 'complete' && onCompletePress ? (
            <Pressable accessibilityRole="button" onPress={onCompletePress} style={styles.completeButton}>
              <Text style={styles.completeButtonText}>{completeActionLabel}</Text>
            </Pressable>
          ) : null}

          <Text accessibilityLabel={`Activity identifier ${activityId}`} style={styles.activityIdentifier}>
            Activity {activityId}
          </Text>
          {developmentControls}
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
    ...Typography.headingSmall,
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
    zIndex: 2,
  },
  hotspot: {
    alignItems: 'center',
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 3,
    height: ComponentSizes.minimumTouchTarget,
    justifyContent: 'center',
    position: 'absolute',
    transform: [{ translateX: -ComponentSizes.minimumTouchTarget / 2 }, { translateY: -ComponentSizes.minimumTouchTarget / 2 }],
    width: ComponentSizes.minimumTouchTarget,
  },
  hotspotPressed: {
    opacity: 0.76,
  },
  hotspotQuestion: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
  },
  objectHighlight: {
    borderColor: BrandColors.tangerine,
    borderRadius: Radii.medium,
    borderWidth: 4,
    boxShadow: `0px 0px 10px ${BrandColors.tangerine}`,
    position: 'absolute',
    zIndex: 1,
  },
  conversationZone: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  conversationCopy: {
    flex: 1,
    gap: Spacing.two,
    minWidth: 0,
  },
  microphoneControl: {
    alignSelf: 'flex-end',
  },
  statusLine: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: Spacing.four,
  },
  completeButtonText: {
    ...Typography.button,
    color: SemanticColors.primaryText,
  },
  activityIdentifier: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
});
