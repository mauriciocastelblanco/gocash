
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
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

  const pieChartData = chartData.map((item, index) => ({
    name: `${item.icon} ${item.category}`,
    amount: item.amount,
    color: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    legendFontColor: colors.textSecondary || '#999',
    legendFontSize: 12,
  }));

  const defaultFormatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const currencyFormatter = formatCurrency || defaultFormatCurrency;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos por Categoría</Text>
      <PieChart
        data={pieChartData}
        width={Dimensions.get('window').width - 64}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
      <View style={styles.legendContainer}>
        {pieChartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.name}: {currencyFormatter(item.amount)}
            </Text>
          </View>
        ))}
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
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary || '#999',
  },
});
