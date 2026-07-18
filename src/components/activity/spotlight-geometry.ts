const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const GROUPED_UNION_AREA_LIMIT = 0.24;
const MINIMUM_SMALL_SPOTLIGHT_SIZE = 44;

export const clueBreathingDurationMs = 1100;
export const clueMarkerMinimumOpacity = 0.3;
export const clueMarkerMaximumOpacity = 0.8;

export type SpotlightRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

function percentage(value: number): `${number}%` {
  const rounded = Math.round(clamp01(value) * 100000) / 1000;
  return `${rounded}%`;
}

export function getNormalizedRectStyle(rect: SpotlightRect) {
  return {
    height: percentage(rect.height),
    left: percentage(rect.x),
    top: percentage(rect.y),
    width: percentage(rect.width),
  };
}

export function isSmallClueTarget(rect: SpotlightRect): boolean {
  return rect.width < 0.18 || rect.height < 0.2;
}

/**
 * Gives tiny targets a readable visual surround without changing the authored
 * target contract. Call this only after grouped/sequential presentation has
 * been resolved so padding cannot change overlap decisions.
 */
export function getSpotlightVisualRect(
  rect: SpotlightRect,
  sceneSize: Readonly<{ width: number; height: number }>,
): SpotlightRect {
  const normalized = normalizeSpotlightRect(rect);
  if (
    !isSmallClueTarget(normalized) ||
    sceneSize.width <= 0 ||
    sceneSize.height <= 0
  ) {
    return normalized;
  }

  const padding = Math.min(Math.max(Math.min(sceneSize.width, sceneSize.height) * 0.012, 5), 8);
  const width = Math.min(
    1,
    Math.max(
      normalized.width + (padding * 2) / sceneSize.width,
      MINIMUM_SMALL_SPOTLIGHT_SIZE / sceneSize.width,
    ),
  );
  const height = Math.min(
    1,
    Math.max(
      normalized.height + (padding * 2) / sceneSize.height,
      MINIMUM_SMALL_SPOTLIGHT_SIZE / sceneSize.height,
    ),
  );
  const centreX = normalized.x + normalized.width / 2;
  const centreY = normalized.y + normalized.height / 2;

  return {
    x: Math.min(Math.max(centreX - width / 2, 0), 1 - width),
    y: Math.min(Math.max(centreY - height / 2, 0), 1 - height),
    width,
    height,
  };
}

function interpolateRect(
  original: SpotlightRect,
  expanded: SpotlightRect,
  progress: number,
): SpotlightRect {
  return {
    x: original.x + (expanded.x - original.x) * progress,
    y: original.y + (expanded.y - original.y) * progress,
    width: original.width + (expanded.width - original.width) * progress,
    height: original.height + (expanded.height - original.height) * progress,
  };
}

/**
 * Preserves the authored separation between multiple targets. If ideal tiny
 * padding would make neighbouring frames cross, all visual expansion eases
 * back just enough to keep the frames touching rather than overlapping.
 */
export function getSpotlightVisualRects(
  rects: readonly SpotlightRect[],
  sceneSize: Readonly<{ width: number; height: number }>,
): readonly SpotlightRect[] {
  const originals = rects.map(normalizeSpotlightRect);
  const expanded = originals.map((rect) => getSpotlightVisualRect(rect, sceneSize));
  const intersects = (candidates: readonly SpotlightRect[]) =>
    candidates.some((rect, index) =>
      candidates.slice(index + 1).some((candidate) => rectsIntersect(rect, candidate)),
    );

  if (!intersects(expanded)) return expanded;

  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const middle = (lower + upper) / 2;
    const candidates = originals.map((rect, index) => interpolateRect(rect, expanded[index], middle));
    if (intersects(candidates)) upper = middle;
    else lower = middle;
  }
  return originals.map((rect, index) => interpolateRect(rect, expanded[index], lower));
}

export function fitSceneFrameWidth(
  area: Readonly<{ width: number; height: number }>,
  aspectRatio: number,
  maxWidth = 900,
): number {
  if (area.width <= 0 || area.height <= 0 || aspectRatio <= 0) return 0;
  return Math.max(0, Math.min(area.width, area.height * aspectRatio, maxWidth));
}

export function getClueMarkerPosition(rect: SpotlightRect) {
  return {
    left: percentage(rect.x + rect.width / 2),
    top: percentage(rect.y + rect.height / 2),
  };
}

export function getClueMarkerPositions(rects: readonly SpotlightRect[]) {
  return rects.map(getClueMarkerPosition);
}

