import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    /**
     * Conserve le corps brut de chaque requete en plus du JSON parse.
     *
     * Necessaire aux webhooks de paiement : la signature Stripe porte sur les
     * octets exacts recus, et un corps re-serialise depuis l'objet parse ne la
     * verifie plus. Sans ce drapeau, `/v1/billing/webhook` refuse tout.
     */
    rawBody: true,
  });

  // ADR-010 : toutes les routes sont sous /v1. Pas de /api en plus — le nom
  // de domaine dit deja que c'est une API.
  app.setGlobalPrefix('v1');

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  new Logger('Bootstrap').log(`API à l'écoute sur http://localhost:${port}/v1`);
}

void bootstrap();
