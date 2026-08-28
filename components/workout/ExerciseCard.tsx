import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ExerciseEntry } from '@/stores/workoutStore';
import { SetLogger } from './SetLogger';
import { getMuscleById } from '@/constants/muscles';
import { getPrimaryMuscleId } from '@/constants/exercises';
import { theme } from '@/constants/theme';

interface Props {
  entry: ExerciseEntry;
  onAddSet: () => void;
  onUpdateSet: (setId: string, weight: number, reps: number) => void;
  onCompleteSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
}

export function ExerciseCard({
  entry,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onRemoveSet,
  onRemoveExercise,
}: Props) {
  const totalVolume = entry.sets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.weight * s.reps, 0);

  const primaryMuscleId = getPrimaryMuscleId(entry.exercise);
  const primaryMuscle = primaryMuscleId ? getMuscleById(primaryMuscleId) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.exerciseName}>{entry.exercise.name}</Text>
          <Text style={styles.muscleText}>
            {primaryMuscle?.name || 'Unknown'}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemoveExercise} style={styles.removeButton}>
          <FontAwesome name="times" size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.setsContainer}>
        {entry.sets.map((set) => (
          <SetLogger
            key={set.id}
            set={set}
            onUpdateSet={(weight, reps) => onUpdateSet(set.id, weight, reps)}
            onCompleteSet={() => onCompleteSet(set.id)}
            onRemoveSet={() => onRemoveSet(set.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addSetButton} onPress={onAddSet}>
          <FontAwesome name="plus" size={14} color={theme.primary} />
          <Text style={styles.addSetText}>Add Set</Text>
        </TouchableOpacity>

        <Text style={styles.volumeText}>
          Volume: {totalVolume.toLocaleString()} kg
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  muscleText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  setsContainer: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  addSetText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  volumeText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
});
