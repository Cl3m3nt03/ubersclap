# Configuration Stripe

Le code est en place et tourne **sans** compte Stripe : tant que
`STRIPE_SECRET_KEY` est absente, l'API démarre normalement et les routes
`/v1/billing/*` répondent `503 BILLING_NOT_CONFIGURED`. Ce document est la
checklist à dérouler le jour où le compte existe. Aucun changement de code n'est
nécessaire.

> ⚠️ **ADR-016** (le nom du produit) est toujours ouvert. Le nom saisi dans
> Stripe apparaît sur les reçus et les factures d'abonnement envoyés aux
> chauffeurs : il est modifiable, mais pas sur les documents déjà émis.

---

## 1. Compte et clés

1. Créer le compte sur dashboard.stripe.com, rester en **mode test** au début
   (les clés `sk_test_...` et les cartes de test suffisent à tout valider).
2. Renseigner l'entité légale et le compte bancaire pour passer en live plus
   tard.
3. Copier la clé secrète dans l'environnement de l'API :

```
STRIPE_SECRET_KEY=sk_test_...
```

La clé publiable n'est **pas** utilisée : le mobile n'affiche aucun formulaire de
paiement, il ouvre une page hébergée par Stripe (Checkout). Rien de bancaire ne
traverse notre serveur ni l'app.

## 2. Produits et tarifs

Créer **un produit par offre**, puis un tarif récurrent par périodicité. Prix
tranchés le 2026-07-25 (ADR-015), annuel = 2 mois offerts :

| Produit    | Périodicité | Montant TTC | Variable d'environnement        |
| ---------- | ----------- | ----------- | ------------------------------- |
| Solo       | mensuel     | 9,99 €      | `STRIPE_PRICE_SOLO_MONTHLY`     |
| Solo       | annuel      | 99,90 €     | `STRIPE_PRICE_SOLO_YEARLY`      |
| Entreprise | mensuel     | 39,99 €     | `STRIPE_PRICE_BUSINESS_MONTHLY` |
| Entreprise | annuel      | 399,90 €    | `STRIPE_PRICE_BUSINESS_YEARLY`  |

Le nom du produit est celui que verra le chauffeur sur son reçu — il dépend
donc d'ADR-016, encore ouvert.

Coller les identifiants `price_...` dans l'environnement. Seuls les tarifs
configurés sont proposés : une offre sans identifiant remonte
`available: false` et n'apparaît pas dans l'app — on peut donc démarrer avec le
seul mensuel.

Points à régler dans Stripe, pas dans le code :

- **Montants** — changer un prix ne demande ni déploiement ni mise à jour de
  l'app : l'écran lit `/v1/billing/plans`, qui interroge Stripe.
- **TVA** — activer Stripe Tax, sinon les reçus d'abonnement seront hors taxes.
- **Période d'essai** — à définir sur le tarif (`trial_period_days`). En base, un
  compte neuf naît déjà `SOLO / TRIALING` sans passer par Stripe.

## 3. Webhook

C'est le webhook, et **lui seul**, qui change le tier en base : le retour de
Checkout ne prouve pas qu'un paiement a abouti. Sans webhook configuré, un
chauffeur peut payer sans que son accès change.

1. Dashboard → Developers → Webhooks → *Add endpoint*.
2. URL : `https://<domaine-api>/v1/billing/webhook`.
3. Événements à envoyer :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copier le secret de signature :

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

En local, avec la CLI Stripe :

```
stripe login
stripe listen --forward-to localhost:3000/v1/billing/webhook
stripe trigger checkout.session.completed
```

`stripe listen` affiche un `whsec_...` **différent** de celui du dashboard —
c'est celui-là qu'il faut en local.

## 4. Portail client

Dashboard → Settings → Billing → Customer portal : activer le portail, autoriser
le changement de moyen de paiement, l'accès aux factures et la résiliation.
`POST /v1/billing/portal` échoue tant que le portail n'est pas activé.

Cocher « annuler à la fin de la période » plutôt qu'immédiatement : le champ
`cancel_at_period_end` est déjà géré et l'écran affiche « accès conservé
jusqu'au … ».

## 5. Retours vers l'app

Défauts (liens profonds `ubersclap://`, aucune configuration nécessaire) :

```
BILLING_SUCCESS_URL=ubersclap://profil/abonnement?billing=success
BILLING_CANCEL_URL=ubersclap://profil/abonnement?billing=cancel
BILLING_PORTAL_RETURN_URL=ubersclap://profil/abonnement?billing=portal
```

À surcharger le jour où une page web de confirmation existe. À savoir : un lien
profond ne se rouvre pas dans Expo Go de la même façon que dans un build natif —
à vérifier sur l'APK, pas dans Expo Go.

## 6. Vérification de bout en bout

1. `GET /v1/billing/plans` → les offres remontent avec leur montant.
2. Depuis le mobile : Profil → Gérer mon abonnement → Souscrire → Checkout
   s'ouvre.
3. Payer avec `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel
   CVC.
4. Retour dans l'app : l'offre affichée passe à `ACTIVE` (l'écran relit
   l'abonnement à chaque prise de focus).
5. En base : `subscriptions` porte `stripe_customer_id`,
   `stripe_subscription_id`, `tier`, `status`, `current_period_end`.
6. `stripe trigger invoice.payment_failed` → le statut passe `PAST_DUE` et
   l'encart « Paiement en échec » apparaît.
7. Rejouer deux fois le même événement → le second est ignoré (table
   `billing_events`, livraison « au moins une fois » de Stripe).

Si Stripe est injoignable ou la clé invalide, les routes répondent `503
BILLING_PROVIDER_ERROR` — jamais 401. Un 401 serait interprété par le mobile
comme une session expirée et déconnecterait le chauffeur pour une erreur de
configuration serveur.

## 7. Stores — à savoir avant publication

Apple et Google exigent leur achat intégré pour du contenu numérique consommé
dans l'app, avec une commission de 15 à 30 %. La lecture retenue ici est celle de
l'exception **outil professionnel / SaaS B2B** : un chauffeur VTC s'abonne à un
logiciel de gestion d'entreprise, ce qui autorise le paiement externe.

Ce n'est pas un point acquis, et c'est un motif de refus classique en revue. À
trancher avant la soumission — pas après.

---

## Ce que le code fait déjà

| Élément | Où |
| --- | --- |
| Routes `GET /v1/billing/subscription`, `GET /v1/billing/plans`, `POST /v1/billing/checkout`, `POST /v1/billing/portal`, `POST /v1/billing/webhook` | `apps/api/src/billing/` |
| Client Stripe optionnel, tarifs lus dans l'environnement, signature de webhook | `apps/api/src/billing/stripe.service.ts` |
| Colonnes `stripe_*` + `billing_events` (idempotence) | `apps/api/src/database/schema/organizations.ts`, migration `0002` |
| Types et traduction des statuts Stripe | `packages/shared/src/billing.ts` |
| Écran d'abonnement, ouverture de Checkout et du portail | `apps/mobile/app/profil/abonnement.tsx` |

Réservé à un rôle portant `billing:manage` (ADMIN, ADR-015) : un chauffeur d'une
organisation Business ne peut pas ouvrir la facturation de sa société.
