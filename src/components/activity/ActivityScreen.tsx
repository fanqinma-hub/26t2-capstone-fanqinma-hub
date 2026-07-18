import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KoolDialogue, KoolMascot, type KoolDialogueVariant, type KoolMascotState, MicrophoneButton, ProgressIndicator } from '@/components/child-ui';
import { BrandColors, clamp, ComponentSizes, isTablet, moderateScale, Radii, SemanticColors, Spacing, Typography } from '@/theme';

import { ClueHotspot, SceneSpotlightOverlay } from './SceneInteractionOverlay';
import type { ActivityScreenProps, ActivityScreenVisualState } from './types';

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

const sceneAspectRatio = 1.5;

function getActivityTitle(title: string) {
  return title.replace(/^Activity\s+\d+:\s*/i, '').trim();
}

// Tier 3 is the warmest celebration, Tier 1 the most neutral.
function tierBadgeTone(label: string): { backgroundColor: string; color: string } {
  if (label.includes('3')) {
    return { backgroundColor: BrandColors.tangerine, color: SemanticColors.primaryText };
  }
  if (label.includes('2')) {
    return { backgroundColor: BrandColors.mimosa, color: SemanticColors.primaryText };
  }
  return { backgroundColor: SemanticColors.surfaceMuted, color: SemanticColors.secondaryText };
}

function getViewportLayout(width: number, height: number) {
  const availableWidth = Math.max(width, 320);
  const availableHeight = Math.max(height, 560);
  const compactPhone = availableWidth <= 390 || availableHeight <= 720;
  const phone = availableWidth < 700;
  const tablet = availableWidth >= 700 && availableWidth < 1100;
  const desktop = availableWidth >= 1100;
  const gap = compactPhone ? 6 : phone ? Spacing.two : 10;
  const paddingHorizontal = compactPhone ? 12 : phone ? Spacing.three : tablet ? Spacing.four : 28;
  const paddingVertical = compactPhone ? Spacing.two : phone ? 12 : Spacing.three;
  const dockHeight = compactPhone ? 150 : phone ? 168 : desktop ? 205 : 198;
  // Upper bound so the scene image never inflates absurdly on large screens. On
  // phones the frame width is the real limit (height = width / aspect ratio), so
  // any extra vertical space becomes balanced breathing room around the image.
  const maxSceneHeight = desktop ? 460 : tablet ? 420 : 360;

  const contentWidth = desktop
    ? clamp(availableWidth - paddingHorizontal * 2, 720, 940)
    : Math.min(availableWidth - paddingHorizontal * 2, tablet ? 760 : ComponentSizes.contentMaxWidth);

  return {
    compactPhone,
    desktop,
    gap,
    paddingHorizontal,
    paddingVertical,
    contentWidth,
    dockHeight,
    maxSceneHeight,
  };
}

