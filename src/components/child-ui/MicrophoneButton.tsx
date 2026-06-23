import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type MicrophoneButtonState = 'idle' | 'listening' | 'processing' | 'disabled' | 'error';

export type MicrophoneButtonProps = {
  state?: MicrophoneButtonState;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const stateContent: Record<
  MicrophoneButtonState,
  { icon: string; label: string; helperText: string; accessibilityHint: string }
> = {
  idle: {
    icon: '🎤',
    label: 'Tap to speak',
    helperText: 'Your microphone is ready.',
    accessibilityHint: 'Double tap to begin speaking.',
  },
  listening: {
    icon: '👂',
    label: 'Listening now',
    helperText: 'Speak when you are ready.',
    accessibilityHint: 'The app is listening.',
  },
  processing: {
    icon: '💭',
    label: 'Thinking…',
    helperText: 'Please wait for the next prompt.',
    accessibilityHint: 'The app is processing your response.',
  },
  disabled: {
    icon: '🔒',
    label: 'Microphone unavailable',
    helperText: 'This button cannot be used right now.',
    accessibilityHint: 'The microphone button is disabled.',
  },
  error: {
    icon: '⚠️',
    label: 'Try again',
    helperText: 'Something went wrong. Tap to try again.',
    accessibilityHint: 'Double tap to try the microphone again.',
  },
};

export function MicrophoneButton({ state = 'idle', onPress, accessibilityLabel }: MicrophoneButtonProps) {
  const content = stateContent[state];
  const isDisabled = state === 'disabled' || state === 'processing';

  return (
    <Pressable
      accessibilityHint={content.accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? `${content.label}. ${content.helperText}`}
      accessibilityRole="button"
      accessibilityState={{ busy: state === 'processing', disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[state], pressed && !isDisabled && styles.pressed]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{content.icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{content.label}</Text>
        <Text style={styles.helperText}>{content.helperText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radii.large,
    borderWidth: Spacing.half,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: ComponentSizes.minimumTouchTarget,
    padding: Spacing.two,
  },
  idle: {
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
  },
  listening: {
    backgroundColor: BrandColors.mimosa,
    borderColor: SemanticColors.focus,
  },
  processing: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.disabled,
  },
  disabled: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: SemanticColors.disabled,
  },
  error: {
    backgroundColor: SemanticColors.surface,
    borderColor: SemanticColors.error,
  },
  pressed: {
    opacity: 0.8,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderRadius: Radii.pill,
    height: ComponentSizes.microphoneButton,
    justifyContent: 'center',
    width: ComponentSizes.microphoneButton,
  },
  icon: {
    ...Typography.heading,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  label: {
    ...Typography.status,
    color: SemanticColors.primaryText,
  },
  helperText: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
});
