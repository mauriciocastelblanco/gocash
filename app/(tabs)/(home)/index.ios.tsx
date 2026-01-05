
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { getUserActiveWorkspace } from '@/lib/transactions';
import { IconSymbol } from '@/components/IconSymbol.ios';

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
}

interface FinancialSummary {
  income: number;
  expense: number;
}

type FilterType = 'all' | 'income' | 'expense';

const ITEMS_PER_PAGE = 10;

export default function HomeScreen() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expense: 0 });
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Get month range - FIXED: Using date-fns to format as YYYY-MM-DD
  const getMonthRange = (date: Date) => {
    const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
    return { startDate, endDate };
  };

  // Format month display
  const formatMonthYear = (date: Date) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date for transaction list
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
  };

  // Filter transactions based on type
  const filteredTransactions = allTransactions.filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  // Paginate transactions
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Load workspace ID
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!user) return;
      const wsId = await getUserActiveWorkspace(user.id);
      setWorkspaceId(wsId);
      console.log('[Home] Workspace ID:', wsId);
    };
    loadWorkspace();
  }, [user]);

  // Fetch financial summary - FIXED: Using correct date format
  const fetchSummary = useCallback(async () => {
    if (!user || !workspaceId) {
      console.log('[Home] No user or workspace, skipping summary fetch');
      return;
    }

    try {
      const { startDate, endDate } = getMonthRange(currentDate);
      console.log('📊 Fetching summary:', { workspaceId, startDate, endDate });

      // Query exactly as the web app does
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)  // >= inicio del mes
        .lte('date', endDate);   // <= fin del mes

      if (fetchError) {
        console.error('[Home] Error fetching summary:', fetchError);
        throw fetchError;
      }

      if (!data || data.length === 0) {
        console.log('📊 No transactions found');
        setSummary({ income: 0, expense: 0 });
        return;
      }

      // Calculate totals exactly as the web app does
      const totalIngresos = data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalGastos = data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      console.log('📊 Summary result:', {
        totalIngresos,
        totalGastos,
        balance: totalIngresos - totalGastos,
        transactionCount: data.length
      });

      setSummary({ income: totalIngresos, expense: totalGastos });
    } catch (err) {
      console.error('[Home] Error:', err);
      setError('Error al cargar el resumen');
    }
  }, [user, workspaceId, currentDate]);

  // Fetch transactions - FIXED: Using correct date format
  const fetchTransactions = useCallback(async () => {
    if (!user || !workspaceId) {
      console.log('[Home] No user or workspace, skipping transactions fetch');
      return;
    }

    try {
      const { startDate, endDate } = getMonthRange(currentDate);
      console.log('[Home] Fetching transactions:', { startDate, endDate, workspaceId });

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          description,
          amount,
          type,
          installments,
          installment_number,
          main_category_id,
          subcategory_id,
          main_category_name,
          subcategory_name,
          main_categories (
            icono
          )
        `)
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)  // >= inicio del mes
        .lte('date', endDate)    // <= fin del mes
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[Home] Error fetching transactions:', fetchError);
        throw fetchError;
      }

      const transformedTransactions: Transaction[] = (data || []).map((t: any) => ({
        id: t.id,
        date: t.date,
        description: t.description || 'Sin descripción',
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
        type: t.type,
        main_category: t.main_category_name,
        subcategory: t.subcategory_name,
        icon: t.main_categories?.icono || null,
        installment_current: t.installment_number,
        installment_total: t.installments,
      }));

      console.log('[Home] Loaded', transformedTransactions.length, 'transactions');
      setAllTransactions(transformedTransactions);
      setError(null);
    } catch (err) {
      console.error('[Home] Error:', err);
      setError('Error al cargar las transacciones');
    }
  }, [user, workspaceId, currentDate]);

  // Load data
  const loadData = useCallback(async () => {
    if (!user || !workspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([fetchSummary(), fetchTransactions()]);
    } catch (err) {
      console.error('[Home] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, workspaceId, fetchSummary, fetchTransactions]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !workspaceId) return;

    console.log('[Home] Setting up real-time subscription');

    const channel = supabase
      .channel('home-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('[Home] Real-time update:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      console.log('[Home] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, workspaceId, loadData]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Handle month change
  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate percentage spent
  const percentageSpent = summary.income > 0 ? (summary.expense / summary.income) * 100 : 0;

  // Determine expense card color
  const getExpenseCardColor = () => {
    if (percentageSpent <= 70) return '#22C55E'; // green
    if (percentageSpent <= 100) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  if (isLoading && allTransactions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => handleMonthChange(-1)}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron-left"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => handleMonthChange(1)}
          >
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Income Card */}
        <TouchableOpacity
          onPress={() => handleFilterChange(filterType === 'income' ? 'all' : 'income')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#22C55E', '#1A1A1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.incomeCard,
              filterType === 'income' && styles.activeCard
            ]}
          >
            <Text style={styles.cardLabel}>Ingresos</Text>
            <Text style={styles.cardAmount}>{formatCurrency(summary.income)}</Text>
            {filterType === 'income' && (
              <Text style={styles.filterIndicator}>✓ Filtro activo</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Expense Card */}
        <TouchableOpacity
          onPress={() => handleFilterChange(filterType === 'expense' ? 'all' : 'expense')}
          activeOpacity={0.8}
        >
          <View style={[
            styles.expenseCard,
            { backgroundColor: getExpenseCardColor() },
            filterType === 'expense' && styles.activeCard
          ]}>
            <Text style={styles.cardLabel}>Gastos</Text>
            <Text style={styles.cardAmount}>{formatCurrency(summary.expense)}</Text>
            {filterType === 'expense' && (
              <Text style={styles.filterIndicator}>✓ Filtro activo</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transacciones</Text>
            {filterType !== 'all' && (
              <TouchableOpacity onPress={() => handleFilterChange('all')}>
                <Text style={styles.clearFilterText}>Limpiar filtro</Text>
              </TouchableOpacity>
            )}
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
          {!error && filteredTransactions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filterType === 'all' 
                  ? 'No hay transacciones este mes'
                  : `No hay ${filterType === 'income' ? 'ingresos' : 'gastos'} este mes`
                }
              </Text>
            </View>
          )}
          {!error && paginatedTransactions.length > 0 && (
            <React.Fragment>
              <View style={styles.transactionsList}>
                {paginatedTransactions.map((transaction, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>{transaction.icon || '💰'}</Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription} numberOfLines={1}>
                          {transaction.description}
                        </Text>
                        {transaction.main_category && (
                          <Text style={styles.transactionCategory} numberOfLines={1}>
                            {transaction.main_category}
                            {transaction.subcategory && ` > ${transaction.subcategory}`}
                          </Text>
                        )}
                        {transaction.installment_total && transaction.installment_total > 1 && (
                          <Text style={styles.installmentText}>
                            Cuota {transaction.installment_current}/{transaction.installment_total}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                        ]}
                      >
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatTransactionDate(transaction.date)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                    onPress={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <IconSymbol
                      ios_icon_name="chevron.left"
                      android_material_icon_name="chevron-left"
                      size={20}
                      color={currentPage === 1 ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.paginationInfo}>
                    <Text style={styles.paginationText}>
                      Página {currentPage} de {totalPages}
                    </Text>
                    <Text style={styles.paginationSubtext}>
                      {filteredTransactions.length} transacciones
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                    onPress={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={currentPage === totalPages ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 12,
  },
  monthButton: {
    padding: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  incomeCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  expenseCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  activeCard: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  errorContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  emptyContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
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
  installmentText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#22C55E',
  },
  expenseAmount: {
    color: '#EF4444',
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paginationSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
