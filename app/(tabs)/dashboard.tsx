
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/app/integrations/supabase/client';
import { getUserActiveWorkspace } from '@/lib/transactions';
import { colors, commonStyles } from '@/styles/commonStyles';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CategorySelector } from '@/components/CategorySelector';
import { useCategories } from '@/hooks/useCategories';
import * as Haptics from 'expo-haptics';

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
  payment_method?: string;
}

interface FinancialSummary {
  income: number;
  expense: number;
}

type FilterType = 'all' | 'income' | 'expense';

const ITEMS_PER_PAGE = 10;
const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  color: (opacity = 1) => `rgba(82, 223, 104, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { deleteTransaction: contextDeleteTransaction, refreshTransactions } = useTransactions();
  const { mainCategories, subcategories, isLoading: categoriesLoading } = useCategories();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expense: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editMainCategoryId, setEditMainCategoryId] = useState<string | null>(null);
  const [editSubcategoryId, setEditSubcategoryId] = useState<string | null>(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('debit');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const workspace = await getUserActiveWorkspace(user.id);
      
      if (!workspace) {
        console.error('No active workspace found');
        return;
      }

      setWorkspaceId(workspace.id);
      const { start, end } = getMonthRange(currentDate);

      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_financial_summary',
        {
          p_workspace_id: workspace.id,
          p_start_date: start,
          p_end_date: end,
        }
      );

      if (summaryError) throw summaryError;
      if (summaryData && summaryData.length > 0) {
        setSummary({
          income: summaryData[0].total_income || 0,
          expense: summaryData[0].total_expense || 0,
        });
      }

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          description,
          type,
          date,
          payment_method,
          installment_current,
          installment_total,
          main_categories!inner(id, name, icon),
          subcategories!inner(id, name)
        `)
        .eq('workspace_id', workspace.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      const formattedTransactions = (transactionsData || []).map((t: any) => ({
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
        payment_method: t.payment_method,
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    if (user && workspaceId) {
      loadData();
    }
  }, [user, workspaceId, loadData]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const pieChartData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const subcategoryTotals: { [key: string]: number } = {};
    
    expenseTransactions.forEach(t => {
      const subcat = t.subcategory || 'Sin categoría';
      subcategoryTotals[subcat] = (subcategoryTotals[subcat] || 0) + t.amount;
    });

    const colors = ['#52DF68', '#4ECDC4', '#FF6B6B', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA'];
    
    return Object.entries(subcategoryTotals).map(([name, value], index) => ({
      name,
      population: value,
      color: colors[index % colors.length],
      legendFontColor: '#FFFFFF',
      legendFontSize: 12,
    }));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const handleEdit = (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditDate(new Date(transaction.date));
    setEditPaymentMethod(transaction.payment_method || 'debit');
    
    const mainCat = mainCategories.find(c => c.name === transaction.main_category);
    const subcat = subcategories.find(s => s.name === transaction.subcategory);
    setEditMainCategoryId(mainCat?.id || null);
    setEditSubcategoryId(subcat?.id || null);
    
    setEditModalVisible(true);
  };

  const handleDelete = async (transactionId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
              await contextDeleteTransaction(transactionId);
              await loadData();
              await refreshTransactions();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la transacción');
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction || !editMainCategoryId || !editSubcategoryId) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editAmount),
          description: editDescription,
          date: format(editDate, 'yyyy-MM-dd'),
          main_category_id: editMainCategoryId,
          subcategory_id: editSubcategoryId,
          payment_method: editPaymentMethod,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditModalVisible(false);
      await loadData();
      await refreshTransactions();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la transacción');
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthRange = (date: Date) => {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');
    return { start, end };
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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilter(type);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => handleMonthChange(-1)}>
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="chevron-left" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity onPress={() => handleMonthChange(1)}>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <LinearGradient colors={['#52DF68', '#3BC252']} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary.income)}</Text>
          </LinearGradient>

          <LinearGradient colors={['#FF6B6B', '#EE5A52']} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary.expense)}</Text>
          </LinearGradient>
        </View>

        {/* Pie Chart */}
        {pieChartData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Gastos por Subcategoría</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('income')}
          >
            <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>Ingresos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('expense')}
          >
            <Text style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>Gastos</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          {paginatedTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionIcon}>{transaction.icon || '💰'}</Text>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.main_category} • {transaction.subcategory}
                  </Text>
                  <Text style={styles.transactionDate}>{formatTransactionDate(transaction.date)}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleEdit(transaction)} style={styles.actionButton}>
                    <IconSymbol 
                      ios_icon_name="pencil" 
                      android_material_icon_name="edit" 
                      size={18} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(transaction.id)} style={styles.actionButton}>
                    <IconSymbol 
                      ios_icon_name="trash" 
                      android_material_icon_name="delete" 
                      size={18} 
                      color="#FF6B6B" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <TouchableOpacity
                key={page}
                style={[styles.pageButton, currentPage === page && styles.pageButtonActive]}
                onPress={() => handlePageChange(page)}
              >
                <Text style={[styles.pageText, currentPage === page && styles.pageTextActive]}>{page}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Editar Transacción</Text>
              
              <Text style={styles.label}>Monto</Text>
              <TextInput
                style={styles.input}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Descripción"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>{format(editDate, 'dd/MM/yyyy')}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setEditDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Categoría</Text>
              <CategorySelector
                mainCategories={mainCategories}
                subcategories={subcategories}
                selectedMainCategoryId={editMainCategoryId}
                selectedSubcategoryId={editSubcategoryId}
                onMainCategorySelect={setEditMainCategoryId}
                onSubcategorySelect={setEditSubcategoryId}
                type={editingTransaction?.type || 'expense'}
                isLoading={categoriesLoading}
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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  chartContainer: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 120,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  incomeAmount: {
    color: colors.primary,
  },
  expenseAmount: {
    color: '#FF6B6B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonActive: {
    backgroundColor: colors.primary,
  },
  pageText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pageTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  dateButton: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});
