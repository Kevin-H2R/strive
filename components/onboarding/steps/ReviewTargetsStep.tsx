import React, { useState, useEffect } from 'react';
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
import { useSettingsStore } from '@/stores/settingsStore';
import { MUSCLE_GROUPS } from '@/constants/muscles';
import { GoalsData, FocusLevel, FOCUS_OPTIONS, getFocusColor } from './GoalsStep';

interface ReviewTargetsStepProps extends OnboardingStepProps {
  goalsData?: GoalsData;
  onNextWithTargets?: (targets: Record<number, number>) => void;
}

export function ReviewTargetsStep({ onNext, onBack, isLastStep, goalsData, onNextWithTargets }: ReviewTargetsStepProps) {
  const { setWeeklySetTarget } = useSettingsStore();

  // Calculate initial targets based on goals data
  const calculateInitialTargets = (): Record<number, number> => {
    const targets: Record<number, number> = {};
    MUSCLE_GROUPS.forEach((muscle) => {
      const focus = goalsData?.muscleFocus[muscle.id] || 'growth';
      const option = FOCUS_OPTIONS.find((o) => o.level === focus);
      targets[muscle.id] = option?.sets || 10;
    });
    return targets;
  };

  const [targets, setTargets] = useState<Record<number, number>>(calculateInitialTargets);

  // Recalculate when goalsData changes
  useEffect(() => {
    setTargets(calculateInitialTargets());
  }, [goalsData]);

  const adjustTarget = (muscleId: number, delta: number) => {
    setTargets((prev) => ({
      ...prev,
      [muscleId]: Math.max(0, Math.min(30, (prev[muscleId] || 0) + delta)),
    }));
  };

  const handleFinish = () => {
    // Save all targets to store
    MUSCLE_GROUPS.forEach((muscle) => {
      setWeeklySetTarget(muscle.id, targets[muscle.id] || 10);
    });

    // Pass targets to next step if callback provided
    if (onNextWithTargets) {
      onNextWithTargets(targets);
    } else {
      onNext();
    }
  };

  const getFocusLevelForSets = (sets: number): FocusLevel => {
    if (sets <= 6) return 'maintenance';
    if (sets <= 12) return 'growth';
    return 'accelerated';
  };

  const totalSets = Object.values(targets).reduce((sum, sets) => sum + sets, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>

      <Text style={styles.title}>Review your targets</Text>
      <Text style={styles.subtitle}>
        Fine-tune the exact number of sets per week for each muscle
      </Text>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Training days</Text>
          <Text style={styles.summaryValue}>{goalsData?.daysPerWeek || 4}x / week</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total weekly sets</Text>
          <Text style={styles.summaryValue}>{totalSets} sets</Text>
        </View>
      </View>

      {/* Muscle Targets */}
      <View style={styles.muscleList}>
        {MUSCLE_GROUPS.map((muscle) => {
          const currentSets = targets[muscle.id] || 10;
          const focusLevel = getFocusLevelForSets(currentSets);
          const focusColor = getFocusColor(focusLevel);
          const focusLabel = FOCUS_OPTIONS.find((o) => o.level === focusLevel)?.label || '';

          return (
            <View key={muscle.id} style={styles.muscleRow}>
              <View style={styles.muscleInfo}>
                <View
                  style={[
                    styles.muscleColor,
                    { backgroundColor: muscle.color },
                  ]}
                />
                <View style={styles.muscleTextContainer}>
                  <Text style={styles.muscleName}>{muscle.name}</Text>
                  <Text style={[styles.focusLabel, { color: focusColor }]}>
                    {focusLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustTarget(muscle.id, -1)}>
                  <FontAwesome name="minus" size={12} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.setsDisplay}>
                  <Text style={styles.setsValue}>{currentSets}</Text>
                  <Text style={styles.setsLabel}>sets</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustTarget(muscle.id, 1)}>
                  <FontAwesome name="plus" size={12} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

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
            <Text style={styles.legendText}>
              {option.label}: {option.description}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        You can always adjust these later in your profile settings
      </Text>

      <View style={styles.buttons}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="arrow-left" size={16} color={theme.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.continueButton} onPress={handleFinish}>
          <Text style={styles.continueButtonText}>
            {isLastStep ? 'Start Training' : 'Continue'}
          </Text>
          <FontAwesome name="check" size={16} color={theme.buttonPrimaryText} />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
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
    paddingVertical: 12,
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
    marginRight: 12,
  },
  muscleTextContainer: {
    flex: 1,
  },
  muscleName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  focusLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  setsDisplay: {
    alignItems: 'center',
    marginHorizontal: 12,
    minWidth: 50,
  },
  setsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  setsLabel: {
    fontSize: 10,
    color: theme.textMuted,
  },
  legend: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  note: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.buttonPrimaryText,
    marginRight: 8,
  },
});
