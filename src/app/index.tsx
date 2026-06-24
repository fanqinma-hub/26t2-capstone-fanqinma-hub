import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { KoolMascot } from '@/components/child-ui';
import { brandAssets } from '@/constants/brand-assets';
import { BrandColors, ComponentSizes, Radii, SemanticColors, Spacing, Typography } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.content}>
          <Image accessible accessibilityLabel="FunWattle: Learning blooms with therapy" resizeMode="contain" source={brandAssets.logos.tagline.source} style={styles.logo} />

          <View style={styles.hero}>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>Your learning adventure</Text>
              <Text accessibilityRole="header" style={styles.title}>
                Big, Small and Everything in Between!
              </Text>
              <Text style={styles.description}>Look closely, talk with Kool, and practise fun size words.</Text>

              <Pressable accessibilityRole="button" onPress={() => router.push('/activity/1')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>Start activity</Text>
              </Pressable>

              <Pressable accessibilityRole="button" onPress={() => router.push('/report')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>View report</Text>
              </Pressable>
            </View>

            <View style={styles.mascotArea}>
              <KoolMascot size="large" state="wave" />
              <Text style={styles.mascotCaption}>Hi, I’m Kool!</Text>
            </View>
          </View>
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
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: ComponentSizes.contentMaxWidth,
    width: '100%',
  },
  logo: {
    height: 88,
    maxWidth: 360,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
  },
  card: {
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.mimosa,
    borderRadius: Radii.large,
    borderWidth: 3,
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
  },
  eyebrow: {
    ...Typography.label,
    color: BrandColors.marsala,
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
  },
  description: {
    ...Typography.body,
    color: SemanticColors.secondaryText,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 68,
    paddingHorizontal: Spacing.four,
  },
  primaryButtonText: {
    ...Typography.button,
    color: SemanticColors.primaryText,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: ComponentSizes.minimumTouchTarget,
    paddingHorizontal: Spacing.four,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: BrandColors.marsala,
  },
  pressed: {
    opacity: 0.8,
  },
  mascotArea: {
    alignItems: 'center',
  },
  mascotCaption: {
    ...Typography.speech,
    color: BrandColors.marsala,
    marginTop: -Spacing.three,
  },
});
