
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Extract segments join to a variable for dependency tracking
  const segmentsPath = segments.join('/');

  useEffect(() => {
    console.log('[Index] Auth state:', { 
      hasUser: !!user, 
      isLoading, 
      segments: segmentsPath,
      hasNavigated 
    });

    // Wait for auth to finish loading
    if (isLoading) {
      console.log('[Index] Still loading auth...');
      return;
    }

    // Prevent multiple navigation attempts
    if (hasNavigated) {
      console.log('[Index] Already navigated, skipping...');
      return;
    }

    // Determine where to navigate based on auth state
    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginScreen = segments[0] === 'login';
    
    if (user && !inAuthGroup) {
      console.log('[Index] User logged in, navigating to dashboard');
      setHasNavigated(true);
      router.replace('/(tabs)/dashboard');
    } else if (!user && inAuthGroup) {
      console.log('[Index] No user but in auth group, navigating to login');
      setHasNavigated(true);
      router.replace('/login');
    } else if (!user && !inLoginScreen && segments.length === 0) {
      console.log('[Index] Initial load, no user, navigating to login');
      setHasNavigated(true);
      router.replace('/login');
    } else if (user && segments.length === 0) {
      console.log('[Index] Initial load, has user, navigating to dashboard');
      setHasNavigated(true);
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, segmentsPath, hasNavigated, router, segments]);

  // Reset navigation flag when user changes
  useEffect(() => {
    setHasNavigated(false);
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
