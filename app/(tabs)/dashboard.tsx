
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { getUserActiveWorkspace } from '@/lib/transactions';
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
}

interface FinancialSummary {
  income: number;
  expense: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState<FinancialSummary>({ income: 0, expense: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Get month range
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
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

  // Load workspace ID
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!user) return;
      const wsId = await getUserActiveWorkspace(user.id);
      setWorkspaceId(wsId);
      console.log('[Dashboard] Workspace ID:', wsId);
    };
    loadWorkspace();
  }, [user]);

  // Fetch financial summary
  const fetchSummary = useCallback(async () => {
    if (!user || !workspaceId) {
      console.log('[Dashboard] No user or workspace, skipping summary fetch');
      return;
    }

    try {
      const { startDate, endDate } = getMonthRange(currentDate);
      console.log('[Dashboard] Fetching summary:', { startDate, endDate, workspaceId });

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (fetchError) {
        console.error('[Dashboard] Error fetching summary:', fetchError);
        throw fetchError;
      }

      // Calculate totals by type
      const totals = (data || []).reduce(
        (acc, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          if (t.type === 'income') {
            acc.income += amount;
          } else if (t.type === 'expense') {
            acc.expense += amount;
          }
          return acc;
        },
        { income: 0, expense: 0 }
      );

      console.log('[Dashboard] Summary:', totals);
      setSummary(totals);
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setError('Error al cargar el resumen');
    }
  }, [user, workspaceId, currentDate]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user || !workspaceId) {
      console.log('[Dashboard] No user or workspace, skipping transactions fetch');
      return;
    }

    try {
      const { startDate, endDate } = getMonthRange(currentDate);
      console.log('[Dashboard] Fetching transactions:', { startDate, endDate, workspaceId });

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
          main_categories!transactions_main_category_id_fkey (
            icono
          )
        `)
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[Dashboard] Error fetching transactions:', fetchError);
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

      console.log('[Dashboard] Loaded', transformedTransactions.length, 'transactions');
      setTransactions(transformedTransactions);
    } catch (err) {
      console.error('[Dashboard] Error:', err);
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
      console.error('[Dashboard] Error loading data:', err);
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

    console.log('[Dashboard] Setting up real-time subscription');

    const channel = supabase
      .channel('dashboard-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('[Dashboard] Real-time update:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      console.log('[Dashboard] Cleaning up real-time subscription');
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
  };

  // Calculate percentage spent
  const percentageSpent = summary.income > 0 ? (summary.expense / summary.income) * 100 : 0;

  // Determine expense card color
  const getExpenseCardColor = () => {
    if (percentageSpent <= 70) return '#22C55E'; // green
    if (percentageSpent <= 100) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  if (isLoading && transactions.length === 0) {
    return (
      <View style={[commonStyles.container, styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[commonStyles.container, styles.container]}>
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
              android_material_icon_name="chevron_left"
              size={24}
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
              android_material_icon_name="chevron_right"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Income Card */}
        <LinearGradient
          colors={['#22C55E', '#1A1A1A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.incomeCard}
        >
          <Text style={styles.cardLabel}>Ingresos</Text>
          <Text style={styles.cardAmount}>{formatCurrency(summary.income)}</Text>
        </LinearGradient>

        {/* Expense Card */}
        <View style={[styles.expenseCard, { backgroundColor: getExpenseCardColor() }]}>
          <Text style={styles.cardLabel}>Gastos</Text>
          <Text style={styles.cardAmount}>{formatCurrency(summary.expense)}</Text>
          <Text style={styles.percentageText}>
            {percentageSpent.toFixed(1)}% de los ingresos
          </Text>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transacciones</Text>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
          {!error && transactions.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay transacciones este mes</Text>
            </View>
          )}
          {!error && transactions.length > 0 && (
            <View style={styles.transactionsList}>
              {transactions.map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.iconText}>{transaction.icon || '💰'}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      {transaction.main_category && (
                        <Text style={styles.transactionCategory}>
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
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
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
    paddingBottom: 140,
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
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
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
    backgroundColor: colors.backgroundAlt,
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
});
