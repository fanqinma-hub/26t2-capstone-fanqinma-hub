/**
 * Development-only component state gallery. Re-evaluate or remove this route before a production release.
 */
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  FeedbackBubble,
  type FeedbackBubbleVariant,
  KoolDialogue,
  type KoolDialogueVariant,
  ListeningIndicator,
  type ListeningIndicatorState,
  MicrophoneButton,
  type MicrophoneButtonState,
  ProgressIndicator,
} from '@/components/child-ui';
import { ComponentSizes, SemanticColors, Spacing, Typography } from '@/theme';

const dialogueVariants: KoolDialogueVariant[] = ['default', 'prompt', 'gentle'];
const microphoneStates: MicrophoneButtonState[] = ['idle', 'listening', 'processing', 'disabled', 'error'];
const listeningStates: ListeningIndicatorState[] = [
  'listening',
  'gentleCue',
  'reprompt',
  'tapHelpAvailable',
  'finalListening',
  'processing',
  'error',
];
const feedbackVariants: FeedbackBubbleVariant[] = ['neutral', 'encouragement', 'success', 'help', 'error'];

function PreviewSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function UiPreviewScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heading}>
        <Text style={styles.title}>FunWattle UI preview</Text>
        <Text style={styles.subtitle}>Development-only visual checks for every shared component state.</Text>
      </View>

      <PreviewSection title="Kool dialogue">
        {dialogueVariants.map((variant) => (
          <KoolDialogue key={variant} message="What can you see in this picture?" variant={variant} />
        ))}
      </PreviewSection>

      <PreviewSection title="Microphone button">
        {microphoneStates.map((state) => (
          <MicrophoneButton key={state} onPress={() => undefined} state={state} />
        ))}
      </PreviewSection>

      <PreviewSection title="Listening indicator">
        {listeningStates.map((state) => (
          <ListeningIndicator key={state} state={state} />
        ))}
      </PreviewSection>

      <PreviewSection title="Progress indicator">
        <ProgressIndicator currentActivity={2} totalActivities={5} />
        <ProgressIndicator currentActivity={0} totalActivities={0} />
      </PreviewSection>

      <PreviewSection title="Feedback bubble">
        {feedbackVariants.map((variant) => (
          <FeedbackBubble key={variant} message="You are doing a wonderful job." variant={variant} />
        ))}
      </PreviewSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: Spacing.four,
    maxWidth: ComponentSizes.contentMaxWidth,
    padding: Spacing.four,
    width: '100%',
  },
  heading: {
    gap: Spacing.one,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
  },
  subtitle: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
  },
});
