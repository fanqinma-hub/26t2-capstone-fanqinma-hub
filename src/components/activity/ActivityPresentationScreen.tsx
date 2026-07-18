import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import {
  getMicrophoneVisualCenterFromBottom,
  KoolDialogue,
  MASCOT_NECK_RATIO,
  MicrophoneButton,
  ProgressIndicator,
} from '@/components/child-ui';
import { MascotAnimator } from '@/components/mascot';
import { BrandColors, clamp, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';
import type {
  ActivityScreenActions,
  ActivityScreenViewModel,
  SceneAssetManifestEntry,
} from '@/types/visual.types';

import {
  getClueMarkerPositions,
  fitSceneFrameWidth,
  getSpotlightFrameRects,
  getSpotlightPhaseCount,
  resolveSpotlightPresentation,
} from './spotlight-geometry';
import {
  beginMicrophoneHold,
  endMicrophoneHold,
  isSceneContainerAccessible,
} from './activity-presentation-interactions';
import { ClueHotspot, SceneSpotlightOverlay } from './SceneInteractionOverlay';

export type ActivityPresentationScreenProps = Readonly<{
  viewModel: ActivityScreenViewModel;
  actions: ActivityScreenActions;
  scene: SceneAssetManifestEntry;
}>;

/**
 * Continuous responsive layout: every dimension is a clamped function of the
 * viewport, so neighbouring window sizes always produce neighbouring layouts
 * (no stepped breakpoints). The only discrete switch is the column-vs-row
 * arrangement for desktop and landscape-phone shapes.
 */
export function getFluidLayout(width: number, height: number) {
  const horizontal = width >= 960 || (height <= 560 && width >= 640);
  return {
    horizontal,
    compactTitle: width <= 430,
    compactDialogue: width <= 430 || (!horizontal && height <= 780),
    /**
     * The label costs ~38px of dock height. On very short portrait viewports
     * that space is better spent on the scene; the touch target is unaffected.
     */
    showMicLabel: horizontal || height >= 620,
    gap: clamp(Math.round(height * 0.014), 6, 14),
    pagePaddingH: clamp(Math.round(width * 0.035), 12, 28),
    pagePaddingV: clamp(Math.round(height * 0.016), 8, 20),
    /** Upper bound on the dialogue-to-dock breathing gap. */
    breatheMax: clamp(Math.round(height * 0.03), 6, 24),
    sceneMaxHeight: clamp(height * 0.46, 200, 620),
    mascotVisualHeight: clamp(Math.round(height * 0.19), 104, 232),
    micVisualSize: clamp(Math.round(height * 0.15), 84, 156),
    contentMaxWidth: horizontal ? 1440 : 820,
  };
}

function ActionButton({
  compact = false,
  disabled = false,
  label,
  onPress,
  tone = 'secondary',
}: Readonly<{
  compact?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
}>) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={compact ? 5 : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        compact && styles.actionButtonCompact,
        tone === 'primary' && styles.actionButtonPrimary,
        disabled && styles.actionButtonDisabled,
        pressed && !disabled && styles.actionButtonPressed,
      ]}>
      <Text style={[styles.actionButtonText, compact && styles.actionButtonTextCompact]}>{label}</Text>
    </Pressable>
  );
}

