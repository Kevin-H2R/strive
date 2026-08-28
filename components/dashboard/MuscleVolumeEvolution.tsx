import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useMuscleVolumeHistory } from '@/hooks/useWorkouts';
import { MUSCLE_GROUPS } from '@/constants/muscles';
import { theme } from '@/constants/theme';

const screenWidth = Dimensions.get('window').width;

export function MuscleVolumeEvolution() {
  const [selectedMuscleId, setSelectedMuscleId] = useState(1); // Default to Chest
  const { history, loading } = useMuscleVolumeHistory(8);

  const selectedMuscle = MUSCLE_GROUPS.find((m) => m.id === selectedMuscleId);
  const muscleHistory = history[selectedMuscleId] || [];

  const hasData = muscleHistory.some((h) => h.volume > 0);

  const chartData = {
    labels: muscleHistory.map((h) => h.week),
    datasets: [
      {
        data: hasData
          ? muscleHistory.map((h) => h.volume / 1000 || 0)
          : [0, 0, 0, 0, 0, 0, 0, 0], // Placeholder data
        color: () => selectedMuscle?.color || theme.chart,
        strokeWidth: 3,
      },
    ],
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Volume Evolution</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.muscleSelector}
      >
        {MUSCLE_GROUPS.map((muscle) => {
          const isSelected = muscle.id === selectedMuscleId;
          return (
            <TouchableOpacity
              key={muscle.id}
              style={[
                styles.muscleChip,
                isSelected && { backgroundColor: muscle.color, borderColor: muscle.color },
              ]}
              onPress={() => setSelectedMuscleId(muscle.id)}
            >
              <Text
                style={[
                  styles.muscleChipText,
                  isSelected && styles.muscleChipTextSelected,
                ]}
              >
                {muscle.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No {selectedMuscle?.name.toLowerCase()} workouts yet
          </Text>
          <Text style={styles.emptySubtext}>
            Start training to see your progress
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 48}
            height={180}
            yAxisLabel=""
            yAxisSuffix="k"
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 1,
              color: () => selectedMuscle?.color || theme.chart,
              labelColor: () => theme.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: selectedMuscle?.color || theme.chart,
                fill: theme.card,
              },
              propsForBackgroundLines: {
                strokeDasharray: '4',
                stroke: theme.border,
              },
            }}
            style={styles.chart}
            bezier
            fromZero
          />
          <View style={styles.chartLegend}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: selectedMuscle?.color },
              ]}
            />
            <Text style={styles.legendText}>
              {selectedMuscle?.name} volume (kg x reps / 1000)
            </Text>
          </View>
        </View>
      )}
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
  loadingContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
  },
  muscleSelector: {
    paddingBottom: 12,
  },
  muscleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  muscleChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  muscleChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -16,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
