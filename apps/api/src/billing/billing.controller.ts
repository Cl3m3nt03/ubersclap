import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Headers,
  BadRequestException,
  type RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { startCheckoutSchema, type StartCheckoutInput } from '@cadance/shared';

import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { CurrentDriverId } from '../auth/current-driver.decorator';
import { Public } from '../auth/public.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Etat de l'abonnement de l'organisation du chauffeur connecte. */
  @Get('subscription')
  subscription(@CurrentDriverId() driverId: string) {
    return this.billing.getState(driverId);
  }

  /**
   * Offres et prix, lus chez le prestataire.
   *
   * L'app n'affiche jamais un prix ecrit en dur : c'est cette route qui le
   * donne, donc changer un tarif dans Stripe suffit — pas de mise a jour de
   * l'app sur les stores.
   */
  @Get('plans')
  plans() {
    return this.billing.listPlans();
  }

  /**
   * Ouvre un passage en caisse. Renvoie une URL que l'app ouvre dans le
   * navigateur ; le changement de tier n'arrive qu'au webhook.
   */
  @Post('checkout')
  @HttpCode(200)
  checkout(
    @CurrentDriverId() driverId: string,
    @Body(new ZodValidationPipe(startCheckoutSchema)) input: StartCheckoutInput,
  ) {
    return this.billing.startCheckout(driverId, input);
  }

  /** Portail client : moyen de paiement, factures, resiliation. */
  @Post('portal')
  @HttpCode(200)
  portal(@CurrentDriverId() driverId: string) {
    return this.billing.openPortal(driverId);
  }
}

/**
 * Webhooks du prestataire de paiement.
 *
 * Controleur separe pour deux raisons qui ne s'appliquent qu'a lui : la route
 * est `@Public()` — Stripe n'a pas de jeton utilisateur, l'authentification est
 * la signature — et elle a besoin du corps BRUT, la signature portant sur les
 * octets exacts. Un corps deja parse puis re-serialise ne verifie plus.
 */
@Controller('billing/webhook')
export class BillingWebhookController {
  constructor(
    private readonly billing: BillingService,
    private readonly stripe: StripeService,
  ) {}

  /**
   * Pas de limite de debit : une rafale d'evenements legitimes (fin de mois,
   * renouvellements groupes) ne doit pas etre rejetee. La signature filtre
   * deja tout ce qui ne vient pas de Stripe.
   */
  @Public()
  @SkipThrottle()
  @Post()
  @HttpCode(200)
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    if (!request.rawBody) {
      // Signifie que `rawBody: true` a disparu de main.ts : sans le corps brut
      // aucune signature n'est verifiable, donc on refuse plutot que de faire
      // confiance au corps parse.
      throw new BadRequestException({
        message: 'Corps brut indisponible',
        code: 'RAW_BODY_UNAVAILABLE',
      });
    }

    const event = this.stripe.constructEvent(request.rawBody, signature);
    return this.billing.handleEvent(event);
  }
}
