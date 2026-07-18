import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { role2DevActivityFixtures } from '@/fixtures/role2-activity-scenes.fixture';
import { SemanticColors, Spacing, Typography } from '@/theme';

import { SceneSpotlightOverlay } from '../SceneInteractionOverlay';
import { role2DevSceneAssets } from './role2-scene-manifest';
import {
  getSpotlightFrameRects,
  getSpotlightPhaseCount,
  resolveSpotlightPresentation,
} from './spotlight-geometry';

const MIN_VISIBLE_STATE_MS = 1800;
const SEQUENTIAL_SPOTLIGHT_MS = 1600;

function BeachSpotlightQa() {
  const scene = role2DevSceneAssets['beach-day'];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const presentation = useMemo(() => {
    const qaTargetIds = [
      'activity-5:wave',
      'activity-5:sandcastle',
      'activity-5:umbrella',
    ] as const;
    return resolveSpotlightPresentation(
      scene.focusTargets
        .filter((target) => qaTargetIds.includes(target.id as typeof qaTargetIds[number]))
        .map((target) => target.rect),
    );
  }, [scene.focusTargets]);
  const phaseCount = getSpotlightPhaseCount(presentation);
  const visibleRects = useMemo(
    () => getSpotlightFrameRects(presentation, phaseIndex),
    [phaseIndex, presentation],
  );
  const phaseLabels = ['Wave', 'Sandcastle', 'Umbrella', 'Combined summary'] as const;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setPhaseIndex((current) => {
        if (current >= phaseCount - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, SEQUENTIAL_SPOTLIGHT_MS);
    return () => clearInterval(timer);
  }, [phaseCount, playing]);

  const play = () => {
    if (phaseIndex >= phaseCount - 1) setPhaseIndex(0);
    setPlaying(true);
  };

  return (
    <View style={styles.qaPanel}>
      <Text style={styles.qaTitle}>Beach spotlight geometry QA</Text>
      <Text style={styles.status}>
        Phase {phaseIndex + 1} of {phaseCount}: {phaseLabels[phaseIndex]}
      </Text>
      <Text style={styles.note}>
        Geometry-only QA. This four-phase overlap check is not part of the Activity 5 dialogue or retry flow.
      </Text>
      <View
        accessibilityLabel={`${scene.accessibilityLabel} Spotlight QA phase ${phaseIndex + 1}: ${phaseLabels[phaseIndex]}`}
        accessible
        style={[styles.scene, { aspectRatio: 3 / 2 }]}>
        <Image accessible={false} resizeMode="contain" source={scene.source} style={styles.sceneImage} />
        <SceneSpotlightOverlay rects={visibleRects} sceneSource={scene.source} />
      </View>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          disabled={phaseIndex === 0}
          onPress={() => {
            setPlaying(false);
            setPhaseIndex((current) => Math.max(0, current - 1));
          }}
          style={[styles.button, phaseIndex === 0 && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>Previous phase</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={phaseIndex >= phaseCount - 1}
          onPress={() => {
            setPlaying(false);
            setPhaseIndex((current) => Math.min(phaseCount - 1, current + 1));
          }}
          style={[styles.button, phaseIndex >= phaseCount - 1 && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>Next phase</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={playing ? () => setPlaying(false) : play} style={styles.button}>
          <Text style={styles.buttonText}>{playing ? 'Pause QA' : 'Play four phases'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function Role2SceneDemo() {
  const [activityIndex, setActivityIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const fixture = role2DevActivityFixtures[activityIndex];
  const step = fixture.steps[stepIndex];
  const scene = role2DevSceneAssets[fixture.sceneKey];
  const activeFocusTargetIds: readonly string[] = step.activeFocusTargetIds;
  const activeTargets = useMemo(
    () => scene.focusTargets.filter((target) => activeFocusTargetIds.includes(target.id)),
    [activeFocusTargetIds, scene.focusTargets],
  );
  const spotlightPresentation = useMemo(
    () => resolveSpotlightPresentation(activeTargets.map((target) => target.rect)),
    [activeTargets],
  );
  const visibleSpotlightRects = useMemo(
    () => getSpotlightFrameRects(
      spotlightPresentation,
      Math.max(0, getSpotlightPhaseCount(spotlightPresentation) - 1),
    ),
    [spotlightPresentation],
  );

  const advance = useCallback(() => {
    setStepIndex((current) => {
      if (current < fixture.steps.length - 1) return current + 1;
      setActivityIndex((currentActivity) =>
        (currentActivity + 1) % role2DevActivityFixtures.length,
      );
      return 0;
    });
  }, [fixture.steps.length]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(advance, MIN_VISIBLE_STATE_MS);
    return () => clearTimeout(timer);
  }, [advance, paused]);

  const reset = () => {
    setActivityIndex(0);
    setStepIndex(0);
    setPaused(true);
  };
  const questionCurrent = 'questionCurrent' in step
    ? step.questionCurrent
    : Math.min(
      fixture.questionTotal,
      Math.max(1, Math.floor(stepIndex / 2) + 1),
    );

  return (
    <View style={styles.root}>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>Activity {fixture.activity} of 5</Text>
        <Text style={styles.progress}>Question {questionCurrent} of {fixture.questionTotal}</Text>
      </View>
      <Text style={styles.title}>{fixture.title}</Text>
      <Text style={styles.message}>{step.koolMessage}</Text>
      <Text style={styles.status}>
        {step.statusLine} · fixture state: {step.state} · spotlight: {spotlightPresentation.mode}
      </Text>

      <View style={styles.qaSelector}>
        <Text style={styles.selectorLabel}>Jump to activity</Text>
        <View style={styles.controls}>
          {role2DevActivityFixtures.map((candidate, index) => (
            <Pressable
              key={candidate.activity}
              accessibilityLabel={`Show Activity ${candidate.activity} scene QA`}
              accessibilityRole="button"
              onPress={() => {
                setActivityIndex(index);
                setStepIndex(0);
                setPaused(true);
              }}
              style={[styles.button, index === activityIndex && styles.buttonActive]}>
              <Text style={styles.buttonText}>Activity {candidate.activity}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.selectorLabel}>Jump to fixture state</Text>
        <View style={styles.controls}>
          {fixture.steps.map((candidate, index) => (
            <Pressable
              key={candidate.state}
              accessibilityLabel={`Show ${candidate.state} fixture state`}
              accessibilityRole="button"
              onPress={() => {
                setStepIndex(index);
                setPaused(true);
              }}
              style={[styles.button, index === stepIndex && styles.buttonActive]}>
              <Text style={styles.buttonText}>{candidate.state}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View
        accessibilityLabel={scene.accessibilityLabel}
        accessible
        style={[styles.scene, { aspectRatio: scene.aspectRatio === '5:4' ? 5 / 4 : 3 / 2 }]}>
        <Image accessible={false} resizeMode="contain" source={scene.source} style={styles.sceneImage} />
        <SceneSpotlightOverlay rects={visibleSpotlightRects} sceneSource={scene.source} />
      </View>

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" onPress={advance} style={styles.button}>
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setPaused((current) => !current)} style={styles.button}>
          <Text style={styles.buttonText}>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={reset} style={styles.button}>
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>
        Development fixture only · automatic states remain visible for at least {MIN_VISIBLE_STATE_MS}ms · source copy is verbatim from the supplied Excel · spotlight phases do not control activity timing.
      </Text>
      <BeachSpotlightQa />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.two },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progress: { ...Typography.status, color: SemanticColors.secondaryText },
  title: { ...Typography.headingSmall, color: SemanticColors.primaryText },
  message: { ...Typography.body, color: SemanticColors.primaryText },
  status: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  scene: { alignSelf: 'center', backgroundColor: SemanticColors.surface, maxWidth: 760, overflow: 'hidden', width: '100%' },
  sceneImage: { ...StyleSheet.absoluteFillObject, height: '100%', width: '100%' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  button: { backgroundColor: SemanticColors.surfaceAccent, borderRadius: 12, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  buttonActive: { borderColor: SemanticColors.focus, borderWidth: 2 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { ...Typography.bodySmall, color: SemanticColors.primaryText },
  note: { ...Typography.bodySmall, color: SemanticColors.secondaryText },
  qaPanel: { borderColor: SemanticColors.disabled, borderRadius: 16, borderWidth: 1, gap: Spacing.two, marginTop: Spacing.three, padding: Spacing.two },
  qaSelector: { gap: Spacing.one },
  qaTitle: { ...Typography.headingSmall, color: SemanticColors.primaryText },
  selectorLabel: { ...Typography.status, color: SemanticColors.secondaryText },
});
