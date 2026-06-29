import { Dimensions } from 'react-native';

// Responsive sizing helpers. Sizes are derived once at module load from the
// window dimensions — adequate for this portrait children's app. Rotation does
// not re-scale at runtime (known limitation; revisit with useWindowDimensions
// if landscape support is added later).

const BASE_WIDTH = 375; // iPhone-class reference width the design was tuned at.

const { width, height } = Dimensions.get('window');

// Use the shorter side so landscape or unusually wide windows do not over-scale.
const shortSide = Math.min(width, height);

export const screenWidth = width;
export const screenHeight = height;

export const isSmallPhone = shortSide < 360;
export const isTablet = shortSide >= 600;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Clamp the ratio so tiny phones stay legible and tablets do not inflate text.
const ratio = clamp(shortSide / BASE_WIDTH, 0.85, 1.25);

// Linear scale — for dimensions that should track screen size closely
// (touch targets, icons, the mascot).
export function scale(size: number): number {
  return Math.round(size * ratio);
}

// Tempered scale — for typography, where full linear scaling reads as too
// aggressive. factor=0 keeps the base size, factor=1 equals scale().
export function moderateScale(size: number, factor = 0.4): number {
  return Math.round(size + (size * ratio - size) * factor);
}
