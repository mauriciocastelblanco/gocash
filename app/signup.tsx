
import React, { useState } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  isValidEmail,
  isValidChileanPhone,
  formatPhoneForStorage,
  translateError,
} from '@/lib/validation';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigoCelular, setCodigoCelular] = useState('+56');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleSignUp = async () => {
    // Validation
    if (!email || !isValidEmail(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Email inválido');
      return;
    }

    if (!password || password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!nombre || nombre.trim().length < 2 || nombre.length > 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'El nombre debe tener entre 2 y 100 caracteres');
      return;
    }

    let formattedPhone = '';
    if (numeroCelular && numeroCelular.trim() !== '') {
      if (!isValidChileanPhone(numeroCelular)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Número de celular inválido. Debe ser chileno de 9 dígitos');
        return;
      }
      formattedPhone = formatPhoneForStorage(numeroCelular);
    }

    // Button press animation
    buttonScale.value = withSpring(0.95, { damping: 10 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10 });
    }, 100);

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('[SignUpScreen] Attempting sign up...');
      
      const result = await signUp({
        email,
        password,
        nombre,
        numero_celular: formattedPhone,
        codigo_celular: codigoCelular,
      });

      if (!result.success) {
        console.error('[SignUpScreen] Sign up failed:', result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', translateError(result.error || 'Error desconocido'));
        setIsLoading(false);
        return;
      }

      console.log('[SignUpScreen] Account created successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Éxito',
        'Cuenta creada exitosamente. Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión.',
        [{ 
          text: 'OK', 
          onPress: () => {
            router.replace('/login');
          }
        }]
      );
    } catch (error: any) {
      console.error('[SignUpScreen] Unexpected error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Ocurrió un error al crear la cuenta. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[commonStyles.container, styles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/88b8286c-84e9-41a0-a0a5-982a71f79d19.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>
          💡 Completa tus datos para registrarte en Gocash.cl
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={[commonStyles.input, styles.input]}
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
              style={[commonStyles.input, styles.input]}
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
              style={[commonStyles.input, styles.input]}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Celular (Opcional)</Text>
            <View style={styles.phoneContainer}>
              <TextInput
                style={[commonStyles.input, styles.input, styles.phoneCodeInput]}
                value={codigoCelular}
                onChangeText={setCodigoCelular}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
              <TextInput
                style={[commonStyles.input, styles.input, styles.phoneNumberInput]}
                placeholder="912345678"
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
              style={[buttonStyles.primaryButton, styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={buttonStyles.primaryButtonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            disabled={isLoading}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLinkTextBold}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneCodeInput: {
    flex: 0.3,
  },
  phoneNumberInput: {
    flex: 0.7,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  signUpButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLinkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
