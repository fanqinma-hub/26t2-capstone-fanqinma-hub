import { Image, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import type { AssetVisualMetrics } from '@/constants/asset-visual-metrics.gen';

/** Width / height of the *visible* artwork content. */
export function visualContentAspect(metrics: AssetVisualMetrics): number {
  return (metrics.canvasWidth * metrics.content.width) / (metrics.canvasHeight * metrics.content.height);
}

export type VisualArtworkProps = Readonly<{
  metrics: AssetVisualMetrics;
  source: ImageSourcePropType;
  /** Height of the visible content; the layout box matches it exactly. */
  visualHeight: number;
  imageOpacity?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Renders a raster asset so its layout box equals the visible (alpha) bounding
 * box measured by scripts/asset-tools/measure-visual-bounds.js. Transparent
 * canvas padding in the PNG therefore never shifts flexbox alignment: siblings
 * align against what the eye actually sees.
 */
export function VisualArtwork({ metrics, source, visualHeight, imageOpacity, style }: VisualArtworkProps) {
  const canvasHeight = visualHeight / metrics.content.height;
  const canvasWidth = canvasHeight * (metrics.canvasWidth / metrics.canvasHeight);
  const contentWidth = canvasWidth * metrics.content.width;

  return (
    <View
      pointerEvents="none"
      // Clipping at the visual bounding box is lossless (only alpha<=8 pixels
      // live outside it) and keeps the transparent canvas from inflating the
      // document scroll height on web.
      style={[{ height: visualHeight, overflow: 'hidden', width: contentWidth }, style]}>
      <Image
        accessible={false}
        resizeMode="stretch"
        source={source}
        style={{
          height: canvasHeight,
          left: -metrics.content.x * canvasWidth,
          opacity: imageOpacity,
          position: 'absolute',
          top: -metrics.content.y * canvasHeight,
          width: canvasWidth,
        }}
      />
    </View>
  );
}
