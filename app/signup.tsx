
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  isValidEmail,
  isValidChileanPhone,
  formatPhoneForStorage,
  translateError,
} from '@/lib/validation';
import { useAuth } from '@/contexts/AuthContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    ...commonStyles.input,
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCodeInput: {
    ...commonStyles.input,
    width: 60,
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  phoneNumberInput: {
    ...commonStyles.input,
    flex: 1,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  button: {
    ...buttonStyles.primary,
    marginTop: 8,
  },
  buttonText: {
    ...buttonStyles.primaryText,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default function SignUpScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { signUp, signIn } = useAuth();

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSignUp = async () => {
    try {
      // Validate required fields
      if (!nombre.trim()) {
        Alert.alert('Error', 'Por favor ingresa tu nombre');
        return;
      }

      if (!email.trim() || !isValidEmail(email)) {
        Alert.alert('Error', 'Por favor ingresa un email válido');
        return;
      }

      if (!password || password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      // Validate phone if provided
      let formattedPhone = '';
      if (numeroCelular.trim()) {
        if (!isValidChileanPhone(numeroCelular)) {
          Alert.alert('Error', 'Número de celular inválido. Debe ser chileno de 9 dígitos');
          return;
        }
        formattedPhone = formatPhoneForStorage(numeroCelular);
      }

      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      buttonScale.value = withSpring(0.95);
      setTimeout(() => {
        buttonScale.value = withSpring(1);
      }, 100);

      console.log('[SignUp] Creating account with formatted phone:', formattedPhone);

      const { success, error } = await signUp({
        email: email.trim().toLowerCase(),
        password,
        nombre: nombre.trim(),
        numero_celular: formattedPhone,
        codigo_celular: '+56',
      });

      if (!success) {
        Alert.alert('Error', translateError(error || 'No se pudo crear la cuenta'));
        setIsLoading(false);
        return;
      }

      console.log('[SignUp] Account created successfully, auto-logging in...');

      // Auto sign-in after successful registration
      try {
        await signIn(email.trim().toLowerCase(), password);
        console.log('[SignUp] Auto-login successful');
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/dashboard');
      } catch (signInError: any) {
        console.error('[SignUp] Auto-login failed:', signInError);
        // If auto-login fails, redirect to login screen
        Alert.alert(
          'Cuenta creada',
          'Tu cuenta fue creada exitosamente. Por favor inicia sesión.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('[SignUp] Sign up error:', error);
      Alert.alert('Error', translateError(error.message || 'Ocurrió un error inesperado'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>
          💡 Completa tus datos para registrarte en Gocash.cl
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre completo"
            placeholderTextColor={colors.textSecondary}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Celular (Opcional)</Text>
          <View style={styles.phoneContainer}>
            <TextInput
              style={styles.phoneCodeInput}
              value="+56"
              editable={false}
            />
            <TextInput
              style={styles.phoneNumberInput}
              placeholder="959113551"
              placeholderTextColor={colors.textSecondary}
              value={numeroCelular}
              onChangeText={setNumeroCelular}
              keyboardType="phone-pad"
              maxLength={9}
              editable={!isLoading}
            />
          </View>
          <Text style={styles.helperText}>
            Número chileno de 9 dígitos (ej: 912345678)
          </Text>
        </View>

        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerText}>
          ¿Ya tienes cuenta?{' '}
          <Text
            style={styles.linkText}
            onPress={() => router.back()}
          >
            Inicia Sesión
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
