import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { BillingInterval, PlanTier } from '@cadance/shared';

/**
 * Acces au prestataire de paiement, et rien d'autre.
 *
 * Tout ce qui est propre a Stripe est isole ici : le reste du module raisonne
 * en tier et en periodicite. Si le prestataire change un jour, c'est ce fichier
 * qui est reecrit, pas la logique d'abonnement.
 *
 * Le service demarre meme SANS cle configuree. C'est volontaire : l'API doit
 * tourner en local et en recette avant que le compte Stripe existe. Les routes
 * de paiement repondent alors 503 `BILLING_NOT_CONFIGURED` — une panne lisible
 * et localisee — au lieu de faire echouer le demarrage de toute l'application.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY absente — les routes de facturation repondront 503.',
      );
      this.client = null;
    } else {
      // Pas de `apiVersion` fixee ici : la version du SDK installe fait foi,
      // ce qui evite un decalage entre les types TypeScript et la version
      // envoyee. La montee de version se fait en mettant a jour le paquet.
      this.client = new Stripe(secretKey);
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** Le client Stripe, ou un 503 explicite si le paiement n'est pas branche. */
  requireClient(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException({
        message: "Le paiement n'est pas encore configuré",
        code: 'BILLING_NOT_CONFIGURED',
      });
    }
    return this.client;
  }

  /**
   * Execute un appel Stripe en traduisant ses erreurs.
   *
   * Indispensable : les erreurs du SDK portent un `statusCode`, que Nest
   * reexpose tel quel. Une cle invalide devenait ainsi un **401** cote client —
   * or le mobile interprete tout 401 comme une session expiree, tente un
   * refresh, puis DECONNECTE le chauffeur. Une erreur de configuration de notre
   * cote ne doit jamais vider la session de l'utilisateur.
   *
   * Le message d'origine reste dans les logs serveur et n'est pas renvoye au
   * client : il contient un fragment de la cle secrete.
   */
  async run<T>(label: string, call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        this.logger.error(
          `Appel Stripe « ${label} » en echec : ${error.type} — ${error.message}`,
        );
        throw new ServiceUnavailableException({
          message: 'Le service de paiement est momentanément indisponible',
          code: 'BILLING_PROVIDER_ERROR',
        });
      }
      throw error;
    }
  }

  /**
   * Identifiant du tarif pour une offre, lu dans l'environnement.
   *
   * Les tarifs ne sont pas dans le code : ADR-015 n'est pas tranchee et les
   * prix bougeront. Un prix en dur imposerait un deploiement de l'API — et une
   * mise a jour de l'app si le mobile l'affichait — pour chaque changement.
   */
  priceIdFor(tier: PlanTier, interval: BillingInterval): string | null {
    return this.config.get<string>(`STRIPE_PRICE_${tier}_${interval}`) ?? null;
  }

  /** Retrouve l'offre correspondant a un tarif Stripe. Inverse de `priceIdFor`. */
  planForPriceId(
    priceId: string,
  ): { tier: PlanTier; interval: BillingInterval } | null {
    const tiers: PlanTier[] = ['SOLO', 'BUSINESS'];
    const intervals: BillingInterval[] = ['MONTHLY', 'YEARLY'];

    for (const tier of tiers) {
      for (const interval of intervals) {
        if (this.priceIdFor(tier, interval) === priceId) {
          return { tier, interval };
        }
      }
    }

    // Tarif inconnu : cree a la main dans Stripe, ou variable d'environnement
    // oubliee au deploiement. On le signale sans deviner un tier.
    this.logger.warn(`Tarif Stripe inconnu : ${priceId}`);
    return null;
  }

  /**
   * Verifie la signature du webhook et renvoie l'evenement.
   *
   * Sans cette verification, n'importe qui connaissant l'URL peut se declarer
   * abonne BUSINESS en envoyant un faux `customer.subscription.updated`. La
   * signature est donc obligatoire, jamais optionnelle en developpement.
   */
  constructEvent(rawBody: Buffer, signature: string | undefined): Stripe.Event {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secret) {
      throw new ServiceUnavailableException({
        message: "Le webhook de paiement n'est pas configuré",
        code: 'BILLING_NOT_CONFIGURED',
      });
    }

    if (!signature) {
      throw new BadRequestException({
        message: 'Signature de webhook manquante',
        code: 'INVALID_WEBHOOK_SIGNATURE',
      });
    }

    try {
      return this.requireClient().webhooks.constructEvent(
        rawBody,
        signature,
        secret,
      );
    } catch (error) {
      this.logger.warn(
        `Signature de webhook invalide : ${(error as Error).message}`,
      );
      throw new BadRequestException({
        message: 'Signature de webhook invalide',
        code: 'INVALID_WEBHOOK_SIGNATURE',
      });
    }
  }

  /**
   * URL de retour apres passage en caisse ou sortie du portail.
   *
   * Ce sont des liens profonds vers l'app (`ubersclap://`), pas des pages web :
   * le paiement s'ouvre depuis le mobile et doit y ramener. Stripe exige une
   * URL absolue, d'ou le repli sur un `https` si rien n'est configure.
   */
  returnUrl(kind: 'success' | 'cancel' | 'portal'): string {
    const key = {
      success: 'BILLING_SUCCESS_URL',
      cancel: 'BILLING_CANCEL_URL',
      portal: 'BILLING_PORTAL_RETURN_URL',
    }[kind];

    return (
      this.config.get<string>(key) ??
      `ubersclap://profil/abonnement?billing=${kind}`
    );
  }
}
