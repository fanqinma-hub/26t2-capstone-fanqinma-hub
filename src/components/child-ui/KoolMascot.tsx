import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { brandAssets } from '@/constants/brand-assets';
import { assetVisualMetrics, type AssetVisualMetrics } from '@/constants/asset-visual-metrics.gen';
import { scale } from '@/theme';

import { VisualArtwork, visualContentAspect } from './VisualArtwork';

export type KoolMascotState = 'idle' | 'wave' | 'speaking' | 'listening' | 'thinking' | 'retry' | 'success' | 'breathe';

export type KoolMascotProps = {
  state: KoolMascotState;
  size?: 'small' | 'medium' | 'large';
  /** Exact height of the visible artwork; overrides the size preset. */
  visualHeight?: number;
  isSpeaking?: boolean;
  reducedMotion?: boolean;
  accessibilityLabel?: string;
};

const mascotMetrics: Record<KoolMascotState, AssetVisualMetrics> = {
  idle: assetVisualMetrics.koolIdle,
  wave: assetVisualMetrics.koolWave,
  speaking: assetVisualMetrics.koolSpeaking,
  listening: assetVisualMetrics.koolListening,
  thinking: assetVisualMetrics.koolThinking,
  retry: assetVisualMetrics.koolRetry,
  success: assetVisualMetrics.koolSuccess,
  breathe: assetVisualMetrics.koolBreathe,
};

// Matches the visible artwork height the previous canvas-box presets produced,
// so existing screens keep the same on-screen mascot size.
const mascotVisualHeights = {
  small: scale(144),
  medium: scale(194),
  large: scale(320),
} as const;

// Widest pose (wave) decides the slot width so the layout box never jumps
// horizontally when the pose changes.
const mascotSlotAspect = Math.max(...Object.values(mascotMetrics).map(visualContentAspect));

/**
 * Kool's neckline measured from the top of the visible artwork, as a fraction
 * of its height. Used by screens to align companion elements (for example the
 * microphone centre) with Kool's neck.
 */
export const MASCOT_NECK_RATIO = 0.34;

/** Layout footprint of the mascot for a given visible-artwork height. */
export function getMascotSlotSize(visualHeight: number) {
  return { height: visualHeight, width: visualHeight * mascotSlotAspect };
}

const stateLabels: Record<KoolMascotState, string> = {
  idle: 'Kool is ready to learn',
  wave: 'Kool is waving hello',
  speaking: 'Kool is speaking',
  listening: 'Kool is listening carefully',
  thinking: 'Kool is thinking',
  retry: 'Kool is ready to practise together',
  success: 'Kool is celebrating',
  breathe: 'Kool is taking a slow breath',
};

export function KoolMascot({ state, size = 'medium', visualHeight, isSpeaking, reducedMotion, accessibilityLabel }: KoolMascotProps) {
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion ?? Boolean(systemReducedMotion);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));
  const animatedState = isSpeaking ? 'speaking' : state;

  useEffect(() => {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(scale);
    translateX.set(0);
    translateY.set(0);
    scale.set(1);

    if (shouldReduceMotion) return () => undefined;

    if (animatedState === 'idle' || animatedState === 'wave') {
      translateY.set(withRepeat(withSequence(withTiming(-5, { duration: 1300 }), withTiming(0, { duration: 1300 })), -1));
      scale.set(withRepeat(withSequence(withTiming(1.02, { duration: 1800 }), withTiming(1, { duration: 1800 })), -1));
    }
    if (animatedState === 'speaking') {
      translateY.set(withRepeat(withSequence(withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 })), -1));
    }
    if (animatedState === 'listening') {
      scale.set(withRepeat(withSequence(withTiming(1.035, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1));
    }
    if (animatedState === 'thinking') {
      translateX.set(withRepeat(withSequence(withTiming(-5, { duration: 700 }), withTiming(5, { duration: 700 })), -1, true));
    }
    if (animatedState === 'retry') {
      translateX.set(withSequence(withTiming(-7, { duration: 110 }), withTiming(7, { duration: 110 }), withTiming(-4, { duration: 110 }), withTiming(0, { duration: 110 })));
    }
    if (animatedState === 'success') {
      translateY.set(withSequence(withTiming(-15, { duration: 190 }), withTiming(0, { duration: 240 })));
      scale.set(withSequence(withTiming(1.12, { duration: 190 }), withTiming(1, { duration: 240 })));
    }
    if (animatedState === 'breathe') {
      scale.set(withRepeat(withSequence(withTiming(1.06, { duration: 1800 }), withTiming(1, { duration: 1800 })), -1));
    }

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [animatedState, scale, shouldReduceMotion, translateX, translateY]);

  const resolvedVisualHeight = visualHeight ?? mascotVisualHeights[size];

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel ?? stateLabels[animatedState]}
      style={[styles.container, getMascotSlotSize(resolvedVisualHeight), animatedStyle]}>
      <VisualArtwork
        metrics={mascotMetrics[animatedState]}
        source={brandAssets.kool[animatedState].source}
        visualHeight={resolvedVisualHeight}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
});
