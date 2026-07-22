# 🗺️ BACKLOG.md

# Uber's Clap — Ce qu'il reste à faire

Version : 1.0.0 — 2026-07-22

> Document de travail. Priorités justifiées, pas classées à l'instinct.
> Les références `ADR-xxx` renvoient à `00_CANON.md`.

---

# 📍 Où on en est

## Ce qui existe et tourne

```
Monorepo pnpm + Turborepo
packages/shared     tokens, argent en centimes, machine à états, schémas Zod
apps/mobile         Expo SDK 54, 7 composants, 5 écrans + modale de création
Git                 10 branches, historique main → develop → features
```

Vérifié : `expo-doctor` 18/18, typecheck propre, l'app se lance dans Expo Go.

## Ce qui n'existe pas

**Aucune persistance.** Les données viennent de `lib/mock.ts`. Rien n'est
enregistré, rien ne survit à un rechargement. Pas de backend, pas d'auth, pas
de base.

C'est un prototype d'interface fonctionnel, pas une application.

---

# 🔴 Décisions bloquantes — à trancher avant de coder plus loin

Ces trois points ne coûtent rien aujourd'hui et coûtent très cher plus tard.
Aucune ligne de code ne les résoudra.

## 1. Le nom du produit — ADR-016

« Uber's Clap » contient une marque déposée activement défendue, sur un produit
qui cible les chauffeurs Uber et vise l'App Store.

**Bloque :** l'identité visuelle, le nom de domaine, les comptes développeur,
la communication.

**Coût si tranché maintenant :** zéro.
**Coût après logo, DA, domaine et premiers utilisateurs :** très élevé.

→ Décision produit, pas technique. À prendre cette semaine.

## 2. Validation comptable — ADR-012

La facture est le cœur de la proposition de valeur et le document qui engage la
responsabilité de l'utilisateur.

À faire valider par un expert-comptable **avant** d'écrire le générateur :

- TVA 10 % (transport de personnes) vs franchise en base
- mentions obligatoires exactes, y compris le n° de registre VTC
- règle de numérotation et conservation
- calendrier réel de la facturation électronique

**Bloque :** tout le module facturation, et potentiellement le modèle de
données si une contrainte impose un champ supplémentaire.

## 3. Tarification — ADR-015

Proposition en attente : Pro à 16,99 €, mur du plan gratuit sur les factures,
quota SMS explicite.

**Bloque :** le module abonnement, et les limites à coder dans l'API.

Le point dur reste le même : les SMS et l'IA sont des coûts variables. Sans
quota, un gros utilisateur peut être déficitaire.

---

# 🟠 P0 — Les fondations

Sans ça, l'app ne peut rien enregistrer. C'est le seul vrai chemin critique.

## P0.1 — Backend NestJS + Drizzle

```
Schéma Drizzle conforme ADR-004 → ADR-009
Migrations
Docker Compose : Postgres + Redis
Seed de développement
```

Le schéma est déjà entièrement spécifié dans le canon. C'est de la
transcription, pas de la conception.

## P0.2 — Authentification

```
POST /v1/auth/register · login · refresh · logout
Argon2id
JWT 15 min + refresh 30 jours
Guard d'isolation multi-tenant (ADR-007)
```

**Le guard avant les routes métier.** L'isolation par `driver_id` ne doit jamais
dépendre de la discipline du développeur : un helper de repository qui
l'applique par construction, pas une clause `WHERE` à ne pas oublier.

## P0.3 — Couche données mobile

```
TanStack Query
Suppression de lib/mock.ts
Expo SecureStore pour les tokens
Intercepteur de refresh
```

## P0.4 — Offline-first — ADR-011

**À faire maintenant, pas après.**

```
Expo SQLite en base locale
File de mutations persistée, rejouée à la reconnexion
UUID v7 générés côté mobile
Idempotency-Key sur tous les POST
```

C'est la seule tâche P0 qu'on pourrait être tenté de repousser, et celle qu'il
ne faut surtout pas repousser. L'offline n'est pas une fonctionnalité qu'on
ajoute : c'est une propriété de la couche données. Le rajouter après implique
de réécrire tous les appels réseau et tous les écrans qui en dépendent.

Le cas d'usage est central, pas marginal : parking souterrain d'aéroport,
tunnel, sous-sol d'hôtel. C'est là que le chauffeur crée ses courses.

---

# 🟡 P1 — Le MVP — ADR-014

Périmètre figé. Tout ajout ici repousse la date de sortie.

| Module | Contenu | Dépend de |
| --- | --- | --- |
| Clients | CRUD, recherche, historique | P0.1–P0.3 |
| Courses | CRUD, machine à états, transitions validées serveur | P0 complet |
| Planning | Vue jour + semaine, détection de conflits | Courses |
| Dépenses | Saisie simple, photo du justificatif | P0.1 |
| Facturation | 1 facture ↔ N courses, PDF conforme | Décision 2 |
| Dashboard | CA, courses, km, dépenses, bénéfice réels | Tout |

## Le PDF de facture

Le seul artefact qui sort de l'app et qui représente le chauffeur chez son
client. Il n'a **jamais été designé** — ni maquette, ni gabarit.

```
Génération côté serveur (BullMQ), jamais sur mobile
Numérotation transactionnelle en base
Factur-X : PDF/A-3 + XML CII embarqué
Stockage R2, URL signée à expiration courte
Table credit_notes pour les avoirs
```

