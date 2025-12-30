
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  // Animation values for floating labels
  const emailFocusAnimation = useSharedValue(0);
  const passwordFocusAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleEmailFocus = useCallback(() => {
    emailFocusAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    Haptics.selectionAsync();
  }, [emailFocusAnimation]);

  const handleEmailBlur = useCallback(() => {
    if (!email) {
      emailFocusAnimation.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [email, emailFocusAnimation]);

  const handlePasswordFocus = useCallback(() => {
    passwordFocusAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    Haptics.selectionAsync();
  }, [passwordFocusAnimation]);

  const handlePasswordBlur = useCallback(() => {
    if (!password) {
      passwordFocusAnimation.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [password, passwordFocusAnimation]);

  const emailLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            emailFocusAnimation.value,
            [0, 1],
            [0, -28],
            Extrapolate.CLAMP
          ),
        },
        {
          scale: interpolate(
            emailFocusAnimation.value,
            [0, 1],
            [1, 0.85],
            Extrapolate.CLAMP
          ),
        },
      ],
      color: interpolate(
        emailFocusAnimation.value,
        [0, 1],
        [0, 1],
        Extrapolate.CLAMP
      ) > 0.5 ? colors.primary : colors.textSecondary,
    };
  });

  const passwordLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            passwordFocusAnimation.value,
            [0, 1],
            [0, -28],
            Extrapolate.CLAMP
          ),
        },
        {
          scale: interpolate(
            passwordFocusAnimation.value,
            [0, 1],
            [1, 0.85],
            Extrapolate.CLAMP
          ),
        },
      ],
      color: interpolate(
        passwordFocusAnimation.value,
        [0, 1],
        [0, 1],
        Extrapolate.CLAMP
      ) > 0.5 ? colors.primary : colors.textSecondary,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    // Button press animation
    buttonScale.value = withSpring(0.95, { damping: 10 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10 });
    }, 100);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      console.log('[LoginScreen] Attempting login...');
      await signIn(email, password);
      console.log('[LoginScreen] Login successful, navigating to dashboard...');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to dashboard after successful login
      // Use replace to prevent going back to login screen
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('[LoginScreen] Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'No se pudo iniciar sesión. Por favor intenta de nuevo.';
      
      if (error?.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
      setIsLoading(false);
    }
  };

  // Initialize animations if fields have values
  React.useEffect(() => {
    if (email) {
      emailFocusAnimation.value = 1;
    }
  }, [email, emailFocusAnimation]);

  React.useEffect(() => {
    if (password) {
      passwordFocusAnimation.value = 1;
    }
  }, [password, passwordFocusAnimation]);

  return (
    <KeyboardAvoidingView
      style={[commonStyles.container, styles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/88b8286c-84e9-41a0-a0a5-982a71f79d19.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Animated.Text style={[styles.floatingLabel, emailLabelStyle]}>
              Email
            </Animated.Text>
            <TextInput
              ref={emailInputRef}
              style={[commonStyles.input, styles.animatedInput]}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              onFocus={handleEmailFocus}
              onBlur={handleEmailBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Animated.Text style={[styles.floatingLabel, passwordLabelStyle]}>
              Contraseña
            </Animated.Text>
            <TextInput
              ref={passwordInputRef}
              style={[commonStyles.input, styles.animatedInput]}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={[buttonStyles.primaryButton, styles.loginButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={buttonStyles.primaryButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Usa tus credenciales de Gocash.cl para iniciar sesión.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 28,
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 16,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    zIndex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 4,
  },
  animatedInput: {
    paddingTop: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
