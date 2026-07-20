import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { clientUiAssets } from '@/constants/client-assets';
import {
  BrandColors,
  Radii,
  scale,
  SemanticColors,
  Spacing,
  Typography,
} from '@/theme';

export type FixtureRewardInterstitialProps = Readonly<{
  message: string;
  onContinue(): void;
  visible: boolean;
}>;

/**
 * Temporary visual-only extraction of the approved Sprint 1 reward card.
 * It does not grant a reward, update a session, or implement reward policy.
 */
export function FixtureRewardInterstitial({
  message,
  onContinue,
  visible,
}: FixtureRewardInterstitialProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onContinue}
      transparent
      visible={visible}>
      <View style={styles.rewardOverlay}>
        <View
          accessibilityLabel={`Reward unlocked. ${message}`}
          accessibilityRole="alert"
          style={styles.rewardCard}>
          <Image
            accessible={false}
            resizeMode="contain"
            source={clientUiAssets.successCelebration.source}
            style={styles.rewardIcon}
          />
          <Text style={styles.rewardTitle}>Coin earned!</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={({ pressed }) => [
              styles.rewardButton,
              pressed && styles.rewardButtonPressed,
            ]}>
            <Text style={styles.rewardButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const rewardImageHeight = scale(220);

const styles = StyleSheet.create({
  rewardOverlay: {
    alignItems: 'center',
    backgroundColor: SemanticColors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  rewardCard: {
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderColor: BrandColors.tangerine,
    borderRadius: Radii.large,
    borderWidth: 3,
    gap: Spacing.two,
    maxWidth: 360,
    padding: Spacing.three,
    width: '100%',
  },
  rewardIcon: {
    aspectRatio: 281 / 510,
    height: rewardImageHeight,
  },
  rewardTitle: {
    ...Typography.headingSmall,
    color: SemanticColors.primaryText,
    textAlign: 'center',
  },
  rewardButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.tangerine,
    borderColor: BrandColors.marsala,
    borderRadius: Radii.pill,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  rewardButtonPressed: {
    opacity: 0.76,
  },
  rewardButtonText: {
    ...Typography.button,
    color: SemanticColors.primaryText,
  },
});