// Largest aspect-ratio-correct frame that fits the measured scene area, capped
// so it does not over-inflate on big screens.
function fitScene(area: { width: number; height: number }, maxHeight: number) {
  const availableWidth = area.width || 0;
  const availableHeight = area.height || 0;
  const widthFromHeight = Math.min(availableHeight, maxHeight) * sceneAspectRatio;
  const frameWidth = Math.max(Math.min(availableWidth, widthFromHeight), 0);
  return { width: frameWidth, height: frameWidth / sceneAspectRatio };
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
  tierBadge,
  audioLevel,
  hotspots,
  activeHotspotId,
  onBackPress,
  onMicrophonePress,
  onMicrophonePressIn,
  onMicrophonePressOut,
  onSkipPress,
  onHotspotPress,
  onCompletePress,
  completeActionLabel = 'View demo report',
  developmentControls,
}: ActivityScreenProps) {
  const { width, height } = useWindowDimensions();
  const presentation = activityScreenVisualStatePresentation[visualState];
  const showHotspots = Boolean(presentation.showHotspots && hotspots?.length && onHotspotPress);
  const showMicrophone = presentation.showMicrophone ?? true;
  const resolvedMascotState = mascotState ?? mascotByVisualState[visualState];
  const layout = getViewportLayout(width, height);

  // The scene image is the elastic element: it takes whatever vertical space is
  // left after the (full, never-clipped) dialogue and the bottom dock, so Kool's
  // bubble can never be cut off and short screens just get a smaller picture.
  const [sceneArea, setSceneArea] = useState({ width: 0, height: 0 });
  const onSceneAreaLayout = (event: LayoutChangeEvent) => {
    const { width: areaWidth, height: areaHeight } = event.nativeEvent.layout;
    setSceneArea((previous) =>
      previous.width === areaWidth && previous.height === areaHeight
        ? previous
        : { width: areaWidth, height: areaHeight },
    );
  };
  const sceneFit = useMemo(
    () => fitScene(sceneArea, layout.maxSceneHeight),
    [sceneArea, layout.maxSceneHeight],
  );
  const activityTitle = getActivityTitle(title);
  const headingTitle = `Activity ${currentActivity} of ${totalActivities}: ${activityTitle}`;
  const mascotSize = layout.compactPhone ? 'small' : layout.desktop ? 'small' : isTablet ? 'medium' : 'small';
  const isComplete = visualState === 'complete';
  // Skip is a secondary "keep the demo moving" escape; hide it once the child
  // has succeeded or the activity is over.
  const showSkip = Boolean(onSkipPress) && visualState !== 'success' && !isComplete;
  const spotlightHotspots = activeHotspotId
    ? hotspots?.filter((hotspot) => hotspot.id === activeHotspotId) ?? []
    : showHotspots
      ? hotspots ?? []
      : [];

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.root,
          {
            paddingHorizontal: layout.paddingHorizontal,
            paddingVertical: layout.paddingVertical,
          },
        ]}>
        <View style={[styles.content, { maxWidth: layout.contentWidth, gap: layout.gap }]}>
          <View style={styles.heading}>
            <View style={styles.headingRow}>
              {onBackPress ? (
                <Pressable
                  accessibilityLabel="Go back to the learning unit"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={onBackPress}
                  style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
                  <Text style={styles.backButtonText}>{'<'}</Text>
                </Pressable>
              ) : null}
              <Text
                accessibilityRole="header"
                numberOfLines={layout.compactPhone ? 2 : 1}
                style={[styles.title, !isTablet && styles.titleCompact, layout.compactPhone && styles.titleMicro]}>
                {headingTitle}
              </Text>
              {showSkip ? (
                <Pressable
                  accessibilityHint="Move on to the next question without answering."
                  accessibilityLabel="Skip this question"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onSkipPress}
                  style={({ pressed }) => [styles.headerSkipButton, pressed && styles.skipButtonPressed]}>
                  <Text style={styles.headerSkipButtonText}>Skip ›</Text>
                </Pressable>
              ) : null}
            </View>
            <ProgressIndicator currentActivity={currentActivity} showLabel={false} totalActivities={totalActivities} />
          </View>

          <View style={styles.sceneArea} onLayout={onSceneAreaLayout}>
            <View
              accessibilityLabel={`${activityTitle} picture`}
              style={[styles.sceneFrame, { height: sceneFit.height, width: sceneFit.width }]}>
              <Image accessible accessibilityLabel={`${activityTitle} scene`} resizeMode="cover" source={sceneSource} style={styles.sceneImage} />
              {spotlightHotspots.length > 0 ? (
                <SceneSpotlightOverlay
                  rects={spotlightHotspots}
                  sceneSource={sceneSource}
                  showFrames={!showHotspots}
                />
              ) : null}
              {showHotspots ? (
                <View style={styles.hotspotLayer}>
                  {hotspots?.map((hotspot) => (
                    <ClueHotspot
                      key={hotspot.id}
                      label={hotspot.label}
                      onPress={() => onHotspotPress?.(hotspot.id)}
                      rect={hotspot}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {presentation.dialogueVariant ? (
            <KoolDialogue
              message={koolMessage}
              size={layout.compactPhone ? 'compact' : 'default'}
              variant={presentation.dialogueVariant}
            />
          ) : null}

          <View style={styles.dock}>
            {tierBadge ? (
              <View style={styles.tierBadgeRow}>
                <Text
                  accessibilityLabel={`Result: ${tierBadge}`}
                  accessibilityRole="text"
                  style={[styles.tierBadge, tierBadgeTone(tierBadge)]}>
                  {tierBadge}
                </Text>
              </View>
            ) : null}
            <View style={[styles.mascotMicRow, { minHeight: layout.dockHeight }]}>
              <KoolMascot isSpeaking={isKoolSpeaking} size={mascotSize} state={resolvedMascotState} />
              {showMicrophone ? (
                <MicrophoneButton
                  audioLevel={audioLevel}
                  layout="primary"
                  onPress={onMicrophonePress}
                  onPressIn={onMicrophonePressIn}
                  onPressOut={onMicrophonePressOut}
                  showLabel={!layout.compactPhone}
                  state={microphoneState}
                />
              ) : null}
            </View>

            {isComplete && onCompletePress ? (
              <Pressable accessibilityRole="button" onPress={onCompletePress} style={styles.completeButton}>
                <Text style={styles.completeButtonText}>{completeActionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {developmentControls ? (
          <ScrollView style={styles.devOverlay} contentContainerStyle={styles.devOverlayContent}>
            <Text accessibilityLabel={`Activity identifier ${activityId}`} style={styles.activityIdentifier}>
              Activity {activityId}
            </Text>
            {developmentControls}
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  root: {
    alignItems: 'center',
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    width: '100%',
  },
  sceneArea: {
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 0,
    width: '100%',
  },
  dock: {
    gap: Spacing.one,
    width: '100%',
  },
  tierBadgeRow: {
    alignItems: 'center',
  },
  tierBadge: {
    ...Typography.label,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  headerSkipButton: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  headerSkipButtonText: {
    ...Typography.bodySmall,
    color: SemanticColors.primaryText,
  },
  devOverlay: {
    backgroundColor: SemanticColors.background,
    borderColor: BrandColors.pewter,
    borderTopWidth: 1,
    maxHeight: 220,
    width: '100%',
  },
  devOverlayContent: {
    gap: Spacing.two,
    padding: Spacing.two,
  },
  heading: {
    gap: Spacing.one,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backButtonPressed: {
    opacity: 0.72,
  },
  backButtonText: {
    color: SemanticColors.primaryText,
    fontFamily: Typography.headingSmall.fontFamily,
    fontSize: 24,
    lineHeight: 28,
  },
  title: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
    flex: 1,
  },
  titleCompact: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(26),
  },
  titleMicro: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(23),
  },
  sceneFrame: {
    alignSelf: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.large,
    borderWidth: Spacing.half,
    overflow: 'hidden',
    position: 'relative',
  },
  sceneImage: {
    height: '100%',
    width: '100%',
  },
  hotspotLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
    zIndex: 2,
  },
  mascotMicRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
