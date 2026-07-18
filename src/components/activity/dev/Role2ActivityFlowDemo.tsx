import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { role2ActivityFlowFixtures } from '@/fixtures/role2-activity-flow.fixture';
import { BrandColors, Radii, SemanticColors, Spacing, Typography } from '@/theme';
import type { ActivityScreenActions } from '@/types/visual.types';

import { ActivityPresentationScreen } from '../ActivityPresentationScreen';
import { sceneAssetManifest } from '../scene-asset-manifest';

export function Role2ActivityFlowDemo({ onExit }: Readonly<{ onExit?: () => void }>) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [stateIndex, setStateIndex] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [lastAction, setLastAction] = useState('No fixture action yet');
  const fixture = role2ActivityFlowFixtures[activityIndex];
  const viewModel = fixture.states[stateIndex];
  const scene = sceneAssetManifest[viewModel.sceneAssetKey];

  const actions = useMemo<ActivityScreenActions>(() => ({
    onBack: () => setLastAction('Back pressed — visual fixture only'),
    onReplay: () => setLastAction('Replay pressed — no TTS is called'),
    onMicrophoneStart: () => setLastAction('Microphone start pressed — no STT is called'),
    onMicrophoneStop: () => setLastAction('Microphone stop pressed — no STT is called'),
    onClue: (targetId) => setLastAction(`Clue pressed for ${targetId}`),
    onSkip: () => setLastAction('Skip pressed — controller is not advanced'),
    onContinue: () => setLastAction('Continue pressed — integration is not claimed'),
  }), []);

  return (
    <View style={styles.root}>
      <ActivityPresentationScreen actions={actions} scene={scene} viewModel={viewModel} />
      <Pressable
        accessibilityLabel={controlsOpen ? 'Close fixture controls' : 'Open fixture controls'}
        accessibilityRole="button"
        onPress={() => setControlsOpen((current) => !current)}
        style={styles.toggle}>
        <Text style={styles.toggleText}>{controlsOpen ? 'Close QA' : 'QA controls'}</Text>
      </Pressable>
      {controlsOpen ? (
        <ScrollView contentContainerStyle={styles.panelContent} style={styles.panel}>
          <Text style={styles.panelTitle}>Fixture-driven Activity flow</Text>
          <Text style={styles.note}>Controls float above the page and never reduce the scene’s layout space.</Text>
          <Text style={styles.note}>{lastAction}</Text>
          <Text style={styles.label}>Activity</Text>
          <View style={styles.controlRow}>
            {role2ActivityFlowFixtures.map((candidate, index) => (
              <Pressable
                key={candidate.activity}
                accessibilityRole="button"
                onPress={() => { setActivityIndex(index); setStateIndex(0); }}
                style={[styles.controlButton, index === activityIndex && styles.controlButtonActive]}>
                <Text style={styles.controlButtonText}>{candidate.activity}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Visual state</Text>
          <View style={styles.controlRow}>
            {fixture.states.map((candidate, index) => (
              <Pressable
                key={candidate.visualState}
                accessibilityRole="button"
                onPress={() => setStateIndex(index)}
                style={[styles.controlButton, index === stateIndex && styles.controlButtonActive]}>
                <Text style={styles.controlButtonText}>{candidate.visualState}</Text>
              </Pressable>
            ))}
          </View>
          {onExit ? (
            <Pressable accessibilityRole="button" onPress={onExit} style={styles.exitButton}>
              <Text style={styles.controlButtonText}>Return to component gallery</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  toggle: {
    backgroundColor: BrandColors.tangerine, borderColor: BrandColors.marsala,
    borderRadius: Radii.pill, borderWidth: 2, bottom: Spacing.two, left: Spacing.two,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.half,
    position: 'absolute', zIndex: 20,
  },
  toggleText: { ...Typography.bodySmall, color: SemanticColors.primaryText },
  panel: {
    backgroundColor: 'rgba(255, 252, 246, 0.98)', borderColor: BrandColors.marsala,
    borderRadius: Radii.large, borderWidth: 2, maxHeight: '78%', maxWidth: 520,
    bottom: 64, left: Spacing.two, position: 'absolute', width: '92%', zIndex: 19,
  },
  panelContent: { gap: Spacing.one, padding: Spacing.two },
  panelTitle: { ...Typography.headingSmall, color: SemanticColors.primaryText },
  note: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  label: { ...Typography.label, color: SemanticColors.primaryText },
  controlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  controlButton: {
    backgroundColor: SemanticColors.surface, borderColor: BrandColors.marsala,
    borderRadius: Radii.pill, borderWidth: 1, minHeight: 44,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one,
  },
  controlButtonActive: { backgroundColor: BrandColors.mimosa, borderWidth: 3 },
  controlButtonText: { ...Typography.bodySmall, color: SemanticColors.primaryText },
  exitButton: {
    alignItems: 'center', backgroundColor: SemanticColors.surfaceMuted,
    borderRadius: Radii.pill, marginTop: Spacing.one, minHeight: 44, padding: Spacing.one,
  },
});