function SceneSpotlight({
  actions,
  scene,
  sceneWidth,
  viewModel,
}: Pick<ActivityPresentationScreenProps, 'actions' | 'scene' | 'viewModel'> & {
  sceneWidth?: number;
}) {
  const activeTargets = useMemo(
    () => viewModel.focusTargets.filter((target) => viewModel.activeFocusTargetIds.includes(target.id)),
    [viewModel.activeFocusTargetIds, viewModel.focusTargets],
  );
  const presentation = useMemo(
    () => resolveSpotlightPresentation(activeTargets.map((target) => target.rect)),
    [activeTargets],
  );
  const visibleRects = useMemo(() => {
    const finalPhase = Math.max(0, getSpotlightPhaseCount(presentation) - 1);
    return getSpotlightFrameRects(presentation, finalPhase);
  }, [presentation]);
  const clueTargets = activeTargets.length > 0 ? activeTargets : viewModel.focusTargets;
  const cluePositions = useMemo(
    () => getClueMarkerPositions(clueTargets.map((target) => target.rect)),
    [clueTargets],
  );

  return (
    <View
      accessible={isSceneContainerAccessible(viewModel.showClueTargets)}
      accessibilityLabel={scene.accessibilityLabel}
      style={[
        styles.sceneFrame,
        { aspectRatio: viewModel.sceneAspectRatio === '5:4' ? 5 / 4 : 3 / 2 },
        sceneWidth ? { width: sceneWidth } : null,
      ]}>
      <Image accessible={false} resizeMode="contain" source={scene.source} style={styles.sceneImage} />
      <SceneSpotlightOverlay
        rects={visibleRects}
        sceneSource={scene.source}
        showFrames={!viewModel.showClueTargets}
      />
      {viewModel.showClueTargets ? (
        <View style={[StyleSheet.absoluteFill, styles.clueLayer]}>
          {clueTargets.map((target, index) => (
            <ClueHotspot
              key={target.id}
              label={target.objectName}
              onPress={() => actions.onClue(target.id)}
              position={cluePositions[index]}
              rect={target.rect}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ActivityPresentationScreen({ viewModel, actions, scene }: ActivityPresentationScreenProps) {
  const { height, width } = useWindowDimensions();
  const reducedMotion = Boolean(useReducedMotion());
  const audioLevel = useSharedValue(viewModel.audioLevel);
  const fluid = getFluidLayout(width, height);
  const micEnabled = viewModel.canStartMicrophone || viewModel.canStopMicrophone;
  const sceneAspectRatio = viewModel.sceneAspectRatio === '5:4' ? 5 / 4 : 3 / 2;
  const [sceneArea, setSceneArea] = useState({ width: 0, height: 0 });
  const microphoneHoldActive = useRef(false);
  const fittedSceneWidth = useMemo(() => {
    const fitted = fitSceneFrameWidth(sceneArea, sceneAspectRatio);
    return Math.min(fitted, fluid.sceneMaxHeight * sceneAspectRatio);
  }, [fluid.sceneMaxHeight, sceneArea, sceneAspectRatio]);
  const questionLabel = `Question ${viewModel.questionProgress.current} of ${viewModel.questionProgress.total}`;
  const onSceneAreaLayout = (event: LayoutChangeEvent) => {
    const { width: areaWidth, height: areaHeight } = event.nativeEvent.layout;
    setSceneArea((previous) =>
      Math.abs(previous.width - areaWidth) < 0.5 && Math.abs(previous.height - areaHeight) < 0.5
        ? previous
        : { width: areaWidth, height: areaHeight },
    );
  };

  // Align the centre of the visible microphone badge with Kool's neckline.
  // Both boxes are visual boxes (see VisualArtwork), so this is pure geometry:
  // the row bottom-aligns Kool's feet and the button's bottom edge, the badge
  // centre sits `labelBlock + badge/2` above the button bottom, and the neck
  // sits `visualHeight * (1 - MASCOT_NECK_RATIO)` above the feet.
  const neckFromRowBottom = fluid.mascotVisualHeight * (1 - MASCOT_NECK_RATIO);
  const micCenterFromBottom = getMicrophoneVisualCenterFromBottom(fluid.micVisualSize, fluid.showMicLabel);
  const micLift = Math.max(0, Math.round(neckFromRowBottom - micCenterFromBottom));

  useEffect(() => {
    audioLevel.set(Math.max(0, Math.min(1, viewModel.audioLevel)));
  }, [audioLevel, viewModel.audioLevel]);

  const startMicrophoneHold = () => {
    beginMicrophoneHold(viewModel.canStartMicrophone, microphoneHoldActive, actions.onMicrophoneStart);
  };

  const stopMicrophoneHold = () => {
    endMicrophoneHold(viewModel.canStopMicrophone, microphoneHoldActive, actions.onMicrophoneStop);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.headerActions}>
        <View style={styles.headerPrimaryActions}>
          <ActionButton compact disabled={!viewModel.canBack} label="‹ Back" onPress={actions.onBack} />
          <ActionButton compact disabled={!viewModel.canReplay} label="↻ Replay" onPress={actions.onReplay} />
        </View>
        {viewModel.canSkip ? <ActionButton compact label="Skip ›" onPress={actions.onSkip} /> : null}
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.title, fluid.compactTitle && styles.titleCompact]}>
        Activity {viewModel.activityProgress.current} of 5: {viewModel.title}
      </Text>
      <ProgressIndicator
        currentActivity={viewModel.activityProgress.current}
        showLabel={false}
        totalActivities={viewModel.activityProgress.total}
      />
    </View>
  );

  const dialogue = (
    <KoolDialogue
      message={viewModel.koolMessage}
      size={fluid.compactDialogue ? 'compact' : 'default'}
      trailingLabel={questionLabel}
      variant={viewModel.visualState === 'gentleCue' || viewModel.visualState === 'reprompt' || viewModel.visualState === 'error' ? 'gentle' : 'prompt'}
    />
  );

  const dock = (
    <View style={styles.mascotMicRow}>
      <MascotAnimator
        accessibilityLabel={`Kool is ${viewModel.mascotState}`}
        celebrationIntensity={viewModel.celebrationIntensity}
        reducedMotion={reducedMotion}
        state={viewModel.mascotState}
        visualHeight={fluid.mascotVisualHeight}
      />
      <View style={[styles.micSlot, { marginBottom: micLift, minWidth: fluid.micVisualSize }]}>
        {viewModel.canContinue ? (
          <ActionButton label="Continue ›" onPress={actions.onContinue} tone="primary" />
        ) : (
          <MicrophoneButton
            accessibilityLabel={micEnabled ? undefined : 'Microphone unavailable in this visual state'}
            audioLevel={audioLevel}
            layout="primary"
            onPressIn={startMicrophoneHold}
            onPressOut={stopMicrophoneHold}
            showLabel={fluid.showMicLabel}
            state={micEnabled ? viewModel.microphoneState : 'disabled'}
            visualSize={fluid.micVisualSize}
          />
        )}
      </View>
    </View>
  );

  // Vertical slack has exactly one owner. Portrait: the scene area is the only
  // flexible slot; the picture bottom-anchors against the dialogue, so any
  // leftover height floats above the picture, while the dialogue-to-dock gap
  // stays bounded by the capped breathe spacer. No ScrollView: short viewports
  // shrink the picture instead of pushing the dock off screen.
  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.page,
          {
            gap: fluid.gap,
            maxWidth: fluid.contentMaxWidth,
            paddingHorizontal: fluid.pagePaddingH,
            paddingVertical: fluid.pagePaddingV,
          },
        ]}>
        {header}
        {fluid.horizontal ? (
          <View style={[styles.experienceRow, { gap: fluid.pagePaddingH }]}>
            <View onLayout={onSceneAreaLayout} style={styles.sceneColumnRow}>
              <SceneSpotlight
                actions={actions}
                scene={scene}
                sceneWidth={fittedSceneWidth || undefined}
                viewModel={viewModel}
              />
            </View>
            {/* Centre the dialogue+dock cluster so it mirrors the vertically
                centred scene; the fixed spacer keeps the dialogue-to-dock
                distance bounded just like the portrait breathe spacer. */}
            <View style={[styles.supportColumn, { gap: fluid.gap }]}>
              {dialogue}
              <View style={{ height: fluid.breatheMax }} />
              {dock}
            </View>
          </View>
        ) : (
          <>
            <View onLayout={onSceneAreaLayout} style={styles.sceneArea}>
              <SceneSpotlight
                actions={actions}
                scene={scene}
                sceneWidth={fittedSceneWidth || undefined}
                viewModel={viewModel}
              />
            </View>
            {dialogue}
            <View style={{ flexGrow: 1, maxHeight: fluid.breatheMax }} />
            {dock}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: SemanticColors.background,
    flex: 1,
    width: '100%',
  },
  page: {
    flex: 1,
    width: '100%',
  },
  header: {
    gap: Spacing.one,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerPrimaryActions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  title: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 27,
  },
  experienceRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
  },
  sceneArea: {
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'flex-end',
    minHeight: 120,
    minWidth: 0,
    width: '100%',
  },
  sceneColumnRow: {
    alignItems: 'center',
    flex: 3,
    justifyContent: 'center',
    minHeight: 0,
    minWidth: 0,
  },
  sceneFrame: {
    alignSelf: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.large,
    borderWidth: 2,
    maxWidth: 900,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  sceneImage: {
    height: '100%',
    width: '100%',
  },
  clueLayer: {
    pointerEvents: 'box-none',
  },
  supportColumn: {
    flex: 2,
    justifyContent: 'center',
    maxWidth: 480,
    minWidth: 0,
  },
  mascotMicRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  micSlot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: ComponentSizes.minimumTouchTarget,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  actionButtonCompact: {
    minHeight: 34,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  actionButtonPrimary: {
    backgroundColor: BrandColors.tangerine,
  },
  actionButtonDisabled: {
    borderColor: SemanticColors.disabled,
    opacity: 0.45,
  },
  actionButtonPressed: {
    opacity: 0.72,
  },
  actionButtonText: {
    ...Typography.label,
    color: SemanticColors.primaryText,
  },
  actionButtonTextCompact: {
    ...Typography.bodySmall,
  },
});
