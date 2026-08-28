import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { WorkoutSet } from '@/stores/workoutStore';
import { theme } from '@/constants/theme';

interface Props {
  set: WorkoutSet;
  onUpdateSet: (weight: number, reps: number) => void;
  onCompleteSet: () => void;
  onRemoveSet: () => void;
}

export function SetLogger({ set, onUpdateSet, onCompleteSet, onRemoveSet }: Props) {
  return (
    <View style={[styles.container, set.completed && styles.containerCompleted]}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={set.weight > 0 ? set.weight.toString() : ''}
          onChangeText={(text) => onUpdateSet(parseFloat(text) || 0, set.reps)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.inputPlaceholder}
        />
        <Text style={styles.inputLabel}>kg</Text>
      </View>

      <Text style={styles.times}>x</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={set.reps > 0 ? set.reps.toString() : ''}
          onChangeText={(text) => onUpdateSet(set.weight, parseInt(text) || 0)}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.inputPlaceholder}
        />
        <Text style={styles.inputLabel}>reps</Text>
      </View>

      <TouchableOpacity
        style={[styles.completeButton, set.completed && styles.completeButtonActive]}
        onPress={onCompleteSet}>
        <FontAwesome
          name={set.completed ? 'check-circle' : 'circle-o'}
          size={24}
          color={set.completed ? theme.success : theme.textMuted}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeButton} onPress={onRemoveSet}>
        <FontAwesome name="trash-o" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  containerCompleted: {
    backgroundColor: theme.card,
    borderColor: theme.success,
  },
  setNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  input: {
    width: 60,
    backgroundColor: theme.inputBackground,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: theme.inputText,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  inputLabel: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.textMuted,
  },
  times: {
    fontSize: 16,
    color: theme.textSecondary,
    marginHorizontal: 4,
  },
  completeButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  completeButtonActive: {},
  removeButton: {
    marginLeft: 12,
    padding: 4,
  },
});
