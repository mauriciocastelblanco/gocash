
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
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    console.log('[TransactionContext] Auth state:', {
      hasUser: !!user,
      authLoading,
      userId: user?.id,
    });

    // Only load transactions when we have a user and auth is done loading
    if (!authLoading && user) {
      console.log('[TransactionContext] Loading transactions...');
      loadTransactions();
    } else if (!authLoading && !user) {
      console.log('[TransactionContext] No user, clearing transactions');
      setTransactions([]);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const loadTransactions = async () => {
    if (!user) {
      console.log('[TransactionContext] No user, skipping load');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[TransactionContext] Fetching transactions for user:', user.id);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('[TransactionContext] Error loading transactions:', error);
        // Don't throw, just log and continue
        setTransactions([]);
        return;
      }

      console.log('[TransactionContext] Loaded', data?.length || 0, 'transactions');

      const transformedTransactions: Transaction[] = (data || []).map((t: any) => ({
        id: t.id,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
        description: t.description || '',
        type: t.type as TransactionType,
        mainCategoryId: t.main_category_id || '',
        mainCategoryName: t.main_category_name || 'Sin categoría',
        subcategoryId: t.subcategory_id || '',
        subcategoryName: t.subcategory_name || 'Sin subcategoría',
        paymentMethod: (t.payment_method_type || 'cash') as PaymentMethod,
        date: t.date ? new Date(t.date) : new Date(t.created_at),
        createdAt: new Date(t.created_at),
        installments: t.installments || undefined,
        installmentNumber: t.installment_number || undefined,
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('[TransactionContext] Error:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    console.log('[TransactionContext] Refreshing...');
    await loadTransactions();
  };

  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'mainCategoryName' | 'subcategoryName'>
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[TransactionContext] Adding transaction');

      const dateStr = transaction.date.toISOString().split('T')[0];

      await saveTransaction({
        userId: user.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: dateStr,
        subcategoryId: transaction.subcategoryId,
        paymentMethodType: transaction.paymentMethod,
        installments: transaction.installments,
        workspaceId: null,
      });

      console.log('[TransactionContext] Transaction added');
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
      console.log('[TransactionContext] Deleting transaction:', id);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[TransactionContext] Error deleting:', error);
        throw error;
      }

      console.log('[TransactionContext] Transaction deleted');
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('[TransactionContext] Error:', error);
      throw error;
    }
  };

  const getMonthlyTransactions = (year: number, month: number): Transaction[] => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  const getMonthlyTotal = (
    year: number,
    month: number,
    type?: TransactionType
  ): number => {
    const monthlyTransactions = getMonthlyTransactions(year, month);
    const filteredTransactions = type 
      ? monthlyTransactions.filter((t) => t.type === type)
      : monthlyTransactions;
    
    return filteredTransactions.reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const value = {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    getMonthlyTransactions,
    getMonthlyTotal,
    refreshTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
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
