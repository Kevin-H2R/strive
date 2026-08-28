import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useExercises } from '@/hooks/useExercises';
import { Exercise, getPrimaryMuscleId } from '@/constants/exercises';
import { MUSCLE_GROUPS, getMuscleById } from '@/constants/muscles';
import { theme } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ visible, onClose, onSelect }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<number | null>(null);
  const { exercises, exercisesByMuscle } = useExercises(searchQuery);

  const filteredExercises = selectedMuscle
    ? exercisesByMuscle[selectedMuscle] || []
    : exercises;

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearchQuery('');
    setSelectedMuscle(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Exercise</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.inputPlaceholder}
        />

        <View style={styles.muscleFilters}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedMuscle === null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedMuscle(null)}>
            <Text
              style={[
                styles.filterChipText,
                selectedMuscle === null && styles.filterChipTextActive,
              ]}>
              All
            </Text>
          </TouchableOpacity>
          {MUSCLE_GROUPS.map((muscle) => (
            <TouchableOpacity
              key={muscle.id}
              style={[
                styles.filterChip,
                selectedMuscle === muscle.id && { backgroundColor: muscle.color, borderColor: muscle.color },
              ]}
              onPress={() => setSelectedMuscle(muscle.id)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedMuscle === muscle.id && styles.filterChipTextActive,
                ]}>
                {muscle.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const primaryMuscleId = getPrimaryMuscleId(item);
            const primaryMuscle = primaryMuscleId ? getMuscleById(primaryMuscleId) : null;
            // Get secondary muscles (contribution > 0.3 but not primary)
            const secondaryMuscles = item.muscleContributions
              .filter((mc) => mc.muscleId !== primaryMuscleId && mc.contribution >= 0.3)
              .map((mc) => getMuscleById(mc.muscleId)?.name)
              .filter(Boolean);

            return (
              <TouchableOpacity
                style={styles.exerciseItem}
                onPress={() => handleSelect(item)}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMuscle}>
                  {primaryMuscle?.name || 'Unknown'}
                  {secondaryMuscles.length > 0 && ` / ${secondaryMuscles.join(', ')}`}
                </Text>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  closeButton: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: theme.card,
    margin: 16,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.inputText,
  },
  muscleFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  filterChipTextActive: {
    color: theme.buttonPrimaryText,
  },
  listContent: {
    padding: 16,
  },
  exerciseItem: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  separator: {
    height: 8,
  },
});
