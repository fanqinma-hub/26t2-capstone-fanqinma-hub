/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/asset-tools/measure-visual-bounds.js
 *
 * Visible-pixel (alpha) bounding boxes for raster assets that participate in
 * layout alignment. `content` is the visible bounding box expressed as
 * fractions of the PNG canvas, so layout code can size and align the artwork
 * by what the eye actually sees instead of the transparent canvas.
 */
export type AssetVisualMetrics = Readonly<{
  canvasWidth: number;
  canvasHeight: number;
  content: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

export const assetVisualMetrics = {
  microphoneFunwattle: {
      canvasWidth: 1254,
      canvasHeight: 1254,
      content: {
          x: 0.12998,
          y: 0.11563,
          width: 0.74402,
          height: 0.77512
      }
  },
  koolIdle: {
      canvasWidth: 170,
      canvasHeight: 248,
      content: {
          x: 0.20588,
          y: 0.12903,
          width: 0.72353,
          height: 0.82258
      }
  },
  koolWave: {
      canvasWidth: 590,
      canvasHeight: 760,
      content: {
          x: 0.0661,
          y: 0.03684,
          width: 0.91695,
          height: 0.94342
      }
  },
  koolSpeaking: {
      canvasWidth: 190,
      canvasHeight: 238,
      content: {
          x: 0.24211,
          y: 0.13866,
          width: 0.66842,
          height: 0.77731
      }
  },
  koolListening: {
      canvasWidth: 168,
      canvasHeight: 238,
      content: {
          x: 0.29762,
          y: 0.14286,
          width: 0.55357,
          height: 0.78151
      }
  },
  koolThinking: {
      canvasWidth: 148,
      canvasHeight: 262,
      content: {
          x: 0.16892,
          y: 0.18702,
          width: 0.7027,
          height: 0.76336
      }
  },
  koolRetry: {
      canvasWidth: 164,
      canvasHeight: 238,
      content: {
          x: 0.23171,
          y: 0.12605,
          width: 0.68293,
          height: 0.79832
      }
  },
  koolSuccess: {
      canvasWidth: 182,
      canvasHeight: 238,
      content: {
          x: 0.18132,
          y: 0.12185,
          width: 0.70879,
          height: 0.80672
      }
  },
  koolBreathe: {
      canvasWidth: 189,
      canvasHeight: 238,
      content: {
          x: 0.26455,
          y: 0.11765,
          width: 0.66138,
          height: 0.81933
      }
  },
} as const satisfies Record<string, AssetVisualMetrics>;
