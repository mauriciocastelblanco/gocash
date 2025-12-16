
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'debit' | 'credit' | 'cash';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  category: Category;
  paymentMethod: PaymentMethod;
  date: Date;
  createdAt: Date;
}

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
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
      
      // Transform database transactions to app format
      const transformedTransactions: Transaction[] = (data || []).map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        description: t.description || '',
        type: t.type as TransactionType,
        category: {
          id: t.main_category_id || 'other',
          name: t.main_category_name || 'Otros',
          emoji: '💰',
        },
        paymentMethod: (t.payment_method_type || 'cash') as PaymentMethod,
        date: new Date(t.date || t.created_at),
        createdAt: new Date(t.created_at),
      }));

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

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Adding transaction:', transaction);

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          payment_method_type: transaction.paymentMethod,
          date: transaction.date.toISOString(),
          main_category_name: transaction.category.name,
          affects_balance: true,
          source: 'manual_transaction',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        throw error;
      }

      console.log('Transaction added successfully:', data);
      
      // Reload transactions to get the updated list
      await loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
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
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const getMonthlyTransactions = (year: number, month: number): Transaction[] => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  const getMonthlyTotal = (year: number, month: number, type?: TransactionType): number => {
    const monthlyTransactions = getMonthlyTransactions(year, month);
    return monthlyTransactions
      .filter(t => !type || t.type === type)
      .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : t.amount), 0);
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
