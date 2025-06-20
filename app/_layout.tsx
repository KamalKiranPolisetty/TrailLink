import { useEffect } from 'react';
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  useEffect(() => {
    // Hide splash screen after a short delay to ensure everything is loaded
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}