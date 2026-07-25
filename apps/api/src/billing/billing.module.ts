import { Module } from '@nestjs/common';

import {
  BillingController,
  BillingWebhookController,
} from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

/**
 * Abonnement et paiement (ADR-015).
 *
 * `StripeService` est exporte : la garde de fonctionnalites et, plus tard, la
 * facturation centralisee Business en auront besoin sans reimporter le SDK.
 */
@Module({
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
