import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Screen = 'home' | 'report';

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('home');

  if (screen === 'report') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Session Report</Text>

        <View style={styles.card}>
          <Text style={styles.section}>Parent View Placeholder</Text>
          <Text>
            Progress summary, word cards and stars will appear here.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Therapist View Placeholder</Text>
          <Text>
            Tier counts, transcript examples and editable therapist note will appear here.
          </Text>
        </View>

        <Pressable style={styles.button} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Big, Small and Everything in Between!</Text>
      <Text style={styles.subtitle}>FunWattle Size Words Unit</Text>

      <Link asChild href="/activity/1">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Start Activity 1</Text>
        </Pressable>
      </Link>

      <Pressable style={styles.button} onPress={() => setScreen('report')}>
        <Text style={styles.buttonText}>View Report</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
  },
});
