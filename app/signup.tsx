
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
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
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
    width: 70,
    fontSize: 16,
  },
  phoneNumberInput: {
    ...commonStyles.input,
    flex: 1,
    fontSize: 16,
  },
  button: {
    ...buttonStyles.primary,
    marginTop: 8,
  },
  buttonText: {
    ...buttonStyles.primaryText,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigoCelular, setCodigoCelular] = useState('+56');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSignUp = async () => {
    if (isLoading) return;

    // Clear previous errors
    setErrors({});
    const newErrors: { [key: string]: string } = {};

    // Validate fields
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (nombre.trim().length < 2 || nombre.length > 100) {
      newErrors.nombre = 'El nombre debe tener entre 2 y 100 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validate phone if provided
    if (numeroCelular.trim()) {
      if (!isValidChileanPhone(numeroCelular)) {
        newErrors.numeroCelular = 'Número de celular inválido. Debe ser chileno de 9 dígitos';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    buttonScale.value = withSpring(0.95);

    try {
      const result = await signUp({
        email: email.trim().toLowerCase(),
        password,
        nombre: nombre.trim(),
        numero_celular: numeroCelular.trim() ? formatPhoneForStorage(numeroCelular) : undefined,
        codigo_celular: codigoCelular,
      });

      if (result.error) {
        setErrors({ general: result.error });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // User is automatically logged in, navigation handled by AuthContext
      }
    } catch (error: any) {
      setErrors({ general: translateError(error.message) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      buttonScale.value = withSpring(1);
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
          <Text style={styles.logoText}>💰</Text>
        </View>

        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Registra tus datos para comenzar</Text>

        {errors.general && (
          <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 16 }]}>
            {errors.general}
          </Text>
        )}

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
          {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
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
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Celular (Opcional)</Text>
          <View style={styles.phoneContainer}>
            <TextInput
              style={styles.phoneCodeInput}
              value={codigoCelular}
              editable={false}
              placeholderTextColor={colors.textSecondary}
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
          {errors.numeroCelular && <Text style={styles.errorText}>{errors.numeroCelular}</Text>}
        </View>

        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Inicia Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
