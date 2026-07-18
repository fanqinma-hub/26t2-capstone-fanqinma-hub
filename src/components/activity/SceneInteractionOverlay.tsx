import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BrandColors, Radii, Typography } from '@/theme';

import {
  clueBreathingDurationMs,
  clueMarkerMaximumOpacity,
  clueMarkerMinimumOpacity,
  getClueMarkerPosition,
  getSpotlightVisualRects,
} from './spotlight-geometry';
import type { SpotlightRect } from './spotlight-geometry';

export function ClueHotspot({
  label,
  onPress,
  position,
  rect,
}: Readonly<{
  label: string;
  onPress: () => void;
  position?: ReturnType<typeof getClueMarkerPosition>;
  rect: SpotlightRect;
}>) {
  const reducedMotion = Boolean(useReducedMotion());
  const pulse = useSharedValue(1);
  const markerStyle = useAnimatedStyle(() => ({
    opacity: clueMarkerMinimumOpacity + pulse.value * (clueMarkerMaximumOpacity - clueMarkerMinimumOpacity),
    transform: [{ scale: 0.96 + pulse.value * 0.04 }],
  }));

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.set(1);
    if (reducedMotion) return () => undefined;

    pulse.set(withRepeat(
      withSequence(
        withTiming(0, { duration: clueBreathingDurationMs }),
        withTiming(1, { duration: clueBreathingDurationMs }),
      ),
      -1,
    ));
    return () => cancelAnimation(pulse);
  }, [pulse, reducedMotion]);

  return (
    <View
      style={[styles.clueMarker, position ?? getClueMarkerPosition(rect)]}
      testID="clue-hotspot">
      <Animated.View
        style={[styles.clueMarkerAnimated, markerStyle]}
        testID="clue-hotspot-pulse">
        <Pressable
          accessibilityHint="Double tap to ask Kool for a clue about this part of the picture."
          accessibilityLabel={`Picture clue: ${label}`}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onPress}
          style={({ pressed }) => [styles.clueMarkerButton, pressed && styles.clueMarkerPressed]}>
          <Text style={styles.clueMarkerText}>?</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function SpotlightFrame({
  pulse,
  rect,
  sceneSize,
  sceneSource,
}: Readonly<{
  pulse: SharedValue<number>;
  rect: SpotlightRect;
  sceneSize: { width: number; height: number };
  sceneSource: ImageSourcePropType;
}>) {
  const geometryStyle = useAnimatedStyle(() => {
    const scaleValue = 0.96 + pulse.value * 0.1;
    const baseLeft = rect.x * sceneSize.width;
    const baseTop = rect.y * sceneSize.height;
    const baseWidth = rect.width * sceneSize.width;
    const baseHeight = rect.height * sceneSize.height;
    const width = baseWidth * scaleValue;
    const height = baseHeight * scaleValue;
    return {
      height,
      left: baseLeft - (width - baseWidth) / 2,
      top: baseTop - (height - baseHeight) / 2,
      width,
    };
  });
  const sceneStyle = useAnimatedStyle(() => {
    const scaleValue = 0.96 + pulse.value * 0.1;
    const baseLeft = rect.x * sceneSize.width;
    const baseTop = rect.y * sceneSize.height;
    const baseWidth = rect.width * sceneSize.width;
    const baseHeight = rect.height * sceneSize.height;
    const width = baseWidth * scaleValue;
    const height = baseHeight * scaleValue;
    const left = baseLeft - (width - baseWidth) / 2;
    const top = baseTop - (height - baseHeight) / 2;
    return {
      height: sceneSize.height,
      left: -left,
      top: -top,
      width: sceneSize.width,
    };
  });
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(pulse.value, [0, 1], ['#7A5A16', '#FFF7A3']),
    opacity: 0.18 + pulse.value * 0.82,
    shadowOpacity: 0.12 + pulse.value * 0.72,
    shadowRadius: 3 + pulse.value * 9,
  }));

  return (
    <Animated.View style={[styles.spotlightFrame, geometryStyle]} testID="scene-spotlight-frame">
      <View style={styles.spotlightCutout} testID="scene-spotlight-cutout">
        <Animated.Image
          accessible={false}
          resizeMode="stretch"
          source={sceneSource}
          style={[styles.cutoutImage, sceneStyle]}
          testID="scene-spotlight-source"
        />
      </View>
      <Animated.View style={[styles.spotlightBorder, borderStyle]} testID="scene-spotlight-border" />
    </Animated.View>
  );
}

export function SceneSpotlightOverlay({
  rects,
  sceneSource,
  showFrames = true,
}: Readonly<{
  rects: readonly SpotlightRect[];
  sceneSource: ImageSourcePropType;
  showFrames?: boolean;
}>) {
  const reducedMotion = Boolean(useReducedMotion());
  const pulse = useSharedValue(1);
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSceneSize((previous) =>
      previous.width === width && previous.height === height ? previous : { width, height },
    );
  };
  const visualRects = useMemo(
    () => getSpotlightVisualRects(rects, sceneSize),
    [rects, sceneSize],
  );

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.set(1);
    if (reducedMotion || rects.length === 0 || !showFrames) return () => undefined;

    pulse.set(withRepeat(
      withSequence(
        withTiming(0, { duration: clueBreathingDurationMs }),
        withTiming(1, { duration: clueBreathingDurationMs }),
      ),
      -1,
    ));
    return () => cancelAnimation(pulse);
  }, [pulse, rects.length, reducedMotion, showFrames]);

  if (rects.length === 0 && showFrames) return null;

  return (
    <View
      onLayout={onLayout}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="scene-spotlight-layer">
      <View style={styles.sceneDim} testID="scene-spotlight-dim" />
      {showFrames && sceneSize.width > 0 && sceneSize.height > 0
        ? visualRects.map((rect, index) => (
          <SpotlightFrame
            key={`spotlight-frame-${index}`}
            pulse={pulse}
            rect={rect}
            sceneSize={sceneSize}
            sceneSource={sceneSource}
          />
        ))
        : null}
    </View>
  );
}

const clueMarkerSize = 48;

const styles = StyleSheet.create({
  sceneDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 16, 24, 0.62)',
    zIndex: 1,
  },
  spotlightFrame: {
    position: 'absolute',
    zIndex: 2,
  },
  spotlightCutout: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.medium,
    overflow: 'hidden',
  },
  cutoutImage: {
    position: 'absolute',
  },
  spotlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderColor: BrandColors.mimosa,
    borderRadius: Radii.medium,
    borderWidth: 5,
    shadowColor: '#FFF7A3',
  },
  clueMarker: {
    alignItems: 'center',
    height: clueMarkerSize,
    justifyContent: 'center',
    position: 'absolute',
    transform: [
      { translateX: -clueMarkerSize / 2 },
      { translateY: -clueMarkerSize / 2 },
    ],
    width: clueMarkerSize,
    zIndex: 5,
  },
  clueMarkerAnimated: {
    height: '100%',
    width: '100%',
  },
  clueMarkerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: '#1F1A17',
    borderRadius: Radii.pill,
    borderWidth: 3,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  clueMarkerPressed: {
    transform: [{ scale: 0.94 }],
  },
  clueMarkerText: {
    ...Typography.headingSmall,
    color: '#1F1A17',
  },
});
