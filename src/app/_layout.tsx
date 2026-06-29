import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts as useNunitoFonts,
} from '@expo-google-fonts/nunito';
import {
  Raleway_600SemiBold,
  Raleway_700Bold,
  useFonts as useRalewayFonts,
} from '@expo-google-fonts/raleway';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '@/session';
import { SemanticColors, Spacing, Typography } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [nunitoLoaded, nunitoError] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [ralewayLoaded, ralewayError] = useRalewayFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
  });
  const fontError = nunitoError ?? ralewayError;
  const fontsReady = (nunitoLoaded && ralewayLoaded) || Boolean(fontError);

  useEffect(() => {
    if (!fontsReady) {
      return;
    }

    if (fontError) {
      console.warn('FunWattle fonts could not load. Continuing with system fonts.', fontError);
    }

    void SplashScreen.hideAsync();
  }, [fontError, fontsReady]);

  if (!fontsReady) {
    return (
      <View accessibilityLabel="Loading FunWattle" accessibilityRole="progressbar" style={styles.loadingScreen}>
        <ActivityIndicator color={SemanticColors.focus} />
        <Text style={styles.loadingText}>Loading FunWattle…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Slot />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: SemanticColors.background,
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: SemanticColors.primaryText,
  },
});
