import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SignupData } from '../../app/signup';
import { supabaseAuth } from '../../services/supabase-auth';

interface SignupStep3Props {
  data: SignupData;
  onNext: (stepData: Partial<SignupData>) => void;
  onSaveAndExit: () => void;
}

export default function SignupStep3({ data, onNext, onSaveAndExit }: SignupStep3Props) {
  const [termsAccepted, setTermsAccepted] = useState(data.termsAccepted);
  const [loading, setLoading] = useState(false);

  const handleTermsToggle = () => {
    setTermsAccepted(!termsAccepted);
  };

  const handleTermsPress = () => {
    router.push('/terms-and-conditions' as any);
  };

  const handlePrivacyPress = () => {
    router.push('/terms-and-conditions' as any);
  };

  const saveUserData = async () => {
    try {
      console.log('📝 Creating user account with Supabase...');

      const { user, error } = await supabaseAuth.signUp({
        email: data.email,
        password: data.password,
        username: data.username,
        phone: data.phone,
        full_name: data.username,
        address: data.address,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
      });

      if (error) {
        Alert.alert('Registration Failed', error);
        return false;
      }

      if (user) {
        console.log('✅ User created successfully with Supabase:', user.email);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error creating user account:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
      return false;
    }
  };

  const handleContinue = async () => {
    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms & Conditions to continue');
      return;
    }

    setLoading(true);

    try {
      const success = await saveUserData();
      if (success) {
        Alert.alert(
          'Registration Successful!',
          `Welcome to GBC Canteen!\n\n🔗 Account created with Supabase\n📊 Real-time sync enabled\n🔐 Secure authentication active`,
          [
            {
              text: 'Continue to App',
              onPress: () => {
                router.replace('/(tabs)');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms & Conditions</Text>

        {/* Terms Acceptance */}
        <TouchableOpacity style={styles.checkboxContainer} onPress={handleTermsToggle}>
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>I agree to the </Text>
            <TouchableOpacity onPress={handleTermsPress}>
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity onPress={handlePrivacyPress}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Registration Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Registration Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Username:</Text>
            <Text style={styles.summaryValue}>{data.username}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{data.email}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Phone:</Text>
            <Text style={styles.summaryValue}>{data.phone}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Address:</Text>
            <Text style={styles.summaryValue}>
              {data.address}, {data.city}, {data.postcode}, {data.country}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            By completing registration, you'll be able to log in using your email or phone number with your chosen password.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={onSaveAndExit}>
          <Text style={styles.saveButtonText}>Save & exit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.continueButton, (!termsAccepted || loading) && styles.continueButtonDisabled]} 
          onPress={handleContinue}
          disabled={!termsAccepted || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Complete Registration</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F47B20',
    borderColor: '#F47B20',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#F47B20',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  summaryContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  infoContainer: {
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#0066cc',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#F47B20',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
