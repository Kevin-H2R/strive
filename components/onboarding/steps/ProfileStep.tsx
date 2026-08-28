import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { OnboardingStepProps } from '../types';
import { useAuthStore } from '@/stores/authStore';

export function ProfileStep({ onNext, onBack, isLastStep }: OnboardingStepProps) {
  const { profile, updateProfile } = useAuthStore();
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | ''>(profile?.gender || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);

    await updateProfile({
      age: age ? parseInt(age, 10) : null,
      gender: gender || null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
    });

    setSaving(false);
    onNext();
  };

  const isComplete = age && gender && height && weight;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tell us about yourself</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your experience
        </Text>

        {/* Age */}
        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={theme.inputPlaceholder}
            />
            <Text style={styles.unit}>years</Text>
          </View>
        </View>

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                gender === 'male' && styles.genderOptionActive,
              ]}
              onPress={() => setGender('male')}>
              <FontAwesome
                name="mars"
                size={28}
                color={gender === 'male' ? theme.buttonPrimaryText : theme.textSecondary}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === 'male' && styles.genderTextActive,
                ]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderOption,
                gender === 'female' && styles.genderOptionActive,
              ]}
              onPress={() => setGender('female')}>
              <FontAwesome
                name="venus"
                size={28}
                color={gender === 'female' ? theme.buttonPrimaryText : theme.textSecondary}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === 'female' && styles.genderTextActive,
                ]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Height */}
        <View style={styles.field}>
          <Text style={styles.label}>Height</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="175"
              placeholderTextColor={theme.inputPlaceholder}
            />
            <Text style={styles.unit}>cm</Text>
          </View>
        </View>

        {/* Weight */}
        <View style={styles.field}>
          <Text style={styles.label}>Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="70"
              placeholderTextColor={theme.inputPlaceholder}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <FontAwesome name="arrow-left" size={16} color={theme.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.continueButton, !isComplete && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={saving}>
            <Text style={styles.continueButtonText}>
              {saving ? 'Saving...' : isLastStep ? 'Finish' : 'Continue'}
            </Text>
            <FontAwesome name="arrow-right" size={16} color={theme.buttonPrimaryText} />
          </TouchableOpacity>
        </View>

        {!isComplete && (
          <Text style={styles.hint}>Please fill in all fields to continue</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: theme.inputText,
  },
  unit: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.textSecondary,
    width: 50,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    marginHorizontal: 6,
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
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.buttonPrimaryText,
    marginRight: 8,
  },
  hint: {
    textAlign: 'center',
    color: theme.textMuted,
    marginTop: 16,
    fontSize: 14,
  },
});
