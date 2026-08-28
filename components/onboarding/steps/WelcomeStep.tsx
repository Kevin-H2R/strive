import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { OnboardingStepProps } from '../types';

export function WelcomeStep({ onNext }: OnboardingStepProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.logo}>STRIVE</Text>
        <Text style={styles.tagline}>Back to basics</Text>
      </View>

      <View style={styles.problemSection}>
        <Text style={styles.sectionTitle}>The problem</Text>
        <Text style={styles.problemText}>
          The fitness industry is broken. Endless contradicting advice. Influencers you can't trust.
          Unrealistic standards from people hiding their "supplements".
        </Text>
        <Text style={styles.problemText}>
          You didn't start going to the gym to become a bodybuilder. You just want to look good and feel strong.
        </Text>
      </View>

      <View style={styles.solutionSection}>
        <Text style={styles.sectionTitle}>The solution</Text>
        <Text style={styles.solutionText}>
          Strive strips away the noise and focuses on what actually matters for muscle growth:{' '}
          <Text style={styles.highlight}>volume</Text>.
        </Text>

        <View style={styles.principles}>
          <View style={styles.principleRow}>
            <View style={styles.principleIcon}>
              <FontAwesome name="line-chart" size={20} color={theme.primary} />
            </View>
            <View style={styles.principleContent}>
              <Text style={styles.principleTitle}>Track what matters</Text>
              <Text style={styles.principleText}>
                Volume is the primary driver of muscle growth. We help you track sets per muscle group.
              </Text>
            </View>
          </View>

          <View style={styles.principleRow}>
            <View style={styles.principleIcon}>
              <FontAwesome name="bullseye" size={20} color={theme.primary} />
            </View>
            <View style={styles.principleContent}>
              <Text style={styles.principleTitle}>Train with purpose</Text>
              <Text style={styles.principleText}>
                Want a bigger chest? Do more chest volume. It's that simple.
              </Text>
            </View>
          </View>

          <View style={styles.principleRow}>
            <View style={styles.principleIcon}>
              <FontAwesome name="check" size={20} color={theme.primary} />
            </View>
            <View style={styles.principleContent}>
              <Text style={styles.principleTitle}>No BS, just results</Text>
              <Text style={styles.principleText}>
                Science-based approach. No fads, no gimmicks, no magic shortcuts.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Let's get started</Text>
        <FontAwesome name="arrow-right" size={16} color={theme.buttonPrimaryText} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  problemSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  problemText: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  solutionSection: {
    marginBottom: 40,
  },
  solutionText: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  highlight: {
    color: theme.primary,
    fontWeight: '700',
  },
  principles: {
    gap: 20,
  },
  principleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  principleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  principleContent: {
    flex: 1,
  },
  principleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  principleText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.buttonPrimaryText,
    marginRight: 8,
  },
});
