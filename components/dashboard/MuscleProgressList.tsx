import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MuscleVolume } from '@/hooks/useVolume';
import { theme } from '@/constants/theme';

interface Props {
  muscleVolumes: MuscleVolume[];
}

export function MuscleProgressList({ muscleVolumes }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle Progress</Text>
      {muscleVolumes.map((muscle) => (
        <View key={muscle.muscleId} style={styles.muscleRow}>
          <View style={styles.muscleInfo}>
            <Text style={styles.muscleName}>{muscle.muscleName}</Text>
            <Text style={styles.volumeText}>
              {muscle.sets} / {muscle.targetSets} sets
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${muscle.percentage}%`,
                  backgroundColor: muscle.color,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.percentageText,
              { color: muscle.color },
            ]}>
            {muscle.percentage.toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.text,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleInfo: {
    width: 100,
  },
  muscleName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  volumeText: {
    fontSize: 10,
    color: theme.textMuted,
    marginTop: 2,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: theme.surface,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
