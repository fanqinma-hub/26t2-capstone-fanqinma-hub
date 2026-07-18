/**
 * Development-only component state gallery. Re-evaluate or remove this route before a production release.
 */
import { Redirect } from 'expo-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activityScreenVisualStatePresentation } from '@/components/activity/ActivityScreen';
import type { ActivityScreenVisualState } from '@/components/activity';
import { Role2ActivityFlowDemo, Role2SceneDemo } from '@/components/activity/dev';
import {
  FeedbackBubble,
  type FeedbackBubbleVariant,
  KoolDialogue,
  type KoolDialogueVariant,
  KoolMascot,
  type KoolMascotState,
  MicrophoneButton,
  type MicrophoneButtonState,
  ProgressIndicator,
} from '@/components/child-ui';
import { clientScenes } from '@/constants/client-assets';
import { ComponentSizes, SemanticColors, Spacing, Typography } from '@/theme';

const dialogueVariants: KoolDialogueVariant[] = ['default', 'prompt', 'gentle'];
const microphoneStates: MicrophoneButtonState[] = ['idle', 'listening', 'processing', 'disabled', 'error'];
const feedbackVariants: FeedbackBubbleVariant[] = ['neutral', 'encouragement', 'success', 'help', 'error'];
const activityVisualStates: ActivityScreenVisualState[] = [
  'prompt',
  'listening',
  'gentleCue',
  'reprompt',
  'tapHelpAvailable',
  'cluePresented',
  'finalListening',
  'processing',
  'success',
  'retry',
  'complete',
  'error',
];
const mascotStates: KoolMascotState[] = ['idle', 'wave', 'speaking', 'listening', 'thinking', 'retry', 'success', 'breathe'];

function PreviewSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function UiPreviewScreen() {
  const [showActivityFlow, setShowActivityFlow] = useState(false);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  if (showActivityFlow) {
    return <Role2ActivityFlowDemo onExit={() => setShowActivityFlow(false)} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heading}>
        <Text style={styles.title}>FunWattle UI preview</Text>
        <Text style={styles.subtitle}>Development-only visual checks for every shared component state.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowActivityFlow(true)}
          style={styles.flowPreviewButton}>
          <Text style={styles.flowPreviewButtonText}>Open complete Activity 1–5 visual flow</Text>
        </Pressable>
      </View>

      <PreviewSection title="Kool dialogue">
        {dialogueVariants.map((variant) => (
          <KoolDialogue key={variant} message="What can you see in this picture?" variant={variant} />
        ))}
      </PreviewSection>

      <PreviewSection title="Kool mascot states">
        <View style={styles.mascotGrid}>
          {mascotStates.map((state) => (
            <View key={state} style={styles.mascotState}>
              <KoolMascot size="small" state={state} />
              <Text style={styles.mascotStateName}>{state}</Text>
            </View>
          ))}
        </View>
      </PreviewSection>

      <PreviewSection title="Activity 1 client scene">
        <View accessible accessibilityLabel={clientScenes.activity1.label} style={styles.sceneFrame}>
          <Image accessible accessibilityLabel="Activity 1 scene" resizeMode="contain" source={clientScenes.activity1.source} style={styles.sceneImage} />
        </View>
      </PreviewSection>

      <PreviewSection title="Activity 2–5 development fixture">
        <Role2SceneDemo />
      </PreviewSection>

      <PreviewSection title="Activity visual states">
        <Text style={styles.sectionDescription}>These are the visual presentations available to the Activity 1 shell. State transitions remain outside this preview.</Text>
        {activityVisualStates.map((state) => {
          const presentation = activityScreenVisualStatePresentation[state];

          return (
            <View key={state} style={styles.activityState}>
              <Text style={styles.activityStateName}>{presentation.previewLabel}</Text>
              {presentation.dialogueVariant ? <KoolDialogue message="What can you see in this picture?" variant={presentation.dialogueVariant} /> : null}
            </View>
          );
        })}
      </PreviewSection>

      <PreviewSection title="Microphone button">
        {microphoneStates.map((state) => (
          <MicrophoneButton key={state} onPress={() => undefined} state={state} />
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
  flowPreviewButton: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surfaceAccent,
    borderColor: SemanticColors.focus,
    borderRadius: 24,
    borderWidth: 2,
    minHeight: 56,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  flowPreviewButtonText: {
    ...Typography.button,
    color: SemanticColors.primaryText,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
  },
  sectionDescription: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  sceneFrame: {
    aspectRatio: 1.5,
    backgroundColor: SemanticColors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  sceneImage: {
    height: '100%',
    width: '100%',
  },
  activityState: {
    gap: Spacing.two,
  },
  activityStateName: {
    ...Typography.status,
    color: SemanticColors.primaryText,
  },
  mascotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  mascotState: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderRadius: 16,
    minWidth: 118,
    padding: Spacing.one,
  },
  mascotStateName: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
});