export function getSceneCropStyle(rect: SpotlightRect) {
  return {
    height: `${100 / rect.height}%` as `${number}%`,
    left: `${-(rect.x / rect.width) * 100}%` as `${number}%`,
    top: `${-(rect.y / rect.height) * 100}%` as `${number}%`,
    width: `${100 / rect.width}%` as `${number}%`,
  };
}

export type SpotlightPresentation = Readonly<{
  mode: 'individual' | 'grouped' | 'sequential';
  rects: readonly SpotlightRect[];
  summaryRect: SpotlightRect | null;
}>;

export function normalizeSpotlightRect(rect: SpotlightRect): SpotlightRect {
  const x = clamp01(rect.x);
  const y = clamp01(rect.y);
  return {
    x,
    y,
    width: Math.max(0, Math.min(rect.width, 1 - x)),
    height: Math.max(0, Math.min(rect.height, 1 - y)),
  };
}

/**
 * Tiles only the complement of every target rectangle. Rendering these tiles
 * above the scene dims non-target pixels without putting a translucent layer
 * over an active object.
 */
export function buildSpotlightDimRegions(
  targets: readonly SpotlightRect[],
): readonly SpotlightRect[] {
  if (targets.length === 0) return [];
  const normalized = targets.map(normalizeSpotlightRect);
  const xEdges = [...new Set([0, 1, ...normalized.flatMap((rect) => [rect.x, rect.x + rect.width])])].sort(
    (left, right) => left - right,
  );
  const yEdges = [...new Set([0, 1, ...normalized.flatMap((rect) => [rect.y, rect.y + rect.height])])].sort(
    (top, bottom) => top - bottom,
  );
  const regions: SpotlightRect[] = [];

  for (let yIndex = 0; yIndex < yEdges.length - 1; yIndex += 1) {
    for (let xIndex = 0; xIndex < xEdges.length - 1; xIndex += 1) {
      const x = xEdges[xIndex];
      const y = yEdges[yIndex];
      const width = xEdges[xIndex + 1] - x;
      const height = yEdges[yIndex + 1] - y;
      const centreX = x + width / 2;
      const centreY = y + height / 2;
      const insideTarget = normalized.some(
        (target) =>
          centreX >= target.x &&
          centreX <= target.x + target.width &&
          centreY >= target.y &&
          centreY <= target.y + target.height,
      );
      if (!insideTarget && width > 0 && height > 0) regions.push({ x, y, width, height });
    }
  }

  return regions;
}

function rectsIntersect(left: SpotlightRect, right: SpotlightRect): boolean {
  return (
    Math.min(left.x + left.width, right.x + right.width) > Math.max(left.x, right.x) &&
    Math.min(left.y + left.height, right.y + right.height) > Math.max(left.y, right.y)
  );
}

function unionRect(rects: readonly SpotlightRect[]): SpotlightRect {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return normalizeSpotlightRect({ x: left, y: top, width: right - left, height: bottom - top });
}

/**
 * Keeps separate borders when they do not overlap, groups a compact comparison,
 * and exposes explicit phases for large overlaps. Consumers decide when phases
 * advance; the visual utility owns no activity or conversation timer.
 */
export function resolveSpotlightPresentation(
  targets: readonly SpotlightRect[],
): SpotlightPresentation {
  const normalized = targets.map(normalizeSpotlightRect);
  const hasIntersection = normalized.some((target, index) =>
    normalized.slice(index + 1).some((candidate) => rectsIntersect(target, candidate)),
  );

  if (!hasIntersection) return { mode: 'individual', rects: normalized, summaryRect: null };

  const groupedRect = unionRect(normalized);
  if (groupedRect.width * groupedRect.height <= GROUPED_UNION_AREA_LIMIT) {
    return { mode: 'grouped', rects: [groupedRect], summaryRect: null };
  }

  return { mode: 'sequential', rects: normalized, summaryRect: groupedRect };
}

export function getSpotlightPhaseCount(presentation: SpotlightPresentation): number {
  if (presentation.mode !== 'sequential') return presentation.rects.length > 0 ? 1 : 0;
  return presentation.rects.length + (presentation.summaryRect ? 1 : 0);
}

export function getSpotlightFrameRects(
  presentation: SpotlightPresentation,
  phaseIndex: number,
): readonly SpotlightRect[] {
  if (presentation.mode !== 'sequential') return presentation.rects;
  const safeIndex = Math.max(0, Math.min(phaseIndex, getSpotlightPhaseCount(presentation) - 1));
  if (safeIndex < presentation.rects.length) return [presentation.rects[safeIndex]];
  return presentation.summaryRect ? [presentation.summaryRect] : [];
}
