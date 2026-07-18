/**
 * Measures the visible (alpha > threshold) bounding box of the raster UI
 * assets that participate in layout alignment, and generates a typed metrics
 * module. Layout code aligns against these *visual* boxes instead of the PNG
 * canvas, so transparent padding in re-exported artwork can never skew
 * alignment again — re-run this script and the layout stays correct.
 *
 * Usage:
 *   node scripts/asset-tools/measure-visual-bounds.js
 *
 * Output:
 *   src/constants/asset-visual-metrics.gen.ts (do not edit by hand)
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ALPHA_THRESHOLD = 8;
const root = path.resolve(__dirname, '../..');
const outputPath = path.resolve(root, 'src/constants/asset-visual-metrics.gen.ts');

const assets = [
  { key: 'microphoneFunwattle', file: 'assets/brand/ui/microphone-funwattle.png' },
  { key: 'koolIdle', file: 'assets/brand/kool/kool-idle.png' },
  { key: 'koolWave', file: 'assets/brand/kool/kool-wave.png' },
  { key: 'koolSpeaking', file: 'assets/brand/kool/kool-speaking.png' },
  { key: 'koolListening', file: 'assets/brand/kool/kool-listening.png' },
  { key: 'koolThinking', file: 'assets/brand/kool/kool-thinking.png' },
  { key: 'koolRetry', file: 'assets/brand/kool/kool-retry.png' },
  { key: 'koolSuccess', file: 'assets/brand/kool/kool-success.png' },
  { key: 'koolBreathe', file: 'assets/brand/kool/kool-breathe.png' },
];

function measure(filePath) {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  const { width, height, data } = png;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(width * y + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) {
    throw new Error(`No visible pixels found in ${filePath}`);
  }

  const round = (value) => Number(value.toFixed(5));
  return {
    canvasWidth: width,
    canvasHeight: height,
    content: {
      x: round(minX / width),
      y: round(minY / height),
      width: round((maxX - minX + 1) / width),
      height: round((maxY - minY + 1) / height),
    },
  };
}

const entries = assets.map(({ key, file }) => {
  const metrics = measure(path.resolve(root, file));
  return `  ${key}: ${JSON.stringify(metrics, null, 4).replace(/\n/g, '\n  ').replace(/"([a-zA-Z]+)":/g, '$1:')},`;
});

const output = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/asset-tools/measure-visual-bounds.js
 *
 * Visible-pixel (alpha) bounding boxes for raster assets that participate in
 * layout alignment. \`content\` is the visible bounding box expressed as
 * fractions of the PNG canvas, so layout code can size and align the artwork
 * by what the eye actually sees instead of the transparent canvas.
 */
export type AssetVisualMetrics = Readonly<{
  canvasWidth: number;
  canvasHeight: number;
  content: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

export const assetVisualMetrics = {
${entries.join('\n')}
} as const satisfies Record<string, AssetVisualMetrics>;
`;

fs.writeFileSync(outputPath, output);
console.log(`Wrote ${path.relative(root, outputPath)}`);
for (const { key, file } of assets) {
  const m = measure(path.resolve(root, file));
  console.log(
    `${key}: canvas ${m.canvasWidth}x${m.canvasHeight}, content ${(m.content.width * 100).toFixed(1)}% x ${(m.content.height * 100).toFixed(1)}% at (${(m.content.x * 100).toFixed(1)}%, ${(m.content.y * 100).toFixed(1)}%)`,
  );
}
