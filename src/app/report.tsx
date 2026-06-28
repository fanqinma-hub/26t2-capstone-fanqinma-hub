import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { brandAssets } from '@/constants/brand-assets';
import { activity01Definition } from '@/fixtures/activity-01.fixture';
import { reportDemoFixture } from '@/fixtures/report-demo.fixture';
import { useSession } from '@/session';
import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

type ReportAudience = 'parent' | 'therapist';

const reportReferenceLinks = [
  {
    label: 'How to write an early childhood provider report',
    url: 'https://www.ndis.gov.au/providers/working-participants/early-childhood-providers/how-write-early-childhood-provider-report',
  },
  {
    label: 'How to write a plan reassessment report',
    url: 'https://www.ndis.gov.au/providers/working-participants/allied-health-professionals/how-write-plan-reassessment-report',
  },
] as const;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ReportScreen() {
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const [audience, setAudience] = useState<ReportAudience>('parent');
  const [therapistNote, setTherapistNote] = useState<string>(reportDemoFixture.therapistNote);
  const router = useRouter();
  const { state: sessionState } = useSession();
  const cameFromCompletedActivity = firstParam(params.from) === 'activityComplete' && sessionState.status === 'completed';
  const activityPayload = useMemo(
    () => ({
      source: 'activityComplete',
      capturedAt: new Date().toISOString(),
      routeParams: params,
      session: sessionState,
      activityDefinition: activity01Definition, // BOB: not important, should not use this data
    }),
    [params, sessionState],
  );
  const activityPayloadJson = useMemo(
    () => JSON.stringify(activityPayload, null, 2),
    [activityPayload],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image accessible accessibilityLabel="FunWattle" resizeMode="contain" source={brandAssets.logos.main.source} style={styles.logo} />
            <Text style={styles.prototypeLabel}>{reportDemoFixture.reportLabel}</Text>
          </View>

          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>Activity 1 report</Text>
            <Text style={styles.subtitle}>{reportDemoFixture.sessionLabel}</Text>
            <Text style={styles.sampleDataLabel}>{reportDemoFixture.sampleDataLabel}</Text>
          </View>

          <View accessibilityRole="tablist" style={styles.toggle}>
            {(['parent', 'therapist'] as const).map((option) => {
              const selected = audience === option;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => setAudience(option)}
                  style={[styles.toggleButton, selected && styles.toggleButtonSelected]}>
                  <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{option === 'parent' ? 'Parent view' : 'Therapist view'}</Text>
                </Pressable>
              );
            })}
          </View>

          {audience === 'parent' ? (
            <View style={styles.stack}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>A bright start, {reportDemoFixture.childName}!</Text>
                <Text style={styles.cardBody}>{reportDemoFixture.parentSummary}</Text>
                <Text style={styles.encouragement}>{reportDemoFixture.encouragement}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Size words we practised</Text>
                <View style={styles.wordStack}>
                  {reportDemoFixture.sizeWordExamples.map((item) => (
                    <View key={item.word} style={styles.wordRow}>
                      <Text style={styles.wordChip}>{item.word}</Text>
                      <Text style={styles.wordExample}>{item.example}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>How Kool helped</Text>
                <Text style={styles.cardBody}>Kool gave {reportDemoFixture.helpCount} picture clue to help Sam keep going.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.stack}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Demo tier summary</Text>
                {reportDemoFixture.tierSummary.map((item) => (
                  <View key={item.tier} style={styles.tierRow}>
                    <View>
                      <Text style={styles.tierName}>{item.tier}</Text>
                      <Text style={styles.tierLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.tierCount}>{item.count}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Size-word examples</Text>
                {reportDemoFixture.sizeWordExamples.map((item) => (
                  <Text key={item.word} style={styles.wordExample}>{item.example}</Text>
                ))}
                <Text style={styles.helpCount}>Picture scaffold/help count: {reportDemoFixture.helpCount}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Therapist note</Text>
                <TextInput
                  accessibilityLabel="Editable therapist note"
                  multiline
                  onChangeText={setTherapistNote}
                  style={styles.noteInput}
                  value={therapistNote}
                />
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable accessibilityLabel="Download report. Demo only." accessibilityRole="button" disabled style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Download</Text>
            </Pressable>
            <Pressable accessibilityLabel="Share report. Demo only." accessibilityRole="button" disabled style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>{reportDemoFixture.disclaimer}</Text>
          </View>

          <View style={styles.appendixCard}>
            <Text style={styles.cardTitle}>{cameFromCompletedActivity ? 'Completed activity data' : 'Report writing resources'}</Text>
            {cameFromCompletedActivity ? (
              <ScrollView horizontal style={styles.jsonScroll}>
                <Text selectable style={styles.jsonText}>{activityPayloadJson}</Text>
              </ScrollView>
            ) : (
              <View style={styles.resourceStack}>
                {reportReferenceLinks.map((link) => (
                  <ExternalLink asChild href={link.url} key={link.url}>
                    <Pressable accessibilityRole="link" style={({ pressed }) => [styles.resourceLink, pressed && styles.resourceLinkPressed]}>
                      <Text style={styles.resourceLinkText}>{link.label}</Text>
                      <Text style={styles.resourceUrl}>{link.url}</Text>
                    </Pressable>
                  </ExternalLink>
                ))}
              </View>
            )}
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Back to home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    maxWidth: ComponentSizes.contentMaxWidth,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    height: 42,
    width: 142,
  },
  prototypeLabel: {
    ...Typography.bodySmall,
    color: BrandColors.marsala,
  },
  heading: {
    gap: Spacing.half,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
  },
  subtitle: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
  },
  sampleDataLabel: {
    ...Typography.label,
    color: BrandColors.marsala,
  },
  toggle: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    padding: Spacing.half,
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: Radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: ComponentSizes.minimumTouchTarget,
    paddingHorizontal: Spacing.two,
  },
  toggleButtonSelected: {
    backgroundColor: BrandColors.mimosa,
  },
  toggleText: {
    ...Typography.label,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
  toggleTextSelected: {
    color: SemanticColors.primaryText,
  },
  stack: {
    gap: Spacing.two,
  },
  card: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.large,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  cardTitle: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
  },
  cardBody: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
  },
  encouragement: {
    ...Typography.bodyStrong,
    color: BrandColors.marsala,
  },
  wordStack: {
    gap: Spacing.two,
  },
  wordRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  wordChip: {
    ...Typography.label,
    backgroundColor: BrandColors.mimosa,
    borderRadius: Radii.pill,
    color: SemanticColors.primaryText,
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  wordExample: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
    flex: 1,
    minWidth: 180,
  },
  tierRow: {
    alignItems: 'center',
    borderTopColor: SemanticColors.surfaceMuted,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  tierName: {
    ...Typography.label,
    color: SemanticColors.primaryText,
  },
  tierLabel: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  tierCount: {
    ...Typography.headingSmall,
    color: BrandColors.marsala,
  },
  helpCount: {
    ...Typography.bodyStrong,
    color: BrandColors.marsala,
  },
  noteInput: {
    ...Typography.body,
    backgroundColor: SemanticColors.surfaceWarm,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.medium,
    borderWidth: 1,
    color: SemanticColors.primaryText,
    minHeight: 128,
    padding: Spacing.two,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surfaceMuted,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: ComponentSizes.minimumTouchTarget,
  },
  actionButtonText: {
    ...Typography.label,
    color: SemanticColors.disabled,
  },
  disclaimer: {
    backgroundColor: SemanticColors.surfaceWarm,
    borderRadius: Radii.medium,
    padding: Spacing.two,
  },
  disclaimerText: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  appendixCard: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.pewter,
    borderRadius: Radii.large,
    borderWidth: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  jsonScroll: {
    backgroundColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.small,
  },
  jsonText: {
    color: SemanticColors.primaryText,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    padding: Spacing.two,
  },
  resourceStack: {
    gap: Spacing.two,
  },
  resourceLink: {
    borderColor: BrandColors.pewter,
    borderRadius: Radii.medium,
    borderWidth: 1,
    gap: Spacing.half,
    padding: Spacing.two,
  },
  resourceLinkPressed: {
    opacity: 0.76,
  },
  resourceLinkText: {
    ...Typography.bodyStrong,
    color: BrandColors.marsala,
  },
  resourceUrl: {
    ...Typography.bodySmall,
    color: SemanticColors.secondaryText,
  },
  homeButton: {
    alignItems: 'center',
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: ComponentSizes.minimumTouchTarget,
  },
  homeButtonText: {
    ...Typography.button,
    color: BrandColors.marsala,
  },
});
