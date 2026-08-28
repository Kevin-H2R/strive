import { ReactNode } from 'react';

export interface OnboardingStepProps {
  onNext: () => void;
  onBack?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export interface OnboardingStepConfig {
  id: string;
  component: React.ComponentType<OnboardingStepProps>;
  // Optional: Add validation function if step needs to be completed before proceeding
  canProceed?: () => boolean;
}
