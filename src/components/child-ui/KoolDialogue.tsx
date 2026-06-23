import { StyleSheet, Text, View } from 'react-native';

import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type KoolDialogueVariant = 'default' | 'prompt' | 'gentle';

export type KoolDialogueProps = {
  message: string;
  speakerLabel?: string;
  variant?: KoolDialogueVariant;
  accessibilityLabel?: string;
};

const variantLabels: Record<KoolDialogueVariant, string> = {
  default: 'Kool says',
  prompt: 'Kool asks',
  gentle: 'Kool reminds',
};

export function KoolDialogue({
  message,
  speakerLabel,
  variant = 'default',
  accessibilityLabel,
}: KoolDialogueProps) {
  const label = speakerLabel ?? variantLabels[variant];

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? `${label}: ${message}`} style={[styles.container, styles[variant]]}>
      <Text style={styles.speaker}>{label}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.large,
    borderWidth: Spacing.half,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  default: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
  },
  prompt: {
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: BrandColors.tangerine,
  },
  gentle: {
    backgroundColor: BrandColors.mimosa,
    borderColor: SemanticColors.warning,
  },
  speaker: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
  },
  message: {
    ...Typography.body,
    color: SemanticColors.primaryText,
  },
});
