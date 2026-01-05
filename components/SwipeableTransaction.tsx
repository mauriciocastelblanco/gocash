
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
  resetSwipe: () => void;
}

const BUTTON_WIDTH = 90;
const BUTTONS_TOTAL_WIDTH = BUTTON_WIDTH * 2 + 8; // 2 buttons + gap

export const SwipeableTransaction = forwardRef<SwipeableTransactionRef, SwipeableTransactionProps>(
  ({ transaction, onEdit, onDelete, formatCurrency, formatDate }, ref) => {
    const buttonsTranslateX = useSharedValue(BUTTONS_TOTAL_WIDTH);
    const isOpen = useSharedValue(false);

    const resetSwipe = () => {
      buttonsTranslateX.value = withSpring(BUTTONS_TOTAL_WIDTH, { damping: 20, stiffness: 300 });
      isOpen.value = false;
    };

    useImperativeHandle(ref, () => ({
      resetSwipe,
    }));

    const triggerHaptic = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        // Swiping left (negative translation) reveals buttons
        if (event.translationX < 0) {
          const newValue = BUTTONS_TOTAL_WIDTH + event.translationX;
          buttonsTranslateX.value = Math.max(0, newValue);
        } else if (isOpen.value) {
          // Swiping right when open hides buttons
          const newValue = event.translationX;
          buttonsTranslateX.value = Math.min(BUTTONS_TOTAL_WIDTH, newValue);
        }
      })
      .onEnd(() => {
        // If swiped more than halfway, open fully
        if (buttonsTranslateX.value < BUTTONS_TOTAL_WIDTH / 2) {
          buttonsTranslateX.value = withSpring(0, { damping: 20, stiffness: 300 });
          isOpen.value = true;
          runOnJS(triggerHaptic)();
        } else {
          // Otherwise close
          buttonsTranslateX.value = withSpring(BUTTONS_TOTAL_WIDTH, { damping: 20, stiffness: 300 });
          isOpen.value = false;
        }
      });

    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: buttonsTranslateX.value }],
    }));

    const handleEdit = () => {
      onEdit(transaction);
      // Don't reset immediately - let parent handle it after save
    };

    const handleDelete = () => {
      resetSwipe();
      onDelete(transaction);
    };

    return (
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          {/* Action buttons - positioned behind the card */}
          <Animated.View style={[styles.actionsContainer, buttonsAnimatedStyle]}>
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
          </Animated.View>

          {/* Transaction card - static, stays in place */}
          <View style={styles.transactionCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.categoryIcon}>{transaction.icon || '💰'}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.description} numberOfLines={1}>
                {transaction.description}
              </Text>
              <Text style={styles.category} numberOfLines={1}>
                {transaction.main_category}
                {transaction.subcategory ? ` > ${transaction.subcategory}` : ''}
              </Text>
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text
                style={[
                  styles.amount,
                  transaction.type === 'income' ? styles.income : styles.expense,
                ]}
              >
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </Text>
              {transaction.installment_total && transaction.installment_total > 1 && (
                <Text style={styles.installment}>
                  {transaction.installment_current}/{transaction.installment_total}
                </Text>
              )}
            </View>
          </View>
        </View>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    height: 96,
  },
  transactionCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  actionButton: {
    width: BUTTON_WIDTH,
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  income: {
    color: colors.primary,
  },
  expense: {
    color: '#FF4444',
  },
  installment: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
