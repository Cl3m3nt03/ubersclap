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

  /**
   * CORS — pour le navigateur uniquement.
   *
   * L'app native ne connait pas cette regle : elle n'est appliquee que par les
   * navigateurs. Elle devient indispensable des qu'on ouvre l'app en web
   * (`expo start --web`), sinon la requete est bloquee AVANT d'etre envoyee et
   * le client la lit comme une panne reseau — « Pas de connexion » sur un
   * serveur qui repond parfaitement.
   *
   * Ouvert a tout en developpement, restreint a une liste explicite des qu'une
   * origine est configuree : un `*` en production laisserait n'importe quel
   * site appeler l'API avec les jetons d'un chauffeur.
   */
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    // Les jetons voyagent dans l'en-tete Authorization, pas en cookie : aucun
    // besoin d'autoriser les credentials, et ne pas le faire evite le couple
    // interdit `origin: *` + `credentials: true`.
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'Accept'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  new Logger('Bootstrap').log(`API à l'écoute sur http://localhost:${port}/v1`);
}

void bootstrap();
