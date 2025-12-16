
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
    console.log('[TransactionContext] Auth state changed:', {
      hasUser: !!user,
      authLoading,
    });

    if (!authLoading && user) {
      console.log('[TransactionContext] Loading transactions for user:', user.id);
      loadTransactions();
    } else if (!authLoading && !user) {
      console.log('[TransactionContext] No user, clearing transactions');
      setTransactions([]);
    }
  }, [user, authLoading]);

  const loadTransactions = async () => {
    if (!user) {
      console.log('[TransactionContext] No user, skipping transaction load');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[TransactionContext] Loading transactions for user:', user.id);

      // Query transactions directly - the table already has main_category_name and subcategory_name columns
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('[TransactionContext] Error loading transactions:', error);
        throw error;
      }

      console.log('[TransactionContext] Loaded transactions count:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('[TransactionContext] Sample transaction:', JSON.stringify(data[0], null, 2));
      }

      // Transform database transactions to app format
      const transformedTransactions: Transaction[] = (data || []).map((t: any) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        const transactionDate = t.date ? new Date(t.date) : new Date(t.created_at);
        
        return {
          id: t.id,
          amount: amount,
          description: t.description || '',
          type: t.type as TransactionType,
          mainCategoryId: t.main_category_id || '',
          mainCategoryName: t.main_category_name || 'Sin categoría',
          subcategoryId: t.subcategory_id || '',
          subcategoryName: t.subcategory_name || 'Sin subcategoría',
          paymentMethod: (t.payment_method_type || 'cash') as PaymentMethod,
          date: transactionDate,
          createdAt: new Date(t.created_at),
          installments: t.installments || undefined,
          installmentNumber: t.installment_number || undefined,
        };
      });

      console.log('[TransactionContext] Transformed transactions count:', transformedTransactions.length);
      
      if (transformedTransactions.length > 0) {
        console.log('[TransactionContext] Sample transformed transaction:', JSON.stringify({
          id: transformedTransactions[0].id,
          amount: transformedTransactions[0].amount,
          type: transformedTransactions[0].type,
          description: transformedTransactions[0].description,
          date: transformedTransactions[0].date.toISOString(),
        }, null, 2));
      }

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('[TransactionContext] Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    console.log('[TransactionContext] Refreshing transactions...');
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
      console.log('[TransactionContext] Deleting transaction:', id);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[TransactionContext] Error deleting transaction:', error);
        throw error;
      }

      console.log('[TransactionContext] Transaction deleted successfully');
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('[TransactionContext] Error deleting transaction:', error);
      throw error;
    }
  };

  const getMonthlyTransactions = (year: number, month: number): Transaction[] => {
    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      const txYear = date.getFullYear();
      const txMonth = date.getMonth();
      return txYear === year && txMonth === month;
    });
    
    console.log(`[TransactionContext] Monthly transactions for ${year}-${month + 1}:`, filtered.length);
    console.log(`[TransactionContext] Total transactions available:`, transactions.length);
    
    if (filtered.length > 0) {
      console.log('[TransactionContext] Sample monthly transaction:', {
        amount: filtered[0].amount,
        type: filtered[0].type,
        date: filtered[0].date.toISOString(),
      });
    }
    
    return filtered;
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
    
    const total = filteredTransactions.reduce((sum, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    console.log(`[TransactionContext] Monthly total for ${year}-${month + 1} (${type || 'all'}):`, total);
    console.log(`[TransactionContext] Transactions counted:`, filteredTransactions.length);
    
    return total;
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

  console.log('[TransactionContext] Rendering with state:', {
    transactionCount: transactions.length,
    isLoading,
  });

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
