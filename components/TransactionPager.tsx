
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  mainCategoryName: string;
  subcategoryName: string;
  date: Date;
}

interface TransactionPagerProps {
  transactions: Transaction[];
  itemsPerPage?: number;
}

export function TransactionPager({ transactions, itemsPerPage = 5 }: TransactionPagerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

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

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyText}>No hay transacciones este mes</Text>
        <Text style={styles.emptySubtext}>
          Agrega tu primera transacción usando el botón de abajo
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.transactionsList}>
        {currentTransactions.map((transaction, index) => (
          <View key={`${transaction.id}-${index}`} style={styles.transactionCard}>
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
        ))}
      </View>

      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
            onPress={goToPreviousPage}
            disabled={currentPage === 0}
          >
            <Text style={[styles.paginationButtonText, currentPage === 0 && styles.paginationButtonTextDisabled]}>
              ‹ Anterior
            </Text>
          </TouchableOpacity>

          <View style={styles.pageIndicator}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pageDot,
                  index === currentPage && styles.pageDotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
            onPress={goToNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <Text style={[styles.paginationButtonText, currentPage === totalPages - 1 && styles.paginationButtonTextDisabled]}>
              Siguiente ›
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  transactionsList: {
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
  income: {
    color: colors.income,
  },
  expense: {
    color: colors.expense,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  paginationButtonTextDisabled: {
    color: colors.textSecondary,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  pageDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
});
