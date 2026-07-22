# 🛠️ STACK.md

# Uber's Clap

> Documentation technique - Choix de la stack

Version : 0.1.0

---

# 📖 Introduction

Uber's Clap est une application mobile SaaS destinée aux chauffeurs VTC.

Le choix technique doit répondre à plusieurs objectifs :

- Rapidité de développement
- Maintenance long terme
- Scalabilité
- Expérience mobile fluide
- Sécurité des données
- Facilité d'évolution

La stack choisie privilégie un environnement moderne basé sur TypeScript afin d'avoir une cohérence entre le mobile et le backend.

---

# 🏗️ Architecture globale

```
┌─────────────────────┐
│                     │
│  Application Mobile │
│ React Native + Expo │
│                     │
└──────────┬──────────┘
           │
           │ HTTPS REST API
           │
┌──────────▼──────────┐
│                     │
│      Backend        │
│       NestJS        │
│                     │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌────▼────┐
│Postgres │ │ Redis   │
│Database │ │ Queue   │
└─────────┘ └─────────┘

```

---

# 📱 MOBILE

# React Native

## Choix

React Native sera utilisé pour développer l'application mobile.

---

## Pourquoi React Native ?

Avantages :

- Une seule base de code Android/iOS
- Très grande communauté
- Ecosystème mature
- Développement rapide
- Compatible avec les APIs natives

---

## Alternative étudiée

### Flutter

Avantages :

- Très performant
- UI contrôlée

Inconvénients :

- Dart supplémentaire
- Ecosystème différent
- Moins cohérent avec TypeScript

---

# Expo

## Choix

Expo sera utilisé comme environnement mobile.

---

## Avantages

- Simplification du développement
- Build automatique
- Notifications natives
- Mise à jour OTA
- Gestion caméra/GPS/signature

---

# Langage

## TypeScript

Toute l'application utilise TypeScript.

---

## Pourquoi ?

- Typage fort
- Réduction des erreurs
- Meilleure maintenance
- Partage de modèles entre projets

---

# UI MOBILE

## NativeWind

Utilisation de Tailwind CSS dans React Native.

---

Avantages :

- Rapidité de développement
- Design cohérent
- Réutilisation des composants

---

# Gestion état serveur

## TanStack Query

Utilisé pour :

- appels API
- cache
- synchronisation
- loading states

---

# Formulaires

## React Hook Form

Gestion :

- création client
- création course
- factures

---

# Validation

## Zod

Utilisé pour :

- validation formulaire
- validation API
- partage des schemas

---

# Navigation

## React Navigation

Gestion :

- écrans
- routes
- navigation utilisateur

---

# Animation

## React Native Reanimated

Utilisé pour :

- transitions
- animations fluides
- interactions modernes

---

# 🔥 BACKEND

# NestJS

## Choix

NestJS sera utilisé pour l'API backend.

---

## Pourquoi ?

- Architecture professionnelle
- Modules séparés
- Compatible TypeScript
- Très adapté aux applications SaaS

---

# Architecture backend

Organisation :

```
src

├── auth

├── users

├── clients

├── courses

├── invoices

├── expenses

├── vehicles

├── notifications

├── statistics

└── ai

```

---

# API

## REST API

Le projet utilise une API REST.

---

Pourquoi ?

- Simple
- Stable
- Facile à documenter
- Suffisant pour l'application

---

# Documentation API

## Swagger

Permet :

- documentation automatique
- tests API
- onboarding développeur

---

# 🗄️ DATABASE

# PostgreSQL

## Choix

PostgreSQL sera la base principale.

---

Pourquoi ?

Les données sont fortement relationnelles :

Exemple :

Client

↓

Courses

↓

Factures

↓

Paiements

---

Avantages :

- Fiabilité
- Performances
- Relations complexes
- Open source

---

# Extension géographique

## PostGIS

Ajout possible pour :

- coordonnées GPS
- recherche distance
- optimisation trajet

---

# ORM

## Drizzle ORM

Choix recommandé.

---

Pourquoi ?

- Très proche du SQL
- Performances élevées
- Typage TypeScript
- Contrôle complet

---

Alternative :

## Prisma

Avantages :

- Très simple
- Très populaire

Inconvénient :

- Plus abstrait

---

# ⚡ CACHE ET JOBS

# Redis

Utilisé pour :

- cache
- sessions temporaires
- tâches asynchrones

---

# BullMQ

Gestion des tâches en arrière-plan.

Exemples :

- génération PDF
- envoi SMS
- rappels automatiques
- notifications

---

# 🗺️ SERVICES EXTERNES

# Google Maps Platform

Utilisation :

- calcul trajet
- distance
- temps estimé
- géocoding
- autocomplete adresse

---

# Firebase Cloud Messaging

Notifications mobiles.

Exemples :

- nouvelle réservation
- rappel course
- facture disponible

---

# Resend

Emails transactionnels.

Utilisation :

- facture
- confirmation
- notifications

---

# Twilio / Brevo SMS

Messages clients.

Utilisation :

- rappels
- confirmations

---

# Cloudflare R2

Stockage fichiers.

Utilisation :

- PDF
- documents
- signatures
- justificatifs

---

# Stripe

Paiements futurs.

Utilisation :

- abonnement Premium
- abonnement Business

---

# 🤖 IA

# OpenAI API

Utilisation :

Assistant métier.

Fonctionnalités :

- création course automatique
- analyse activité
- recommandations

---

# 📊 ANALYTICS

# PostHog

Utilisation :

Comprendre :

- écrans utilisés
- fonctionnalités populaires
- parcours utilisateur

---

# 🐛 MONITORING

# Sentry

Utilisation :

- erreurs mobile
- erreurs backend
- performance

---

# 🔐 SECURITY

## Authentification

Solution :

JWT + Refresh Token

---

Fonctionnalités :

- sessions sécurisées
- expiration token
- renouvellement automatique

---

# Protection API

Mise en place :

- Rate limiting
- Validation DTO
- Guards NestJS
- Permissions

---

# 🐳 DEVOPS

# Docker

Utilisation :

Conteneurisation :

- backend
- database
- redis

---

# CI/CD

GitHub Actions.

Automatisation :

- tests
- lint
- build
- déploiement

---

# ENVIRONNEMENTS

## Development

Local développeur.

---

## Staging

Tests avant production.

---

## Production

Application réelle.

---

# 📌 Résumé final

| Domaine           | Technologie             |
| ----------------- | ----------------------- |
| Mobile            | React Native + Expo     |
| Langage           | TypeScript              |
| UI                | NativeWind              |
| Backend           | NestJS                  |
| API               | REST                    |
| Documentation API | Swagger                 |
| Database          | PostgreSQL              |
| ORM               | Drizzle                 |
| Cache             | Redis                   |
| Jobs              | BullMQ                  |
| Maps              | Google Maps             |
| Notifications     | Firebase                |
| Emails            | Resend                  |
| SMS               | Twilio/Brevo            |
| Storage           | Cloudflare R2           |
| Paiement          | Stripe                  |
| Monitoring        | Sentry                  |
| Analytics         | PostHog                 |
| IA                | OpenAI API              |
| DevOps            | Docker + Github Actions |

---

# Conclusion

Cette stack permet de construire une application mobile professionnelle capable d'évoluer d'un MVP vers un véritable SaaS métier utilisé par des milliers de chauffeurs.
