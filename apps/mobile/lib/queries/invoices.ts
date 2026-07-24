import { useQuery } from '@tanstack/react-query';
import type {
  CourseWithClient,
  CreateInvoiceInput,
  Invoice,
  InvoiceSummary,
} from '@ubersclap/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

/**
 * Liste des factures.
 *
 * On charge tout et on filtre / calcule l'encours cote client : le nombre de
 * factures d'un chauffeur independant reste modeste, et un seul chargement
 * evite de repartir au reseau a chaque changement d'onglet.
 */
export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices(),
    queryFn: () => apiRequest<InvoiceSummary[]>('/invoices'),
  });
}

/**
 * Courses facturables : terminées et pas encore facturées.
 *
 * Sert l'écran de facturation, qui laisse cocher plusieurs courses d'un même
 * client pour une facture groupée (ADR-005). `staleTime` court : dès qu'une
 * facture est émise, ces courses n'en sont plus.
 */
export function useBillableCourses() {
  return useQuery({
    queryKey: queryKeys.billableCourses(),
    queryFn: () => apiRequest<CourseWithClient[]>('/invoices/billable-courses'),
    staleTime: 0,
  });
}

/**
 * Emet une facture.
 *
 * Appel direct, jamais mis dans la file offline (ADR-011) : l'emission attribue
 * un numero legal cote serveur, dans une transaction — elle ne peut pas etre
 * rejouee a l'aveugle depuis un appareil. L'ecran appelant s'assure d'etre en
 * ligne avant d'appeler.
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  return apiRequest<Invoice>('/invoices', { method: 'POST', body: input });
}
