import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useTemplates, useTodaysPlannedWorkout, WorkoutTemplate } from '@/hooks/useTemplates';

interface WorkoutStartModalProps {
  visible: boolean;
  onClose: () => void;
  onStartEmpty: () => void;
  onStartFromTemplate: (template: WorkoutTemplate) => void;
}

export function WorkoutStartModal({
  visible,
  onClose,
  onStartEmpty,
  onStartFromTemplate,
}: WorkoutStartModalProps) {
  const { templates, loading: templatesLoading } = useTemplates();
  const { plannedWorkout, loading: plannedLoading } = useTodaysPlannedWorkout();

  const loading = templatesLoading || plannedLoading;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Start Workout</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Today's Planned Workout */}
              {plannedWorkout?.template && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today's Workout</Text>
                  <TouchableOpacity
                    style={styles.plannedCard}
                    onPress={() => onStartFromTemplate(plannedWorkout.template!)}>
                    <View style={styles.plannedIcon}>
                      <FontAwesome name="calendar-check-o" size={24} color={theme.success} />
                    </View>
                    <View style={styles.plannedInfo}>
                      <Text style={styles.plannedName}>{plannedWorkout.template.name}</Text>
                      <Text style={styles.plannedMeta}>
                        {plannedWorkout.template.exercises.length} exercises scheduled
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Templates */}
              {templates.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>From Template</Text>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.templateCard}
                      onPress={() => onStartFromTemplate(template)}>
                      <View style={styles.templateIcon}>
                        <FontAwesome name="file-text-o" size={20} color={theme.primary} />
                      </View>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateMeta}>
                          {template.exercises.length} exercises
                        </Text>
                      </View>
                      <FontAwesome name="chevron-right" size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Empty Workout Option */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Or Start Fresh</Text>
                <TouchableOpacity style={styles.emptyCard} onPress={onStartEmpty}>
                  <View style={styles.emptyIcon}>
                    <FontAwesome name="plus" size={20} color={theme.textSecondary} />
                  </View>
                  <View style={styles.emptyInfo}>
                    <Text style={styles.emptyName}>Empty Workout</Text>
                    <Text style={styles.emptyMeta}>Build your workout from scratch</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.modal,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  plannedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.success,
  },
  plannedIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${theme.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  plannedInfo: {
    flex: 1,
  },
  plannedName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  plannedMeta: {
    fontSize: 13,
    color: theme.success,
    marginTop: 2,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  templateMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emptyInfo: {
    flex: 1,
  },
  emptyName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  emptyMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
});
