import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export type MicrophoneButtonState = 'idle' | 'listening' | 'processing' | 'disabled' | 'error';

export type MicrophoneButtonProps = {
  state?: MicrophoneButtonState;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  accessibilityLabel?: string;
  layout?: 'default' | 'primary';
  showLabel?: boolean;
  /** 0..1 live mic level; drives the "I can hear you" waveform while holding. */
  audioLevel?: SharedValue<number>;
};

const stateContent: Record<
  MicrophoneButtonState,
  { label: string; helperText: string; accessibilityHint: string }
> = {
  idle: {
    label: 'Hold to talk',
    helperText: 'Hold the button and tell Kool.',
    accessibilityHint: 'Press and hold to speak, then let go when you are done.',
  },
  listening: {
    label: 'Listening…',
    helperText: 'Keep talking, then let go.',
    accessibilityHint: 'The app is listening while you hold the button.',
  },
  processing: {
    label: 'Thinking…',
    helperText: 'Please wait for the next prompt.',
    accessibilityHint: 'The app is processing your response.',
  },
  disabled: {
    label: 'Listen to Kool',
    helperText: 'Kool is talking now.',
    accessibilityHint: 'Please wait while Kool is speaking.',
  },
  error: {
    label: 'Try again',
    helperText: 'Something went wrong. Tap to try again.',
    accessibilityHint: 'Double tap to try the microphone again.',
  },
};

function MicrophoneGlyph({ color }: { color: string }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.glyph}>
      <View style={[styles.glyphHead, { backgroundColor: color }]} />
      <View style={[styles.glyphStem, { backgroundColor: color }]} />
      <View style={[styles.glyphBase, { backgroundColor: color }]} />
    </View>
  );
}

export function MicrophoneButton({
  state = 'idle',
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  layout = 'default',
  showLabel = true,
  audioLevel,
}: MicrophoneButtonProps) {
  const content = stateContent[state];
  const isDisabled = state === 'disabled' || state === 'processing';
  const iconColor = state === 'listening' ? BrandColors.marsala : SemanticColors.primaryText;

  // Expands and brightens with the live mic level while the child holds and talks.
  const waveStyle = useAnimatedStyle(() => {
    const level = audioLevel?.value ?? 0;
    return {
      opacity: 0.16 + level * 0.5,
      transform: [{ scale: 1 + level * 0.42 }],
    };
  });

  return (
    <Pressable
      accessibilityHint={content.accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? `${content.label}. ${content.helperText}`}
      accessibilityRole="button"
      accessibilityState={{ busy: state === 'processing', disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.button,
        styles[state],
        layout === 'primary' && styles.primaryButton,
        layout === 'primary' && !showLabel && styles.primaryIconOnly,
        pressed && !isDisabled && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>
        {state === 'listening' ? <Animated.View pointerEvents="none" style={[styles.wave, waveStyle]} /> : null}
        <View style={[styles.iconCircle, layout === 'primary' && styles.primaryIconCircle, state === 'listening' && styles.listeningIconCircle]}>
          <SymbolView
            fallback={<MicrophoneGlyph color={iconColor} />}
            name="mic.fill"
            size={48}
            tintColor={iconColor}
          />
        </View>
      </View>
      {showLabel ? (
        <View style={[styles.copy, layout === 'primary' && styles.primaryCopy]}>
          <Text style={[styles.label, layout === 'primary' && styles.primaryLabel]}>{content.label}</Text>
          {layout === 'default' ? <Text style={styles.helperText}>{content.helperText}</Text> : null}
        </View>
      ) : null}
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
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'column',
    gap: Spacing.one,
    minHeight: ComponentSizes.microphoneButton + Spacing.five,
    minWidth: ComponentSizes.microphoneButton + Spacing.five,
    padding: 0,
  },
  primaryIconOnly: {
    minHeight: ComponentSizes.microphoneButton,
    minWidth: ComponentSizes.microphoneButton,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    backgroundColor: BrandColors.mimosa,
    borderRadius: Radii.pill,
    height: ComponentSizes.microphoneButton,
    position: 'absolute',
    width: ComponentSizes.microphoneButton,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderRadius: Radii.pill,
    height: ComponentSizes.microphoneButton,
    justifyContent: 'center',
    width: ComponentSizes.microphoneButton,
  },
  primaryIconCircle: {
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderWidth: Spacing.half,
    height: ComponentSizes.microphoneButton,
    width: ComponentSizes.microphoneButton,
  },
  listeningIconCircle: {
    borderColor: BrandColors.marsala,
    borderWidth: 4,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  primaryCopy: {
    flex: 0,
  },
  label: {
    ...Typography.status,
    color: SemanticColors.primaryText,
  },
  primaryLabel: {
    textAlign: 'center',
  },
  helperText: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  glyph: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'flex-end',
    width: 48,
  },
  glyphHead: {
    borderRadius: 12,
    height: 28,
    width: 18,
  },
  glyphStem: {
    borderRadius: 2,
    height: 12,
    marginTop: 2,
    width: 4,
  },
  glyphBase: {
    borderRadius: 2,
    height: 4,
    marginTop: 1,
    width: 22,
  },
});
