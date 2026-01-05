
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

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
  const translateX = useSharedValue(0);
  const animatedPage = useSharedValue(0);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

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

  const changePage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPage(newPage);
      animatedPage.value = withSpring(newPage, {
        damping: 20,
        stiffness: 90,
      });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      changePage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      changePage(currentPage - 1);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldGoNext = event.translationX < -SWIPE_THRESHOLD && currentPage < totalPages - 1;
      const shouldGoPrev = event.translationX > SWIPE_THRESHOLD && currentPage > 0;

      if (shouldGoNext) {
        runOnJS(goToNextPage)();
      } else if (shouldGoPrev) {
        runOnJS(goToPreviousPage)();
      }

      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    });

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

  const renderPage = (pageIndex: number) => {
    const startIndex = pageIndex * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = transactions.slice(startIndex, endIndex);

    return (
      <View key={pageIndex} style={styles.page}>
        {pageTransactions.map((transaction, index) => {
          return (
            <TransactionCard
              key={`${transaction.id}-${index}`}
              transaction={transaction}
              pageIndex={pageIndex}
              animatedPage={animatedPage}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getCategoryEmoji={getCategoryEmoji}
            />
          );
        })}
      </View>
    );
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value + interpolate(
            animatedPage.value,
            [0, totalPages - 1],
            [0, -(totalPages - 1) * screenWidth]
          ),
        },
      ],
    };
  });

  // Create animated styles for pagination dots - moved outside of conditional
  const dotAnimatedStyles = useMemo(() => {
    return Array.from({ length: totalPages }).map((_, index) => {
      // We'll create the animated style in the render
      return index;
    });
  }, [totalPages]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.pagesContainer, containerAnimatedStyle]}>
          {Array.from({ length: totalPages }).map((_, index) => renderPage(index))}
        </Animated.View>
      </GestureDetector>

      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
            onPress={goToPreviousPage}
            disabled={currentPage === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.paginationButtonText, currentPage === 0 && styles.paginationButtonTextDisabled]}>
              ‹
            </Text>
          </TouchableOpacity>

          <View style={styles.pageIndicatorContainer}>
            {dotAnimatedStyles.map((index) => (
              <PaginationDot
                key={index}
                index={index}
                currentPage={currentPage}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
            onPress={goToNextPage}
            disabled={currentPage === totalPages - 1}
            activeOpacity={0.7}
          >
            <Text style={[styles.paginationButtonText, currentPage === totalPages - 1 && styles.paginationButtonTextDisabled]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Separate component for pagination dot to use hooks properly
interface PaginationDotProps {
  index: number;
  currentPage: number;
}

function PaginationDot({ index, currentPage }: PaginationDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = index === currentPage;
    const width = withTiming(isActive ? 24 : 8, { duration: 300 });
    const opacity = withTiming(isActive ? 1 : 0.4, { duration: 300 });
    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.pageDot,
        index === currentPage && styles.pageDotActive,
        animatedStyle,
      ]}
    />
  );
}

// Separate component for transaction card to use hooks properly
interface TransactionCardProps {
  transaction: Transaction;
  pageIndex: number;
  animatedPage: Animated.SharedValue<number>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  getCategoryEmoji: (categoryName: string) => string;
}

function TransactionCard({
  transaction,
  pageIndex,
  animatedPage,
  formatCurrency,
  formatDate,
  getCategoryEmoji,
}: TransactionCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(animatedPage.value - pageIndex);
    const opacity = interpolate(
      distance,
      [0, 0.5, 1],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      distance,
      [0, 1],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    return {
      opacity: withTiming(opacity, { duration: 300 }),
      transform: [{ scale: withTiming(scale, { duration: 300 }) }],
    };
  });

  return (
    <Animated.View style={[styles.transactionCard, animatedStyle]}>
      <View style={styles.transactionLeft}>
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryEmoji}>
            {getCategoryEmoji(transaction.mainCategoryName)}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pagesContainer: {
    flexDirection: 'row',
    width: screenWidth * 10,
  },
  page: {
    width: screenWidth - 40,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
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
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    marginTop: 8,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  paginationButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  paginationButtonTextDisabled: {
    color: colors.textSecondary,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  pageDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  pageDotActive: {
    backgroundColor: colors.primary,
  },
});
