
import { supabase } from '@/app/integrations/supabase/client';

/**
 * Get user's active workspace ID
 */
export const getUserActiveWorkspace = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('user_active_workspace')
      .select('active_workspace_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getUserActiveWorkspace] Error:', error);
      return null;
    }

    return data?.active_workspace_id || null;
  } catch (error) {
    console.error('[getUserActiveWorkspace] Exception:', error);
    return null;
  }
};

/**
 * Crear una transacción simple (sin cuotas)
 */
export const createTransaction = async ({
  userId,
  type,
  amount,
  description,
  date,
  subcategoryId,
  paymentMethodType,
  workspaceId,
}: {
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string; // 'YYYY-MM-DD'
  subcategoryId?: string | null;
  paymentMethodType?: 'debit' | 'credit' | 'cash';
  workspaceId?: string | null;
}) => {
  console.log('[createTransaction] Creating:', { type, amount, description, workspaceId });

  // Get workspace_id if not provided
  let finalWorkspaceId = workspaceId;
  if (!finalWorkspaceId) {
    finalWorkspaceId = await getUserActiveWorkspace(userId);
    console.log('[createTransaction] Using active workspace:', finalWorkspaceId);
  }

  const { data, error } = await supabase.rpc('insert_transaction_with_subcategory', {
    p_user_id: userId,
    p_type: type,
    p_amount: amount,
    p_description: description,
    p_date: date,
    p_subcategory_id: subcategoryId || null,
    p_payment_method_type: paymentMethodType || 'debit',
    p_source: 'mobile_app',
    p_workspace_id: finalWorkspaceId,
  });

  if (error) {
    console.error('[createTransaction] Error:', error);
    throw error;
  }

  console.log('[createTransaction] Success');
  return data;
};

/**
 * Crear una transacción con cuotas (tarjeta de crédito)
 */
export const createTransactionWithInstallments = async ({
  userId,
  totalAmount,
  description,
  date,
  subcategoryId,
  installments,
  workspaceId,
}: {
  userId: string;
  totalAmount: number;
  description: string;
  date: string; // 'YYYY-MM-DD'
  subcategoryId?: string | null;
  installments: number;
  workspaceId?: string | null;
}) => {
  console.log('[createTransactionWithInstallments] Creating:', {
    totalAmount,
    installments,
    perInstallment: totalAmount / installments,
    workspaceId,
  });

  // Get workspace_id if not provided
  let finalWorkspaceId = workspaceId;
  if (!finalWorkspaceId) {
    finalWorkspaceId = await getUserActiveWorkspace(userId);
    console.log('[createTransactionWithInstallments] Using active workspace:', finalWorkspaceId);
  }

  const { data, error } = await supabase.rpc('insert_transaction_with_installments', {
    p_user_id: userId,
    p_type: 'expense',
    p_total_amount: totalAmount,
    p_description: description,
    p_date: date,
    p_subcategory_id: subcategoryId || null,
    p_payment_method_type: 'credit',
    p_installments: installments,
    p_source: 'mobile_app',
    p_workspace_id: finalWorkspaceId,
  });

  if (error) {
    console.error('[createTransactionWithInstallments] Error:', error);
    throw error;
  }

  console.log(
    '[createTransactionWithInstallments] Success - Created',
    installments,
    'installments'
  );
  return data;
};

/**
 * Función helper que decide cuál usar
 */
export const saveTransaction = async (transactionData: {
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string; // 'YYYY-MM-DD'
  subcategoryId?: string | null;
  paymentMethodType?: 'debit' | 'credit' | 'cash';
  installments?: number;
  workspaceId?: string | null;
}) => {
  const {
    userId,
    type,
    amount,
    description,
    date,
    subcategoryId,
    paymentMethodType,
    installments,
    workspaceId,
  } = transactionData;

  // Si es crédito con más de 1 cuota, usar función de cuotas
  if (paymentMethodType === 'credit' && installments && installments > 1) {
    return createTransactionWithInstallments({
      userId,
      totalAmount: amount,
      description,
      date,
      subcategoryId,
      installments,
      workspaceId,
    });
  }

  // Sino, usar función simple
  return createTransaction({
    userId,
    type,
    amount,
    description,
    date,
    subcategoryId,
    paymentMethodType,
    workspaceId,
  });
};
