function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Continuous responsive dimensions; portrait artwork is capped again by measurements. */
export function getFluidLayout(width: number, height: number) {
  const horizontal = width >= 960 || (height <= 560 && width >= 640);
  return {
    horizontal,
    compactTitle: width <= 430,
    compactDialogue: width <= 430 || (!horizontal && height <= 780),
    showMicLabel: horizontal || height >= 620,
    gap: clamp(Math.round(height * 0.014), 6, 14),
    pagePaddingH: clamp(Math.round(width * 0.035), 12, 28),
    pagePaddingV: clamp(Math.round(height * 0.016), 8, 20),
    breatheMax: clamp(Math.round(height * 0.03), 6, 24),
    sceneMaxHeight: clamp(height * 0.46, 200, 620),
    mascotVisualHeight: horizontal
      ? clamp(Math.round(height * 0.19), 104, 232)
      : clamp(Math.round(height * 0.24), 124, 280),
    micVisualSize: clamp(Math.round(height * 0.15), 84, 156),
    contentMaxWidth: horizontal ? 1440 : 820,
  };
}

export function getPortraitMascotVisualHeight({
  desiredHeight,
  dialogueHeight,
  gap,
  headerHeight,
  pageHeight,
  pagePaddingV,
  sceneHeight,
}: Readonly<{
  desiredHeight: number;
  dialogueHeight: number;
  gap: number;
  headerHeight: number;
  pageHeight: number;
  pagePaddingV: number;
  sceneHeight: number;
}>) {
  if (pageHeight <= 0 || headerHeight <= 0 || dialogueHeight <= 0 || sceneHeight <= 0) {
    return desiredHeight;
  }
  const remainingHeight =
    pageHeight -
    pagePaddingV * 2 -
    headerHeight -
    sceneHeight -
    dialogueHeight -
    gap * 3;
  return Math.max(0, Math.min(desiredHeight, Math.floor(remainingHeight)));
}
