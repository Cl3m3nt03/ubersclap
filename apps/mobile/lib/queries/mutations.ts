import type { QueryClient } from '@tanstack/react-query';
import type {
  ClientRecord,
  Course,
  CourseStatus,
  CreateClientInput,
  CreateCourseInput,
  CreateExpenseInput,
  Expense,
} from '@ubersclap/shared';

import { apiRequest } from '../api';
import { mutationKeys, queryKeys } from './keys';

export interface TransitionCourseInput {
  id: string;
  to: CourseStatus;
  finalPriceInclTaxCents?: number;
}

/**
 * Enregistre la `mutationFn` de chaque mutation persistable (ADR-011).
 *
 * Une mutation creee hors-ligne est mise en pause, serialisee en SQLite, puis
 * rejouee au retour du reseau — parfois apres un redemarrage complet de l'app.
 * A ce moment la, TanStack ne dispose que de la cle et des variables : c'est
 * ici qu'il retrouve la fonction a executer. Les mutations definies uniquement
 * dans un composant (closure perdue au redemarrage) ne pourraient jamais etre
 * rejouees.
 *
 * A appeler une seule fois, avant de restaurer le cache persiste.
 */
export function registerMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(mutationKeys.createCourse, {
    mutationFn: (input: CreateCourseInput) =>
      apiRequest<Course>('/courses', {
        method: 'POST',
        body: input,
        // Cle d'idempotence = ID de la course (ADR-010 + ADR-011). Un rejeu
        // apres coupure porte la meme cle et ne cree pas de doublon.
        idempotencyKey: input.id,
      }),
    onSuccess: () => {
      // Le serveur peut avoir cree le client au passage : les deux listes
      // bougent apres une creation de course.
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  queryClient.setMutationDefaults(mutationKeys.transitionCourse, {
    mutationFn: ({ id, to, finalPriceInclTaxCents }: TransitionCourseInput) =>
      apiRequest<Course>(`/courses/${id}/transitions`, {
        method: 'POST',
        body: { to, finalPriceInclTaxCents },
      }),
    onSuccess: (course: Course) => {
      queryClient.setQueryData(queryKeys.course(course.id), course);
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  queryClient.setMutationDefaults(mutationKeys.createClient, {
    mutationFn: (input: CreateClientInput) =>
      apiRequest<ClientRecord>('/clients', {
        method: 'POST',
        body: input,
        idempotencyKey: input.id,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  queryClient.setMutationDefaults(mutationKeys.createExpense, {
    mutationFn: (input: CreateExpenseInput) =>
      apiRequest<Expense>('/expenses', {
        method: 'POST',
        body: input,
        // Cle d'idempotence = ID de la depense : une depense notee a la pompe
        // sans reseau est rejouee sans doublon au retour de la connexion.
        idempotencyKey: input.id,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
