# 🌐 API.md

# Uber's Clap

> Documentation API REST

Version : 0.1.0

---

# 📖 Introduction

L'API Uber's Clap permet à l'application mobile de communiquer avec le backend.

Elle gère :

- authentification
- utilisateurs
- clients
- courses
- planning
- facturation
- dépenses
- véhicules
- notifications
- statistiques
- IA

---

# ⚙️ Informations générales

## Base URL

Développement :

```
http://localhost:3000/api
```

Production :

```
https://api.ubersclap.com/api
```

---

# Format des réponses

Toutes les réponses utilisent JSON.

Exemple succès :

```json
{
  "success": true,
  "data": {}
}
```

---

Exemple erreur :

```json
{
  "success": false,
  "message": "Une erreur est survenue",
  "code": "ERROR_CODE"
}
```

---

# 🔐 Authentification

L'API utilise :

- JWT Access Token
- Refresh Token

Header obligatoire :

```
Authorization: Bearer TOKEN
```

---

# 🔑 MODULE AUTH

---

# POST /auth/register

Création d'un compte chauffeur.

## Request

```json
{
  "firstname": "Jean",
  "lastname": "Dupont",
  "email": "jean@email.com",
  "phone": "0600000000",
  "password": "password"
}
```

---

## Response

```json
{
  "user": {
    "id": "uuid",
    "firstname": "Jean",
    "email": "jean@email.com"
  },
  "accessToken": "token"
}
```

---

# POST /auth/login

Connexion utilisateur.

---

Request :

```json
{
  "email": "jean@email.com",
  "password": "password"
}
```

---

# POST /auth/refresh

Renouvellement du token.

---

# POST /auth/logout

Déconnexion.

---

# 👤 MODULE USER

---

# GET /users/me

Retourne le profil connecté.

---

Response :

```json
{
  "id": "uuid",
  "firstname": "Jean",
  "company": "Jean VTC"
}
```

---

# PATCH /users/me

Modifier son profil.

---

Données :

- nom
- société
- adresse
- logo

---

# 👥 MODULE CLIENTS

---

# GET /clients

Liste des clients.

Paramètres :

```
?page=1
&search=dupont
&category=VIP
```

---

Response :

```json
[
  {
    "id": "uuid",
    "firstname": "Pierre",
    "lastname": "Martin",
    "phone": "0600000000"
  }
]
```

---

# POST /clients

Créer un client.

---

Request :

```json
{
  "firstname": "Pierre",
  "lastname": "Martin",
  "phone": "0600000000",
  "email": "pierre@email.com"
}
```

---

# GET /clients/:id

Détails client.

Retourne :

- informations
- historique courses
- factures

---

# PATCH /clients/:id

Modifier un client.

---

# DELETE /clients/:id

Suppression logique.

---

# 🚗 MODULE COURSES

Module principal.

---

# GET /courses

Liste des courses.

Filtres :

```
date

status

client

vehicle
```

---

# POST /courses

Créer une course.

---

Request :

```json
{
  "clientId": "uuid",

  "type": "AIRPORT",

  "pickup": {
    "address": "Paris"
  },

  "destination": {
    "address": "CDG"
  },

  "date": "2026-07-22",

  "time": "14:00",

  "price": 120
}
```

---

# GET /courses/:id

Détails course.

Retourne :

- client
- trajet
- prix
- facture
- signature

---

# PATCH /courses/:id

Modifier une course.

---

# DELETE /courses/:id

Annuler une course.

---

# PATCH /courses/:id/status

Changer le statut.

---

Request :

```json
{
  "status": "COMPLETED"
}
```

---

# POST /courses/:id/signature

Ajouter une signature client.

---

Request :

```json
{
  "signature": "base64_data"
}
```

---

# 📅 MODULE PLANNING

---

# GET /planning/day

Planning journée.

Paramètre :

```
date=2026-07-22
```

---

# GET /planning/week

Planning semaine.

---

# GET /planning/month

Planning mois.

---

# 🧾 MODULE FACTURES

---

# GET /invoices

Liste factures.

---

Filtres :

```
status

date

client
```

---

# POST /invoices/:courseId

Créer facture depuis une course.

---

# GET /invoices/:id

Détails facture.

---

# GET /invoices/:id/pdf

Télécharger PDF.

---

# PATCH /invoices/:id/status

Modifier statut paiement.

---

Request :

```json
{
  "status": "PAID"
}
```

---

# 💸 MODULE DEPENSES

---

# GET /expenses

Liste dépenses.

---

# POST /expenses

Créer dépense.

---

Request :

```json
{
  "type": "FUEL",
  "amount": 80,
  "description": "Plein essence"
}
```

---

# PATCH /expenses/:id

Modifier.

---

# DELETE /expenses/:id

Supprimer.

---

# 🚘 MODULE VEHICULES

---

# GET /vehicles

Liste véhicules.

---

# POST /vehicles

Ajouter véhicule.

---

Request :

```json
{
  "brand": "Tesla",
  "model": "Model Y",
  "registration": "AA-123-AA"
}
```

---

# PATCH /vehicles/:id

Modifier.

---

# DELETE /vehicles/:id

Supprimer.

---

# 🔔 MODULE NOTIFICATIONS

---

# GET /notifications

Liste notifications.

---

# PATCH /notifications/:id/read

Marquer comme lu.

---

# POST /notifications/test

Test notification.

---

# 📊 MODULE STATISTIQUES

---

# GET /statistics/dashboard

Retourne :

- CA
- bénéfices
- courses
- kilomètres

---

Response :

```json
{
  "revenue": 5000,
  "expenses": 900,
  "profit": 4100,
  "courses": 45
}
```

---

# GET /statistics/revenue

Evolution revenus.

---

# GET /statistics/clients

Statistiques clients.

---

Retour :

- meilleur client
- nombre courses
- revenu généré

---

# 🤖 MODULE IA

---

# POST /ai/course-parser

Création intelligente d'une course.

---

Request :

```json
{
  "text": "Demain 15h CDG vers Paris pour Mr Dupont"
}
```

---

Response :

```json
{
  "client": "Dupont",
  "date": "2026-07-23",
  "time": "15:00",
  "pickup": "CDG",
  "destination": "Paris"
}
```

---

# POST /ai/assistant

Assistant métier.

---

Request :

```json
{
  "message": "Combien ai-je gagné cette semaine ?"
}
```

---

Response :

```json
{
  "answer": "Vous avez gagné 1450€ cette semaine."
}
```

---

# 📁 MODULE DOCUMENTS

---

# POST /documents/upload

Upload fichier.

---

Types :

- PDF
- image
- signature

---

# GET /documents/:id

Récupérer document.

---

# DELETE /documents/:id

Supprimer document.

---

# ❌ Codes erreurs

| Code | Signification         |
| ---- | --------------------- |
| 400  | Données invalides     |
| 401  | Non authentifié       |
| 403  | Permission refusée    |
| 404  | Ressource inexistante |
| 409  | Conflit               |
| 500  | Erreur serveur        |

---

# 🔒 Règles sécurité

Toutes les routes privées nécessitent :

- JWT valide
- utilisateur propriétaire des données
- validation DTO

---

# 📌 Versioning

L'API utilise :

```
/api/v1
```

Exemple :

```
/api/v1/courses
```

---

# Conclusion

Cette API fournit toutes les fonctionnalités nécessaires au fonctionnement d'Uber's Clap et permet au mobile de gérer l'ensemble de l'activité professionnelle du chauffeur VTC.
