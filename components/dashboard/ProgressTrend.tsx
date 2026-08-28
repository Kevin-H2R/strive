import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useVolumeHistory } from '@/hooks/useWorkouts';
import { theme, withOpacity } from '@/constants/theme';

const screenWidth = Dimensions.get('window').width;

export function ProgressTrend() {
  const { history, loading } = useVolumeHistory(6);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Volume Trend</Text>
        <Text style={styles.emptyText}>No workout history yet</Text>
      </View>
    );
  }

  const chartData = {
    labels: history.map((h) => h.week),
    datasets: [
      {
        data: history.map((h) => h.volume / 1000 || 0.1), // Convert to thousands, minimum 0.1 for display
        color: (opacity = 1) => withOpacity(theme.chart, opacity),
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Volume Trend (Last 6 Weeks)</Text>
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
          decimalPlaces: 0,
          color: (opacity = 1) => withOpacity(theme.chart, opacity),
          labelColor: () => theme.textSecondary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.chart,
          },
          propsForBackgroundLines: {
            stroke: theme.border,
          },
        }}
        style={styles.chart}
        bezier
        fromZero
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
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    textAlign: 'center',
    color: theme.textMuted,
    paddingVertical: 40,
  },
});
