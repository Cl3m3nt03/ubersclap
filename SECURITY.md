# 🔐 SECURITY.md

# Uber's Clap

> Documentation sécurité

Version : 0.1.0

---

# 📖 Introduction

Uber's Clap manipule des données professionnelles importantes :

- Informations personnelles clients
- Numéros de téléphone
- Adresses de prise en charge
- Historique des trajets
- Factures
- Documents professionnels
- Informations financières

La sécurité est donc un élément essentiel du projet.

---

# 🎯 Objectifs sécurité

L'application doit garantir :

- Confidentialité des données
- Intégrité des informations
- Disponibilité du service
- Protection contre les attaques
- Respect du RGPD

---

# 🔐 Authentification

## Solution

JWT avec Refresh Token.

---

# Fonctionnement

Lors de la connexion :

1. L'utilisateur fournit ses identifiants.
2. Le serveur vérifie les informations.
3. Un Access Token est généré.
4. Un Refresh Token est généré.

---

# Access Token

Durée courte :

Exemple :

```
15 minutes
```

Utilisation :

- Appels API
- Validation utilisateur

---

# Refresh Token

Durée longue :

Exemple :

```
30 jours
```

Utilisation :

- Renouvellement automatique session

---

# Stockage mobile

Les tokens ne doivent jamais être stockés en clair.

Utilisation :

- Secure Storage Expo
- Keychain iOS
- Keystore Android

---

# 🔑 Gestion des mots de passe

Les mots de passe ne sont jamais stockés directement.

Utilisation :

```
Argon2id
```

ou

```
bcrypt
```

---

Exemple :

Mot de passe :

```
MonMotDePasse123
```

Devient :

```
$argon2id$v=19$...
```

---

# 👤 Gestion des permissions

Chaque utilisateur ne peut accéder qu'à ses propres données.

---

Exemple :

Le chauffeur A ne peut jamais voir :

- clients du chauffeur B
- courses du chauffeur B
- factures du chauffeur B

---

# Architecture permissions

Future version :

```
Organization

 └── Owner

 └── Manager

 └── Driver

```

---

# 🛡️ Protection API

Toutes les routes privées nécessitent :

- JWT valide
- utilisateur actif
- permissions suffisantes

---

# Validation des données

Toutes les entrées utilisateur sont validées.

Utilisation :

- DTO NestJS
- class-validator
- Zod

---

Exemple :

Une course ne peut pas être créée avec :

```
prix = -100
```

ou

```
date invalide
```

---

# 🚦 Rate Limiting

Protection contre :

- brute force
- spam
- abus API

---

Exemple :

Login :

```
5 tentatives / minute
```

---

# 🌐 Sécurité réseau

Toutes les communications utilisent :

```
HTTPS obligatoire
```

---

TLS minimum :

```
TLS 1.2+
```

---

# 🗄️ Sécurité base de données

## Principes

- Aucun accès public direct
- Utilisateur SQL limité
- Mots de passe forts
- Sauvegardes régulières

---

# Chiffrement

Données sensibles :

Possibilité de chiffrement :

- documents
- tokens
- informations privées

---

# 📄 Sécurité documents

Documents stockés :

- factures
- signatures
- justificatifs

sont protégés.

---

# Stockage

Cloudflare R2 / S3.

---

Règles :

- URLs temporaires
- expiration automatique
- permissions privées

---

Exemple :

Une facture n'est jamais accessible via :

```
https://storage.com/facture.pdf
```

Mais via :

```
URL SIGNÉE TEMPORAIRE
```

---

# ✍️ Signature numérique

Les signatures doivent conserver :

- image signature
- date
- heure
- utilisateur
- course associée

---

Objectif :

Créer une preuve de prestation.

---

# 📱 Sécurité mobile

Protection :

- détection session expirée
- verrouillage automatique
- stockage sécurisé
- aucune donnée sensible dans les logs

---

# 🔥 Gestion des erreurs

Les erreurs retournées au client ne doivent jamais exposer :

- stack trace
- informations SQL
- chemins serveur

---

Mauvais :

```json
{
  "error": "Postgres password invalid"
}
```

---

Correct :

```json
{
  "message": "Erreur serveur"
}
```

---

# 📝 Logs

Les logs doivent permettre :

- diagnostic erreur
- suivi activité
- sécurité

---

Ne jamais enregistrer :

- mot de passe
- token complet
- données bancaires

---

# 📊 Monitoring sécurité

Outils :

## Sentry

Surveillance :

- erreurs
- crash
- anomalies

---

## Audit Logs

Future fonctionnalité.

Enregistrer :

- connexion
- modification facture
- suppression course
- changement permission

---

# 🇪🇺 RGPD

Uber's Clap doit respecter le RGPD.

---

# Données collectées

Exemples :

- identité chauffeur
- identité client
- historique courses
- documents

---

# Droits utilisateurs

Le chauffeur doit pouvoir :

## Consulter ses données

Accès complet.

---

## Modifier ses données

Modification profil.

---

## Supprimer ses données

Suppression compte.

---

## Exporter ses données

Format :

- JSON
- CSV
- PDF

---

# Conservation des données

Définir :

- durée conservation documents
- historique courses
- factures

Selon obligations légales.

---

# Cookies et tracking

Application mobile :

Pas de tracking inutile.

Tout analytics doit être :

- transparent
- configurable

---

# Sauvegardes

Stratégie :

## Base de données

Backup automatique quotidien.

---

## Documents

Réplication stockage.

---

# Plan récupération

En cas de problème :

1. Restaurer base.
2. Restaurer documents.
3. Vérifier intégrité.
4. Réouvrir service.

---

# Sécurité future

Évolutions possibles :

- Authentification biométrique
- Double authentification
- Détection connexion suspecte
- Chiffrement avancé
- Gestion entreprise avec rôles

---

# Checklist sécurité MVP

## Auth

[ ] JWT
[ ] Refresh Token
[ ] Hash password
[ ] Secure Storage

---

## API

[ ] Validation DTO
[ ] Rate limiting
[ ] HTTPS
[ ] Permissions

---

## Database

[ ] Backup
[ ] User isolation
[ ] Logs sécurisés

---

## Documents

[ ] Storage privé
[ ] URLs temporaires

---

# Conclusion

La sécurité d'Uber's Clap doit être intégrée dès la conception.

L'objectif est de construire une application professionnelle capable d'être utilisée quotidiennement par des chauffeurs indépendants tout en garantissant la protection complète de leurs données et celles de leurs clients.
