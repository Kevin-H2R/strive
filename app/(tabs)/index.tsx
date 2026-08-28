import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeeklyVolume } from '@/hooks/useVolume';
import { WeeklyVolumeChart } from '@/components/dashboard/WeeklyVolumeChart';
import { ProgressTrend } from '@/components/dashboard/ProgressTrend';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { MuscleProgressList } from '@/components/dashboard/MuscleProgressList';
import { MuscleVolumeEvolution } from '@/components/dashboard/MuscleVolumeEvolution';
import { getWeekRangeForDate, getCurrentWeekRange, formatDate } from '@/lib/utils';
import { addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { theme } from '@/constants/theme';

export default function DashboardScreen() {
  const [weekDate, setWeekDate] = React.useState(new Date());
  const isCurrentWeek = isSameWeek(weekDate, new Date(), { weekStartsOn: 1 });

  const { muscleVolumes, totalVolume, totalSets, workoutCount, loading, refetch } = useWeeklyVolume(
    isCurrentWeek ? undefined : weekDate
  );
  const [refreshing, setRefreshing] = React.useState(false);

  const { start, end } = isCurrentWeek ? getCurrentWeekRange() : getWeekRangeForDate(weekDate);
  const weekLabel = `${formatDate(start, 'MMM d')} - ${formatDate(end, 'MMM d')}`;

  const goToPreviousWeek = () => setWeekDate((d) => subWeeks(d, 1));
  const goToNextWeek = () => {
    const next = addWeeks(weekDate, 1);
    if (next <= new Date()) setWeekDate(next);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 500);
  }, [refetch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }>
        <View style={styles.header}>
          <Text style={styles.greeting}>{isCurrentWeek ? 'This Week' : 'Past Week'}</Text>
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.dateRange}>{weekLabel}</Text>
            <TouchableOpacity
              onPress={goToNextWeek}
              style={[styles.navButton, isCurrentWeek && styles.navButtonDisabled]}
              disabled={isCurrentWeek}>
              <Text style={[styles.navArrow, isCurrentWeek && styles.navArrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <QuickStats
          totalVolume={totalVolume}
          totalSets={totalSets}
          workoutCount={workoutCount}
        />

        <WeeklyVolumeChart muscleVolumes={muscleVolumes} />

        <MuscleProgressList muscleVolumes={muscleVolumes} />

        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.sectionTitle}>Overall Evolution</Text>
        </View>

        <MuscleVolumeEvolution />

        <ProgressTrend />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navArrow: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
  },
  navArrowDisabled: {
    color: theme.textSecondary,
  },
  dateRange: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  sectionDivider: {
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: theme.textSecondary,
    opacity: 0.2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
});
