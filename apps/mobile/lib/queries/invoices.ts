import { useQuery } from '@tanstack/react-query';
import type {
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
