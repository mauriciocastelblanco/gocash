
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  main_category: string | null;
  subcategory: string | null;
  icon: string | null;
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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const { start, end } = getMonthRange(currentDate);
      
      // Fetch summary
      const { data: summaryData } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end);

      const income = summaryData?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
      const expense = summaryData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
      setSummary({ income, expense });

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          description,
          amount,
          type,
          main_categories(name, icon),
          subcategories(name)
        `)
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .limit(10);

      const formattedTransactions = transactionsData?.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        main_category: t.main_categories?.name || null,
        subcategory: t.subcategories?.name || null,
        icon: t.main_categories?.icon || '💰',
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMonthRange = (date: Date) => {
    return {
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd'),
    };
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </Text>
        <TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Income Card */}
      <LinearGradient
        colors={['#52DF68', '#3AB854']}
        style={styles.summaryCard}
      >
        <Text style={styles.cardLabel}>Ingresos</Text>
        <Text style={styles.cardAmount}>{formatCurrency(summary.income)}</Text>
      </LinearGradient>

      {/* Expense Card */}
      <LinearGradient
        colors={['#52DF68', '#3AB854']}
        style={styles.summaryCard}
      >
        <Text style={styles.cardLabel}>Gastos</Text>
        <Text style={styles.cardAmount}>{formatCurrency(summary.expense)}</Text>
      </LinearGradient>

      {/* Transactions Section */}
      <Text style={styles.sectionTitle}>Transacciones</Text>
      
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>No hay transacciones este mes</Text>
      ) : (
        transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionIcon}>{transaction.icon}</Text>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionCategory}>
                  {transaction.main_category}
                  {transaction.subcategory && ` > ${transaction.subcategory}`}
                </Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[styles.transactionAmount, transaction.type === 'expense' && styles.expenseAmount]}>
                {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </Text>
              <Text style={styles.transactionDate}>
                {format(new Date(transaction.date), 'd MMM', { locale: es })}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
    opacity: 0.9,
  },
  cardAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#8E8E93',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  expenseAmount: {
    color: '#FF453A',
  },
  transactionDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 32,
  },
});
