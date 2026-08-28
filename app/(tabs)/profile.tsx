import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { MUSCLE_GROUPS } from '@/constants/muscles';
import { theme } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const { weightUnit, setWeightUnit, weeklySetTargets, setWeeklySetTarget } = useSettingsStore();
  const { resetOnboarding } = useOnboardingStore();
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingMuscle, setEditingMuscle] = useState<number | null>(null);
  const [targetValue, setTargetValue] = useState('');

  // Profile edit states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingField, setEditingField] = useState<'age' | 'gender' | 'height' | 'weight' | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleResetTutorial = () => {
    Alert.alert(
      'Reset Tutorial',
      'This will show the onboarding tutorial again next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            resetOnboarding();
            Alert.alert('Done', 'Tutorial will show on next app launch.');
          },
        },
      ]
    );
  };

  const handleEditTarget = (muscleId: number) => {
    setEditingMuscle(muscleId);
    setTargetValue(weeklySetTargets[muscleId]?.toString() || '');
    setShowTargetModal(true);
  };

  const handleSaveTarget = () => {
    if (editingMuscle !== null) {
      const value = parseInt(targetValue, 10) || 0;
      setWeeklySetTarget(editingMuscle, value);
    }
    setShowTargetModal(false);
    setEditingMuscle(null);
    setTargetValue('');
  };

  const handleEditProfile = (field: 'age' | 'gender' | 'height' | 'weight') => {
    setEditingField(field);
    if (field === 'gender') {
      setEditValue(profile?.gender || '');
    } else {
      setEditValue(profile?.[field]?.toString() || '');
    }
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (editingField === null) return;

    let updates: Record<string, any> = {};

    if (editingField === 'gender') {
      updates.gender = editValue || null;
    } else if (editingField === 'age') {
      updates.age = parseInt(editValue, 10) || null;
    } else if (editingField === 'height') {
      updates.height = parseFloat(editValue) || null;
    } else if (editingField === 'weight') {
      updates.weight = parseFloat(editValue) || null;
    }

    const { error } = await updateProfile(updates);

    if (error) {
      Alert.alert('Error', error);
    }

    setShowProfileModal(false);
    setEditingField(null);
    setEditValue('');
  };

  const formatHeight = (cm: number | null | undefined) => {
    if (!cm) return 'Not set';
    return `${cm} cm`;
  };

  const formatWeight = (kg: number | null | undefined) => {
    if (!kg) return 'Not set';
    if (weightUnit === 'lbs') {
      return `${Math.round(kg * 2.205)} lbs`;
    }
    return `${kg} kg`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={32} color={theme.buttonPrimaryText} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              Member since {new Date(user?.created_at || '').toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('age')}>
            <Text style={styles.infoLabel}>Age</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>
                {profile?.age ? `${profile.age} years` : 'Not set'}
              </Text>
              <FontAwesome name="pencil" size={14} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('gender')}>
            <Text style={styles.infoLabel}>Gender</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>
                {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not set'}
              </Text>
              <FontAwesome name="pencil" size={14} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={() => handleEditProfile('height')}>
            <Text style={styles.infoLabel}>Height</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{formatHeight(profile?.height)}</Text>
              <FontAwesome name="pencil" size={14} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.infoRow, styles.infoRowLast]} onPress={() => handleEditProfile('weight')}>
            <Text style={styles.infoLabel}>Weight</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>{formatWeight(profile?.weight)}</Text>
              <FontAwesome name="pencil" size={14} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Unit Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Weight Unit</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  weightUnit === 'kg' && styles.toggleOptionActive,
                ]}
                onPress={() => setWeightUnit('kg')}>
                <Text
                  style={[
                    styles.toggleText,
                    weightUnit === 'kg' && styles.toggleTextActive,
                  ]}>
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  weightUnit === 'lbs' && styles.toggleOptionActive,
                ]}
                onPress={() => setWeightUnit('lbs')}>
                <Text
                  style={[
                    styles.toggleText,
                    weightUnit === 'lbs' && styles.toggleTextActive,
                  ]}>
                  lbs
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weekly Targets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Set Targets</Text>
          <Text style={styles.sectionSubtitle}>
            Set your target number of sets per week for each muscle group
          </Text>

          {MUSCLE_GROUPS.map((muscle) => (
            <TouchableOpacity
              key={muscle.id}
              style={styles.targetRow}
              onPress={() => handleEditTarget(muscle.id)}>
              <View style={[styles.muscleColor, { backgroundColor: muscle.color }]} />
              <Text style={styles.muscleName}>{muscle.name}</Text>
              <Text style={styles.targetValue}>
                {weeklySetTargets[muscle.id] || 0} sets
              </Text>
              <FontAwesome name="pencil" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Developer Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <TouchableOpacity style={styles.devRow} onPress={handleResetTutorial}>
            <FontAwesome name="refresh" size={16} color={theme.textSecondary} />
            <Text style={styles.devRowText}>Reset Tutorial</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <FontAwesome name="sign-out" size={20} color={theme.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Edit Target Modal */}
      <Modal visible={showTargetModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Set Target for{' '}
              {MUSCLE_GROUPS.find((m) => m.id === editingMuscle)?.name}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.targetInput}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={theme.inputPlaceholder}
              />
              <Text style={styles.inputUnit}>sets/week</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTargetModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveTarget}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showProfileModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editingField?.charAt(0).toUpperCase()}{editingField?.slice(1)}
            </Text>

            {editingField === 'gender' ? (
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    editValue === 'male' && styles.genderOptionActive,
                  ]}
                  onPress={() => setEditValue('male')}>
                  <FontAwesome
                    name="mars"
                    size={24}
                    color={editValue === 'male' ? theme.buttonPrimaryText : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      editValue === 'male' && styles.genderTextActive,
                    ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    editValue === 'female' && styles.genderOptionActive,
                  ]}
                  onPress={() => setEditValue('female')}>
                  <FontAwesome
                    name="venus"
                    size={24}
                    color={editValue === 'female' ? theme.buttonPrimaryText : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.genderText,
                      editValue === 'female' && styles.genderTextActive,
                    ]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.targetInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType={editingField === 'age' ? 'number-pad' : 'decimal-pad'}
                  placeholder={
                    editingField === 'age' ? '25' :
                    editingField === 'height' ? '175' :
                    '70'
                  }
                  placeholderTextColor={theme.inputPlaceholder}
                />
                <Text style={styles.inputUnit}>
                  {editingField === 'age' ? 'years' :
                   editingField === 'height' ? 'cm' :
                   'kg'}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowProfileModal(false);
                  setEditingField(null);
                  setEditValue('');
                }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveProfile}>
                <Text style={styles.modalSaveText}>Save</Text>
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
  scrollContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  memberSince: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.text,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: theme.textSecondary,
    marginRight: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: theme.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  toggleTextActive: {
    color: theme.buttonPrimaryText,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  muscleColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  muscleName: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
  },
  targetValue: {
    fontSize: 14,
    color: theme.textSecondary,
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.error,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: theme.textMuted,
    marginTop: 24,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.modal,
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  targetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: theme.inputText,
  },
  inputUnit: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.textSecondary,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  genderOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    width: '45%',
  },
  genderOptionActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  genderText: {
    marginTop: 8,
    fontSize: 16,
    color: theme.textSecondary,
  },
  genderTextActive: {
    color: theme.buttonPrimaryText,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
  },
  modalCancelText: {
    color: theme.textSecondary,
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: theme.buttonPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: theme.buttonPrimaryText,
    fontWeight: '600',
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  devRowText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 12,
  },
});
