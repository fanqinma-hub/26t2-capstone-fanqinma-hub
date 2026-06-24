import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { ActivityScreen } from '@/components/activity';
import { activity01DevelopmentFixture } from '@/fixtures/activity-01.fixture';
import { SemanticColors, Spacing, Typography } from '@/theme';

export default function ActivityRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const activityId = Array.isArray(id) ? id[0] : id;

  if (activityId !== '1') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.notFound}>
          <Text accessibilityRole="header" style={styles.title}>
            Activity not found
          </Text>
          <Text style={styles.message}>This activity is not available yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <ActivityScreen {...activity01DevelopmentFixture} />;
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
