
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[Index] Auth state:', { hasUser: !!user, isLoading });
    
    if (isLoading) {
      console.log('[Index] Still loading, waiting...');
      return;
    }

    // Use a small timeout to ensure the navigation stack is ready
    const timer = setTimeout(() => {
      if (user) {
        console.log('[Index] User authenticated, navigating to home...');
        router.replace('/(tabs)/(home)/');
      } else {
        console.log('[Index] No user, navigating to login...');
        router.replace('/(auth)/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    console.log('[Index] Rendering loading state');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Fallback redirect (should not be reached due to useEffect)
  console.log('[Index] Rendering fallback redirect:', user ? 'to home' : 'to login');
  if (user) {
    return <Redirect href="/(tabs)/(home)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
