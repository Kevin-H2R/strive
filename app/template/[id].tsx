import React, { useEffect, useState } from 'react';
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutStore } from '@/stores/workoutStore';
import { TemplateExercise } from '@/hooks/useTemplates';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { theme } from '@/constants/theme';

export default function TemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { allExercises } = useExercises();
  const { activeWorkout, startWorkoutFromTemplate } = useWorkoutStore();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [fromCoach, setFromCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('workout_templates')
      .select('name, exercises, from_coach')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) Alert.alert('Error', error.message);
        else {
          setName(data.name);
          setExercises(data.exercises || []);
          setFromCoach(data.from_coach);
        }
        setLoading(false);
      });
  }, [id]);

  const names = new Map(allExercises.map((e) => [e.id, e.name]));

  const setSets = (index: number, delta: number) =>
    setExercises((list) =>
      list.map((e, i) => (i === index ? { ...e, sets: Math.max(1, Math.min(10, e.sets + delta)) } : e))
    );

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required');
    setSaving(true);
    const { error } = await supabase
      .from('workout_templates')
      .update({ name: name.trim(), exercises })
      .eq('id', id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  };

  const remove = () =>
    Alert.alert('Delete template?', 'Upcoming scheduled workouts using it are removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // planned_workouts.template_id has no cascade: drop upcoming, detach completed.
          await supabase.from('planned_workouts').delete().eq('template_id', id).eq('completed', false);
          await supabase.from('planned_workouts').update({ template_id: null }).eq('template_id', id);
          const { error } = await supabase.from('workout_templates').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else router.back();
        },
      },
    ]);

  const start = () => {
    const go = () => {
      startWorkoutFromTemplate({ id, name, exercises, created_at: '' }, allExercises);
      router.dismissTo('/workout');
    };
    if (activeWorkout) {
      Alert.alert('Workout in progress', 'Replace it with this template?', [
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Template',
          headerRight: () => (
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text style={styles.headerSave}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Template name"
          placeholderTextColor={theme.textMuted}
        />
        {fromCoach && (
          <Text style={styles.muted}>
            Made by your coach. Your edits are shown to it, and it may adjust this template when it re-plans.
          </Text>
        )}

        {exercises.map((e, i) => (
          <View key={`${e.exerciseId}-${i}`} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName} numberOfLines={2}>
                {names.get(e.exerciseId) ?? 'Exercise'}
              </Text>
              {!!e.targets?.length && (
                <Text style={styles.muted}>Next: {e.targets.map((t) => `${t.weight}×${t.reps}`).join('  ')}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.stepper} onPress={() => setSets(i, -1)} accessibilityLabel="Fewer sets">
              <FontAwesome name="minus" size={12} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.sets}>{e.sets} sets</Text>
            <TouchableOpacity style={styles.stepper} onPress={() => setSets(i, 1)} accessibilityLabel="More sets">
              <FontAwesome name="plus" size={12} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.trash}
              onPress={() => setExercises((list) => list.filter((_, j) => j !== i))}
              accessibilityLabel="Remove exercise">
              <FontAwesome name="trash-o" size={18} color={theme.error} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPickerOpen(true)}>
          <Text style={styles.secondaryText}>+ Add exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={start} disabled={exercises.length === 0}>
          <Text style={styles.buttonText}>Start this workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={remove}>
          <Text style={[styles.secondaryText, { color: theme.error }]}>Delete template</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ex) => setExercises((list) => [...list, { exerciseId: ex.id, sets: 3 }])}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  scroll: { padding: 16, gap: 12 },
  headerSave: { color: theme.primary, fontSize: 16, fontWeight: '600' },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: 8,
  },
  muted: { fontSize: 13, color: theme.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  exerciseName: { fontSize: 15, fontWeight: '600', color: theme.text },
  stepper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sets: { color: theme.text, fontSize: 14, minWidth: 48, textAlign: 'center', fontVariant: ['tabular-nums'] },
  trash: { padding: 6 },
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
