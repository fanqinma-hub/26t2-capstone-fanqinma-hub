import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandAssets } from '@/constants/brand-assets';
import { createMediumParticipationSession } from '@/fixtures/sprint2-session.fixtures';
import {
  buildCurrentReportViewModel,
  getCurrentReportDataNotice,
} from '@/reports/report-read-model';
import { useSession } from '@/session';
import {
  BrandColors,
  ComponentSizes,
  isTablet,
  Radii,
  SemanticColors,
  Spacing,
  Typography,
} from '@/theme';
import type { WordLearningStatus } from '@/types/metrics.types';
import type { ReportAudience, ReportViewModel } from '@/types/report.types';

const sceneLabels = {
  'kitchen-bench': 'Kitchen Bench',
  park: 'At the Park',
  'toy-box': 'Toy Box',
  'farmers-market': "Farmer's Market",
  'beach-day': 'Beach Day',
} as const;

const contextItems = [
  ['NDIS plan reviews', 'Dated evidence of expressive vocabulary improvement for functional communication goals.'],
  ['GP / paediatrician referral loop', 'Attach this report to correspondence when closing the loop on a referral for language delay.'],
  ['School communication', 'Share the parent copy with the classroom teacher to encourage descriptor use in class.'],
  ['Clinic records', "Save to the child's session history as evidence of progress toward expressive language goals."],
] as const;

function requestedAudience(value: string | string[] | undefined): ReportAudience {
  const selected = Array.isArray(value) ? value[0] : value;
  return selected === 'therapist' || selected === 'clinician' ? 'therapist' : 'parent';
}

function formatDuration(durationMs: number) {
  if (durationMs <= 0) return 'Not recorded';
  const minutes = Math.max(1, Math.round(durationMs / 60_000));
  return `${minutes} min`;
}

