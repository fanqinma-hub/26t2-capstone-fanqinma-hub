import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { KoolMascot } from '@/components/child-ui';
import type { KoolMascotState } from '@/components/child-ui';
import type { MascotAnimatorProps, MascotState } from '@/types/visual.types';

import { mascotRasterTransitionMs } from './mascot-animation.types';

const rasterState: Record<MascotState, KoolMascotState> = {
  idle: 'idle',
  speaking: 'speaking',
  listening: 'listening',
  thinking: 'thinking',
  success: 'success',
};

/**
 * Stable renderer boundary for every consumer. The current release renderer is
 * the approved raster artwork; the later Lottie rig can replace this internals
 * without changing props, layout footprint, or consumer code.
 */
export function MascotAnimator({
  state,
  reducedMotion,
  accessibilityLabel,
  size = 'medium',
  visualHeight,
}: MascotAnimatorProps) {
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    cancelAnimation(opacity);
    opacity.set(reducedMotion ? 1 : 0.35);
    if (!reducedMotion) opacity.set(withTiming(1, { duration: mascotRasterTransitionMs }));
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion, state]);

  return (
    <Animated.View style={[styles.footprint, animatedStyle]}>
      <KoolMascot
        accessibilityLabel={accessibilityLabel}
        reducedMotion={reducedMotion}
        size={size}
        state={rasterState[state]}
        visualHeight={visualHeight}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footprint: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
