import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { OnboardingStepProps } from '../types';
import { getMuscleById, MUSCLE_GROUPS } from '@/constants/muscles';
import { WorkoutTemplate, GeneratedPlan } from '@/lib/generateWorkoutPlan';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface GeneratedPlanStepProps extends OnboardingStepProps {
  daysPerWeek: number;
  targetSets: Record<number, number>;
}

export function GeneratedPlanStep({
  onNext,
  onBack,
  isLastStep,
  daysPerWeek,
  targetSets,
}: GeneratedPlanStepProps) {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  useEffect(() => {
    const generatePlan = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get the current session for auth header
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session error:', sessionError);
        console.log('Session exists:', !!sessionData?.session);
        console.log('Access token exists:', !!sessionData?.session?.access_token);
        console.log('Access token preview:', sessionData?.session?.access_token?.substring(0, 50) + '...');

        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          console.error('No access token found');
          setError('Please log in to generate a workout plan.');
          return;
        }

        // Call function directly with fetch for better debugging
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        console.log('Calling function at:', `${supabaseUrl}/functions/v1/generate-workout-plan`);

        const response = await fetch(
          `${supabaseUrl}/functions/v1/generate-workout-plan`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': anonKey || '',
            },
            body: JSON.stringify({ daysPerWeek, targetSets }),
          }
        );

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
          console.error('Function error:', response.status, responseText);
          setError('Failed to generate workout plan. Please try again.');
          return;
        }

        const data = JSON.parse(responseText);
        setPlan(data as GeneratedPlan);
      } catch (err) {
        console.error('Error calling edge function:', err);
        setError('Failed to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    generatePlan();
  }, [daysPerWeek, targetSets]);

  const handleFinish = async () => {
    if (!plan || !user) return;

    setSaving(true);

    try {
      // Save each template to Supabase
      for (const template of plan.templates) {
        const exercisesData = template.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
        }));

        await supabase.from('workout_templates').insert({
          user_id: user.id,
          name: template.name,
          exercises: exercisesData,
        });
      }

      onNext();
    } catch (error) {
      console.error('Error saving templates:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = (index: number) => {
    setExpandedTemplate(expandedTemplate === index ? null : index);
  };

  const getTotalSetsForTemplate = (template: WorkoutTemplate): number => {
    return template.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Generating your workout plan...</Text>
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome name="exclamation-circle" size={48} color={theme.error} />
        <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.error, marginBottom: 12 }]}
          onPress={async () => {
            await supabase.auth.signOut();
          }}>
          <Text style={styles.retryButtonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={async () => {
            setLoading(true);
            setError(null);
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const accessToken = sessionData?.session?.access_token;

              if (!accessToken) {
                setError('Please log in to generate a workout plan.');
                setLoading(false);
                return;
              }

              const { data, error: fnError } = await supabase.functions.invoke(
                'generate-workout-plan',
                {
                  body: { daysPerWeek, targetSets },
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );

              if (fnError) {
                setError('Failed to generate workout plan. Please try again.');
              } else {
                setPlan(data as GeneratedPlan);
              }
            } catch {
              setError('Failed to connect to server. Please try again.');
            } finally {
              setLoading(false);
            }
          }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>

      <Text style={styles.title}>Your Workout Plan</Text>
      <Text style={styles.subtitle}>
        We've created {plan.templates.length} workout templates based on your goals
      </Text>

      {/* Volume Summary Button */}
      <TouchableOpacity
        style={styles.volumeSummaryButton}
        onPress={() => setShowVolumeModal(true)}>
        <FontAwesome name="bar-chart" size={16} color={theme.primary} />
        <Text style={styles.volumeSummaryText}>View Weekly Volume Summary</Text>
        <FontAwesome name="chevron-right" size={14} color={theme.textMuted} />
      </TouchableOpacity>

      {/* Templates */}
      {plan.templates.map((template, index) => (
        <View key={index} style={styles.templateCard}>
          <TouchableOpacity
            style={styles.templateHeader}
            onPress={() => toggleTemplate(index)}>
            <View style={styles.templateTitleRow}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateSets}>
                {getTotalSetsForTemplate(template)} sets
              </Text>
            </View>
            <FontAwesome
              name={expandedTemplate === index ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {expandedTemplate === index && (
            <View style={styles.exerciseList}>
              {template.exercises.map((exercise, exIndex) => {
                const muscle = getMuscleById(exercise.primaryMuscleId);
                return (
                  <View key={exIndex} style={styles.exerciseRow}>
                    <View
                      style={[
                        styles.muscleIndicator,
                        { backgroundColor: muscle?.color || theme.textMuted },
                      ]}
                    />
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.exerciseMuscle}>{muscle?.name}</Text>
                    </View>
                    <Text style={styles.exerciseSets}>{exercise.sets} sets</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <Text style={styles.note}>
        You can modify these templates anytime in the Planner tab
      </Text>

      <View style={styles.buttons}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="arrow-left" size={16} color={theme.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.continueButton, saving && styles.continueButtonDisabled]}
          onPress={handleFinish}
          disabled={saving}>
          <Text style={styles.continueButtonText}>
            {saving ? 'Saving...' : 'Start Training'}
          </Text>
          <FontAwesome name="check" size={16} color={theme.buttonPrimaryText} />
        </TouchableOpacity>
      </View>

      {/* Volume Summary Modal */}
      <Modal visible={showVolumeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Volume Summary</Text>
              <TouchableOpacity onPress={() => setShowVolumeModal(false)}>
                <FontAwesome name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.volumeList}>
              {MUSCLE_GROUPS.map(muscle => {
                const planned = plan.weeklySetsByMuscle[muscle.id] || 0;
                const target = targetSets[muscle.id] || 10;
                const percentage = Math.round((planned / target) * 100);

                return (
                  <View key={muscle.id} style={styles.volumeRow}>
                    <View style={styles.volumeMuscleInfo}>
                      <View
                        style={[
                          styles.volumeMuscleColor,
                          { backgroundColor: muscle.color },
                        ]}
                      />
                      <Text style={styles.volumeMuscleName}>{muscle.name}</Text>
                    </View>
                    <View style={styles.volumeNumbers}>
                      <Text style={styles.volumePlanned}>{planned}</Text>
                      <Text style={styles.volumeSeparator}>/</Text>
                      <Text style={styles.volumeTarget}>{target}</Text>
                      <Text
                        style={[
                          styles.volumePercentage,
                          percentage >= 90 ? styles.volumeGood : styles.volumeLow,
                        ]}>
                        {percentage}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowVolumeModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.buttonPrimaryText,
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
  volumeSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  volumeSummaryText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    marginLeft: 10,
  },
  templateCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  templateTitleRow: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  templateSets: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  muscleIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    color: theme.text,
  },
  exerciseMuscle: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  exerciseSets: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  note: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontStyle: 'italic',
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
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.buttonPrimaryText,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.modal,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  volumeList: {
    maxHeight: 300,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  volumeMuscleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  volumeMuscleColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  volumeMuscleName: {
    fontSize: 14,
    color: theme.text,
  },
  volumeNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumePlanned: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  volumeSeparator: {
    fontSize: 14,
    color: theme.textMuted,
    marginHorizontal: 4,
  },
  volumeTarget: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  volumePercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  volumeGood: {
    color: theme.success,
  },
  volumeLow: {
    color: '#f59e0b',
  },
  modalCloseButton: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
});
