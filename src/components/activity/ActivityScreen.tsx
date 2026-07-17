import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { DimensionValue, LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KoolDialogue, KoolMascot, type KoolDialogueVariant, type KoolMascotState, MicrophoneButton, ProgressIndicator } from '@/components/child-ui';
import { BrandColors, clamp, ComponentSizes, isTablet, moderateScale, Radii, scale, SemanticColors, Spacing, Typography } from '@/theme';

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

function HotspotOverlay({ hotspot, onPress }: { hotspot: ActivityHotspot; onPress: () => void }) {
  // Large objects (watermelon, pot) show the marker on their centre; small
  // objects (strawberry, teacup) show it just below so it never covers them.
  const isSmallObject = hotspot.width < 0.18 || hotspot.height < 0.2;
  const left = toPercentage(hotspot.x + hotspot.width / 2);
  const top = isSmallObject
    ? toPercentage(Math.min(hotspot.y + hotspot.height + 0.05, 0.94))
    : toPercentage(hotspot.y + hotspot.height / 2);
  const systemReducedMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [
      { translateX: -hotspotSize / 2 },
      { translateY: -hotspotSize / 2 },
      { scale: 0.96 + pulse.value * 0.04 },
    ],
  }));

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.set(1);

    if (systemReducedMotion) return () => undefined;

    pulse.set(withRepeat(
      withSequence(
        withTiming(0.72, { duration: 1100 }),
        withTiming(1, { duration: 1100 }),
      ),
      -1,
    ));

    return () => cancelAnimation(pulse);
  }, [pulse, systemReducedMotion]);

  return (
    <Animated.View style={[styles.hotspot, { left, top }, animatedStyle]}>
      <Pressable
        accessibilityHint="Double tap to ask Kool for a clue about this part of the picture."
        accessibilityLabel={`Picture clue: ${hotspot.label}`}
        accessibilityRole="button"
        hitSlop={12}
        onPress={onPress}
        style={({ pressed }) => [styles.hotspotButton, pressed && styles.hotspotPressed]}>
        <Text style={styles.hotspotQuestion}>?</Text>
      </Pressable>
    </Animated.View>
  );
}

function HighlightedObject({ hotspot }: { hotspot: ActivityHotspot }) {
  const systemReducedMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.55,
    transform: [{ scale: 0.98 + pulse.value * 0.04 }],
  }));

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.set(1);

    if (systemReducedMotion) return () => undefined;

    // Same breathing rhythm as the question-mark hotspot so the highlighted
    // object reads as "this is the one Kool means".
    pulse.set(withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1100 }),
        withTiming(1, { duration: 1100 }),
      ),
      -1,
    ));

    return () => cancelAnimation(pulse);
  }, [pulse, systemReducedMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.objectHighlight,
        {
          height: toPercentage(hotspot.height),
          left: toPercentage(hotspot.x),
          top: toPercentage(hotspot.y),
          width: toPercentage(hotspot.width),
        },
        animatedStyle,
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
            </View>
            <ProgressIndicator currentActivity={currentActivity} showLabel={false} totalActivities={totalActivities} />
          </View>

          <View style={styles.sceneArea} onLayout={onSceneAreaLayout}>
            <View
              accessibilityLabel={`${activityTitle} picture`}
              style={[styles.sceneFrame, { height: sceneFit.height, width: sceneFit.width }]}>
              <Image accessible accessibilityLabel={`${activityTitle} scene`} resizeMode="cover" source={sceneSource} style={styles.sceneImage} />
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
            {statusLine ? (
              <Text
                accessibilityLiveRegion="polite"
                numberOfLines={layout.compactPhone ? 2 : 1}
                style={[styles.statusLine, layout.compactPhone && styles.statusLineCompact]}>
                {statusLine}
              </Text>
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
            ) : showSkip ? (
              <View style={styles.skipRow}>
                <Pressable
                  accessibilityHint="Move on to the next question without answering."
                  accessibilityLabel="Skip this question"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onSkipPress}
                  style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}>
                  <Text style={styles.skipButtonText}>Skip ›</Text>
                </Pressable>
              </View>
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

const hotspotSize = scale(40);
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
  skipRow: {
    alignItems: 'flex-end',
  },
  skipButton: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipButtonText: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
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
  hotspot: {
    alignItems: 'center',
    height: hotspotSize,
    justifyContent: 'center',
    position: 'absolute',
    width: hotspotSize,
  },
  hotspotButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: '#1F1A17',
    borderRadius: Radii.pill,
    borderWidth: 3,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  hotspotPressed: {
    opacity: 0.6,
  },
  hotspotQuestion: {
    ...Typography.headingSmall,
    color: '#1F1A17',
  },
  objectHighlight: {
    backgroundColor: 'rgba(255, 146, 31, 0.22)',
    borderColor: BrandColors.tangerine,
    borderRadius: Radii.medium,
    borderWidth: 4,
    position: 'absolute',
    zIndex: 3,
  },
  mascotMicRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLine: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
  statusLineCompact: {
    fontSize: moderateScale(17),
    lineHeight: moderateScale(22),
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
