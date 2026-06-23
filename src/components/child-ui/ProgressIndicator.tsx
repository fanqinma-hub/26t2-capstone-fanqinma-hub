import { StyleSheet, Text, View } from 'react-native';

import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type ProgressIndicatorProps = {
  currentActivity: number;
  totalActivities: number;
  accessibilityLabel?: string;
};

function toPositiveWholeNumber(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function ProgressIndicator({ currentActivity, totalActivities, accessibilityLabel }: ProgressIndicatorProps) {
  const safeTotal = toPositiveWholeNumber(totalActivities);
  const safeCurrent = safeTotal === 0 ? 0 : Math.min(Math.max(toPositiveWholeNumber(currentActivity), 1), safeTotal);
  const progress = safeTotal === 0 ? 0 : safeCurrent / safeTotal;
  const progressText = safeTotal === 0 ? 'Activity progress is unavailable.' : `Activity ${safeCurrent} of ${safeTotal}`;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? progressText}
      accessibilityRole="progressbar"
      accessibilityValue={safeTotal === 0 ? { text: progressText } : { min: 1, max: safeTotal, now: safeCurrent }}
      style={styles.container}>
      <Text style={styles.label}>{progressText}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    ...Typography.label,
    color: SemanticColors.primaryText,
  },
  track: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.pill,
    height: ComponentSizes.progressBarHeight,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: BrandColors.tangerine,
    borderRadius: Radii.pill,
    height: '100%',
  },
});
