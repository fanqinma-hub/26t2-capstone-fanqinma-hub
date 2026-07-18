import { StyleSheet, Text, View } from 'react-native';

import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type KoolDialogueVariant = 'default' | 'prompt' | 'gentle';

export type KoolDialogueProps = {
  message: string;
  speakerLabel?: string;
  trailingLabel?: string;
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
  trailingLabel,
  variant = 'default',
  size = 'default',
  accessibilityLabel,
}: KoolDialogueProps) {
  const label = speakerLabel ?? variantLabels[variant];

  return (
    <View
      accessible
      accessibilityLabel={
        accessibilityLabel ?? `${label}${trailingLabel ? `. ${trailingLabel}` : ''}: ${message}`
      }
      style={[styles.container, styles[variant], size === 'compact' && styles.containerCompact]}>
      <View style={styles.labelRow}>
        <Text style={[styles.speaker, size === 'compact' && styles.speakerCompact]}>{label}</Text>
        {trailingLabel ? (
          <Text style={[styles.trailingLabel, size === 'compact' && styles.trailingLabelCompact]}>
            {trailingLabel}
          </Text>
        ) : null}
      </View>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 16,
    lineHeight: 20,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  trailingLabel: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
    textAlign: 'right',
  },
  trailingLabelCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  message: {
    ...Typography.speech,
    color: SemanticColors.primaryText,
  },
  messageCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
});
