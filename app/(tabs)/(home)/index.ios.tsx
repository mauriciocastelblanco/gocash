
import { IconSymbol } from '@/components/IconSymbol.ios';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseChart } from '@/components/ExpenseChart';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/app/integrations/supabase/client';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getUserActiveWorkspace } from '@/lib/transactions';
import React, { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SwipeableTransaction } from '@/components/SwipeableTransaction.ios';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  main_category: string | null;
  subcategory: string | null;
  icon: string | null;
  installment_current?: number;
  installment_total?: number;
  main_category_id?: string;
  subcategory_id?: string;
}

interface FinancialSummary {
  income: number;
  expense: number;
}

interface CategoryExpense {
  category: string;
  icon: string;
  amount: number;
  color: string;
}

type FilterType = 'all' | 'income' | 'expense';

const ITEMS_PER_PAGE = 10;

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expense: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      getUserActiveWorkspace(user.id).then(setWorkspaceId);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user || !workspaceId) return;

    try {
      const { start, end } = getMonthRange(selectedMonth);
      
      // Load summary
      const { data: summaryData } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('workspace_id', workspaceId)
        .gte('date', start)
        .lte('date', end);

      const newSummary = { income: 0, expense: 0 };
      summaryData?.forEach((t) => {
        if (t.type === 'income') newSummary.income += t.amount;
        else newSummary.expense += t.amount;
      });
      setSummary(newSummary);

      // Load category expenses for chart
      const { data: expenseData } = await supabase
        .from('transactions')
        .select(`
          amount,
          main_categories!inner(name, icon)
        `)
        .eq('workspace_id', workspaceId)
        .eq('type', 'expense')
        .gte('date', start)
        .lte('date', end);

      const categoryMap = new Map<string, { amount: number; icon: string }>();
      expenseData?.forEach((item: any) => {
        const categoryName = item.main_categories?.name || 'Otros';
        const icon = item.main_categories?.icon || '💰';
        const existing = categoryMap.get(categoryName) || { amount: 0, icon };
        categoryMap.set(categoryName, {
          amount: existing.amount + item.amount,
          icon,
        });
      });

      const expenses = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          icon: data.icon,
          amount: data.amount,
          color: '',
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryExpenses(expenses);

      // Load transactions with pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = supabase
        .from('transactions')
        .select(`
          *,
          main_categories(name, icon),
          subcategories(name)
        `, { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .gte('date', start)
        .lte('date', end);

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, count } = await query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      const formattedTransactions = data?.map((t: any) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        main_category: t.main_categories?.name || null,
        subcategory: t.subcategories?.name || null,
        icon: t.main_categories?.icon || null,
        installment_current: t.installment_current,
        installment_total: t.installment_total,
        main_category_id: t.main_category_id,
        subcategory_id: t.subcategory_id,
      })) || [];

      setTransactions(formattedTransactions);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, workspaceId, selectedMonth, filterType, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMonthRange = (date: Date) => {
    return {
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd'),
    };
  };

  const formatMonthYear = (date: Date) => {
    return format(date, 'MMMM yyyy');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTransactionDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMonthChange = (offset: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterType(type);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentPage(page);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditDate(new Date(transaction.date));
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction || !workspaceId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editAmount),
          description: editDescription,
          date: format(editDate, 'yyyy-MM-dd'),
        })
        .eq('id', editingTransaction.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!workspaceId) return;

    Alert.alert(
      'Eliminar transacción',
      '¿Estás seguro de que deseas eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id)
                .eq('workspace_id', workspaceId);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la transacción');
            }
          },
        },
      ]
    );
  };

  const getExpenseCardColor = () => {
    const balance = summary.income - summary.expense;
    if (balance > 0) return colors.success;
    if (balance < 0) return colors.error;
    return colors.textSecondary;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.monthButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
          <TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.monthButton}>
            <IconSymbol name="chevron.right" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <LinearGradient colors={[colors.success, colors.successDark]} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary.income)}</Text>
          </LinearGradient>

          <LinearGradient colors={[colors.error, colors.errorDark]} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary.expense)}</Text>
          </LinearGradient>
        </View>

        <View style={[styles.balanceCard, { borderLeftColor: getExpenseCardColor() }]}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balanceAmount, { color: getExpenseCardColor() }]}>
            {formatCurrency(summary.income - summary.expense)}
          </Text>
        </View>

        {/* Expense Chart */}
        <View style={styles.chartWrapper}>
          <ExpenseChart expenses={categoryExpenses} total={summary.expense} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'income' && styles.filterTabActive]}
            onPress={() => handleFilterChange('income')}
          >
            <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>
              Ingresos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'expense' && styles.filterTabActive]}
            onPress={() => handleFilterChange('expense')}
          >
            <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>
              Gastos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Transacciones</Text>
          {transactions.map((transaction) => (
            <SwipeableTransaction
              key={transaction.id}
              transaction={transaction}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
            >
              <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  currentPage === totalPages && styles.pageButtonTextDisabled,
                ]}
              >
                Siguiente
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Transacción</Text>
            
            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="Monto"
              placeholderTextColor={colors.textSecondary}
            />
            
            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Descripción"
              placeholderTextColor={colors.textSecondary}
            />
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{format(editDate, 'dd/MM/yyyy')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setEditDate(date);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  chartWrapper: {
    paddingHorizontal: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  pageButtonDisabled: {
    backgroundColor: colors.cardBackground,
  },
  pageButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: colors.textSecondary,
  },
  pageInfo: {
    color: colors.text,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dateButtonText: {
    color: colors.text,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
});
