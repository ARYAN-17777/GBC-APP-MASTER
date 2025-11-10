import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabaseAuth } from '../services/supabase-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // SECURITY FIX: No auto-authentication check on login screen
    // Users must explicitly authenticate with valid credentials
    console.log('🔐 Login screen loaded - authentication required');
  }, []);

  const handleLogin = async () => {
    // Restaurant login validation
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      console.log('🏪 LOGIN: Attempting restaurant authentication with credentials:', username);

      const { user, error } = await supabaseAuth.signInRestaurant({
        username: username.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('❌ LOGIN: Restaurant authentication failed:', error);
        Alert.alert('Restaurant Login Failed', error);
        return;
      }

      if (user) {
        console.log('✅ LOGIN: Restaurant authentication successful:', user.restaurant_name);

        // Clear any cached data from previous restaurant sessions
        console.log('🧹 LOGIN: Clearing cached data from previous sessions...');
        try {
          // Get all AsyncStorage keys and remove any that might be from other restaurants
          const allKeys = await AsyncStorage.getAllKeys();
          const keysToRemove = allKeys.filter(key =>
            key.includes('orders_') ||
            key.includes('gbc_notifications_') ||
            key.includes('gbc_read_notifications_') ||
            key.includes('gbc_offline_queue_')
          ).filter(key => !key.includes(user.app_restaurant_uid)); // Keep current restaurant's data

          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
            console.log('✅ LOGIN: Cleared cached data from other restaurants');
          }
        } catch (error) {
          console.warn('⚠️ LOGIN: Failed to clear cached data:', error);
        }

        Alert.alert(
          'Restaurant Login Successful!',
          `Welcome back, ${user.restaurant_name}!\n\n🏪 Restaurant: ${user.username}\n📊 Real-time order management enabled`,
          [
            {
              text: 'Continue',
              onPress: () => {
                console.log('🏪 LOGIN: Navigating to tabs after successful login');
                router.replace('/(tabs)');
              },
            },
          ]
        );
      } else {
        console.error('❌ LOGIN: No user returned from authentication');
        Alert.alert('Login Failed', 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ LOGIN: Exception during authentication:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleForgotPassword = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter your restaurant username first.');
      return;
    }

    // Direct password reset without email redirection
    Alert.alert(
      'Reset Password',
      'Choose how you want to reset your password:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          onPress: () => {
            Alert.alert(
              'Contact Support',
              'Please contact our support team:\n\nEmail: support@gbccanteen.com\nPhone: +44 20 1234 5678\n\nThey will help you reset your restaurant password securely.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Branding */}
        <View style={styles.header}>
          <Text style={styles.generalText}>GENERAL</Text>
          <Text style={styles.bilimoriaText}>BILIMORIA'S</Text>
          <Text style={styles.canteenText}>20 CANTEEN 21</Text>
          <Text style={styles.locationText}>ESTD LONDON UK</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Restaurant Login Header */}
          <View style={styles.loginHeaderContainer}>
            <Text style={styles.loginHeaderText}>Restaurant Login</Text>
            <Text style={styles.loginSubHeaderText}>Access your restaurant dashboard</Text>
          </View>

          {/* Restaurant Username Input */}
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Restaurant Username"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password Input with Forgot Password */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Policy Link */}
        <TouchableOpacity
          style={styles.privacyButton}
          onPress={() => router.push('/terms-and-conditions' as any)}
        >
          <Text style={styles.privacyText}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F47B20', // Orange background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  generalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 3,
    marginBottom: 5,
  },
  bilimoriaText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
    marginBottom: 5,
  },
  canteenText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 4,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    letterSpacing: 2,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 60,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 25,
  },
  forgotPasswordButton: {
    position: 'absolute',
    right: 20,
    top: 18,
  },
  forgotPasswordText: {
    color: '#999',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#333',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  signUpText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  privacyButton: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  privacyText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '400',
  },
  loginHeaderContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginHeaderText: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  loginSubHeaderText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '400',
  },
});
