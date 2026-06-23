import { StyleSheet, Text, View } from 'react-native';

import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type FeedbackBubbleVariant = 'neutral' | 'encouragement' | 'success' | 'help' | 'error';

export type FeedbackBubbleProps = {
  message: string;
  variant?: FeedbackBubbleVariant;
  accessibilityLabel?: string;
};

const variantContent: Record<FeedbackBubbleVariant, { icon: string; title: string }> = {
  neutral: { icon: '💬', title: 'A note' },
  encouragement: { icon: '🌱', title: 'Keep going' },
  success: { icon: '🎉', title: 'Great work' },
  help: { icon: '💡', title: 'Helpful hint' },
  error: { icon: '⚠️', title: 'Let us try again' },
};

export function FeedbackBubble({ message, variant = 'neutral', accessibilityLabel }: FeedbackBubbleProps) {
  const content = variantContent[variant];

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? `${content.title}. ${message}`} style={[styles.container, styles[variant]]}>
      <Text style={styles.icon}>{content.icon}</Text>
      <View style={styles.copy}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: Radii.medium,
    borderWidth: Spacing.half,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  neutral: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.pewter,
  },
  encouragement: {
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: BrandColors.tangerine,
  },
  success: {
    backgroundColor: BrandColors.mimosa,
    borderColor: SemanticColors.success,
  },
  help: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.focus,
  },
  error: {
    backgroundColor: SemanticColors.surface,
    borderColor: SemanticColors.error,
  },
  icon: {
    ...Typography.headingSmall,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    ...Typography.label,
    color: SemanticColors.primaryText,
  },
  message: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
});
