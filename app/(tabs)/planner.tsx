import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/constants/theme';

interface PlannedWorkout {
  id: string;
  scheduled_date: string;
  completed: boolean;
  template_id: string | null;
  workout_templates?: {
    name: string;
  } | null;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: any;
}

export default function PlannerScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // Refetch on focus so templates written by the coach show up.
  useFocusEffect(useCallback(() => { fetchTemplates(); }, [user]));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchPlannedWorkouts();
    fetchTemplates();
  }, [weekStart, user]);

  const fetchPlannedWorkouts = async () => {
    if (!user) return;

    const weekEnd = addDays(weekStart, 6);
    const { data } = await supabase
      .from('planned_workouts')
      .select(`
        *,
        workout_templates (name)
      `)
      .eq('user_id', user.id)
      .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));

    setPlannedWorkouts(data || []);
  };

  const fetchTemplates = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', user.id);

    setTemplates(data || []);
  };

  const handlePreviousWeek = () => {
    setWeekStart(subWeeks(weekStart, 1));
  };

  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  const handleScheduleWorkout = async (templateId: string) => {
    if (!user) return;

    const { error } = await supabase.from('planned_workouts').insert({
      user_id: user.id,
      template_id: templateId,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
    });

    if (error) {
      Alert.alert('Error', 'Failed to schedule workout');
    } else {
      fetchPlannedWorkouts();
      setShowTemplateModal(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !newTemplateName.trim()) return;

    const { error } = await supabase.from('workout_templates').insert({
      user_id: user.id,
      name: newTemplateName.trim(),
      exercises: [],
    });

    if (error) {
      Alert.alert('Error', 'Failed to create template');
    } else {
      fetchTemplates();
      setNewTemplateName('');
      setShowCreateTemplate(false);
    }
  };

  const handleDeletePlanned = async (id: string) => {
    const { error } = await supabase.from('planned_workouts').delete().eq('id', id);

    if (!error) {
      fetchPlannedWorkouts();
    }
  };

  const getWorkoutsForDate = (date: Date) => {
    return plannedWorkouts.filter(
      (w) => w.scheduled_date === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={handlePreviousWeek} style={styles.navButton}>
          <FontAwesome name="chevron-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {format(weekStart, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
          <FontAwesome name="chevron-right" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekContainer}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dayWorkouts = getWorkoutsForDate(day);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                isToday && styles.dayButtonToday,
              ]}
              onPress={() => setSelectedDate(day)}>
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayTextSelected,
                ]}>
                {format(day, 'EEE')}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayTextSelected,
                ]}>
                {format(day, 'd')}
              </Text>
              {dayWorkouts.length > 0 && (
                <View style={[styles.workoutDot, isSelected && styles.workoutDotSelected]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowTemplateModal(true)}>
            <FontAwesome name="plus" size={16} color={theme.buttonPrimaryText} />
          </TouchableOpacity>
        </View>

        {getWorkoutsForDate(selectedDate).length === 0 ? (
          <View style={styles.emptyDay}>
            <FontAwesome name="calendar-o" size={48} color={theme.textMuted} />
            <Text style={styles.emptyDayText}>No workouts planned</Text>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => setShowTemplateModal(true)}>
              <Text style={styles.scheduleButtonText}>Schedule Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          getWorkoutsForDate(selectedDate).map((workout) => (
            <View key={workout.id} style={styles.plannedCard}>
              <View style={styles.plannedInfo}>
                <Text style={styles.plannedName}>
                  {workout.workout_templates?.name || 'Workout'}
                </Text>
                <Text style={styles.plannedStatus}>
                  {workout.completed ? 'Completed' : 'Scheduled'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeletePlanned(workout.id)}
                style={styles.deleteButton}>
                <FontAwesome name="trash-o" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={styles.templatesSection}>
          <View style={styles.templatesSectionHeader}>
            <Text style={styles.templatesTitle}>Workout Templates</Text>
            <TouchableOpacity onPress={() => setShowCreateTemplate(true)}>
              <FontAwesome name="plus-circle" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {templates.length === 0 ? (
            <Text style={styles.noTemplatesText}>
              Create templates to quickly schedule workouts
            </Text>
          ) : (
            templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => router.push(`/template/${template.id}`)}>
                <Text style={styles.templateName}>{template.name}</Text>
                <FontAwesome name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.modalItem}
                onPress={() => handleScheduleWorkout(template.id)}>
                <Text style={styles.modalItemText}>{template.name}</Text>
              </TouchableOpacity>
            ))}

            {templates.length === 0 && (
              <Text style={styles.modalEmptyText}>
                No templates yet. Create one first!
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        visible={showCreateTemplate}
        animationType="fade"
        transparent>
        <View style={styles.overlayContainer}>
          <View style={styles.createTemplateModal}>
            <Text style={styles.createTemplateTitle}>New Template</Text>
            <TextInput
              style={styles.templateInput}
              placeholder="Template name (e.g., Push Day)"
              value={newTemplateName}
              onChangeText={setNewTemplateName}
              placeholderTextColor={theme.inputPlaceholder}
            />
            <View style={styles.createTemplateButtons}>
              <TouchableOpacity
                style={styles.cancelTemplateButton}
                onPress={() => {
                  setNewTemplateName('');
                  setShowCreateTemplate(false);
                }}>
                <Text style={styles.cancelTemplateText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveTemplateButton}
                onPress={handleCreateTemplate}>
                <Text style={styles.saveTemplateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  dayButtonSelected: {
    backgroundColor: theme.primary,
  },
  dayButtonToday: {
    borderWidth: 2,
    borderColor: theme.primary,
  },
  dayName: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  dayTextSelected: {
    color: theme.buttonPrimaryText,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
    marginTop: 4,
  },
  workoutDotSelected: {
    backgroundColor: theme.buttonPrimaryText,
  },
  scrollContent: {
    padding: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  addButton: {
    backgroundColor: theme.buttonPrimary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDayText: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 12,
    marginBottom: 16,
  },
  scheduleButton: {
    backgroundColor: theme.buttonPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scheduleButtonText: {
    color: theme.buttonPrimaryText,
    fontWeight: '600',
  },
  plannedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  plannedInfo: {
    flex: 1,
  },
  plannedName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  plannedStatus: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  templatesSection: {
    marginTop: 24,
  },
  templatesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templatesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  noTemplatesText: {
    color: theme.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  modalClose: {
    fontSize: 16,
    color: theme.primary,
  },
  modalItem: {
    backgroundColor: theme.card,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.text,
  },
  modalEmptyText: {
    textAlign: 'center',
    color: theme.textMuted,
    padding: 32,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTemplateModal: {
    backgroundColor: theme.modal,
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  createTemplateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  templateInput: {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: theme.inputText,
  },
  createTemplateButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelTemplateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelTemplateText: {
    color: theme.textSecondary,
    fontWeight: '500',
  },
  saveTemplateButton: {
    backgroundColor: theme.buttonPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveTemplateText: {
    color: theme.buttonPrimaryText,
    fontWeight: '600',
  },
});
