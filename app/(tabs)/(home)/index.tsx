
import { SwipeableTransaction } from '@/components/SwipeableTransaction';
import { useAuth } from '@/contexts/AuthContext';
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
import { ExpenseChart } from '@/components/ExpenseChart';
import { supabase } from '@/app/integrations/supabase/client';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getUserActiveWorkspace } from '@/lib/transactions';
import React, { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';

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

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C41A'
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expense: 0 });
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadData = useCallback(async () => {
    if (!user || !workspaceId) {
      console.log('HomeScreen - No user or workspace ID');
      return;
    }

    try {
      const { start, end } = getMonthRange(selectedMonth);
      console.log('HomeScreen - Loading data for range:', start, 'to', end);
      console.log('HomeScreen - Workspace ID:', workspaceId);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          description,
          amount,
          type,
          main_categories!inner(name, icon, id),
          subcategories(name, id)
        `)
        .eq('workspace_id', workspaceId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (transactionsError) {
        console.error('HomeScreen - Transactions error:', transactionsError);
        throw transactionsError;
      }

      console.log('HomeScreen - Loaded transactions:', transactionsData?.length || 0);
      console.log('HomeScreen - Raw transactions data:', JSON.stringify(transactionsData, null, 2));

      const formattedTransactions: Transaction[] = (transactionsData || []).map((t: any) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        main_category: t.main_categories?.name || null,
        subcategory: t.subcategories?.name || null,
        icon: t.main_categories?.icon || null,
        main_category_id: t.main_categories?.id || null,
        subcategory_id: t.subcategories?.id || null,
      }));

      setTransactions(formattedTransactions);

      // Calculate summary
      const income = formattedTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = formattedTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      console.log('HomeScreen - Summary - Income:', income, 'Expense:', expense);
      setSummary({ income, expense });

      // Calculate category expenses
      const expensesByCategory = formattedTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => {
          const category = t.main_category || 'Sin categoría';
          const icon = t.icon || '💰';
          if (!acc[category]) {
            acc[category] = { category, icon, amount: 0 };
          }
          acc[category].amount += t.amount;
          return acc;
        }, {} as Record<string, { category: string; icon: string; amount: number }>);

      const categoryExpensesArray = Object.values(expensesByCategory)
        .map((item, index) => ({
          ...item,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      console.log('HomeScreen - Category expenses:', categoryExpensesArray);
      console.log('HomeScreen - Category expenses count:', categoryExpensesArray.length);
      setCategoryExpenses(categoryExpensesArray);
    } catch (error) {
      console.error('HomeScreen - Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, workspaceId, selectedMonth]);

  useEffect(() => {
    if (user) {
      getUserActiveWorkspace(user.id).then((id) => {
        console.log('HomeScreen - Workspace ID:', id);
        setWorkspaceId(id);
      });
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Apply filter
    let filtered = transactions;
    if (filter === 'income') {
      filtered = transactions.filter((t) => t.type === 'income');
    } else if (filter === 'expense') {
      filtered = transactions.filter((t) => t.type === 'expense');
    }
    console.log('HomeScreen - Filtered transactions:', filtered.length);
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [filter, transactions]);

  const getMonthRange = (date: Date) => {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    return { start, end };
  };

  const formatMonthYear = (date: Date) => {
    return format(date, 'MMMM yyyy');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatTransactionDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilter(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editAmount),
          description: editDescription,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      setEditModalVisible(false);
      loadData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    }
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
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
                .eq('id', transaction.id);

              if (error) throw error;

              loadData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'No se pudo eliminar la transacción');
            }
          },
        },
      ]
    );
  };

  const getExpenseCardColor = () => {
    const ratio = summary.expense / summary.income;
    if (ratio > 0.8) return '#FF6B6B';
    if (ratio > 0.6) return '#FFA07A';
    return colors.accent;
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.monthButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.monthButton}>
            <IconSymbol name="chevron.right" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryAmount, { color: colors.accent }]}>
              {formatCurrency(summary.income)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryAmount, { color: getExpenseCardColor() }]}>
              {formatCurrency(summary.expense)}
            </Text>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[colors.accent, '#45B7D1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(summary.income - summary.expense)}
          </Text>
        </LinearGradient>

        {/* Expense Chart */}
        {console.log('HomeScreen - Rendering ExpenseChart with data:', categoryExpenses)}
        <ExpenseChart data={categoryExpenses} formatCurrency={formatCurrency} />

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('income')}
          >
            <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>
              Ingresos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('expense')}
          >
            <Text style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>
              Gastos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <Text style={styles.sectionTitle}>Transacciones</Text>
        {paginatedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay transacciones</Text>
          </View>
        ) : (
          <>
            {paginatedTransactions.map((transaction) => (
              <SwipeableTransaction
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                formatCurrency={formatCurrency}
                formatDate={formatTransactionDate}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <TouchableOpacity
                    key={page}
                    style={[
                      styles.pageButton,
                      currentPage === page && styles.pageButtonActive,
                    ]}
                    onPress={() => handlePageChange(page)}
                  >
                    <Text
                      style={[
                        styles.pageText,
                        currentPage === page && styles.pageTextActive,
                      ]}
                    >
                      {page}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Transacción</Text>
            
            <Text style={styles.inputLabel}>Monto</Text>
            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Descripción"
              placeholderTextColor={colors.textSecondary}
            />

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

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedMonth}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) setSelectedMonth(date);
          }}
        />
      )}
    </View>
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
    padding: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 100,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonActive: {
    backgroundColor: colors.accent,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pageTextActive: {
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.accent,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
