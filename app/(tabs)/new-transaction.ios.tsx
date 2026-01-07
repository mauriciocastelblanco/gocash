
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import React, { useState } from 'react';
import { TransactionType, PaymentMethod } from '@/types/transaction';
import { useRouter } from 'expo-router';
import { useTransactions } from '@/contexts/TransactionContext';
import { useCategories } from '@/hooks/useCategories';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySelector } from '@/components/CategorySelector';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export default function NewTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactions();
  const { mainCategories, subcategories, isLoading: categoriesLoading } = useCategories();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installments, setInstallments] = useState('');

  const typeAnimation = useSharedValue(type === 'expense' ? 0 : 1);

  const expenseButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: typeAnimation.value === 0 ? colors.primary : colors.card,
    transform: [{ scale: withSpring(typeAnimation.value === 0 ? 1.05 : 1) }],
  }));

  const incomeButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: typeAnimation.value === 1 ? colors.primary : colors.card,
    transform: [{ scale: withSpring(typeAnimation.value === 1 ? 1.05 : 1) }],
  }));

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción');
      return;
    }

    if (!selectedMainCategoryId) {
      Alert.alert('Error', 'Por favor selecciona una categoría principal');
      return;
    }

    if (!selectedSubcategoryId) {
      Alert.alert('Error', 'Por favor selecciona una subcategoría');
      return;
    }

    const installmentCount = installments ? parseInt(installments) : undefined;
    if (installmentCount && (installmentCount < 2 || installmentCount > 48)) {
      Alert.alert('Error', 'Las cuotas deben estar entre 2 y 48');
      return;
    }

    setIsSubmitting(true);

    try {
      await addTransaction({
        amount: parseFloat(amount),
        description: description.trim(),
        type,
        mainCategoryId: selectedMainCategoryId,
        subcategoryId: selectedSubcategoryId,
        paymentMethod,
        date,
        installments: installmentCount,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setAmount('');
      setDescription('');
      setSelectedMainCategoryId(null);
      setSelectedSubcategoryId(null);
      setPaymentMethod('debit');
      setDate(new Date());
      setInstallments('');

      Alert.alert('Éxito', 'Transacción agregada correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'No se pudo agregar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Nueva Transacción</Text>

          {/* Type Selector */}
          <View style={styles.typeContainer}>
            <Animated.View style={[styles.typeButton, expenseButtonStyle]}>
              <TouchableOpacity
                onPress={() => {
                  setType('expense');
                  typeAnimation.value = withSpring(0);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.typeButtonInner}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Gasto
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.typeButton, incomeButtonStyle]}>
              <TouchableOpacity
                onPress={() => {
                  setType('income');
                  typeAnimation.value = withSpring(1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.typeButtonInner}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Ingreso
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej: Compra en supermercado"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <CategorySelector
              mainCategories={mainCategories}
              subcategories={subcategories}
              selectedMainCategoryId={selectedMainCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              onMainCategorySelect={setSelectedMainCategoryId}
              onSubcategorySelect={setSelectedSubcategoryId}
              type={type}
              isLoading={categoriesLoading}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Método de pago</Text>
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'debit' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod('debit');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'debit' && styles.paymentMethodTextActive,
                  ]}
                >
                  Débito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'credit' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod('credit');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'credit' && styles.paymentMethodTextActive,
                  ]}
                >
                  Crédito
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  paymentMethod === 'cash' && styles.paymentMethodButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod('cash');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'cash' && styles.paymentMethodTextActive,
                  ]}
                >
                  Efectivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Installments (only for credit) */}
          {paymentMethod === 'credit' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuotas (opcional)</Text>
              <TextInput
                style={styles.input}
                value={installments}
                onChangeText={setInstallments}
                placeholder="Número de cuotas (2-48)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[buttonStyles.primary, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={buttonStyles.primaryText}>Agregar Transacción</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 0, // Espacio para la barra negra superior
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typeButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  paymentMethodButtonActive: {
    backgroundColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
  },
  dateButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    marginTop: 8,
  },
});
