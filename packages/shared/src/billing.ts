/**
 * Facturation de l'abonnement — le contrat entre l'app et le prestataire de
 * paiement (Stripe, ADR-015 / PAYMENT_AND_BILLING.md).
 *
 * A ne pas confondre avec les factures du chauffeur a ses clients
 * (`invoices`) : ici c'est NOUS qui facturons le chauffeur. Voir 00_CANON.md,
 * les deux sens du mot « facture » cohabitent dans ce produit.
 *
 * Ce fichier ne connait rien de Stripe hormis la traduction de ses statuts :
 * aucun montant, aucun identifiant de tarif. Les prix vivent dans le tableau
 * de bord Stripe et les identifiants de tarif dans l'environnement du serveur.
 * Changer un prix ne doit jamais demander un deploiement, et surtout pas une
 * mise a jour de l'app sur les stores.
 */

import { z } from 'zod';

import {
  PLAN_TIERS,
  type PlanTier,
  type SubscriptionStatus,
} from './plans';

/** Periodicite de facturation. L'annuel offre deux mois (ADR-015). */
export const BILLING_INTERVALS = ['MONTHLY', 'YEARLY'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const BILLING_INTERVAL_LABEL: Record<BillingInterval, string> = {
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
};

export const startCheckoutSchema = z.object({
  tier: z.enum(PLAN_TIERS),
  interval: z.enum(BILLING_INTERVALS).default('MONTHLY'),
});
export type StartCheckoutInput = z.infer<typeof startCheckoutSchema>;

/**
 * Une offre achetable, telle que le serveur la connait.
 *
 * `priceLabel` et `amountCents` viennent de Stripe, pas du code : le serveur
 * lit le tarif configure et le renvoie tel quel. Une offre dont l'identifiant
 * de tarif n'est pas configure est renvoyee avec `available: false` plutot
 * qu'omise — l'ecran peut ainsi afficher « bientot disponible » au lieu d'une
 * liste vide inexplicable.
 */
export interface BillingPlanOption {
  tier: PlanTier;
  interval: BillingInterval;
  available: boolean;
  amountCents: number | null;
  currency: string | null;
}

/** Etat de l'abonnement de l'organisation, tel que l'app l'affiche. */
export interface SubscriptionState {
  tier: PlanTier;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  /** Fin de la periode courante (essai ou cycle paye). */
  currentPeriodEnd: string | null;
  /** Resilie mais encore actif jusqu'a la fin de la periode payee. */
  cancelAtPeriodEnd: boolean;
  /** Un abonnement payant existe chez le prestataire — le portail est ouvrable. */
  hasPaymentMethod: boolean;
}

/** Redirection vers une page hebergee par le prestataire (Checkout / portail). */
export interface HostedBillingSession {
  url: string;
}

/**
 * Traduction des statuts Stripe vers les notres.
 *
 * Stripe en distingue huit, on en garde quatre : ce qui compte cote produit
 * c'est « l'acces est-il ouvert, menace, ou ferme ? ». Le detail du cycle de
 * vie du paiement appartient a Stripe et au portail client.
 *
 * `incomplete` (le premier paiement n'a jamais abouti) est traite comme impaye
 * et non comme un essai : sinon un abonnement jamais paye donnerait acces.
 */
export function subscriptionStatusFromStripe(status: string): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'CANCELLED';
    default:
      // Statut inconnu = statut futur ajoute par Stripe. On ferme l'acces
      // plutot que de l'ouvrir par defaut sur une valeur qu'on ne comprend pas.
      return 'PAST_DUE';
  }
}
