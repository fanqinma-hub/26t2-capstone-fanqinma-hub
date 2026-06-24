/**
 * Derives the small runtime Kool pose set from the client-provided character
 * sheet. This is intentionally a deterministic, local asset tool: it makes no
 * network requests and does not alter the source sheet.
 *
 * Usage:
 *   node scripts/asset-tools/extract-kool-poses.js
 *   node scripts/asset-tools/extract-kool-poses.js --contact-sheet /private/tmp/kool-poses-contact-sheet.png
 *
 * Crop coordinates were hand-reviewed against the 1414 × 2000 client sheet.
 * Each crop leaves clear space around Kool's hands, ears, leaves, feet and
 * expression while excluding neighbouring poses and label artwork. The
 * conservative near-white key leaves Kool's pale chest and yellow fur intact,
 * while making the reference-sheet background transparent.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const sourcePath = path.resolve(__dirname, '../../assets/brand/reference/kool-character-sheet.png');
const outputDirectory = path.resolve(__dirname, '../../assets/brand/kool');

const poses = {
  'kool-idle.png': {
    x: 96,
    y: 1042,
    width: 146,
    height: 224,
    sourcePose: 'NEUTRAL',
    clearRegions: [{ x: 0, y: 0, width: 6, height: 224 }],
  },
  'kool-wave.png': {
    // Keep the entry-page mascot visually identical to the prior approved
    // runtime asset. Small-pose cleanup must not alter the home greeting.
    x: 74,
    y: 214,
    width: 590,
    height: 760,
    sourcePose: 'large wave character',
    padding: 0,
    preserveTransparentPixels: true,
    // These elements belong to the sheet layout, not the mascot artwork.
    clearRegions: [
      { x: 0, y: 0, width: 480, height: 26 },
      { x: 0, y: 410, width: 170, height: 150 },
      { x: 0, y: 620, width: 110, height: 140 },
      { x: 500, y: 610, width: 90, height: 150 },
    ],
  },
  'kool-speaking.png': {
    x: 226,
    y: 1370,
    width: 166,
    height: 214,
    sourcePose: 'SPEAKING',
    clearRegions: [{ x: 0, y: 0, width: 166, height: 16 }],
  },
  'kool-listening.png': {
    x: 92,
    y: 1370,
    width: 144,
    height: 214,
    sourcePose: 'LISTENING',
    clearRegions: [
      { x: 0, y: 0, width: 144, height: 16 },
      // Removes the reference-sheet's pale-blue left panel border.
      { x: 0, y: 0, width: 14, height: 214 },
      { x: 139, y: 0, width: 5, height: 214 },
    ],
  },
  'kool-thinking.png': {
    x: 780,
    y: 1030,
    width: 124,
    height: 238,
    sourcePose: 'THINKING',
    // The pose itself begins just inside x=780. Starting here preserves the
    // left leaf while excluding the previous pose; the wider lower edge keeps
    // both feet before the blue THINKING label begins.
    clearRegions: [{ x: 0, y: 0, width: 5, height: 238 }],
  },
  'kool-retry.png': {
    x: 380,
    y: 1370,
    width: 140,
    height: 214,
    sourcePose: 'PRACTICE (REPEAT)',
    clearRegions: [
      { x: 0, y: 0, width: 140, height: 16 },
      { x: 0, y: 0, width: 9, height: 214 },
    ],
  },
  'kool-success.png': {
    x: 515,
    y: 1370,
    width: 158,
    height: 214,
    sourcePose: 'CELEBRATE',
    clearRegions: [
      { x: 0, y: 0, width: 158, height: 16 },
      { x: 0, y: 0, width: 10, height: 214 },
    ],
  },
  'kool-breathe.png': {
    x: 802,
    y: 1370,
    width: 165,
    height: 214,
    sourcePose: 'BREATHE IN',
    clearRegions: [
      { x: 0, y: 0, width: 165, height: 16 },
      { x: 0, y: 0, width: 25, height: 214 },
    ],
  },
};

function isNearReferenceBackground(red, green, blue) {
  // The sheet background is a warm, low-saturation near-white. A simple
  // per-pixel key would punch holes in Kool's eye highlights and shirt, so we
  // only remove matching pixels that flood in from a crop edge.
  const lightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  return darkest >= 220 && lightest - darkest <= 35;
}

function isInClearRegion(x, y, clearRegions = []) {
  return clearRegions.some((region) => x >= region.x && x < region.x + region.width && y >= region.y && y < region.y + region.height);
}

function buildBackgroundMask(source, definition) {
  const mask = new Uint8Array(definition.width * definition.height);
  const queue = [];

  function canClear(x, y) {
    if (x < 0 || x >= definition.width || y < 0 || y >= definition.height) return false;
    if (isInClearRegion(x, y, definition.clearRegions)) return true;
    const sourceIndex = ((definition.y + y) * source.width + definition.x + x) << 2;
    return isNearReferenceBackground(source.data[sourceIndex], source.data[sourceIndex + 1], source.data[sourceIndex + 2]);
  }

  function add(x, y) {
    const index = y * definition.width + x;
    if (mask[index] || !canClear(x, y)) return;
    mask[index] = 1;
    queue.push([x, y]);
  }

  for (let x = 0; x < definition.width; x += 1) {
    add(x, 0);
    add(x, definition.height - 1);
  }
  for (let y = 1; y < definition.height - 1; y += 1) {
    add(0, y);
    add(definition.width - 1, y);
  }

  // Mark sheet-only layout elements as transparent even though they may be
  // coloured rather than near-white, then let that mask connect to the edge.
  for (let y = 0; y < definition.height; y += 1) {
    for (let x = 0; x < definition.width; x += 1) {
      if (isInClearRegion(x, y, definition.clearRegions)) {
        const index = y * definition.width + x;
        if (!mask[index]) {
          mask[index] = 1;
          queue.push([x, y]);
        }
      }
    }
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    add(x + 1, y);
    add(x - 1, y);
    add(x, y + 1);
    add(x, y - 1);
  }

  return mask;
}

function derivePose(source, definition) {
  const output = new PNG({ width: definition.width, height: definition.height });
  const backgroundMask = buildBackgroundMask(source, definition);

  for (let y = 0; y < definition.height; y += 1) {
    for (let x = 0; x < definition.width; x += 1) {
      const sourceIndex = ((definition.y + y) * source.width + definition.x + x) << 2;
      const outputIndex = (y * definition.width + x) << 2;
      const red = source.data[sourceIndex];
      const green = source.data[sourceIndex + 1];
      const blue = source.data[sourceIndex + 2];

      const isTransparent = backgroundMask[y * definition.width + x];
      output.data[outputIndex] = isTransparent && !definition.preserveTransparentPixels ? 0 : red;
      output.data[outputIndex + 1] = isTransparent && !definition.preserveTransparentPixels ? 0 : green;
      output.data[outputIndex + 2] = isTransparent && !definition.preserveTransparentPixels ? 0 : blue;
      output.data[outputIndex + 3] = isTransparent ? 0 : 255;
    }
  }

  return output;
}

function addTransparentPadding(image, padding = 12) {
  const output = new PNG({ width: image.width + padding * 2, height: image.height + padding * 2 });

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const sourceIndex = (y * image.width + x) << 2;
      const outputIndex = ((y + padding) * output.width + x + padding) << 2;
      output.data[outputIndex] = image.data[sourceIndex];
      output.data[outputIndex + 1] = image.data[sourceIndex + 1];
      output.data[outputIndex + 2] = image.data[sourceIndex + 2];
      output.data[outputIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  return output;
}

function fillRectangle(image, x, y, width, height, color) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const index = (row * image.width + column) << 2;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = 255;
    }
  }
}

function fillCheckerboard(image, x, y, width, height) {
  const square = 16;
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      const lightSquare = (Math.floor((column - x) / square) + Math.floor((row - y) / square)) % 2 === 0;
      const index = (row * image.width + column) << 2;
      image.data[index] = lightSquare ? 245 : 218;
      image.data[index + 1] = lightSquare ? 246 : 221;
      image.data[index + 2] = lightSquare ? 248 : 226;
      image.data[index + 3] = 255;
    }
  }
}

function compositeScaled(sourceImage, targetImage, cellX, cellY, cellWidth, cellHeight) {
  const scale = Math.min((cellWidth - 24) / sourceImage.width, (cellHeight - 24) / sourceImage.height);
  const drawWidth = Math.max(1, Math.round(sourceImage.width * scale));
  const drawHeight = Math.max(1, Math.round(sourceImage.height * scale));
  const offsetX = cellX + Math.round((cellWidth - drawWidth) / 2);
  const offsetY = cellY + Math.round((cellHeight - drawHeight) / 2);

  for (let y = 0; y < drawHeight; y += 1) {
    for (let x = 0; x < drawWidth; x += 1) {
      const sourceX = Math.min(sourceImage.width - 1, Math.floor(x / scale));
      const sourceY = Math.min(sourceImage.height - 1, Math.floor(y / scale));
      const sourceIndex = (sourceY * sourceImage.width + sourceX) << 2;
      const alpha = sourceImage.data[sourceIndex + 3] / 255;
      if (!alpha) continue;

      const targetIndex = ((offsetY + y) * targetImage.width + offsetX + x) << 2;
      const inverseAlpha = 1 - alpha;
      targetImage.data[targetIndex] = Math.round(sourceImage.data[sourceIndex] * alpha + targetImage.data[targetIndex] * inverseAlpha);
      targetImage.data[targetIndex + 1] = Math.round(sourceImage.data[sourceIndex + 1] * alpha + targetImage.data[targetIndex + 1] * inverseAlpha);
      targetImage.data[targetIndex + 2] = Math.round(sourceImage.data[sourceIndex + 2] * alpha + targetImage.data[targetIndex + 2] * inverseAlpha);
      targetImage.data[targetIndex + 3] = 255;
    }
  }
}

function writeContactSheet(outputPath) {
  const filenames = Object.keys(poses);
  const cellWidth = 160;
  const cellHeight = 250;
  const backgrounds = [
    { kind: 'solid', color: [255, 255, 255] },
    { kind: 'solid', color: [37, 48, 61] },
    { kind: 'checkerboard' },
  ];
  const sheet = new PNG({ width: cellWidth * filenames.length, height: cellHeight * backgrounds.length });

  backgrounds.forEach((background, row) => {
    filenames.forEach((filename, column) => {
      const x = column * cellWidth;
      const y = row * cellHeight;
      if (background.kind === 'checkerboard') {
        fillCheckerboard(sheet, x, y, cellWidth, cellHeight);
      } else {
        fillRectangle(sheet, x, y, cellWidth, cellHeight, background.color);
      }
      compositeScaled(PNG.sync.read(fs.readFileSync(path.join(outputDirectory, filename))), sheet, x, y, cellWidth, cellHeight);
    });
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, PNG.sync.write(sheet));
}

const source = PNG.sync.read(fs.readFileSync(sourcePath));
fs.mkdirSync(outputDirectory, { recursive: true });

for (const [filename, definition] of Object.entries(poses)) {
  if (definition.x + definition.width > source.width || definition.y + definition.height > source.height) {
    throw new Error(`Crop for ${filename} extends outside the source sheet.`);
  }

  fs.writeFileSync(path.join(outputDirectory, filename), PNG.sync.write(addTransparentPadding(derivePose(source, definition), definition.padding)));
}

const contactSheetFlag = process.argv.indexOf('--contact-sheet');
if (contactSheetFlag !== -1) {
  const contactSheetPath = process.argv[contactSheetFlag + 1];
  if (!contactSheetPath || contactSheetPath.startsWith('--')) {
    throw new Error('Pass an output path after --contact-sheet.');
  }
  writeContactSheet(path.resolve(contactSheetPath));
}

console.log(`Derived ${Object.keys(poses).length} Kool poses from ${path.basename(sourcePath)}.${contactSheetFlag === -1 ? '' : ' Wrote contact sheet.'}`);