function formatRate(value: number | null) {
  return value === null ? 'Not available' : `${Math.round(value * 100)}%`;
}

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ audience?: string | string[] }>();
  const { store } = useSession();
  const isSampleData = store.session === null;
  const session = useMemo(
    () => store.session ?? createMediumParticipationSession(),
    [store.session],
  );
  const report = useMemo(() => buildCurrentReportViewModel(session), [session]);
  const notice = useMemo(
    () => getCurrentReportDataNotice(session, {
      hydrationError: store.hydrationError,
      isSampleData,
    }),
    [isSampleData, session, store.hydrationError],
  );
  const audience = requestedAudience(params.audience);
  const [draft, setDraft] = useState(() => ({
    nextStep: report.therapist.nextStep,
    sessionId: session.sessionId,
    therapistNote: report.parent.therapistNote,
  }));
  if (draft.sessionId !== session.sessionId) {
    setDraft({
      nextStep: report.therapist.nextStep,
      sessionId: session.sessionId,
      therapistNote: report.parent.therapistNote,
    });
  }

  const selectAudience = (next: ReportAudience) => {
    router.setParams({ audience: next });
  };

  if (store.hydrationStatus === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingState}>
          <Text accessibilityRole="header" style={styles.reportTitle}>Loading report</Text>
          <Text style={styles.secondaryText}>Checking for the latest saved session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pageShell} style={styles.scrollView}>
        <View style={styles.reportPage}>
          <View style={styles.routeBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/')}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Text style={styles.backButtonText}>Back to home</Text>
            </Pressable>
            <Text style={styles.modePill}>
              {isSampleData
                ? 'Sample report'
                : report.mode === 'live'
                  ? 'Live session'
                  : 'Fixture session'}
            </Text>
          </View>

          <View style={styles.dataNotice}>
            <Text style={styles.dataNoticeText}>{notice}</Text>
          </View>

          <View accessibilityRole="tablist" style={styles.audienceTabs}>
            {(['parent', 'therapist'] as const).map((option) => {
              const selected = audience === option;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => selectAudience(option)}
                  style={[styles.audienceTab, selected && styles.audienceTabSelected]}>
                  <Text style={[styles.audienceTabText, selected && styles.audienceTabTextSelected]}>
                    {option === 'parent' ? 'Parent copy' : 'Clinician copy'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {audience === 'parent' ? (
            <ParentReport
              report={report}
              therapistNote={draft.therapistNote}
              onTherapistNoteChange={(therapistNote) =>
                setDraft((current) => ({ ...current, therapistNote }))
              }
            />
          ) : (
            <ClinicianReport
              report={report}
              nextStep={draft.nextStep}
              onNextStepChange={(nextStep) =>
                setDraft((current) => ({ ...current, nextStep }))
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportHeader({ clinical = false }: { clinical?: boolean }) {
  return (
    <View style={styles.header}>
      <Image
        accessible
        accessibilityLabel={brandAssets.logos.tagline.label}
        resizeMode="contain"
        source={brandAssets.logos.tagline.source}
        style={styles.logo}
      />
      {clinical ? (
        <View style={styles.clinicalHeaderCopy}>
          <Text style={styles.eyebrow}>CLINICAL DETAIL</Text>
        </View>
      ) : null}
    </View>
  );
}

function ParentReport({
  report,
  therapistNote,
  onTherapistNoteChange,
}: {
  report: ReportViewModel;
  therapistNote: string;
  onTherapistNoteChange(value: string): void;
}) {
  const childAge = report.header.childAge > 0 ? String(report.header.childAge) : 'Not recorded';

  return (
    <View style={styles.reportBody}>
      <ReportHeader />
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.reportTitle}>Size Words Report</Text>
        <Text style={styles.reportSubtitle}>{report.header.unitTitle} - Learning Unit Complete</Text>
      </View>

      <View style={styles.infoBar}>
        <InfoField label="Child" value={report.header.childName} />
        <InfoField label="Age" value={childAge} />
        <InfoField label="Date completed" value={report.header.completionDate} />
        <InfoField label="Session length" value={formatDuration(report.header.durationMs)} />
        <InfoField label="Speech pathologist" value={report.header.therapistName} />
      </View>

      <ReportSection title={`How ${report.header.childName} did today`}>
        <View style={styles.ratingRow}>
          <Text accessibilityLabel={`${report.parent.starRating} out of 5 stars`} style={styles.stars}>
            {'★'.repeat(report.parent.starRating)}{'☆'.repeat(5 - report.parent.starRating)}
          </Text>
          <Text style={styles.ratingCaption}>Amazing effort - {report.parent.starRating} out of 5 stars!</Text>
        </View>
        <Text style={styles.bodyText}>{report.parent.summaryText}</Text>
      </ReportSection>

      <ReportSection title={`Size words ${report.header.childName} used today`}>
        <View style={styles.wordGrid}>
          {report.parent.wordCards.map((item) => (
            <WordCard key={item.word} status={item.status} word={item.word} />
          ))}
        </View>
        <Text style={styles.secondaryText}>Green words have recorded child-use evidence. HEARD status will become available when delivery/recast events are recorded.</Text>
      </ReportSection>

      <ReportSection title={`A note from ${report.header.therapistName}`}>
        <TextInput
          accessibilityLabel="Therapist note"
          multiline
          onChangeText={onTherapistNoteChange}
          placeholder="Enter therapist notes here - this field is not persisted by this read-only report integration."
          placeholderTextColor={SemanticColors.secondaryText}
          style={styles.textArea}
          textAlignVertical="top"
          value={therapistNote}
        />
      </ReportSection>

      <ReportSection title="This week's home practice">
        <View style={styles.homePracticeCard}>
          <Text style={styles.practiceTag}>{report.parent.homeTip.label}</Text>
          <Text style={styles.bodyText}>{report.parent.homeTip.text}</Text>
        </View>
      </ReportSection>

      <ReportFooter badge="Parent copy" page="Page 1 of 2" />
    </View>
  );
}

function ClinicianReport({
  report,
  nextStep,
  onNextStepChange,
}: {
  report: ReportViewModel;
  nextStep: string;
  onNextStepChange(value: string): void;
}) {
  const summaryRows = [
    ['Total utterances', String(report.therapist.totalUtterances)],
    ['Utterances containing a size adjective', String(report.therapist.sizeWordUtterances)],
    ['Adjective use rate', formatRate(report.therapist.adjectiveUseRate)],
    ['Tier 2 responses (noun + adjective)', String(report.therapist.tierCounts.adjective_used)],
    ['Tier 3 responses (rich description)', String(report.therapist.tierCounts.rich_description)],
    ['Scaffold taps used', String(report.therapist.scaffoldTaps)],
    ['Unique target adjectives used', `${report.therapist.wordStats.filter((item) => item.status === 'USED').length} of 6`],
  ] as const;

  return (
    <View style={styles.reportBody}>
      <ReportHeader clinical />
      <View style={styles.infoBar}>
        <InfoField label="Child" value={report.header.childName} />
        <InfoField label="Unit" value={report.header.unitTitle} />
        <InfoField label="Date" value={report.header.completionDate} />
        <InfoField label="Duration" value={formatDuration(report.header.durationMs)} />
        <InfoField label="Attempt" value={report.header.unitAttemptNumber > 0 ? String(report.header.unitAttemptNumber) : 'Not recorded'} />
      </View>

      <ReportSection title="Vocabulary use summary">
        <View style={styles.metricGrid}>
          {summaryRows.map(([label, value]) => (
            <View key={label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ReportSection>

      <ReportSection title="Adjective-by-adjective breakdown">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.wordTable}>
            <TableRow header cells={['Target word', "Times heard (Kool's recasts)", 'Times used by child', 'Example utterance']} widths={[130, 210, 190, 310]} />
            {report.therapist.wordStats.map((row) => (
              <TableRow
                cells={[
                  row.word,
                  'Not recorded',
                  String(row.timesUsed),
                  row.examples[0] ?? 'Not yet produced spontaneously',
                ]}
                key={row.word}
                widths={[130, 210, 190, 310]}
              />
            ))}
          </View>
        </ScrollView>
      </ReportSection>

      <ReportSection title="Per-activity detail">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.activityTable}>
            <TableRow header cells={['Activity', 'Scene', 'Prompts given', 'Tier 1', 'Tier 2', 'Tier 3', 'Scaffolds used']} widths={[120, 180, 140, 130, 130, 130, 150]} />
            {report.therapist.activityRows.map((row, index) => (
              <TableRow
                cells={[
                  `Activity ${index + 1}`,
                  sceneLabels[row.scene],
                  String(row.promptsGiven),
                  String(row.tier1),
                  String(row.tier2),
                  String(row.tier3),
                  String(row.scaffoldsUsed),
                ]}
                key={row.activityId}
                widths={[120, 180, 140, 130, 130, 130, 150]}
              />
            ))}
          </View>
        </ScrollView>
      </ReportSection>

      <ReportSection title="Progression readiness flag">
        <View style={styles.readinessCard}>
          <Text style={styles.readinessFlag}>
            {report.therapist.readinessRate === null
              ? 'Not enough recorded responses'
              : report.therapist.readinessRate >= 0.7
                ? 'Ready for next vocabulary unit'
                : 'Repeat this unit with new scenes'}
          </Text>
          <Text style={styles.bodyText}>Readiness rate: {formatRate(report.therapist.readinessRate)}. The contract threshold is 70% Tier 2 or Tier 3 terminal responses.</Text>
        </View>
        <Text style={styles.inputLabel}>Suggested next step</Text>
        <TextInput
          accessibilityLabel="Suggested next step"
          multiline
          onChangeText={onNextStepChange}
          placeholder="Enter recommended next step here - this field is not persisted by this read-only report integration."
          placeholderTextColor={SemanticColors.secondaryText}
          style={styles.textArea}
          textAlignVertical="top"
          value={nextStep}
        />
      </ReportSection>

      <ReportSection title="Using this report (Australian context)">
        <Text style={styles.bodyText}>{report.therapist.ndisContext}</Text>
        <View style={styles.contextGrid}>
          {contextItems.map(([title, body]) => (
            <View key={title} style={styles.contextCard}>
              <Text style={styles.contextTitle}>{title}</Text>
              <Text style={styles.bodyText}>{body}</Text>
            </View>
          ))}
        </View>
      </ReportSection>

      <ReportFooter badge="Clinician copy - not for general distribution" page="Page 2 of 2" />
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoField}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function ReportSection({ children, title }: { children: ReactNode; title: string }) {
  return <View style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text><View style={styles.sectionContent}>{children}</View></View>;
}

function WordCard({ status, word }: { status: WordLearningStatus; word: string }) {
  const tone = status === 'USED' ? styles.wordCardUsed : status === 'HEARD' ? styles.wordCardHeard : styles.wordCardNotYet;
  const statusTone = status === 'USED' ? styles.wordStatusUsed : status === 'HEARD' ? styles.wordStatusHeard : styles.wordStatusNotYet;
  return <View style={[styles.wordCard, tone]}><Text style={styles.wordCardWord}>{word}</Text><Text style={[styles.wordStatus, statusTone]}>{status.replace('_', ' ')}</Text></View>;
}

function TableRow({ cells, widths, header = false }: { cells: readonly string[]; widths: readonly number[]; header?: boolean }) {
  return <View style={[styles.tableRow, header && styles.tableHeaderRow]}>{cells.map((cell, index) => <Text key={`${cell}-${index}`} style={[styles.tableCell, { width: widths[index] }, header && styles.tableHeaderText]}>{cell}</Text>)}</View>;
}

function ReportFooter({ badge, page }: { badge: string; page: string }) {
  return <View style={styles.footer}><Text style={styles.footerText}>FunWattle - &lt;website&gt;</Text><Text style={styles.footerBadge}>{badge}</Text><Text style={styles.footerText}>{page}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: SemanticColors.background, flex: 1 },
  loadingState: { alignItems: 'center', flex: 1, gap: Spacing.two, justifyContent: 'center', padding: Spacing.four },
  scrollView: { flex: 1 },
  pageShell: { alignItems: 'center', padding: isTablet ? Spacing.four : Spacing.two },
  reportPage: { gap: Spacing.two, maxWidth: 1080, width: '100%' },
  routeBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { borderColor: BrandColors.marsala, borderRadius: Radii.pill, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  backButtonText: { ...Typography.label, color: BrandColors.marsala },
  modePill: { ...Typography.bodySmall, backgroundColor: SemanticColors.surfaceMuted, borderRadius: Radii.pill, color: SemanticColors.secondaryText, overflow: 'hidden', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  pressed: { opacity: 0.7 },
  dataNotice: { backgroundColor: '#FFF5D9', borderColor: BrandColors.mimosa, borderRadius: Radii.medium, borderWidth: 1, padding: Spacing.two },
  dataNoticeText: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  audienceTabs: { backgroundColor: SemanticColors.surfaceMuted, borderRadius: Radii.pill, flexDirection: 'row', padding: Spacing.half, width: '100%' },
  audienceTab: { alignItems: 'center', borderRadius: Radii.pill, flex: 1, justifyContent: 'center', minHeight: ComponentSizes.minimumTouchTarget, paddingHorizontal: Spacing.two },
  audienceTabSelected: { backgroundColor: BrandColors.mimosa },
  audienceTabText: { ...Typography.label, color: SemanticColors.secondaryText, textAlign: 'center' },
  audienceTabTextSelected: { color: SemanticColors.primaryText },
  reportBody: { backgroundColor: SemanticColors.surface, borderColor: BrandColors.pewter, borderRadius: Radii.large, borderWidth: 1, gap: Spacing.four, padding: isTablet ? Spacing.four : Spacing.two },
  header: { alignItems: 'center', borderBottomColor: BrandColors.pewter, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: Spacing.two },
  logo: { flexShrink: 1, height: 58, maxWidth: '48%', width: 190 },
  clinicalHeaderCopy: { alignItems: 'flex-end', flex: 1, gap: Spacing.half, maxWidth: '48%', minWidth: 0 },
  eyebrow: { ...Typography.label, color: BrandColors.marsala, letterSpacing: 1.2 },
  secondaryText: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  titleBlock: { alignItems: 'center', gap: Spacing.one },
  reportTitle: { ...Typography.heading, color: BrandColors.marsala, textAlign: 'center' },
  reportSubtitle: { ...Typography.bodyStrong, color: SemanticColors.secondaryText, textAlign: 'center' },
  infoBar: { backgroundColor: SemanticColors.surfaceWarm, borderRadius: Radii.medium, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, padding: Spacing.two },
  infoField: { flex: 1, gap: Spacing.half, minWidth: 140 },
  infoLabel: { ...Typography.label, color: SemanticColors.secondaryText },
  infoValue: { ...Typography.bodyStrong, color: SemanticColors.primaryText },
  section: { gap: Spacing.two },
  sectionTitle: { ...Typography.headingSmall, color: BrandColors.marsala },
  sectionContent: { gap: Spacing.two },
  ratingRow: { alignItems: 'center', backgroundColor: SemanticColors.surfaceWarm, borderRadius: Radii.medium, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, padding: Spacing.two },
  stars: { color: '#B88416', fontSize: 30, letterSpacing: 2 },
  ratingCaption: { ...Typography.bodyStrong, color: SemanticColors.primaryText, flex: 1, minWidth: 190 },
  bodyText: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  wordCard: { borderRadius: Radii.medium, borderWidth: 2, flexBasis: isTablet ? '30%' : '46%', flexGrow: 1, gap: Spacing.one, minWidth: 140, padding: Spacing.two },
  wordCardUsed: { backgroundColor: '#EAF6EC', borderColor: '#4F8A5B' },
  wordCardHeard: { backgroundColor: '#FFF5D9', borderColor: '#B88416' },
  wordCardNotYet: { backgroundColor: SemanticColors.surfaceMuted, borderColor: BrandColors.pewter },
  wordCardWord: { ...Typography.headingSmall, color: SemanticColors.primaryText, textTransform: 'capitalize' },
  wordStatus: { ...Typography.label },
  wordStatusUsed: { color: '#376D42' },
  wordStatusHeard: { color: '#8A6110' },
  wordStatusNotYet: { color: SemanticColors.secondaryText },
  textArea: { ...Typography.body, backgroundColor: SemanticColors.surfaceWarm, borderColor: BrandColors.pewter, borderRadius: Radii.medium, borderWidth: 1, color: SemanticColors.primaryText, minHeight: 132, padding: Spacing.two },
  inputLabel: { ...Typography.label, color: SemanticColors.primaryText },
  homePracticeCard: { backgroundColor: '#FFF5D9', borderColor: BrandColors.mimosa, borderRadius: Radii.medium, borderWidth: 1, gap: Spacing.two, padding: Spacing.two },
  practiceTag: { ...Typography.label, alignSelf: 'flex-start', backgroundColor: BrandColors.mimosa, borderRadius: Radii.pill, color: SemanticColors.primaryText, overflow: 'hidden', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  metricCard: { backgroundColor: SemanticColors.surfaceWarm, borderRadius: Radii.medium, flexBasis: isTablet ? '30%' : '46%', flexGrow: 1, gap: Spacing.one, minWidth: 160, padding: Spacing.two },
  metricValue: { ...Typography.headingSmall, color: BrandColors.marsala },
  metricLabel: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  wordTable: { minWidth: 840 },
  activityTable: { minWidth: 980 },
  tableRow: { borderBottomColor: BrandColors.pewter, borderBottomWidth: 1, flexDirection: 'row' },
  tableHeaderRow: { backgroundColor: BrandColors.marsala, borderTopLeftRadius: Radii.medium, borderTopRightRadius: Radii.medium },
  tableCell: { ...Typography.bodySmall, color: SemanticColors.primaryText, padding: Spacing.two },
  tableHeaderText: { ...Typography.label, color: '#FFFFFF' },
  readinessCard: { backgroundColor: '#EAF6EC', borderColor: '#4F8A5B', borderRadius: Radii.medium, borderWidth: 1, gap: Spacing.one, padding: Spacing.two },
  readinessFlag: { ...Typography.bodyStrong, color: '#376D42' },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  contextCard: { backgroundColor: SemanticColors.surfaceWarm, borderRadius: Radii.medium, flexBasis: isTablet ? '46%' : '100%', flexGrow: 1, gap: Spacing.one, minWidth: 220, padding: Spacing.two },
  contextTitle: { ...Typography.bodyStrong, color: SemanticColors.primaryText },
  footer: { alignItems: 'center', borderTopColor: BrandColors.pewter, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between', paddingTop: Spacing.two },
  footerText: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  footerBadge: { ...Typography.label, backgroundColor: SemanticColors.surfaceMuted, borderRadius: Radii.pill, color: BrandColors.marsala, overflow: 'hidden', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
});
