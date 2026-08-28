import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatVolume } from '@/lib/utils';
import { theme } from '@/constants/theme';

interface Props {
  totalVolume: number;
  totalSets: number;
  workoutCount: number;
}

export function QuickStats({ totalVolume, totalSets, workoutCount }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{formatVolume(totalVolume)}</Text>
        <Text style={styles.statLabel}>Total Volume (kg)</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalSets}</Text>
        <Text style={styles.statLabel}>Total Sets</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{workoutCount}</Text>
        <Text style={styles.statLabel}>Workouts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
