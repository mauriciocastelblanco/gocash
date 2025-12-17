
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    console.log('[Index] Auth state:', { 
      hasUser: !!user, 
      isLoading, 
      segments: segments.join('/'),
      isNavigating 
    });

    // Wait for auth to finish loading
    if (isLoading) {
      console.log('[Index] Still loading auth...');
      return;
    }

    // Prevent multiple navigation attempts
    if (isNavigating) {
      console.log('[Index] Already navigating...');
      return;
    }

    // Determine where to navigate
    const inAuthGroup = segments[0] === '(tabs)';
    
    if (user && !inAuthGroup) {
      console.log('[Index] User logged in, navigating to home');
      setIsNavigating(true);
      setTimeout(() => {
        router.replace('/(tabs)/(home)');
        setIsNavigating(false);
      }, 100);
    } else if (!user && inAuthGroup) {
      console.log('[Index] No user, navigating to login');
      setIsNavigating(true);
      setTimeout(() => {
        router.replace('/login');
        setIsNavigating(false);
      }, 100);
    } else if (!user && segments.length === 0) {
      console.log('[Index] Initial load, no user, navigating to login');
      setIsNavigating(true);
      setTimeout(() => {
        router.replace('/login');
        setIsNavigating(false);
      }, 100);
    } else if (user && segments.length === 0) {
      console.log('[Index] Initial load, has user, navigating to home');
      setIsNavigating(true);
      setTimeout(() => {
        router.replace('/(tabs)/(home)');
        setIsNavigating(false);
      }, 100);
    }
  }, [user, isLoading, segments.join('/')]);

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
