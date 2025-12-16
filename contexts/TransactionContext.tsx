
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { saveTransaction } from '@/lib/transactions';

export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'debit' | 'credit' | 'cash';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  mainCategoryId: string;
  mainCategoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  paymentMethod: PaymentMethod;
  date: Date;
  createdAt: Date;
  installments?: number;
  installmentNumber?: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'mainCategoryName' | 'subcategoryName'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getMonthlyTransactions: (year: number, month: number) => Transaction[];
  getMonthlyTotal: (year: number, month: number, type?: TransactionType) => number;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) {
      console.log('No user, skipping transaction load');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading transactions for user:', user.id);

      // Query transactions directly - the table already has main_category_name and subcategory_name columns
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        throw error;
      }

      console.log('Loaded transactions:', data?.length);
      console.log('Sample transaction:', data?.[0]);

      // Transform database transactions to app format
      const transformedTransactions: Transaction[] = (data || []).map((t: any) => ({
        id: t.id,
        amount: parseFloat(t.amount),
        description: t.description || '',
        type: t.type as TransactionType,
        mainCategoryId: t.main_category_id || '',
        mainCategoryName: t.main_category_name || 'Sin categoría',
        subcategoryId: t.subcategory_id || '',
        subcategoryName: t.subcategory_name || 'Sin subcategoría',
        paymentMethod: (t.payment_method_type || 'cash') as PaymentMethod,
        date: new Date(t.date || t.created_at),
        createdAt: new Date(t.created_at),
        installments: t.installments || undefined,
        installmentNumber: t.installment_number || undefined,
      }));

      console.log('Transformed transactions:', transformedTransactions.length);
      console.log('Sample transformed:', transformedTransactions[0]);

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    await loadTransactions();
  };

  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'mainCategoryName' | 'subcategoryName'>
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[TransactionContext] Adding transaction:', transaction);

      // Format date as YYYY-MM-DD
      const dateStr = transaction.date.toISOString().split('T')[0];

      // Use the new transaction library
      await saveTransaction({
        userId: user.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: dateStr,
        subcategoryId: transaction.subcategoryId,
        paymentMethodType: transaction.paymentMethod,
        installments: transaction.installments,
        workspaceId: null, // Will be auto-fetched by the library
      });

      console.log('[TransactionContext] Transaction added successfully');

      // Reload transactions to get the updated list
      await loadTransactions();
    } catch (error) {
      console.error('[TransactionContext] Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Deleting transaction:', id);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }

      console.log('Transaction deleted successfully');
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const getMonthlyTransactions = (year: number, month: number): Transaction[] => {
    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    console.log(`Monthly transactions for ${year}-${month}:`, filtered.length);
    return filtered;
  };

  const getMonthlyTotal = (
    year: number,
    month: number,
    type?: TransactionType
  ): number => {
    const monthlyTransactions = getMonthlyTransactions(year, month);
    const total = monthlyTransactions
      .filter((t) => !type || t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
    console.log(`Monthly total for ${year}-${month} (${type || 'all'}):`, total);
    return total;
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        addTransaction,
        deleteTransaction,
        getMonthlyTransactions,
        getMonthlyTotal,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
