import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import SignupStep1 from '../components/signup/SignupStep1';
import SignupStep2 from '../components/signup/SignupStep2';
import SignupStep3 from '../components/signup/SignupStep3';

export interface SignupData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  termsAccepted: boolean;
}

export default function SignupScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    country: '',
    termsAccepted: false,
  });

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = (stepData: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...stepData }));
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSaveAndExit = () => {
    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          style={[
            styles.stepCircle,
            currentStep >= step ? styles.activeStep : styles.inactiveStep,
          ]}
        >
          <Text
            style={[
              styles.stepText,
              currentStep >= step ? styles.activeStepText : styles.inactiveStepText,
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SignupStep1
            data={signupData}
            onNext={handleNext}
            onSaveAndExit={handleSaveAndExit}
          />
        );
      case 2:
        return (
          <SignupStep2
            data={signupData}
            onNext={handleNext}
            onSaveAndExit={handleSaveAndExit}
          />
        );
      case 3:
        return (
          <SignupStep3
            data={signupData}
            onNext={handleNext}
            onSaveAndExit={handleSaveAndExit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Sign up</Text>
        </TouchableOpacity>
        
        {renderStepIndicator()}
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 5,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: '#F47B20',
  },
  inactiveStep: {
    backgroundColor: '#e0e0e0',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeStepText: {
    color: '#fff',
  },
  inactiveStepText: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
});
