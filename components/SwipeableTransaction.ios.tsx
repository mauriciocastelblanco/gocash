
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -120;

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

interface SwipeableTransactionProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export interface SwipeableTransactionRef {
  close: () => void;
}

export const SwipeableTransaction = forwardRef<SwipeableTransactionRef, SwipeableTransactionProps>(
  ({ transaction, onEdit, onDelete, formatCurrency, formatDate }, ref) => {
    const translateX = useSharedValue(0);
    const isOpen = useRef(false);

    useImperativeHandle(ref, () => ({
      close: () => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        isOpen.current = false;
      },
    }));

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        const newTranslateX = event.translationX;
        if (newTranslateX < 0) {
          translateX.value = Math.max(newTranslateX, SWIPE_THRESHOLD);
        } else if (isOpen.current) {
          translateX.value = Math.min(newTranslateX + SWIPE_THRESHOLD, 0);
        }
      })
      .onEnd(() => {
        if (translateX.value < SWIPE_THRESHOLD / 2) {
          translateX.value = withSpring(SWIPE_THRESHOLD, { damping: 20, stiffness: 90 });
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          isOpen.current = true;
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
          isOpen.current = false;
        }
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const handleEdit = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      isOpen.current = false;
      setTimeout(() => onEdit(transaction), 100);
    };

    const handleDelete = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      isOpen.current = false;
      setTimeout(() => onDelete(transaction), 100);
    };

    return (
      <View style={styles.container}>
        {/* Action buttons - positioned absolutely with higher z-index and auto pointer events */}
        <View style={styles.actionsContainer} pointerEvents="auto">
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction card - swipeable */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.transactionCard, animatedStyle]}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{transaction.icon || '💰'}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.description}>{transaction.description}</Text>
              <Text style={styles.category}>
                {transaction.main_category}
                {transaction.subcategory ? ` • ${transaction.subcategory}` : ''}
              </Text>
              {transaction.installment_total && transaction.installment_total > 1 && (
                <Text style={styles.installment}>
                  Cuota {transaction.installment_current}/{transaction.installment_total}
                </Text>
              )}
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </View>
            <Text
              style={[
                styles.amount,
                transaction.type === 'income' ? styles.income : styles.expense,
              ]}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    height: 96,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
    zIndex: 100,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  detailsContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  installment: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  income: {
    color: colors.primary,
  },
  expense: {
    color: '#FF4444',
  },
});
