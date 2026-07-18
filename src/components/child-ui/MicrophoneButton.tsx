import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { assetVisualMetrics } from '@/constants/asset-visual-metrics.gen';
import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

import { VisualArtwork } from './VisualArtwork';

export type MicrophoneButtonState = 'idle' | 'listening' | 'processing' | 'disabled' | 'error';

export type MicrophoneButtonProps = {
  state?: MicrophoneButtonState;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  accessibilityLabel?: string;
  layout?: 'default' | 'primary';
  showLabel?: boolean;
  /** Diameter of the visible microphone badge; overrides the layout default. */
  visualSize?: number;
  /** 0..1 live mic level; drives the "I can hear you" waveform while holding. */
  audioLevel?: SharedValue<number>;
};

const stateContent: Record<
  MicrophoneButtonState,
  { label: string; helperText: string; accessibilityHint: string }
> = {
  idle: {
    label: 'Hold to talk',
    helperText: 'Hold the button and tell Kool.',
    accessibilityHint: 'Press and hold to speak, then let go when you are done.',
  },
  listening: {
    label: 'Listening…',
    helperText: 'Keep talking, then let go.',
    accessibilityHint: 'The app is listening while you hold the button.',
  },
  processing: {
    label: 'Thinking…',
    helperText: 'Please wait for the next prompt.',
    accessibilityHint: 'The app is processing your response.',
  },
  disabled: {
    label: 'Listen to Kool',
    helperText: 'Kool is talking now.',
    accessibilityHint: 'Please wait while Kool is speaking.',
  },
  error: {
    label: 'Try again',
    helperText: 'Something went wrong. Tap to try again.',
    accessibilityHint: 'Double tap to try the microphone again.',
  },
};

const microphoneArtwork = require('../../../assets/brand/ui/microphone-funwattle.png');
const microphoneMetrics = assetVisualMetrics.microphoneFunwattle;
const primaryMicrophoneSize = ComponentSizes.microphoneButton + Spacing.three;

/**
 * Distance from the bottom of the primary-layout button to the centre of the
 * visible microphone badge. Screens use this to align the badge centre with a
 * companion element (for example Kool's neckline).
 */
export function getMicrophoneVisualCenterFromBottom(visualSize: number, showLabel: boolean): number {
  const labelBlock = showLabel ? Typography.status.lineHeight + Spacing.one : 0;
  return labelBlock + visualSize / 2;
}

function ProgressiveVoiceRing({
  audioLevel,
  offset,
  phase,
  size,
}: Readonly<{
  audioLevel?: SharedValue<number>;
  offset: number;
  phase: SharedValue<number>;
  size: number;
}>) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = (phase.value + offset) % 1;
    const level = audioLevel?.value ?? 0;
    return {
      opacity: (1 - progress) * (0.22 + level * 0.45),
      transform: [{ scale: 0.82 + progress * 0.58 + level * 0.06 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.waveRing, { height: size, width: size }, animatedStyle]}
      testID="microphone-wave-ring"
    />
  );
}

export function MicrophoneButton({
  state = 'idle',
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  layout = 'default',
  showLabel = true,
  visualSize,
  audioLevel,
}: MicrophoneButtonProps) {
  const content = stateContent[state];
  const isDisabled = state === 'disabled' || state === 'processing';
  const reducedMotion = Boolean(useReducedMotion());
  const wavePhase = useSharedValue(0);
  const microphoneSize = visualSize ?? (layout === 'primary' ? primaryMicrophoneSize : ComponentSizes.microphoneButton);

  useEffect(() => {
    cancelAnimation(wavePhase);
    wavePhase.set(reducedMotion ? 0.35 : 0);
    if (state !== 'listening' || reducedMotion) return () => cancelAnimation(wavePhase);

    wavePhase.set(
      withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(wavePhase);
  }, [reducedMotion, state, wavePhase]);

  return (
    <Pressable
      accessibilityHint={content.accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? `${content.label}. ${content.helperText}`}
      accessibilityRole="button"
      accessibilityState={{ busy: state === 'processing', disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.button,
        styles[state],
        layout === 'primary' && styles.primaryButton,
        layout === 'primary' && !showLabel && styles.primaryIconOnly,
        pressed && !isDisabled && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>
        {state === 'listening' ? (
          <>
            <ProgressiveVoiceRing audioLevel={audioLevel} offset={0} phase={wavePhase} size={microphoneSize} />
            <ProgressiveVoiceRing audioLevel={audioLevel} offset={1 / 3} phase={wavePhase} size={microphoneSize} />
            <ProgressiveVoiceRing audioLevel={audioLevel} offset={2 / 3} phase={wavePhase} size={microphoneSize} />
          </>
        ) : null}
        <VisualArtwork
          imageOpacity={isDisabled ? 0.58 : undefined}
          metrics={microphoneMetrics}
          source={microphoneArtwork}
          visualHeight={microphoneSize}
        />
      </View>
      {showLabel ? (
        <View style={[styles.copy, layout === 'primary' && styles.primaryCopy]}>
          <Text style={[styles.label, layout === 'primary' && styles.primaryLabel]}>{content.label}</Text>
          {layout === 'default' ? <Text style={styles.helperText}>{content.helperText}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radii.large,
    borderWidth: Spacing.half,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: ComponentSizes.minimumTouchTarget,
    padding: Spacing.two,
  },
  idle: {
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
  },
  listening: {
    backgroundColor: BrandColors.mimosa,
    borderColor: SemanticColors.focus,
  },
  processing: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.disabled,
  },
  disabled: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.disabled,
  },
  error: {
    backgroundColor: SemanticColors.surface,
    borderColor: SemanticColors.error,
  },
  pressed: {
    opacity: 0.8,
  },
  // Content-sized on purpose: the button's layout box is the visible badge
  // plus its label, so screens can align against it without dead space.
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'column',
    gap: Spacing.one,
    minHeight: ComponentSizes.minimumTouchTarget,
    minWidth: ComponentSizes.minimumTouchTarget,
    padding: 0,
  },
  primaryIconOnly: {
    minHeight: ComponentSizes.minimumTouchTarget,
    minWidth: ComponentSizes.minimumTouchTarget,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  waveRing: {
    borderRadius: Radii.pill,
    borderColor: BrandColors.mimosa,
    borderWidth: 4,
    position: 'absolute',
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  primaryCopy: {
    flex: 0,
  },
  label: {
    ...Typography.status,
    color: SemanticColors.primaryText,
  },
  primaryLabel: {
    textAlign: 'center',
  },
  helperText: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
});
