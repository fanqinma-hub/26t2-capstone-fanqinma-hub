const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const GROUPED_UNION_AREA_LIMIT = 0.24;

export type SpotlightRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

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
