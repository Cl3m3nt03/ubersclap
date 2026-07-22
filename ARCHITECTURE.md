# 🏗️ ARCHITECTURE.md

# Uber's Clap

> Documentation architecture logicielle

Version : 0.1.0

---

# 📖 Introduction

Uber's Clap est une application mobile SaaS construite autour d'une architecture moderne séparant :

- Application mobile
- API backend
- Base de données
- Services externes
- Workers d'automatisation

L'objectif est d'obtenir une architecture :

- scalable
- maintenable
- sécurisée
- facilement évolutive

---

# 🌐 Architecture globale

```mermaid
flowchart TB

A[Application Mobile<br/>React Native Expo]

B[API Backend<br/>NestJS]

C[(PostgreSQL)]

D[(Redis)]

E[Storage<br/>Cloudflare R2]

F[Services externes]

G[Google Maps]
H[Firebase]
I[Resend]
J[Twilio]
K[OpenAI]


A --> B

B --> C
B --> D
B --> E

B --> F

F --> G
F --> H
F --> I
F --> J
F --> K
```

---

# 📱 Application Mobile

## Technologie

- React Native
- Expo
- TypeScript

---

# Responsabilités

L'application mobile gère :

- interface utilisateur
- navigation
- formulaires
- stockage local
- notifications
- GPS
- signature client

---

# Architecture mobile

Organisation recommandée :

```
src

├── app

├── screens

├── components

├── hooks

├── services

├── store

├── types

├── utils

└── assets

```

---

# Structure détaillée

## app

Gestion :

- navigation
- providers
- configuration globale

---

## screens

Chaque écran utilisateur.

Exemple :

```
screens

├── Login

├── Dashboard

├── Planning

├── Clients

├── Courses

├── Invoice

└── Settings

```

---

## components

Composants réutilisables.

Exemple :

- Button
- Card
- Input
- Modal
- Calendar
- CourseCard

---

## services

Communication backend.

Exemple :

```
services

├── api.ts

├── client.service.ts

├── course.service.ts

└── invoice.service.ts
```

---

# 🔥 Backend

## Technologie

NestJS

---

# Responsabilités

Le backend gère :

- logique métier
- authentification
- permissions
- données
- génération documents
- automatisations

---

# Architecture backend

```
src

├── auth

├── users

├── clients

├── courses

├── planning

├── invoices

├── expenses

├── vehicles

├── notifications

├── statistics

├── ai

├── storage

└── common

```

---

# Modules métier

---

# Auth Module

Gestion :

- inscription
- connexion
- tokens
- permissions

---

# Users Module

Gestion :

- profil chauffeur
- paramètres
- préférences

---

# Clients Module

Gestion CRM.

Responsabilités :

- création client
- modification
- recherche
- historique

---

# Courses Module

Module principal.

Responsabilités :

- création course
- modification
- changement statut
- calcul prix
- historique

---

# Planning Module

Responsabilités :

- calendrier
- disponibilité
- conflits horaires

---

# Invoice Module

Responsabilités :

- génération facture
- PDF
- statut paiement

---

# Expense Module

Gestion :

- carburant
- entretien
- péages
- dépenses diverses

---

# Vehicle Module

Gestion :

- véhicules
- maintenance
- kilométrage

---

# Notification Module

Gestion :

- push notifications
- SMS
- emails

---

# Statistics Module

Calcul :

- CA
- bénéfices
- performances

---

# AI Module

Assistant intelligent.

Responsabilités :

- analyse texte
- création automatique
- recommandations

---

# 🗄️ Couche données

## PostgreSQL

Stockage principal.

---

Relations principales :

```mermaid
erDiagram

USER ||--o{ CLIENT : manages

CLIENT ||--o{ COURSE : books

COURSE ||--|| INVOICE : generates

COURSE ||--o{ EXPENSE : contains

USER ||--o{ VEHICLE : owns

VEHICLE ||--o{ COURSE : used

```

---

# 🔄 Flux principal : création d'une course

```mermaid
sequenceDiagram

participant Driver
participant App
participant API
participant DB
participant Notification

Driver->>App: Création course

App->>API: POST /courses

API->>DB: Enregistrement

DB-->>API: Course créée

API->>Notification: Programmer rappel

Notification-->>Driver: Confirmation

```

---

# 🔄 Cycle de vie d'une course

```mermaid
stateDiagram-v2

[Initial] --> Brouillon

Brouillon --> En attente

En attente --> Confirmée

Confirmée --> En route

En route --> En cours

En cours --> Terminée

Terminée --> Facturée

Facturée --> Payée

Confirmée --> Annulée
```

---

# 🤖 Architecture IA

```mermaid
flowchart LR

A[Message client]

B[AI Service]

C[Extraction données]

D[Création Course]

E[Validation chauffeur]


A --> B
B --> C
C --> D
D --> E

```

---

# ⚙️ Jobs asynchrones

Certaines tâches ne doivent pas bloquer l'utilisateur.

Exemples :

- envoyer SMS
- créer PDF
- envoyer email
- calcul statistiques

Architecture :

```
API

↓

Redis Queue

↓

BullMQ Worker

↓

Action
```

---

# 📄 Gestion documents

Documents stockés dans :

Cloudflare R2

Exemples :

- factures PDF
- signatures
- justificatifs

Flux :

```
Course terminée

↓

Génération PDF

↓

Upload Storage

↓

Lien sécurisé

↓

Client
```

---

# 🔐 Sécurité architecture

Principes :

- aucune donnée sensible côté mobile
- validation serveur obligatoire
- tokens sécurisés
- permissions par utilisateur
- logs d'activité

---

# 📈 Scalabilité future

L'architecture permet :

## Version entreprise

Ajout :

- organisations
- équipes
- rôles

---

## Multi chauffeurs

Ajout :

- dispatcher
- planning partagé
- attribution automatique

---

## Microservices futurs

Possible séparation :

- Notification Service
- AI Service
- Billing Service

Mais uniquement lorsque nécessaire.

---

# 🚫 Choix volontairement évités

## Microservices dès le début

Non recommandé.

Pourquoi :

- complexité inutile
- coût supérieur
- maintenance plus difficile

---

## GraphQL

Non nécessaire.

REST suffit pour ce type d'application.

---

## Serverless complet

Non adapté au besoin métier.

---

# ✅ Conclusion

L'architecture Uber's Clap est pensée pour commencer comme un MVP mobile simple tout en gardant une base capable d'évoluer vers un SaaS professionnel utilisé par plusieurs milliers de chauffeurs.
