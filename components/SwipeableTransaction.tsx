
import React, { useImperativeHandle, forwardRef } from 'react';
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

const BUTTON_WIDTH = 130;

export const SwipeableTransaction = forwardRef<SwipeableTransactionRef, SwipeableTransactionProps>(
  ({ transaction, onEdit, onDelete, formatCurrency, formatDate }, ref) => {
    const translateX = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      close: () => {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
      },
    }));

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        const newTranslateX = event.translationX;
        if (newTranslateX < 0 && newTranslateX > -BUTTON_WIDTH) {
          translateX.value = newTranslateX;
        }
      })
      .onEnd((event) => {
        if (event.translationX < -BUTTON_WIDTH / 2) {
          translateX.value = withSpring(-BUTTON_WIDTH, {
            damping: 20,
            stiffness: 90,
          });
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        } else {
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 90,
          });
        }
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    return (
      <View style={styles.container}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(transaction)}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(transaction)}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, animatedStyle]}>
            <View style={styles.cardContent}>
              <View style={styles.leftContent}>
                <Text style={styles.icon}>{transaction.icon || '💰'}</Text>
                <View style={styles.textContent}>
                  <Text style={styles.description}>{transaction.description}</Text>
                  <Text style={styles.category}>
                    {transaction.main_category}
                    {transaction.subcategory && ` > ${transaction.subcategory}`}
                  </Text>
                  <Text style={styles.date}>{formatDate(transaction.date)}</Text>
                </View>
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
            </View>
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
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    width: BUTTON_WIDTH,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  category: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 2,
  },
  date: {
    color: '#666666',
    fontSize: 12,
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
    color: '#FF6B6B',
  },
});
