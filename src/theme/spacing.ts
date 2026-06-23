export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const SpacingScale = {
  xxs: Spacing.half,
  xs: Spacing.one,
  sm: Spacing.two,
  md: 12,
  lg: Spacing.three,
  xl: Spacing.four,
  xxl: Spacing.five,
  xxxl: 48,
} as const;
