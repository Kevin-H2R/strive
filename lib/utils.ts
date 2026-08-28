import { startOfWeek, endOfWeek, format, isWithinInterval, parseISO, subWeeks } from 'date-fns';

export const getCurrentWeekRange = () => {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
};

export const getWeekRangeForDate = (date: Date) => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
};

export const isInCurrentWeek = (date: Date | string) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  const { start, end } = getCurrentWeekRange();
  return isWithinInterval(parsedDate, { start, end });
};

export const formatWeight = (weight: number, unit: 'kg' | 'lbs') => {
  return `${weight.toFixed(1)} ${unit}`;
};

export const formatVolume = (volume: number) => {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toFixed(0);
};

export const formatDate = (date: Date | string, formatStr: string = 'MMM d, yyyy') => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

export const getLastNWeeks = (n: number) => {
  const weeks = [];
  for (let i = 0; i < n; i++) {
    const weekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
    weeks.push({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      label: format(weekStart, 'MMM d'),
    });
  }
  return weeks.reverse();
};

export const calculateVolumePercentage = (current: number, target: number) => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

export const getVolumeColor = (percentage: number) => {
  if (percentage >= 100) return '#000';    // Black - target met
  if (percentage >= 75) return '#333';     // Dark gray - close
  if (percentage >= 50) return '#666';     // Medium gray - halfway
  return '#999';                            // Light gray - needs work
};
