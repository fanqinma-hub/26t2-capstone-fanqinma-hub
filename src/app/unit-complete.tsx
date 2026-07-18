import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KoolMascot } from '@/components/child-ui';
import { appRoutes } from '@/config/app-config';
import { useFormalActivityDemoSession } from '@/integration/formal-activity-demo';
import {
  BrandColors,
  clamp,
  ComponentSizes,
  Radii,
  SemanticColors,
  Spacing,
  Typography,
} from '@/theme';

export default function UnitCompleteRoute() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const { resetDemo } = useFormalActivityDemoSession();
  const compact = height < 700 || width < 390;
  const mascotHeight = clamp(height * 0.28, 150, 260);
  const restart = useCallback(() => {
    resetDemo();
    router.replace(appRoutes.activity('1'));
  }, [resetDemo, router]);
  const backHome = useCallback(() => {
    resetDemo();
    router.replace(appRoutes.home);
  }, [resetDemo, router]);

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.page,
          {
            gap: compact ? Spacing.two : Spacing.three,
            padding: compact ? Spacing.two : Spacing.four,
          },
        ]}>
        <View accessibilityRole="summary" style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            All five activities complete!
          </Text>
          <Text style={styles.message}>
            You viewed every Size Words demo activity. Wonderful noticing!
          </Text>
        </View>

        <View style={[styles.mascot, { height: mascotHeight }]}>
          <KoolMascot size={compact ? 'small' : 'medium'} state="success" />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={restart}
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.buttonText}>Restart demo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={backHome}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: SemanticColors.background,
    flex: 1,
  },
  page: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.tangerine,
    borderRadius: Radii.large,
    borderWidth: 3,
    gap: Spacing.one,
    maxWidth: 680,
    padding: Spacing.three,
    width: '100%',
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
  mascot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: Spacing.two,
    maxWidth: 520,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: ComponentSizes.minimumTouchTarget,
    paddingHorizontal: Spacing.three,
  },
  primaryButton: {
    backgroundColor: BrandColors.tangerine,
  },
  buttonText: {
    ...Typography.button,
    color: SemanticColors.primaryText,
  },
  pressed: {
    opacity: 0.76,
  },
});
