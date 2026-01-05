
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
import { colors, commonStyles } from '@/styles/commonStyles';
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
      console.log('📊 Fetching summary:', { workspaceId, startDate, endDate });

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (fetchError) {
        console.error('[Dashboard] Error fetching summary:', fetchError);
        throw fetchError;
      }

      if (!data || data.length === 0) {
        console.log('📊 No transactions found');
        setSummary({ income: 0, expense: 0 });
        return;
      }

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
          main_categories (
            icono
          )
        `)
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

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
        icon: t.main_categories?.icono || '💰',
        installment_current: t.installment_number,
        installment_total: t.installments,
      }));

      console.log('[Dashboard] Loaded', transformedTransactions.length, 'transactions');
      setTransactions(transformedTransactions);
      setError(null);
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

  if (isLoading && transactions.length === 0) {
    return (
      <SafeAreaView style={[commonStyles.container, styles.container, styles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[commonStyles.container, styles.container]} edges={['top']}>
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
              android_material_icon_name="chevron_right"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Income Card */}
        <LinearGradient
          colors={['#52DF68', '#3AB854']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.cardLabel}>Ingresos</Text>
          <Text style={styles.cardAmount}>{formatCurrency(summary.income)}</Text>
        </LinearGradient>

        {/* Expense Card */}
        <LinearGradient
          colors={['#52DF68', '#3AB854']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.cardLabel}>Gastos</Text>
          <Text style={styles.cardAmount}>{formatCurrency(summary.expense)}</Text>
        </LinearGradient>

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
                      <Text style={styles.iconText}>{transaction.icon}</Text>
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
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.type === 'expense' && styles.expenseAmount,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
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
    marginBottom: 32,
    paddingVertical: 8,
  },
  monthButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transactionsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
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
    borderRadius: 16,
    padding: 18,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  transactionCategory: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  expenseAmount: {
    color: '#EF4444',
  },
  transactionDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
