import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KoolMascot } from '@/components/child-ui';
import { appRoutes } from '@/config/app-config';
import { brandAssets } from '@/constants/brand-assets';
import { clientUiAssets } from '@/constants/client-assets';
import { BrandColors, clamp, ComponentSizes, isSmallPhone, Radii, SemanticColors, Spacing, Typography } from '@/theme';

function getHomeLayout(width: number, height: number) {
  const compact = isSmallPhone || height < 760 || width < 430;
  const roomy = width >= 900 && height >= 840;
  const paddingHorizontal = compact ? Spacing.two : Spacing.three;
  const availableWidth = Math.max(width - paddingHorizontal * 2, 320);
  const unitIconSize = clamp(
    Math.min(availableWidth * (roomy ? 0.28 : 0.36), height * (compact ? 0.2 : 0.24)),
    compact ? 118 : 140,
    roomy ? 210 : 176,
  );

  return {
    buttonHeight: compact ? ComponentSizes.minimumTouchTarget : 64,
    cardGap: compact ? 6 : 10,
    cardMaxWidth: Math.min(availableWidth, roomy ? 720 : ComponentSizes.contentMaxWidth),
    cardPaddingHorizontal: compact ? Spacing.two : Spacing.three,
    cardPaddingVertical: compact ? 12 : Spacing.three,
    mascotSize: compact || height < 900 ? 'small' as const : 'medium' as const,
    paddingBottom: compact ? 0 : Spacing.two,
    paddingHorizontal,
    paddingTop: compact ? Spacing.one : Spacing.two,
    rootGap: compact ? Spacing.two : Spacing.three,
    logoHeight: clamp(height * 0.09, compact ? 52 : 62, roomy ? 92 : 82),
    logoMaxWidth: roomy ? 420 : 360,
    unitIconSize,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const layout = getHomeLayout(width, height);

  return (
    <SafeAreaView style={styles.screen}>
      <View
        style={[
          styles.root,
          {
            gap: layout.rootGap,
            paddingBottom: layout.paddingBottom,
            paddingHorizontal: layout.paddingHorizontal,
            paddingTop: layout.paddingTop,
          },
        ]}>
        <Image
          accessible
          accessibilityLabel="FunWattle: Learning blooms with therapy"
          resizeMode="contain"
          source={brandAssets.logos.tagline.source}
          style={[
            styles.logo,
            {
              height: layout.logoHeight,
              maxWidth: layout.logoMaxWidth,
            },
          ]}
        />

        <View
          style={[
            styles.card,
            {
              gap: layout.cardGap,
              maxWidth: layout.cardMaxWidth,
              paddingHorizontal: layout.cardPaddingHorizontal,
              paddingVertical: layout.cardPaddingVertical,
            },
          ]}>
          <Text accessibilityRole="header" style={styles.title}>
            Size Words
          </Text>

          <Image
            accessible
            accessibilityLabel="Describing Pictures, ages 6 to 8"
            resizeMode="contain"
            source={clientUiAssets.describingPictures.source}
            style={[
              styles.unitIcon,
              {
                height: layout.unitIconSize,
                width: layout.unitIconSize,
              },
            ]}
          />

          <View style={{ gap: layout.cardGap }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(appRoutes.activity('1'))}
              style={({ pressed }) => [
                styles.primaryButton,
                { minHeight: layout.buttonHeight },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryButtonText}>Start activity</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(appRoutes.report)}
              style={({ pressed }) => [
                styles.secondaryButton,
                { minHeight: layout.buttonHeight },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.secondaryButtonText}>View report</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.mascotArea}>
          <KoolMascot size={layout.mascotSize} state="wave" />
          <Text style={styles.mascotCaption}>Hi, I’m Kool!</Text>
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
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  logo: {
    width: '100%',
  },
  card: {
    alignSelf: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.mimosa,
    borderRadius: Radii.large,
    borderWidth: 3,
    width: '100%',
  },
  title: {
    ...Typography.heading,
    color: SemanticColors.primaryText,
    textAlign: 'center',
  },
  unitIcon: {
    alignSelf: 'center',
    borderRadius: Radii.medium,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
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
    paddingHorizontal: Spacing.three,
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
    marginTop: -Spacing.two,
  },
});
