import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActivityPresentationScreen,
  FixtureRewardInterstitial,
} from '@/components/activity';
import { appRoutes } from '@/config/app-config';
import {
  getNextFormalActivityRouteId,
  parseFormalActivityRouteId,
  useFormalActivityDemo,
} from '@/integration/formal-activity-demo';
import { SemanticColors, Spacing, Typography } from '@/theme';

function InvalidActivityRoute() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.notFound}>
        <Text accessibilityRole="header" style={styles.title}>
          Activity not found
        </Text>
        <Text style={styles.message}>
          Choose one of the five Size Words activities from Home.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FormalActivityRoute({ routeId }: Readonly<{ routeId: '1' | '2' | '3' | '4' | '5' }>) {
  const router = useRouter();
  const handleBack = useCallback(
    () => router.replace(appRoutes.home),
    [router],
  );
  const handleAdvance = useCallback(() => {
    const nextRouteId = getNextFormalActivityRouteId(routeId);
    router.replace(
      nextRouteId ? appRoutes.activity(nextRouteId) : appRoutes.unitComplete,
    );
  }, [routeId, router]);
  const demo = useFormalActivityDemo(routeId, {
    onBack: handleBack,
    onAdvance: handleAdvance,
  });

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ActivityPresentationScreen
        actions={demo.actions}
        scene={demo.scene}
        viewModel={demo.viewModel}
      />
      <FixtureRewardInterstitial
        message={demo.entry.rewardMessage}
        onContinue={demo.onRewardContinue}
        visible={demo.progress.rewardVisible}
      />
    </SafeAreaView>
  );
}

export default function ActivityRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = parseFormalActivityRouteId(params.id);

  if (!routeId) {
    return <InvalidActivityRoute />;
  }

  return <FormalActivityRoute routeId={routeId} />;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  notFound: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
    textAlign: 'center',
  },
});
