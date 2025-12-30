
import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useTransactions } from '@/contexts/TransactionContext';
import { TransactionType, PaymentMethod } from '@/types/transaction';
import { useCategories } from '@/hooks/useCategories';
import { CategorySelector } from '@/components/CategorySelector';

export default function NewTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactions();
  const {
    mainCategories,
    subcategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [installments, setInstallments] = useState('1');

  const buttonScale = useSharedValue(1);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    if (!description.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor ingresa una descripción');
      return;
    }

    if (!selectedMainCategoryId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor selecciona una categoría principal');
      return;
    }

    if (!selectedSubcategoryId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Por favor selecciona una subcategoría');
      return;
    }

    const installmentsNum = parseInt(installments) || 1;
    if (paymentMethod === 'credit' && (installmentsNum < 1 || installmentsNum > 48)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'El número de cuotas debe estar entre 1 y 48');
      return;
    }

    buttonScale.value = withSpring(0.95, { damping: 10 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10 });
    }, 100);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        description: description.trim(),
        type,
        mainCategoryId: selectedMainCategoryId,
        subcategoryId: selectedSubcategoryId,
        paymentMethod,
        date,
        installments: paymentMethod === 'credit' ? installmentsNum : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Transacción agregada correctamente', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error?.message || 'No se pudo agregar la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <SafeAreaView style={[commonStyles.container, styles.container]} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Nueva Transacción</Text>
            <Text style={styles.subtitle}>Registra tu gasto o ingreso</Text>
          </View>

          {categoriesError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ Error al cargar categorías: {categoriesError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.compactSection}>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    type === 'expense' && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setType('expense');
                    setSelectedMainCategoryId(null);
                    setSelectedSubcategoryId(null);
                    Haptics.selectionAsync();
                  }}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      type === 'expense' && styles.segmentButtonTextActive,
                    ]}
                  >
                    💸 Gasto
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    type === 'income' && styles.segmentButtonActive,
                  ]}
                  onPress={() => {
                    setType('income');
                    setSelectedMainCategoryId(null);
                    setSelectedSubcategoryId(null);
                    Haptics.selectionAsync();
                  }}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      type === 'income' && styles.segmentButtonTextActive,
                    ]}
                  >
                    💰 Ingreso
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.compactInputGroup}>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Descripción (ej: Compra en supermercado)"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                editable={!isLoading}
              />
            </View>

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

            <View style={styles.compactSection}>
              <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
              <View style={styles.paymentGrid}>
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMethod === 'debit' && styles.paymentCardActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod('debit');
                    setInstallments('1');
                    Haptics.selectionAsync();
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.paymentIcon}>🏦</Text>
                  <Text
                    style={[
                      styles.paymentLabel,
                      paymentMethod === 'debit' && styles.paymentLabelActive,
                    ]}
                  >
                    Débito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMethod === 'credit' && styles.paymentCardActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod('credit');
                    Haptics.selectionAsync();
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.paymentIcon}>💳</Text>
                  <Text
                    style={[
                      styles.paymentLabel,
                      paymentMethod === 'credit' && styles.paymentLabelActive,
                    ]}
                  >
                    Crédito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    paymentMethod === 'cash' && styles.paymentCardActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod('cash');
                    setInstallments('1');
                    Haptics.selectionAsync();
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.paymentIcon}>💵</Text>
                  <Text
                    style={[
                      styles.paymentLabel,
                      paymentMethod === 'cash' && styles.paymentLabelActive,
                    ]}
                  >
                    Efectivo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {paymentMethod === 'credit' && (
              <View style={styles.compactInputGroup}>
                <View style={styles.installmentsRow}>
                  <Text style={styles.installmentsLabel}>Cuotas:</Text>
                  <TextInput
                    style={styles.installmentsInput}
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                    value={installments}
                    onChangeText={setInstallments}
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                  {parseInt(installments) > 1 && (
                    <Text style={styles.installmentsInfo}>
                      ${(parseFloat(amount || '0') / parseInt(installments)).toFixed(0)}/mes
                    </Text>
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => {
                setShowDatePicker(true);
                Haptics.selectionAsync();
              }}
              disabled={isLoading}
            >
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={[
                  buttonStyles.primaryButton,
                  styles.submitButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={buttonStyles.primaryButtonText}>✓ Guardar Transacción</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 160,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
  },
  form: {
    width: '100%',
  },
  compactSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: colors.background,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  compactInputGroup: {
    marginBottom: 16,
  },
  descriptionInput: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  paymentIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentLabelActive: {
    color: colors.text,
  },
  installmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  installmentsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  installmentsInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    width: 60,
    textAlign: 'center',
    marginRight: 12,
  },
  installmentsInfo: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
