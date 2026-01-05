
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  isValidEmail,
  isValidChileanPhone,
  formatPhoneForStorage,
  translateError,
} from '@/lib/validation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101824',
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
    fontSize: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeInput: {
    width: 70,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#9CA3AF',
    borderWidth: 1,
    borderColor: '#374151',
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
  },
  helperText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.6,
  },
  button: {
    backgroundColor: '#52DF68',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#52DF68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 24,
    fontSize: 14,
  },
  linkText: {
    color: '#52DF68',
    fontWeight: '600',
  },
});

export default function SignUpScreen() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSignUp = async () => {
    try {
      // Validation
      if (!nombre.trim()) {
        Alert.alert('Error', 'El nombre es obligatorio');
        return;
      }

      if (!isValidEmail(email)) {
        Alert.alert('Error', 'Email inválido');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (numeroCelular && !isValidChileanPhone(numeroCelular)) {
        Alert.alert('Error', 'Número de celular inválido');
        return;
      }

      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const formattedPhone = numeroCelular ? formatPhoneForStorage(numeroCelular) : '';

      console.log('📝 Signing up user:', { email, nombre, formattedPhone });

      // Sign up
      const result = await signUp({
        email,
        password,
        nombre: nombre.trim(),
        numero_celular: formattedPhone,
        codigo_celular: '+56',
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        setIsLoading(false);
        return;
      }

      console.log('✅ Sign up successful, now signing in...');

      // Auto-login after successful signup
      await signIn(email, password);

      console.log('✅ Auto-login successful, redirecting to dashboard...');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      Alert.alert('Error', translateError(error.message || 'Error al crear cuenta'));
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
          <Text style={styles.logo}>💰</Text>
        </View>

        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Registra tus datos para comenzar</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mauricio"
            placeholderTextColor="#6B7280"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />
          <Text style={styles.helperText}>El nombre es obligatorio</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="mabri10@gmail.com"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>El email es obligatorio</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.helperText}>La contraseña es obligatoria</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Celular (Opcional)</Text>
          <View style={styles.phoneContainer}>
            <TextInput
              style={styles.countryCodeInput}
              value="+56"
              editable={false}
            />
            <TextInput
              style={styles.phoneInput}
              placeholder="959113551"
              placeholderTextColor="#6B7280"
              value={numeroCelular}
              onChangeText={setNumeroCelular}
              keyboardType="phone-pad"
              maxLength={9}
            />
          </View>
        </View>

        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            disabled={isLoading}
            onPressIn={() => {
              buttonScale.value = withSpring(0.95);
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1);
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
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
