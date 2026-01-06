
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';

interface CategoryExpense {
  category: string;
  icon: string;
  amount: number;
  color?: string;
}

interface ExpenseChartProps {
  data?: CategoryExpense[];
  expenses?: CategoryExpense[];
  total?: number;
  formatCurrency?: (amount: number) => string;
}

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C41A'
];

export function ExpenseChart({ data, expenses, total, formatCurrency }: ExpenseChartProps) {
  const chartData = data || expenses || [];
  
  console.log('ExpenseChart - Received data:', chartData);
  console.log('ExpenseChart - Data length:', chartData.length);
  
  if (!chartData || chartData.length === 0) {
    console.log('ExpenseChart - Showing empty state');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay gastos este mes</Text>
      </View>
    );
  }

  console.log('ExpenseChart - Rendering chart with data');

  const defaultFormatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const currencyFormatter = formatCurrency || defaultFormatCurrency;

  // Calculate total if not provided
  const totalAmount = total || chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos por Categoría</Text>
      
      {/* Simple bar chart representation */}
      <View style={styles.chartContainer}>
        {chartData.map((item, index) => {
          const percentage = (item.amount / totalAmount) * 100;
          const color = item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barLabelContainer}>
                <Text style={styles.barLabel}>
                  {item.icon} {item.category}
                </Text>
                <Text style={styles.barAmount}>
                  {currencyFormatter(item.amount)}
                </Text>
              </View>
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      width: `${percentage}%`,
                      backgroundColor: color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barPercentage}>{percentage.toFixed(1)}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground || '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text || '#FFFFFF',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: colors.cardBackground || '#1E1E1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textSecondary || '#999',
    fontSize: 14,
  },
  chartContainer: {
    gap: 16,
  },
  barContainer: {
    gap: 4,
  },
  barLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text || '#FFFFFF',
  },
  barAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary || '#52DF68',
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.card || '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPercentage: {
    fontSize: 12,
    color: colors.textSecondary || '#999',
    textAlign: 'right',
  },
});
