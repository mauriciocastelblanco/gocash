
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  // Animation values for floating labels
  const emailFocusAnimation = useSharedValue(0);
  const passwordFocusAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleEmailFocus = () => {
    emailFocusAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    Haptics.selectionAsync();
  };

  const handleEmailBlur = () => {
    if (!email) {
      emailFocusAnimation.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePasswordFocus = () => {
    passwordFocusAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    Haptics.selectionAsync();
  };

  const handlePasswordBlur = () => {
    if (!password) {
      passwordFocusAnimation.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

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
      console.log('[LoginScreen] Login successful, navigation will happen automatically');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize animations if fields have values
  React.useEffect(() => {
    if (email) {
      emailFocusAnimation.value = 1;
    }
  }, []);

  React.useEffect(() => {
    if (password) {
      passwordFocusAnimation.value = 1;
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={[commonStyles.container, styles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>📈</Text>
          </View>
          <Text style={styles.appName}>
            go<Text style={styles.appNameGreen}>ca</Text>sh
          </Text>
          <Text style={styles.tagline}>Control de gastos minimalista</Text>
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
              💡 Esta app está conectada a Supabase. Usa tus credenciales para iniciar sesión.
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
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  appNameGreen: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
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
