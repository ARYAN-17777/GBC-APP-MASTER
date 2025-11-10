import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { supabaseAuth } from '../services/supabase-auth';
import { cloudHandshakeService } from '../services/cloud-handshake-service';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [authStatus, setAuthStatus] = useState('Initializing...');

  useEffect(() => {
    // CRITICAL: Block all navigation until authentication is verified
    console.log('🔐 INDEX SCREEN: Starting authentication verification...');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 INDEX SCREEN: Checking for persistent restaurant session...');
      setAuthStatus('Checking for existing login...');

      // PERSISTENT: Check if restaurant has a valid saved session
      console.log('🔐 INDEX SCREEN: Looking for saved restaurant session...');

      // PERSISTENT: Check for existing valid restaurant session (auto-login)
      setAuthStatus('Verifying saved session...');

      // Step 1: Initialize restaurant session - will auto-login if valid session exists
      const restaurantUser = await supabaseAuth.initializeRestaurantSession();

      if (restaurantUser) {
        console.log('✅ INDEX SCREEN: Valid restaurant session found - auto-login for restaurant:', restaurantUser.restaurant_name);
        setAuthStatus('Welcome back! Auto-logging in...');

        // CLOUD HANDSHAKE: Auto-register restaurant with cloud service
        setAuthStatus('Registering with cloud service...');
        try {
          const registrationResult = await cloudHandshakeService.autoRegisterRestaurant();
          if (registrationResult.success) {
            console.log('✅ INDEX SCREEN: Restaurant auto-registered with cloud service');
            setAuthStatus('Starting handshake listener...');

            // Start listening for handshake requests
            const listenerResult = await cloudHandshakeService.startHandshakeListener();
            if (listenerResult.success) {
              console.log('✅ INDEX SCREEN: Cloud handshake listener started');
              setAuthStatus('Welcome back! Ready for orders...');
            } else {
              console.warn('⚠️ INDEX SCREEN: Failed to start handshake listener:', listenerResult.error);
              setAuthStatus('Welcome back! (Handshake listener offline)');
            }
          } else {
            console.warn('⚠️ INDEX SCREEN: Failed to register with cloud service:', registrationResult.error);
            setAuthStatus('Welcome back! (Cloud registration failed)');
          }
        } catch (error) {
          console.error('❌ INDEX SCREEN: Cloud handshake setup failed:', error);
          setAuthStatus('Welcome back! (Cloud service unavailable)');
        }

        // Add small delay to ensure UI state is stable
        setTimeout(() => {
          console.log('🔐 INDEX SCREEN: Auto-login successful - redirecting to app...');
          router.replace('/(tabs)');
        }, 1200);
      } else {
        console.log('❌ INDEX SCREEN: No valid restaurant session found - showing login page');
        setAuthStatus('Please login to continue...');

        // Add small delay to ensure UI state is stable
        setTimeout(() => {
          console.log('🔐 INDEX SCREEN: Redirecting to login screen...');
          router.replace('/login');
        }, 800);
      }
    } catch (error) {
      console.error('❌ INDEX SCREEN: Authentication check failed:', error);
      setAuthStatus('Authentication error. Redirecting to login...');

      // ALWAYS default to login screen on any error
      setTimeout(() => {
        console.log('🔐 INDEX SCREEN: Error fallback - redirecting to login...');
        router.replace('/login');
      }, 500);
    } finally {
      // Keep loading state for a minimum time to prevent flash
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.loadingText}>GBC Kitchen App</Text>
      <Text style={styles.statusText}>{authStatus}</Text>
      <Text style={styles.securityText}>🔐 Checking for saved login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F47B20',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  securityText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
});
