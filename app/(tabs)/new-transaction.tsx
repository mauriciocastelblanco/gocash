
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
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useTransactions } from '@/contexts/TransactionContext';
import { CATEGORIES, TransactionType, PaymentMethod, Category } from '@/types/transaction';

export default function NewTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactions();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción');
      return;
    }

    setIsLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        description: description.trim(),
        type,
        category: selectedCategory,
        paymentMethod,
        date,
      });

      Alert.alert('Éxito', 'Transacción agregada correctamente', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.log('Error adding transaction:', error);
      Alert.alert('Error', 'No se pudo agregar la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
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

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Monto</Text>
            <TextInput
              style={[commonStyles.input, styles.amountInput]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Descripción</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Ej: Compra en supermercado"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Tipo</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  type === 'expense' && styles.segmentButtonActive,
                ]}
                onPress={() => setType('expense')}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    type === 'expense' && styles.segmentButtonTextActive,
                  ]}
                >
                  Gasto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  type === 'income' && styles.segmentButtonActive,
                ]}
                onPress={() => setType('income')}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    type === 'income' && styles.segmentButtonTextActive,
                  ]}
                >
                  Ingreso
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Categoría</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryButton,
                    selectedCategory.id === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      selectedCategory.id === category.id && styles.categoryNameActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Método de pago</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 'debit' && styles.paymentButtonActive,
                ]}
                onPress={() => setPaymentMethod('debit')}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 'debit' && styles.paymentButtonTextActive,
                  ]}
                >
                  Débito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 'credit' && styles.paymentButtonActive,
                ]}
                onPress={() => setPaymentMethod('credit')}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 'credit' && styles.paymentButtonTextActive,
                  ]}
                >
                  Crédito
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 'cash' && styles.paymentButtonActive,
                ]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 'cash' && styles.paymentButtonTextActive,
                  ]}
                >
                  Efectivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={commonStyles.inputLabel}>Fecha</Text>
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
            style={[buttonStyles.primaryButton, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={buttonStyles.primaryButtonText}>
              {isLoading ? 'Guardando...' : 'Guardar Transacción'}
            </Text>
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
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: colors.text,
    fontWeight: '600',
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
});
