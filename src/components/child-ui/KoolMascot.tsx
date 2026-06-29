import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { brandAssets } from '@/constants/brand-assets';
import { scale } from '@/theme';

export type KoolMascotState = 'idle' | 'wave' | 'speaking' | 'listening' | 'thinking' | 'retry' | 'success' | 'breathe';

export type KoolMascotProps = {
  state: KoolMascotState;
  size?: 'small' | 'medium' | 'large';
  isSpeaking?: boolean;
  reducedMotion?: boolean;
  accessibilityLabel?: string;
};

const mascotSizes = {
  small: { height: scale(174), width: scale(120) },
  medium: { height: scale(236), width: scale(168) },
  large: { height: scale(340), width: scale(270) },
} as const;

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

export function KoolMascot({ state, size = 'medium', isSpeaking, reducedMotion, accessibilityLabel }: KoolMascotProps) {
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

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel ?? stateLabels[animatedState]}
      style={[styles.container, mascotSizes[size], animatedStyle]}>
      <Image accessible={false} resizeMode="contain" source={brandAssets.kool[animatedState].source} style={styles.image} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
