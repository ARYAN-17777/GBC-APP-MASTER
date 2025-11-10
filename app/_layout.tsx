import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { NotificationProvider } from '../contexts/NotificationContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <NotificationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="index"
      >
        {/* CRITICAL: Index must be first to ensure it's the entry point */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Login screen must come before tabs to prevent bypass */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        {/* Tabs screen last to ensure authentication is checked first */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NotificationProvider>
  );
}
