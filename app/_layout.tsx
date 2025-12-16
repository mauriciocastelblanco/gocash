
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '@/styles/commonStyles';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('[RootLayoutNav] State:', { 
      hasUser: !!user, 
      isLoading, 
      segments: segments.join('/'),
      userId: user?.id 
    });

    // Don't do anything while loading
    if (isLoading) {
      console.log('[RootLayoutNav] Still loading, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const onLoginScreen = segments[0] === 'login' || segments.length === 0;

    console.log('[RootLayoutNav] Navigation check:', { inAuthGroup, onLoginScreen });

    // Simple navigation logic
    if (!user && inAuthGroup) {
      // Not logged in but trying to access protected routes
      console.log('[RootLayoutNav] No user, redirecting to login');
      router.replace('/login');
    } else if (user && onLoginScreen) {
      // Logged in but on login screen
      console.log('[RootLayoutNav] User logged in, redirecting to home');
      router.replace('/(tabs)/(home)');
    }
  }, [user, isLoading, segments]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      console.log('[RootLayout] Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    console.log('[RootLayout] Waiting for fonts to load...');
    return null;
  }

  return (
    <AuthProvider>
      <TransactionProvider>
        <RootLayoutNav />
      </TransactionProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
