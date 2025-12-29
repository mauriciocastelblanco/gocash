
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';
import { TransactionPager } from '@/components/TransactionPager';

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { transactions, getMonthlyTotal, getMonthlyTransactions, isLoading, refreshTransactions } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('[HomeScreen] Component mounted');
    setMounted(true);
    return () => {
      console.log('[HomeScreen] Component unmounted');
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    console.log('[HomeScreen] State:', {
      mounted,
      authLoading,
      hasUser: !!user,
      isLoading,
      transactionCount: transactions.length,
    });
  }, [mounted, authLoading, user, isLoading, transactions.length]);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthlyIncome = getMonthlyTotal(currentYear, currentMonth, 'income');
  const monthlyExpenses = getMonthlyTotal(currentYear, currentMonth, 'expense');
  const monthlyTransactions = getMonthlyTransactions(currentYear, currentMonth);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const onRefresh = async () => {
    console.log('[HomeScreen] Refreshing...');
    setRefreshing(true);
    try {
      await refreshTransactions();
    } catch (error) {
      console.error('[HomeScreen] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading only on first load
  if (!mounted || authLoading || (isLoading && transactions.length === 0)) {
    console.log('[HomeScreen] Showing loading state');
    return (
      <View style={[commonStyles.container, styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  console.log('[HomeScreen] Rendering main content');

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
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola 👋</Text>
          <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ingresos</Text>
              <Text style={[styles.statAmount, styles.income]}>
                {formatCurrency(monthlyIncome)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Gastos</Text>
              <Text style={[styles.statAmount, styles.expense]}>
                {formatCurrency(monthlyExpenses)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transacciones recientes</Text>
          <TransactionPager transactions={monthlyTransactions} itemsPerPage={5} />
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  monthTitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  income: {
    color: colors.income,
  },
  expense: {
    color: colors.expense,
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
});
