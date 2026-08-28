import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  WelcomeStep,
  ProfileStep,
  GoalsStep,
  ReviewTargetsStep,
  GeneratedPlanStep,
  GoalsData,
} from './steps';

// ============================================
// STEP CONFIGURATION
// Add new steps here to extend the onboarding
// ============================================
const STEP_IDS = ['welcome', 'profile', 'goals', 'review', 'plan'] as const;
type StepId = typeof STEP_IDS[number];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { currentStep, nextStep, previousStep, completeOnboarding } = useOnboardingStore();
  const [goalsData, setGoalsData] = useState<GoalsData | null>(null);
  const [finalTargets, setFinalTargets] = useState<Record<number, number>>({});

  const totalSteps = STEP_IDS.length;
  const currentStepId = STEP_IDS[currentStep] || 'welcome';
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
      onComplete();
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      previousStep();
    }
  };

  const handleGoalsNext = (data: GoalsData) => {
    setGoalsData(data);
    nextStep();
  };

  const handleReviewNext = (targets: Record<number, number>) => {
    setFinalTargets(targets);
    nextStep();
  };

  const handlePlanFinish = () => {
    completeOnboarding();
    onComplete();
  };

  const renderStep = () => {
    const commonProps = {
      onNext: handleNext,
      onBack: isFirstStep ? undefined : handleBack,
      isFirstStep,
      isLastStep,
    };

    switch (currentStepId) {
      case 'welcome':
        return <WelcomeStep {...commonProps} />;

      case 'profile':
        return <ProfileStep {...commonProps} />;

      case 'goals':
        return (
          <GoalsStep
            {...commonProps}
            isLastStep={false}
            onNextWithData={handleGoalsNext}
          />
        );

      case 'review':
        return (
          <ReviewTargetsStep
            {...commonProps}
            isLastStep={false}
            goalsData={goalsData || undefined}
            onNextWithTargets={handleReviewNext}
          />
        );

      case 'plan':
        return (
          <GeneratedPlanStep
            {...commonProps}
            isLastStep={true}
            daysPerWeek={goalsData?.daysPerWeek || 4}
            targetSets={finalTargets}
            onNext={handlePlanFinish}
          />
        );

      default:
        completeOnboarding();
        onComplete();
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {STEP_IDS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Current step */}
      <View style={styles.stepContainer}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: theme.primary,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: theme.success,
  },
  stepContainer: {
    flex: 1,
  },
});
