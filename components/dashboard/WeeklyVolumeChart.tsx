import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { MuscleVolume } from '@/hooks/useVolume';
import { theme, withOpacity } from '@/constants/theme';

interface Props {
  muscleVolumes: MuscleVolume[];
}

const screenWidth = Dimensions.get('window').width;

export function WeeklyVolumeChart({ muscleVolumes }: Props) {
  const topMuscles = muscleVolumes
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6);

  const chartData = {
    labels: topMuscles.map((m) => m.muscleName.slice(0, 4)),
    datasets: [
      {
        data: topMuscles.map((m) => m.volume / 1000), // Convert to thousands
        colors: topMuscles.map((m) => () => m.color), // Use muscle colors
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Volume by Muscle (kg)</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 48}
        height={200}
        yAxisLabel=""
        yAxisSuffix="k"
        chartConfig={{
          backgroundColor: theme.card,
          backgroundGradientFrom: theme.card,
          backgroundGradientTo: theme.card,
          decimalPlaces: 1,
          color: (opacity = 1) => withOpacity('#fff', opacity),
          labelColor: () => theme.textSecondary,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.6,
          propsForBackgroundLines: {
            stroke: theme.border,
          },
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
        withCustomBarColorFromData
        flatColor
      />
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
    marginBottom: 12,
    color: theme.text,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -16,
  },
});
