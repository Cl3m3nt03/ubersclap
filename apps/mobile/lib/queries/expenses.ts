import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateExpenseInput, Expense } from '@ubersclap/shared';

import { apiRequest } from '../api';
import { mutationKeys, queryKeys } from './keys';

export interface ExpenseFilters {
  from?: string;
  to?: string;
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.expenses(filters),
    queryFn: () => apiRequest<Expense[]>('/expenses', { query: { ...filters } }),
  });
}

/**
 * `mutationFn` et `onSuccess` vivent dans `registerMutationDefaults` (ADR-011) :
 * une depense notee hors-ligne, a la pompe ou au peage, doit pouvoir etre
 * rejouee apres un redemarrage. Le hook ne fournit que la cle.
 */
export function useCreateExpense() {
  return useMutation<Expense, unknown, CreateExpenseInput>({
    mutationKey: mutationKeys.createExpense,
  });
}
