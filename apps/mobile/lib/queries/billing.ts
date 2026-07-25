import { useQuery } from '@tanstack/react-query';
import type {
  BillingPlanOption,
  HostedBillingSession,
  StartCheckoutInput,
  SubscriptionState,
} from '@cadance/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

/**
 * Abonnement de l'organisation.
 *
 * Lecture en ligne uniquement, sans mise en cache longue : l'etat peut changer
 * hors de l'app (paiement echoue, resiliation depuis le portail Stripe). Un
 * cache persiste afficherait « Actif » a un compte impaye.
 */
export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.subscription(),
    queryFn: () => apiRequest<SubscriptionState>('/billing/subscription'),
    staleTime: 0,
  });
}

/** Offres et prix, tels que le serveur les lit chez Stripe — jamais en dur ici. */
export function useBillingPlans() {
  return useQuery({
    queryKey: queryKeys.billingPlans(),
    queryFn: () => apiRequest<BillingPlanOption[]>('/billing/plans'),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Demarre un paiement et renvoie l'URL a ouvrir.
 *
 * Appel direct et non mutation offline (ADR-011) : payer sans reseau n'a aucun
 * sens, et une intention de paiement enfilee puis rejouee des jours plus tard
 * ouvrirait une caisse que le chauffeur n'attend plus.
 */
export function startCheckout(
  input: StartCheckoutInput,
): Promise<HostedBillingSession> {
  return apiRequest<HostedBillingSession>('/billing/checkout', {
    method: 'POST',
    body: input,
  });
}

/** Portail client : moyen de paiement, factures d'abonnement, resiliation. */
export function openBillingPortal(): Promise<HostedBillingSession> {
  return apiRequest<HostedBillingSession>('/billing/portal', { method: 'POST' });
}
