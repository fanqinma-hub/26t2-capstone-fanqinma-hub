import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { SemanticColors, Spacing, Typography } from '@/theme';

export default function ReportScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Report
        </Text>
        <Text style={styles.message}>Report content will be connected later.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
  },
  message: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
  },
});
