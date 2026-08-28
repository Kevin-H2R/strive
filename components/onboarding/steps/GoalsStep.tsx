import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { OnboardingStepProps } from '../types';
import { MUSCLE_GROUPS } from '@/constants/muscles';

const FREQUENCY_OPTIONS = [
  { days: 2, label: '2 days', description: 'Light schedule' },
  { days: 3, label: '3 days', description: 'Balanced' },
  { days: 4, label: '4 days', description: 'Moderate' },
  { days: 5, label: '5 days', description: 'Dedicated' },
  { days: 6, label: '6 days', description: 'Intense' },
];

export type FocusLevel = 'maintenance' | 'growth' | 'accelerated';

export interface FocusOption {
  level: FocusLevel;
  label: string;
  sets: number;
  description: string;
}

export const FOCUS_OPTIONS: FocusOption[] = [
  { level: 'maintenance', label: 'Maintain', sets: 4, description: '2-6 sets/week' },
  { level: 'growth', label: 'Grow', sets: 10, description: '7-12 sets/week' },
  { level: 'accelerated', label: 'Prioritize', sets: 14, description: '12+ sets/week' },
];

export const getFocusColor = (level: FocusLevel): string => {
  switch (level) {
    case 'maintenance':
      return theme.textMuted;
    case 'growth':
      return theme.success;
    case 'accelerated':
      return '#f59e0b';
  }
};

// Export state for use in next step
export interface GoalsData {
  daysPerWeek: number;
  muscleFocus: Record<number, FocusLevel>;
}

interface GoalsStepProps extends OnboardingStepProps {
  onNextWithData?: (data: GoalsData) => void;
}

export function GoalsStep({ onNext, onBack, isLastStep, onNextWithData }: GoalsStepProps) {
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [muscleFocus, setMuscleFocus] = useState<Record<number, FocusLevel>>(() => {
    const initial: Record<number, FocusLevel> = {};
    MUSCLE_GROUPS.forEach((muscle) => {
      initial[muscle.id] = 'maintenance';
    });
    return initial;
  });

  const setFocusLevel = (muscleId: number, level: FocusLevel) => {
    setMuscleFocus((prev) => ({
      ...prev,
      [muscleId]: level,
    }));
  };

  const handleContinue = () => {
    if (daysPerWeek === null) return;

    if (onNextWithData) {
      onNextWithData({ daysPerWeek, muscleFocus });
    } else {
      onNext();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>

      {/* Step 1: Training Frequency */}
      <View style={styles.section}>
        <Text style={styles.stepNumber}>1</Text>
        <Text style={styles.title}>How often can you train?</Text>
        <Text style={styles.subtitle}>
          Be realistic - consistency beats intensity
        </Text>

        <View style={styles.frequencyGrid}>
          {FREQUENCY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.days}
              style={[
                styles.frequencyOption,
                daysPerWeek === option.days && styles.frequencyOptionActive,
              ]}
              onPress={() => setDaysPerWeek(option.days)}>
              <Text
                style={[
                  styles.frequencyDays,
                  daysPerWeek === option.days && styles.frequencyTextActive,
                ]}>
                {option.label}
              </Text>
              <Text
                style={[
                  styles.frequencyDesc,
                  daysPerWeek === option.days && styles.frequencyDescActive,
                ]}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step 2: Muscle Focus Levels */}
      {daysPerWeek !== null && (
        <View style={styles.section}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.title}>Set your focus for each muscle</Text>
          <Text style={styles.subtitle}>
            Choose how much volume you want per muscle group
          </Text>

          {/* Legend */}
          <View style={styles.legend}>
            {FOCUS_OPTIONS.map((option) => (
              <View key={option.level} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: getFocusColor(option.level) },
                  ]}
                />
                <Text style={styles.legendLabel}>{option.label}</Text>
                <Text style={styles.legendSets}>{option.description}</Text>
              </View>
            ))}
          </View>

          {/* Muscle List */}
          <View style={styles.muscleList}>
            {MUSCLE_GROUPS.map((muscle) => {
              const currentFocus = muscleFocus[muscle.id] || 'growth';

              return (
                <View key={muscle.id} style={styles.muscleRow}>
                  <View style={styles.muscleInfo}>
                    <View
                      style={[
                        styles.muscleColor,
                        { backgroundColor: muscle.color },
                      ]}
                    />
                    <Text style={styles.muscleName}>{muscle.name}</Text>
                  </View>

                  <View style={styles.focusSelector}>
                    {FOCUS_OPTIONS.map((option) => {
                      const isSelected = currentFocus === option.level;
                      const focusColor = getFocusColor(option.level);

                      return (
                        <TouchableOpacity
                          key={option.level}
                          style={[
                            styles.focusOption,
                            isSelected && {
                              backgroundColor: focusColor,
                              borderColor: focusColor,
                            },
                          ]}
                          onPress={() => setFocusLevel(muscle.id, option.level)}>
                          <Text
                            style={[
                              styles.focusOptionText,
                              isSelected && styles.focusOptionTextActive,
                            ]}>
                            {option.level === 'maintenance' ? 'M' : option.level === 'growth' ? 'G' : 'P'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.buttons}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="arrow-left" size={16} color={theme.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            daysPerWeek === null && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={daysPerWeek === null}>
          <Text style={styles.continueButtonText}>
            {isLastStep ? 'Finish' : 'Continue'}
          </Text>
          <FontAwesome name="arrow-right" size={16} color={theme.buttonPrimaryText} />
        </TouchableOpacity>
      </View>
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
  section: {
    marginBottom: 32,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  frequencyOption: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
  },
  frequencyOptionActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  frequencyDays: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  frequencyDesc: {
    fontSize: 11,
    color: theme.textMuted,
  },
  frequencyTextActive: {
    color: theme.buttonPrimaryText,
  },
  frequencyDescActive: {
    color: theme.buttonPrimaryText,
    opacity: 0.8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  legendSets: {
    fontSize: 10,
    color: theme.textMuted,
  },
  muscleList: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  muscleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  muscleColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  muscleName: {
    fontSize: 14,
    color: theme.text,
  },
  focusSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  focusOption: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
  },
  focusOptionTextActive: {
    color: theme.buttonPrimaryText,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.buttonPrimaryText,
    marginRight: 8,
  },
});
