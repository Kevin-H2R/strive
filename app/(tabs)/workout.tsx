import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { WorkoutStartModal } from '@/components/workout/WorkoutStartModal';
import { saveWorkout } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { Exercise } from '@/constants/exercises';
import { WorkoutTemplate } from '@/hooks/useTemplates';
import { theme } from '@/constants/theme';

export default function WorkoutScreen() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { allExercises } = useExercises();

  const {
    activeWorkout,
    startWorkout,
    startWorkoutFromTemplate,
    setWorkoutDate,
    endWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    completeSet,
    removeSet,
    getTotalVolume,
  } = useWorkoutStore();

  const handleStartWorkout = () => {
    setShowStartModal(true);
  };

  const handleStartEmpty = () => {
    setShowStartModal(false);
    startWorkout();
  };

  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    setShowStartModal(false);
    startWorkoutFromTemplate(template, allExercises);
  };

  const handleAddExercise = (exercise: Exercise) => {
    addExercise(exercise);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setWorkoutDate(selectedDate);
    }
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkout || !user) return;

    const completedSets = activeWorkout.exercises.reduce(
      (count, e) => count + e.sets.filter((s) => s.completed).length,
      0
    );

    if (completedSets === 0) {
      Alert.alert('No completed sets', 'Please complete at least one set before finishing.');
      return;
    }

    Alert.alert(
      'Finish Workout',
      `Save this workout with ${completedSets} completed sets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setSaving(true);
            try {
              const workoutData = {
                name: activeWorkout.name,
                startedAt: activeWorkout.startedAt,
                exercises: activeWorkout.exercises.map((e) => ({
                  exerciseId: e.exerciseId,
                  sets: e.sets
                    .filter((s) => s.completed)
                    .map((s) => ({ weight: s.weight, reps: s.reps })),
                })),
              };

              await saveWorkout(user.id, workoutData);
              endWorkout();
              Alert.alert('Success', 'Workout saved successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to save workout. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? All progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => endWorkout(),
        },
      ]
    );
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <FontAwesome name="bolt" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>Ready to train?</Text>
          <Text style={styles.emptySubtitle}>
            Start a new workout to begin tracking your sets and volume
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
            <FontAwesome name="play" size={20} color={theme.buttonPrimaryText} />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        <WorkoutStartModal
          visible={showStartModal}
          onClose={() => setShowStartModal(false)}
          onStartEmpty={handleStartEmpty}
          onStartFromTemplate={handleStartFromTemplate}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutName}>{activeWorkout.name}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}>
            <FontAwesome name="calendar" size={16} color={theme.primary} />
            <Text style={styles.dateButtonText}>
              {activeWorkout.startedAt.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <Text style={styles.volumeLabel}>
            Total Volume: {getTotalVolume().toLocaleString()} kg
          </Text>
        </View>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={activeWorkout.startedAt}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.datePickerDone}
                onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeWorkout.exercises.map((entry) => (
          <ExerciseCard
            key={entry.exerciseId}
            entry={entry}
            onAddSet={() => addSet(entry.exerciseId)}
            onUpdateSet={(setId, weight, reps) =>
              updateSet(entry.exerciseId, setId, weight, reps)
            }
            onCompleteSet={(setId) => completeSet(entry.exerciseId, setId)}
            onRemoveSet={(setId) => removeSet(entry.exerciseId, setId)}
            onRemoveExercise={() => removeExercise(entry.exerciseId)}
          />
        ))}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowPicker(true)}>
          <FontAwesome name="plus" size={20} color={theme.primary} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelWorkout}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.finishButton, saving && styles.buttonDisabled]}
          onPress={handleFinishWorkout}
          disabled={saving}>
          <Text style={styles.finishButtonText}>
            {saving ? 'Saving...' : 'Finish Workout'}
          </Text>
        </TouchableOpacity>
      </View>

      <ExercisePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
      />

      <WorkoutStartModal
        visible={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStartEmpty={handleStartEmpty}
        onStartFromTemplate={handleStartFromTemplate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.buttonPrimary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  startButtonText: {
    color: theme.buttonPrimaryText,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  datePickerContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  datePickerDone: {
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  datePickerDoneText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  volumeLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.border,
  },
  addExerciseText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  finishButton: {
    flex: 2,
    padding: 16,
    alignItems: 'center',
    backgroundColor: theme.buttonPrimary,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  finishButtonText: {
    fontSize: 16,
    color: theme.buttonPrimaryText,
    fontWeight: '600',
  },
});
