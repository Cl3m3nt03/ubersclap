import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import {
  BILLING_INTERVALS,
  PLAN_TIERS,
  roleCan,
  subscriptionStatusFromStripe,
  type BillingInterval,
  type BillingPlanOption,
  type HostedBillingSession,
  type MembershipRole,
  type PlanTier,
  type StartCheckoutInput,
  type SubscriptionState,
} from '@ubersclap/shared';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import {
  billingEvents,
  organizationMemberships,
  organizations,
  subscriptions,
  users,
} from '../database/schema';
import { StripeService } from './stripe.service';

type SubscriptionRow = typeof subscriptions.$inferSelect;

/**
 * Abonnement de l'organisation : consultation, souscription, et mise a jour
 * depuis les webhooks du prestataire.
 *
 * Regle de repartition : c'est Stripe qui decide de l'etat du paiement, c'est
 * la base qui decide de l'acces. Une route ne modifie donc JAMAIS le tier
 * directement — elle envoie le chauffeur vers Checkout, et seul le webhook
 * recopie le resultat. Un tier change en optimiste a la fin du passage en
 * caisse donnerait un acces BUSINESS a un paiement qui echoue ensuite.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly stripe: StripeService,
  ) {}

  // ------------------------------------------------------------- Lecture

  async getState(driverId: string): Promise<SubscriptionState> {
    const { subscription } = await this.resolveOrganization(driverId);
    return this.serialize(subscription);
  }

  /**
   * Offres achetables, avec leur prix tel que Stripe le connait.
   *
   * Les montants sont lus chez Stripe a chaque appel plutot que dupliques
   * ici : un prix affiche par l'app qui differe du prix debite serait, au
   * mieux, un litige. Si Stripe est injoignable, l'offre est renvoyee sans
   * montant plutot que de faire echouer l'ecran entier.
   */
  async listPlans(): Promise<BillingPlanOption[]> {
    const options: BillingPlanOption[] = [];

    for (const tier of PLAN_TIERS) {
      for (const interval of BILLING_INTERVALS) {
        const priceId = this.stripe.priceIdFor(tier, interval);

        if (!priceId || !this.stripe.isConfigured) {
          options.push({
            tier,
            interval,
            available: false,
            amountCents: null,
            currency: null,
          });
          continue;
        }

        try {
          const price = await this.stripe.requireClient().prices.retrieve(priceId);
          options.push({
            tier,
            interval,
            available: price.active,
            amountCents: price.unit_amount,
            currency: price.currency,
          });
        } catch (error) {
          this.logger.error(
            `Tarif ${priceId} illisible chez Stripe : ${(error as Error).message}`,
          );
          options.push({
            tier,
            interval,
            available: false,
            amountCents: null,
            currency: null,
          });
        }
      }
    }

    return options;
  }

  // ---------------------------------------------------------- Souscription

  /**
   * Ouvre un passage en caisse heberge par Stripe.
   *
   * Checkout plutot qu'un formulaire maison : aucune donnee bancaire ne
   * traverse notre serveur, donc rien a securiser ni a auditer de ce cote
   * (PAYMENT_AND_BILLING.md). L'app n'a qu'une URL a ouvrir.
   */
  async startCheckout(
    driverId: string,
    input: StartCheckoutInput,
  ): Promise<HostedBillingSession> {
    const { organization, subscription, role } =
      await this.resolveOrganization(driverId);
    this.requireBillingAdmin(role);

    const priceId = this.stripe.priceIdFor(input.tier, input.interval);
    if (!priceId) {
      throw new BadRequestException({
        message: "Cette offre n'est pas disponible",
        code: 'PLAN_NOT_AVAILABLE',
      });
    }

    const customerId = await this.ensureCustomer(driverId, organization.id, subscription);

    const session = await this.stripe.requireClient().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: this.stripe.returnUrl('success'),
      cancel_url: this.stripe.returnUrl('cancel'),
      // L'organisation est portee par la session ET par l'abonnement : le
      // webhook `customer.subscription.*` ne voit pas la session, il n'a que
      // ces metadonnees pour savoir quel compte mettre a jour.
      client_reference_id: organization.id,
      subscription_data: { metadata: { organizationId: organization.id } },
      metadata: { organizationId: organization.id },
    });

    if (!session.url) {
      // Ne devrait pas arriver en mode `subscription` ; sans URL l'app n'a
      // rien a ouvrir, autant le dire clairement.
      throw new BadRequestException({
        message: "Le paiement n'a pas pu être ouvert",
        code: 'CHECKOUT_UNAVAILABLE',
      });
    }

    return { url: session.url };
  }

  /**
   * Portail client Stripe : moyen de paiement, factures, resiliation.
   *
   * On ne redeveloppe aucun de ces ecrans. Ils sont fournis, conformes, et
   * traduits ; les refaire serait du travail pur perte sur un chemin ou la
   * moindre erreur touche a l'argent du chauffeur.
   */
  async openPortal(driverId: string): Promise<HostedBillingSession> {
    const { subscription, role } = await this.resolveOrganization(driverId);
    this.requireBillingAdmin(role);

    if (!subscription.stripeCustomerId) {
      throw new BadRequestException({
        message: "Aucun abonnement payant à gérer pour l'instant",
        code: 'NO_BILLING_ACCOUNT',
      });
    }

    const session = await this.stripe
      .requireClient()
      .billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: this.stripe.returnUrl('portal'),
      });

    return { url: session.url };
  }

  // -------------------------------------------------------------- Webhooks

  /**
   * Applique un evenement Stripe, une seule fois.
   *
   * L'insertion dans `billing_events` sert de verrou : Stripe livre « au moins
   * une fois » et rejoue en cas de timeout. Un `invoice.paid` rejoue apres une
   * resiliation rouvrirait l'acces d'un compte resilie.
   */
  async handleEvent(event: Stripe.Event): Promise<{ processed: boolean }> {
    const inserted = await this.db
      .insert(billingEvents)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: billingEvents.id });

    if (inserted.length === 0) {
      this.logger.log(`Evenement ${event.id} deja traite, ignore.`);
      return { processed: false };
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        // La session ne porte pas l'etat de l'abonnement, seulement son
        // identifiant : on relit l'abonnement chez Stripe plutot que de
        // supposer « paye ». Un paiement peut rester en attente.
        const session = event.data.object;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          const subscription = await this.stripe
            .requireClient()
            .subscriptions.retrieve(subscriptionId);
          await this.syncSubscription(subscription);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.syncSubscription(event.data.object);
        break;

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        // Ces evenements ne portent pas le statut de l'abonnement lui-meme.
        // On relit l'abonnement pour eviter de deduire un etat a la main.
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subscriptionId) {
          const subscription = await this.stripe
            .requireClient()
            .subscriptions.retrieve(subscriptionId);
          await this.syncSubscription(subscription);
        }
        break;
      }

      default:
        // Le tableau de bord Stripe peut envoyer plus d'evenements que ceux
        // qu'on traite. On accuse reception : renvoyer une erreur ferait
        // retenter Stripe en boucle sur un evenement qui ne nous concerne pas.
        this.logger.log(`Evenement ${event.type} ignore (non gere).`);
    }

    return { processed: true };
  }

  /**
   * Recopie l'abonnement Stripe dans notre base.
   *
   * L'organisation est retrouvee par les metadonnees, sinon par le client
   * Stripe : les deux chemins existent parce qu'un abonnement cree a la main
   * dans le tableau de bord n'a pas de metadonnees.
   */
  private async syncSubscription(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const row = await this.findSubscriptionRow(stripeSubscription);

    if (!row) {
      this.logger.error(
        `Abonnement Stripe ${stripeSubscription.id} sans organisation connue — ignore.`,
      );
      return;
    }

    const item = stripeSubscription.items.data[0];
    const priceId = item?.price?.id ?? null;
    const plan = priceId ? this.stripe.planForPriceId(priceId) : null;

    // Un tarif inconnu ne doit pas degrader l'abonnement : on garde le tier
    // en place et on laisse la trace dans les logs (cf. planForPriceId).
    const tier: PlanTier = plan?.tier ?? row.tier;
    const interval: BillingInterval | null = plan?.interval ?? row.billingInterval as BillingInterval | null;

    const status = subscriptionStatusFromStripe(stripeSubscription.status);
    const periodEnd = item?.current_period_end ?? null;

    await this.db
      .update(subscriptions)
      .set({
        tier,
        status,
        // Un abonnement resilie retombe en SOLO a l'expiration, mais le tier
        // reste celui paye tant que la periode court : couper l'acces le jour
        // de la resiliation ferait perdre du temps deja paye.
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId:
          typeof stripeSubscription.customer === 'string'
            ? stripeSubscription.customer
            : stripeSubscription.customer.id,
        stripePriceId: priceId,
        billingInterval: interval,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, row.id));

    this.logger.log(
      `Abonnement ${row.organizationId} → ${tier} / ${status}` +
        (stripeSubscription.cancel_at_period_end ? ' (résiliation programmée)' : ''),
    );
  }

  private async findSubscriptionRow(
    stripeSubscription: Stripe.Subscription,
  ): Promise<SubscriptionRow | undefined> {
    const organizationId = stripeSubscription.metadata?.organizationId;

    if (organizationId) {
      const byOrg = await this.db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, organizationId),
      });
      if (byOrg) return byOrg;
    }

    const customerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer.id;

    return this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeCustomerId, customerId),
    });
  }

  // --------------------------------------------------------------- Outils

  /**
   * Cree le client Stripe de l'organisation si besoin, et le memorise.
   *
   * Un client par organisation, pas par passage en caisse : deux clients pour
   * le meme compte dispersent l'historique de facturation et rendent le
   * portail incapable d'afficher les factures passees.
   */
  private async ensureCustomer(
    driverId: string,
    organizationId: string,
    subscription: SubscriptionRow,
  ): Promise<string> {
    if (subscription.stripeCustomerId) return subscription.stripeCustomerId;

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, driverId),
    });

    const customer = await this.stripe.requireClient().customers.create({
      email: user?.email,
      name: user ? `${user.firstName} ${user.lastName}` : undefined,
      metadata: { organizationId },
    });

    await this.db
      .update(subscriptions)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscription.id));

    return customer.id;
  }

  /**
   * Organisation, role et abonnement du chauffeur connecte.
   *
   * Tout part de l'utilisateur authentifie (ADR-007) : aucun identifiant
   * d'organisation n'est accepte depuis la requete, sinon un chauffeur pourrait
   * ouvrir le portail de facturation d'une autre societe.
   */
  private async resolveOrganization(driverId: string): Promise<{
    organization: typeof organizations.$inferSelect;
    subscription: SubscriptionRow;
    role: MembershipRole;
  }> {
    const membership = await this.db.query.organizationMemberships.findFirst({
      where: eq(organizationMemberships.userId, driverId),
    });

    if (!membership) {
      // Comptes anterieurs a ADR-015 : ils n'ont pas d'organisation. Message
      // explicite plutot qu'un 500 illisible.
      throw new NotFoundException({
        message: "Aucune organisation rattachée à ce compte",
        code: 'ORGANIZATION_NOT_FOUND',
      });
    }

    const organization = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, membership.organizationId),
    });
    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, membership.organizationId),
    });

    if (!organization || !subscription) {
      throw new NotFoundException({
        message: 'Abonnement introuvable',
        code: 'SUBSCRIPTION_NOT_FOUND',
      });
    }

    return {
      organization,
      subscription,
      role: membership.role as MembershipRole,
    };
  }

  /** Seul un role portant `billing:manage` touche a l'argent (ADR-015). */
  private requireBillingAdmin(role: MembershipRole): void {
    if (!roleCan(role, 'billing:manage')) {
      throw new ForbiddenException({
        message: "Seul un administrateur peut gérer l'abonnement",
        code: 'BILLING_FORBIDDEN',
      });
    }
  }

  private serialize(row: SubscriptionRow): SubscriptionState {
    return {
      tier: row.tier,
      status: row.status,
      interval: (row.billingInterval as BillingInterval | null) ?? null,
      currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      hasPaymentMethod: row.stripeSubscriptionId !== null,
    };
  }
}
