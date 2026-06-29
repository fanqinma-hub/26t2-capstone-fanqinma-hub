import { StyleSheet, Text, View } from 'react-native';

import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type KoolDialogueVariant = 'default' | 'prompt' | 'gentle';

export type KoolDialogueProps = {
  message: string;
  speakerLabel?: string;
  variant?: KoolDialogueVariant;
  size?: 'default' | 'compact';
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
  size = 'default',
  accessibilityLabel,
}: KoolDialogueProps) {
  const label = speakerLabel ?? variantLabels[variant];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${label}: ${message}`}
      style={[styles.container, styles[variant], size === 'compact' && styles.containerCompact]}>
      <Text style={[styles.speaker, size === 'compact' && styles.speakerCompact]}>{label}</Text>
      <Text style={[styles.message, size === 'compact' && styles.messageCompact]}>{message}</Text>
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
  containerCompact: {
    gap: Spacing.half,
    paddingHorizontal: 12,
    paddingVertical: Spacing.two,
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
  speakerCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  message: {
    ...Typography.speech,
    color: SemanticColors.primaryText,
  },
  messageCompact: {
    fontSize: 20,
    lineHeight: 27,
  },
});
