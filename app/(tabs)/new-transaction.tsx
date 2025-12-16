
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
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
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

    const installmentsNum = parseInt(installments) || 1;
    if (paymentMethod === 'credit' && (installmentsNum < 1 || installmentsNum > 48)) {
      Alert.alert('Error', 'El número de cuotas debe estar entre 1 y 48');
      return;
    }

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
      Alert.alert('Error', error?.message || 'No se pudo agregar la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nueva Transacción</Text>
        </View>

        {categoriesError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al cargar categorías: {categoriesError}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Tipo</Text>
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

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Monto *</Text>
            <TextInput
              style={[commonStyles.input, styles.amountInput]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Descripción *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Ej: Compra en supermercado"
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

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Método de pago</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 'debit' && styles.paymentButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod('debit');
                  setInstallments('1');
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 'debit' && styles.paymentButtonTextActive,
                  ]}
                >
                  🏦 Débito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 'credit' && styles.paymentButtonActive,
                ]}
                onPress={() => setPaymentMethod('credit')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 'credit' && styles.paymentButtonTextActive,
                  ]}
                >
                  💳 Crédito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 'cash' && styles.paymentButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod('cash');
                  setInstallments('1');
                }}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 'cash' && styles.paymentButtonTextActive,
                  ]}
                >
                  💵 Efectivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {paymentMethod === 'credit' && (
            <View style={styles.inputGroup}>
              <Text style={commonStyles.inputLabel}>Número de cuotas</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                value={installments}
                onChangeText={setInstallments}
                keyboardType="number-pad"
                editable={!isLoading}
              />
              <Text style={styles.helperText}>
                {parseInt(installments) > 1
                  ? `${parseInt(installments)} cuotas de $${(
                      parseFloat(amount || '0') / parseInt(installments)
                    ).toFixed(0)}`
                  : 'Ingresa el número de cuotas (1-48)'}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Fecha</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading}
            >
              <Text style={styles.dateButtonText}>📅 {formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

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

          <TouchableOpacity
            style={[
              buttonStyles.primaryButton,
              styles.submitButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={buttonStyles.primaryButtonText}>Guardar Transacción</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: colors.background,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentButtonTextActive: {
    color: colors.text,
  },
  dateButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
