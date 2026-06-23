import { Image, StyleSheet, Text, View } from 'react-native';

import { clientIconAssets } from '@/constants/client-assets';
import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type FeedbackBubbleVariant = 'neutral' | 'encouragement' | 'success' | 'help' | 'error';

export type FeedbackBubbleProps = {
  message: string;
  title?: string;
  variant?: FeedbackBubbleVariant;
  accessibilityLabel?: string;
};

const variantContent: Record<FeedbackBubbleVariant, { icon: string; imageSource?: number; title: string }> = {
  neutral: { icon: '💬', title: 'A note' },
  encouragement: { icon: '🌱', title: 'Keep going' },
  success: { icon: '🎉', imageSource: clientIconAssets.birthdayParty.source as number, title: 'Great work' },
  help: { icon: '💡', title: 'Helpful hint' },
  error: { icon: '⚠️', title: 'Let us try again' },
};

export function FeedbackBubble({ message, title, variant = 'neutral', accessibilityLabel }: FeedbackBubbleProps) {
  const content = variantContent[variant];
  const resolvedTitle = title ?? content.title;

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? `${resolvedTitle}. ${message}`} style={[styles.container, styles[variant]]}>
      {content.imageSource ? <Image accessible={false} resizeMode="contain" source={content.imageSource} style={styles.assetIcon} /> : <Text style={styles.icon}>{content.icon}</Text>}
      <View style={styles.copy}>
        <Text style={styles.title}>{resolvedTitle}</Text>
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
  assetIcon: {
    height: 44,
    width: 44,
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
