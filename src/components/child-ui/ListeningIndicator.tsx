import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { clientUiAssets } from '@/constants/client-assets';
import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type ListeningIndicatorState =
  | 'listening'
  | 'gentleCue'
  | 'reprompt'
  | 'tapHelpAvailable'
  | 'finalListening'
  | 'processing'
  | 'error';

export type ListeningIndicatorProps = {
  state: ListeningIndicatorState;
  accessibilityLabel?: string;
};

const stateContent: Record<ListeningIndicatorState, { icon: string; imageSource?: ImageSourcePropType; title: string; description: string }> = {
  listening: {
    icon: '👂',
    title: 'Listening',
    description: 'Tell us what you can see.',
  },
  gentleCue: {
    icon: '💡',
    title: 'Here is a clue',
    description: 'Take a look and try one more word.',
  },
  reprompt: {
    icon: '🗣️',
    title: 'Let us try again',
    description: 'You can say it in your own words.',
  },
  tapHelpAvailable: {
    icon: '❔',
    title: 'Help is ready',
    description: 'Tap the help button if you would like a clue.',
  },
  finalListening: {
    icon: '⭐',
    title: 'One last try',
    description: 'We are listening for your answer.',
  },
  processing: {
    icon: '💭',
    imageSource: clientUiAssets.thinking.source,
    title: 'Thinking',
    description: 'Please wait for the next prompt.',
  },
  error: {
    icon: '⚠️',
    title: 'We need another try',
    description: 'The app could not understand that response.',
  },
};

export function ListeningIndicator({ state, accessibilityLabel }: ListeningIndicatorProps) {
  const content = stateContent[state];

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? `${content.title}. ${content.description}`} style={[styles.container, styles[state]]}>
      {content.imageSource ? <Image accessible={false} resizeMode="contain" source={content.imageSource} style={styles.assetIcon} /> : <Text style={styles.icon}>{content.icon}</Text>}
      <View style={styles.copy}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description}>{content.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: Radii.medium,
    borderWidth: Spacing.half,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  listening: {
    backgroundColor: BrandColors.mimosa,
    borderColor: SemanticColors.focus,
  },
  gentleCue: {
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: BrandColors.tangerine,
  },
  reprompt: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
  },
  tapHelpAvailable: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.focus,
  },
  finalListening: {
    backgroundColor: BrandColors.mimosa,
    borderColor: BrandColors.marsala,
  },
  processing: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.disabled,
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
  description: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
});
