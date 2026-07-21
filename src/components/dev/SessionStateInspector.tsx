import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/session';
import {
  BrandColors,
  Radii,
  SemanticColors,
  Spacing,
  Typography,
} from '@/theme';
import type { ActivityPromptDefinition } from '@/types/activity.types';

type SessionStateInspectorProps = {
  activeQuestionId: string;
  onResetSession: () => void;
  onSelectQuestion: (questionId: string) => void;
  questions: readonly Pick<
    ActivityPromptDefinition,
    'id' | 'sequence' | 'promptText'
  >[];
};

function displayValue(value: string | number | null) {
  return value === null || value === '' ? 'none' : String(value);
}

export function SessionStateInspector({
  activeQuestionId,
  onResetSession,
  onSelectQuestion,
  questions,
}: SessionStateInspectorProps) {
  const { store } = useSession();

  if (!__DEV__) return null;

  const session = store.session;
  const latestAttempt = session?.attempts.at(-1);
  const activePrompt = session?.promptRecords.find(
    (record) => record.promptId === activeQuestionId,
  );

  return (
    <View
      accessibilityLabel="Development-only Session State Inspector"
      style={styles.panel}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>Session State Inspector</Text>
          <Text style={styles.caption}>
            Hydrated and persisted Role 3 session data
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onResetSession}
          style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset data</Text>
        </Pressable>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.sectionTitle}>Test-only question picker</Text>
        <Text style={styles.caption}>
          Switch prompts without waiting through the full demo.
        </Text>
        <View style={styles.questionButtons}>
          {questions.map((question) => {
            const isActive = question.id === activeQuestionId;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={question.id}
                onPress={() => onSelectQuestion(question.id)}
                style={[
                  styles.questionButton,
                  isActive && styles.questionButtonActive,
                ]}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.questionButtonText,
                    isActive && styles.questionButtonTextActive,
                  ]}>
                  {question.sequence}. {question.promptText}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Status</Text>
          <Text style={styles.summaryValue}>
            {session?.status ?? store.hydrationStatus}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Learning unit</Text>
          <Text style={styles.summaryValue}>{session?.unitId ?? 'none'}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Activity</Text>
          <Text style={styles.summaryValue}>
            {displayValue(session?.activeActivityId ?? null)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Attempts</Text>
          <Text style={styles.summaryValue}>{session?.attempts.length ?? 0}</Text>
        </View>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.sectionTitle}>Active prompt</Text>
        <Text style={styles.dataText}>
          ID: {displayValue(activePrompt?.promptId ?? activeQuestionId)}
        </Text>
        <Text style={styles.dataText}>
          Scaffold taps: {activePrompt?.scaffoldTapCount ?? 0}
        </Text>
        <Text style={styles.dataText}>
          Terminal attempt ID: {activePrompt?.terminalAttemptId ?? 'none'}
        </Text>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.sectionTitle}>Latest SpeechAttempt</Text>
        {latestAttempt ? (
          <>
            <Text style={styles.dataText}>
              Transcript: {displayValue(latestAttempt.transcript)}
            </Text>
            <Text style={styles.dataText}>
              Detected size words:{' '}
              {latestAttempt.detectedKeywords.join(', ') || 'none'}
            </Text>
            <Text style={styles.dataText}>
              Tier: {latestAttempt.tier ?? 'none'}
            </Text>
            <Text style={styles.dataText}>
              Primary words:{' '}
              {latestAttempt.detectedPrimaryWords.join(', ') || 'none'}
            </Text>
            <Text style={styles.dataText}>
              Confidence:{' '}
              {latestAttempt.confidence === null
                ? 'none'
                : latestAttempt.confidence.toFixed(2)}
            </Text>
            <Text style={styles.dataText}>
              Source/status: {latestAttempt.source} / {latestAttempt.status}
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>
            No attempt stored yet. Tap the demo microphone to record a
            development-only mock result.
          </Text>
        )}
      </View>

      <View style={styles.jsonCard}>
        <Text style={styles.sectionTitle}>Full SessionState JSON</Text>
        <Text selectable style={styles.jsonText}>
          {JSON.stringify(store, null, 2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.medium,
    borderWidth: 2,
    gap: Spacing.two,
    padding: Spacing.two,
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
  },
  caption: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  resetButton: {
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  resetButtonText: {
    ...Typography.label,
    color: BrandColors.marsala,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  questionButtons: {
    gap: Spacing.one,
  },
  questionButton: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.small,
    borderWidth: 1,
    minHeight: 44,
    padding: Spacing.one,
  },
  questionButtonActive: {
    backgroundColor: BrandColors.mimosa,
    borderColor: BrandColors.marsala,
  },
  questionButtonText: {
    ...Typography.bodySmall,
    color: SemanticColors.primaryText,
  },
  questionButtonTextActive: {
    fontFamily: Typography.bodyStrong.fontFamily,
  },
  summaryItem: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.small,
    flexGrow: 1,
    minWidth: 120,
    padding: Spacing.one,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  summaryValue: {
    ...Typography.bodyStrong,
    color: BrandColors.marsala,
  },
  dataCard: {
    backgroundColor: SemanticColors.surfaceWarm,
    borderRadius: Radii.small,
    gap: Spacing.half,
    padding: Spacing.two,
  },
  jsonCard: {
    gap: Spacing.one,
  },
  sectionTitle: {
    ...Typography.label,
    color: SemanticColors.primaryText,
  },
  dataText: {
    ...Typography.bodySmall,
    color: SemanticColors.primaryText,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  jsonText: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.small,
    color: SemanticColors.primaryText,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    padding: Spacing.two,
  },
});
