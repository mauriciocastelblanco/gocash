
import React, { useState } from 'react';
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

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { transactions, getMonthlyTotal, getMonthlyTransactions, isLoading, refreshTransactions } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  console.log('[HomeScreen] Render state:', {
    authLoading,
    hasUser: !!user,
    transactionCount: transactions.length,
    isLoading,
  });

  const monthlyIncome = getMonthlyTotal(currentYear, currentMonth, 'income');
  const monthlyExpenses = getMonthlyTotal(currentYear, currentMonth, 'expense');
  const balance = monthlyIncome - monthlyExpenses;
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const getCategoryEmoji = (categoryName: string): string => {
    const emojiMap: { [key: string]: string } = {
      'Supermercado': '🛒',
      'Restaurante': '🍽️',
      'Transporte': '🚗',
      'Salud': '💊',
      'Entretenimiento': '🎬',
      'Hogar': '🏠',
      'Educación': '📚',
      'Otros': '💰',
      'Salario': '💼',
      'Inversiones': '📈',
      'Freelance': '💻',
      'Alimentación y hogar': '🏠',
      'Servicios básicos': '💡',
      'Ahorro': '💰',
    };
    return emojiMap[categoryName] || '📁';
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <View style={[commonStyles.container, styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Show loading state while transactions are loading for the first time
  if (isLoading && transactions.length === 0) {
    return (
      <View style={[commonStyles.container, styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando transacciones...</Text>
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
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola 👋</Text>
          <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Balance del mes</Text>
            <Text style={[styles.balanceAmount, balance >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(balance)}
            </Text>
          </View>

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
          
          {monthlyTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyText}>No hay transacciones este mes</Text>
              <Text style={styles.emptySubtext}>
                Agrega tu primera transacción usando el botón de abajo
              </Text>
            </View>
          ) : (
            monthlyTransactions.slice(0, 10).map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryEmoji}>
                      {getCategoryEmoji(transaction.mainCategoryName)}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.subcategoryName} • {formatDate(transaction.date)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'income' ? styles.income : styles.expense,
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
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
    paddingBottom: 120,
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
  balanceContainer: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  positive: {
    color: colors.income,
  },
  negative: {
    color: colors.expense,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '600',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 24,
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
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
});
