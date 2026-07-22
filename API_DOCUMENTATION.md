# 🌐 API_DOCUMENTATION.md

# Uber's Clap

> Documentation API Backend

Version : 0.1.0

---

# 📖 Introduction

L'API Uber's Clap permet de connecter :

- l'application mobile
- les services backend
- la base de données
- les services externes

L'API suit une architecture REST.

---

# 🎯 Objectifs API

L'API doit être :

- sécurisée
- documentée
- scalable
- simple à maintenir

---

# 🏗️ Architecture

Technologie :

```
NestJS
```

Communication :

```
REST API
```

Format :

```
JSON
```

Documentation :

```
Swagger OpenAPI
```

---

# 🔐 Authentification API

Toutes les routes privées utilisent :

```
Bearer Token JWT
```

---

Header :

```http
Authorization: Bearer {token}
```

---

# 🌍 URL API

Production :

```
https://api.ubersclap.com
```

Développement :

```
http://localhost:3000
```

---

# 📌 Convention réponses API

---

## Succès

```json
{
  "success": true,
  "data": {}
}
```

---

## Erreur

```json
{
  "success": false,
  "message": "Erreur",
  "code": "ERROR_CODE"
}
```

---

# 👤 AUTH MODULE

Base :

```
/auth
```

---

# POST

## Inscription

```
POST /auth/register
```

---

Body :

```json
{
  "email": "driver@test.com",
  "password": "password",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

---

Réponse :

```json
{
  "user": {
    "id": "uuid",
    "email": "driver@test.com"
  }
}
```

---

# POST

## Connexion

```
POST /auth/login
```

---

Body :

```json
{
  "email": "",
  "password": ""
}
```

---

Réponse :

```json
{
  "accessToken": "",
  "refreshToken": ""
}
```

---

# POST

## Rafraîchir token

```
POST /auth/refresh
```

---

# POST

## Déconnexion

```
POST /auth/logout
```

---

# 👤 USER MODULE

Base :

```
/users
```

---

# GET

Profil utilisateur

```
GET /users/me
```

---

Réponse :

```json
{
  "id": "",
  "firstName": "",
  "lastName": "",
  "phone": ""
}
```

---

# PATCH

Modifier profil

```
PATCH /users/me
```

---

# 🚗 DRIVER MODULE

Base :

```
/driver
```

---

# GET

Profil chauffeur

```
GET /driver/profile
```

---

# PATCH

Modifier informations professionnelles

```
PATCH /driver/profile
```

---

# 👥 CLIENT MODULE

Base :

```
/clients
```

---

# GET

Liste clients

```
GET /clients
```

Paramètres :

```
?page=1
&search=dupont
```

---

# GET

Détail client

```
GET /clients/:id
```

---

# POST

Créer client

```
POST /clients
```

---

Body :

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "0600000000"
}
```

---

# PATCH

Modifier client

```
PATCH /clients/:id
```

---

# DELETE

Supprimer client

```
DELETE /clients/:id
```

---

# 🚕 COURSE MODULE

Base :

```
/courses
```

---

# GET

Liste courses

```
GET /courses
```

Filtres :

```
status

date

client

```

---

# GET

Détail course

```
GET /courses/:id
```

---

# POST

Créer course

```
POST /courses
```

---

Body :

```json
{
  "clientId": "",
  "pickup": "",
  "destination": "",
  "date": "",
  "price": 100
}
```

---

# PATCH

Modifier course

```
PATCH /courses/:id
```

---

# PATCH

Changer statut

```
PATCH /courses/:id/status
```

---

Body :

```json
{
  "status": "COMPLETED"
}
```

---

# DELETE

Supprimer course

```
DELETE /courses/:id
```

---

# 📅 PLANNING MODULE

Base :

```
/planning
```

---

# GET

Planning journée

```
GET /planning/day
```

---

Paramètres :

```
date=2026-07-22
```

---

# GET

Planning semaine

```
GET /planning/week
```

---

# 🧾 INVOICE MODULE

Base :

```
/invoices
```

---

# GET

Liste factures

```
GET /invoices
```

---

# GET

Détail facture

```
GET /invoices/:id
```

---

# POST

Créer facture

```
POST /invoices
```

---

# GET

Télécharger PDF

```
GET /invoices/:id/pdf
```

---

# POST

Envoyer facture

```
POST /invoices/:id/send
```

---

# 💸 EXPENSE MODULE

Base :

```
/expenses
```

---

# GET

Liste dépenses

```
GET /expenses
```

---

# POST

Créer dépense

```
POST /expenses
```

---

Body :

```json
{
  "category": "FUEL",
  "amount": 80,
  "description": "Essence"
}
```

---

# DELETE

Supprimer dépense

```
DELETE /expenses/:id
```

---

# 📊 DASHBOARD MODULE

Base :

```
/dashboard
```

---

# GET

Résumé activité

```
GET /dashboard/summary
```

---

Réponse :

```json
{
  "courses": 20,
  "revenue": 2500,
  "expenses": 300,
  "profit": 2200
}
```

---

# 🤖 AI MODULE

Base :

```
/ai
```

---

# POST

Assistant IA

```
POST /ai/chat
```

---

Body :

```json
{
  "message": "Combien gagné cette semaine ?"
}
```

---

Réponse :

```json
{
  "answer": "Vous avez gagné 1200€"
}
```

---

# POST

Créer course IA

```
POST /ai/course-parser
```

---

Body :

```json
{
  "text": "Demain 10h CDG hôtel Hilton"
}
```

---

Réponse :

```json
{
  "suggestion": {
    "date": "",
    "pickup": "",
    "destination": ""
  }
}
```

---

# 🔔 NOTIFICATION MODULE

Base :

```
/notifications
```

---

# GET

Notifications

```
GET /notifications
```

---

# PATCH

Marquer comme lu

```
PATCH /notifications/:id/read
```

---

# 📄 DOCUMENT MODULE

Base :

```
/documents
```

---

# POST

Upload document

```
POST /documents/upload
```

---

# GET

Télécharger document

```
GET /documents/:id
```

---

# 🔒 Sécurité API

Chaque endpoint vérifie :

- JWT valide
- utilisateur propriétaire
- permissions

---

# Validation

Utilisation :

- DTO
- class-validator
- Zod

---

# Pagination

Toutes les listes importantes utilisent :

```json
{
  "page": 1,
  "limit": 20,
  "total": 200
}
```

---

# Versioning API

Prévu :

```
/api/v1/
```

Exemple :

```
GET /api/v1/courses
```

---

# 🚀 Future API

Possibilités :

- API partenaires
- synchronisation plateformes VTC
- application web entreprise
- intégrations comptables

---

# Conclusion

L'API Uber's Clap est conçue comme une base solide permettant de supporter l'application mobile actuelle et les futures évolutions SaaS.