Le Factur-X dès le premier PDF : le surcoût est marginal maintenant, le
refactor a posteriori touche des documents légalement immuables.

## Détection de conflits

Annoncée comme différenciateur dans `FEATURES.md`, jamais spécifiée. Il manque
la règle : marge de trajet fixe, ou appel Directions API à chaque création ?
La seconde option a un coût par requête à chiffrer.

---

# 🟢 P2 — Après le MVP

Par ordre de valeur décroissante, pas par ordre de facilité.

1. **Signature numérique** — preuve de prestation
2. **SMS et emails automatiques** — confirmation, rappel, envoi de facture
3. **Google Maps** — autocomplete, distance, durée
4. **IA** — parsing de course, assistant. Le modèle sort du JSON, il ne résout
   jamais une adresse : la résolution passe par Places, sinon il invente un
   hôtel qui n'existe pas
5. **Multi-véhicules et entretien**
6. **Version Business** — organisations, équipes, planning partagé
7. **Import Uber / Bolt** — le vrai fossé concurrentiel, mais sans API publique

---

# 🔧 Dette technique connue

Tout est documenté, rien n'est caché.

| Sujet | État | Quand traiter |
| --- | --- | --- |
| SDK 54 au lieu de 57 | Volontaire, Expo Go | Au passage en development build |
| `MAX_PATH` Windows | Bloque le build natif | Déplacer le repo vers `C:\dev\` |
| `npx tsc` dans `apps/mobile` | Shim cassé, contournement depuis la racine | Bas |
| Mode sombre | Tokens définis, non branché | v1.1 |
| Tests | **Aucun** | Dès le backend |
| `.gitattributes` | Absent, conversions CRLF | Avant un 2ᵉ contributeur |
| 4 écrans sur 5 | Jamais vus tourner | Prochaine session |

## Deux leçons de la mise en route

**`expo-doctor` vert ≠ arbre de dépendances correct.** Il ne vérifie que les
paquets *déclarés*. `react-native-worklets` arrivait en transitif dans une
version incompatible avec Expo Go : doctor passait 18/18 pendant que l'app
crashait au démarrage.

**Typecheck vert et bundle réussi ne prouvent pas que l'app démarre.** Deux
bugs — `darkMode: media` et la version de worklets — ne se sont révélés qu'à
l'exécution. À intégrer dans la définition de terminé : une fonctionnalité
n'est pas finie tant qu'elle n'a pas tourné sur un appareil.

---

# 💭 Angles morts — ce à quoi on n'a pas encore pensé

Aucun de ces points n'est dans les 28 documents d'origine. Plusieurs valent
plus que des fonctionnalités du backlog.

## Le premier lancement décide de la rétention

Rien n'existe sur l'onboarding. Or `BUSINESS.md` fixe comme critère de succès
« le chauffeur ouvre l'application plusieurs fois par jour » — ça se joue dans
les cinq premières minutes.

Objectif à tenir : **première course créée en moins de 3 minutes** après
l'inscription. Ce qui suppose de ne pas exiger le SIRET, le régime de TVA et le
véhicule avant d'avoir montré la moindre valeur.

## La sauvegarde est un argument de vente

Un chauffeur qui perd ses données perd son activité : son historique de
courses, ses factures, sa comptabilité.

Export complet en un tap (JSON + CSV + PDF), visible dans les réglages. Ça
répond à trois choses d'un coup : l'obligation RGPD de portabilité, la peur
légitime de l'enfermement, et le sentiment de sécurité qui justifie l'abonnement.

## Le coût Google Maps n'a jamais été chiffré

`DEPLOYMENT.md` note « Services API : variable ». Ce n'est pas une estimation.

Un chauffeur qui crée 10 courses par jour déclenche de l'autocomplete sur deux
champs, plus un calcul d'itinéraire. À l'échelle, ça se compare directement à
16,99 € de revenu mensuel.

→ À chiffrer **avant** de brancher les cartes. Leviers : mise en cache agressive
du géocodage, sessions d'autocomplete groupées, ou Mapbox.

## Le support à 6 h du matin

Un chauffeur bloqué avant sa première course ne peut pas attendre 48 h. Prévoir
au minimum un canal visible et une FAQ, et instrumenter les erreurs pour les
voir avant qu'il n'écrive.

## La fiche App Store

Souvent découvert trop tard, et bloquant à la soumission :

```
Politique de confidentialité en ligne — obligatoire
Captures d'écran par taille d'appareil
Déclarations de confidentialité (App Privacy)
Justification des permissions : localisation, contacts, notifications
Compte de démonstration pour la revue Apple
```

Une revue Apple refusée coûte une semaine. À préparer pendant le développement,
pas après.

## Instrumenter le moment de la facture

`ADR-015` place le mur du plan gratuit sur la facture. C'est donc le point de
conversion, et il doit être le mieux mesuré de l'application : combien
atteignent la limite, combien convertissent, combien abandonnent.

---

# 🎯 Les trois prochaines choses

Si on ne devait faire que trois choses :

1. **Trancher le nom** — bloque tout ce qui touche à l'identité, coût nul
   aujourd'hui
2. **Backend + auth + offline** (P0 complet) — sans persistance, tout le reste
   est du décor
3. **Le PDF de facture conforme** — l'artefact qui justifie l'abonnement, et
   celui dont les contraintes légales peuvent encore modifier le modèle de
   données

L'ordre compte : le point 3 peut invalider une partie du point 2 si la
validation comptable impose un champ ou une règle de numérotation
supplémentaire. Faire valider tôt.
