import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SignupData } from '../../app/signup';

interface SignupStep2Props {
  data: SignupData;
  onNext: (stepData: Partial<SignupData>) => void;
  onSaveAndExit: () => void;
}

interface PostcodeData {
  city: string;
  country: string;
  state?: string;
}

export default function SignupStep2({ data, onNext, onSaveAndExit }: SignupStep2Props) {
  const [address, setAddress] = useState(data.address);
  const [city, setCity] = useState(data.city);
  const [postcode, setPostcode] = useState(data.postcode);
  const [country, setCountry] = useState(data.country);
  const [loading, setLoading] = useState(false);

  // Mock postcode lookup function (in real app, use actual API)
  const lookupPostcode = async (code: string): Promise<PostcodeData | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data for common postcodes
    const mockData: { [key: string]: PostcodeData } = {
      // UK postcodes
      'SW1A 1AA': { city: 'London', country: 'United Kingdom' },
      'M1 1AA': { city: 'Manchester', country: 'United Kingdom' },
      'B1 1AA': { city: 'Birmingham', country: 'United Kingdom' },
      'LS1 1AA': { city: 'Leeds', country: 'United Kingdom' },
      'G1 1AA': { city: 'Glasgow', country: 'United Kingdom' },
      
      // US ZIP codes
      '10001': { city: 'New York', country: 'United States' },
      '90210': { city: 'Beverly Hills', country: 'United States' },
      '60601': { city: 'Chicago', country: 'United States' },
      '02101': { city: 'Boston', country: 'United States' },
      '94102': { city: 'San Francisco', country: 'United States' },
      
      // Canadian postal codes
      'M5V 3A8': { city: 'Toronto', country: 'Canada' },
      'H3B 4W5': { city: 'Montreal', country: 'Canada' },
      'V6B 1A1': { city: 'Vancouver', country: 'Canada' },
      
      // Australian postcodes
      '2000': { city: 'Sydney', country: 'Australia' },
      '3000': { city: 'Melbourne', country: 'Australia' },
      '4000': { city: 'Brisbane', country: 'Australia' },
      
      // German postcodes
      '10115': { city: 'Berlin', country: 'Germany' },
      '80331': { city: 'Munich', country: 'Germany' },
      '20095': { city: 'Hamburg', country: 'Germany' },
      
      // French postcodes
      '75001': { city: 'Paris', country: 'France' },
      '69001': { city: 'Lyon', country: 'France' },
      '13001': { city: 'Marseille', country: 'France' },
    };

    // Normalize postcode (remove spaces, convert to uppercase)
    const normalizedCode = code.replace(/\s/g, '').toUpperCase();
    
    // Try exact match first
    if (mockData[code]) {
      return mockData[code];
    }
    
    // Try normalized match
    for (const [key, value] of Object.entries(mockData)) {
      if (key.replace(/\s/g, '').toUpperCase() === normalizedCode) {
        return value;
      }
    }
    
    return null;
  };

  const handlePostcodeChange = async (code: string) => {
    setPostcode(code);
    
    if (code.length >= 4) { // Start lookup after 4 characters
      setLoading(true);
      try {
        const result = await lookupPostcode(code);
        if (result) {
          setCity(result.city);
          setCountry(result.country);
        }
      } catch (error) {
        console.error('Postcode lookup error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const validateForm = () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return false;
    }

    if (!postcode.trim()) {
      Alert.alert('Error', 'Please enter your postcode');
      return false;
    }

    if (!country.trim()) {
      Alert.alert('Error', 'Please enter your country');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onNext({
        address: address.trim(),
        city: city.trim(),
        postcode: postcode.trim(),
        country: country.trim(),
      });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Address Details</Text>

        {/* Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your street address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
            autoCorrect={false}
          />
        </View>

        {/* Postcode with auto-lookup */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Postcode / ZIP Code</Text>
          <View style={styles.postcodeContainer}>
            <TextInput
              style={[styles.input, styles.postcodeInput]}
              value={postcode}
              onChangeText={handlePostcodeChange}
              placeholder="Enter postcode"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {loading && (
              <ActivityIndicator 
                size="small" 
                color="#F47B20" 
                style={styles.loadingIndicator}
              />
            )}
          </View>
          <Text style={styles.hint}>
            City and country will be auto-filled based on postcode
          </Text>
        </View>

        {/* City */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, loading && styles.inputDisabled]}
            value={city}
            onChangeText={setCity}
            placeholder="Enter your city"
            placeholderTextColor="#999"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        {/* Country */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={[styles.input, loading && styles.inputDisabled]}
            value={country}
            onChangeText={setCountry}
            placeholder="Enter your country"
            placeholderTextColor="#999"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={onSaveAndExit}>
          <Text style={styles.saveButtonText}>Save & exit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  postcodeContainer: {
    position: 'relative',
  },
  postcodeInput: {
    paddingRight: 50,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  continueButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
