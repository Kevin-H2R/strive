import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CoachState, getCoachState, runCoach } from '@/lib/coach';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutStore } from '@/stores/workoutStore';
import { theme } from '@/constants/theme';

export default function CoachScreen() {
  const router = useRouter();
  const { allExercises } = useExercises();
  const { activeWorkout, startWorkoutFromTemplate } = useWorkoutStore();
  const [state, setState] = useState<CoachState | null>(null);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState(4);
  const [showNotes, setShowNotes] = useState(false);

  // Reload on focus: the coach also updates in the background after each saved workout.
  useFocusEffect(
    useCallback(() => {
      getCoachState()
        .then((s) => {
          setState(s);
          if (s) {
            setGoal(s.goal ?? '');
            setDays(s.days_per_week);
          }
        })
        .catch((e) => Alert.alert('Error', e.message))
        .finally(() => setLoading(false));
    }, [])
  );

  const ask = async (body: { goal?: string; days_per_week?: number } = {}) => {
    setThinking(true);
    try {
      setState(await runCoach(body));
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Coach error', e.message);
    } finally {
      setThinking(false);
    }
  };

  const startSession = () => {
    const session = state?.next_session;
    if (!session) return;
    const go = () => {
      startWorkoutFromTemplate(
        {
          id: 'coach',
          name: session.name,
          created_at: '',
          exercises: session.exercises.map((e) => ({
            exerciseId: e.exercise_id,
            sets: e.sets.length,
            targets: e.sets,
          })),
        },
        allExercises
      );
      router.push('/workout');
    };
    if (activeWorkout) {
      Alert.alert('Workout in progress', 'Replace it with the coach session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', style: 'destructive', onPress: go },
      ]);
    } else go();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (thinking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.muted}>Coach is reviewing your history… (up to a minute)</Text>
      </View>
    );
  }

  if (!state?.goal || editing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>What do you want to improve?</Text>
          <Text style={styles.muted}>
            Be specific: lifts, numbers, deadline, injuries, equipment. E.g. "Bench 100kg by March, bigger
            shoulders. Old lower-back tweak. Full gym."
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 120 }]}
            value={goal}
            onChangeText={setGoal}
            multiline
            placeholder="My goal…"
            placeholderTextColor={theme.textMuted}
          />
          <Text style={styles.label}>Training days per week</Text>
          <View style={styles.row}>
            {[2, 3, 4, 5, 6].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, d === days && styles.dayChipActive]}
                onPress={() => setDays(d)}>
                <Text style={[styles.dayText, d === days && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.button, !goal.trim() && { opacity: 0.4 }]}
            disabled={!goal.trim()}
            onPress={() => ask({ goal: goal.trim(), days_per_week: days })}>
            <Text style={styles.buttonText}>Build my program</Text>
          </TouchableOpacity>
          {editing && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(false)}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {state.message && (
          <View style={styles.card}>
            <Text style={styles.message}>{state.message}</Text>
          </View>
        )}

        {!!state.scorecard && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Goal scorecard</Text>
            <Text style={styles.body}>{state.scorecard}</Text>
          </View>
        )}

        {state.next_session && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Next: {state.next_session.name}</Text>
            {state.next_session.exercises.map((e) => (
              <View key={e.exercise_id} style={styles.exercise}>
                <Text style={styles.exerciseName}>{e.name}</Text>
                <Text style={styles.sets}>{e.sets.map((s) => `${s.weight}×${s.reps}`).join('   ')}</Text>
                {!!e.cue && <Text style={styles.muted}>{e.cue}</Text>}
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={startSession}>
              <Text style={styles.buttonText}>Start this session</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.program && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Program</Text>
            <Text style={styles.body}>{state.program}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Goal</Text>
          <Text style={styles.body}>{state.goal}</Text>
          <Text style={styles.muted}>{state.days_per_week} days/week</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(true)}>
            <Text style={styles.secondaryText}>Change goal</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowNotes((v) => !v)}>
          <Text style={styles.secondaryText}>{showNotes ? 'Hide' : 'Show'} coach memory</Text>
        </TouchableOpacity>
        {showNotes && (
          <View style={styles.card}>
            <Text style={styles.body}>{state.notes}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => ask()}>
          <Text style={styles.secondaryText}>Re-plan now</Text>
        </TouchableOpacity>
        <Text style={[styles.muted, { textAlign: 'center' }]}>
          Updated {new Date(state.updated_at).toLocaleString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: theme.background,
  },
  scroll: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text },
  label: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginTop: 8 },
  muted: { fontSize: 13, color: theme.textSecondary },
  body: { fontSize: 15, lineHeight: 21, color: theme.text },
  message: { fontSize: 16, lineHeight: 23, color: theme.text, fontWeight: '500' },
  input: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: theme.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 8 },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  dayText: { color: theme.text, fontWeight: '600' },
  dayTextActive: { color: theme.background },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  exercise: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.borderLight, gap: 2 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: theme.text },
  sets: { fontSize: 15, color: theme.text, fontVariant: ['tabular-nums'] },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: theme.background, fontSize: 16, fontWeight: '600' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: theme.textSecondary, fontSize: 15, fontWeight: '500' },
});
