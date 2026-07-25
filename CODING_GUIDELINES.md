# 👨‍💻 CODING_GUIDELINES.md

# Cadance

> Guide de développement et standards de code

Version : 0.1.0

---

# 📖 Introduction

Ce document définit les règles de développement utilisées sur Cadance.

Les objectifs sont :

- garder un code maintenable
- faciliter le travail en équipe
- réduire les bugs
- accélérer les évolutions
- garantir une qualité professionnelle

---

# 🎯 Principes généraux

Le projet suit plusieurs principes :

## Clean Code

Le code doit être :

- lisible
- simple
- documenté quand nécessaire
- facilement modifiable

---

## DRY

Don't Repeat Yourself.

Éviter :

- duplication logique
- fonctions identiques
- composants copiés

---

## KISS

Keep It Simple.

Ne pas créer une complexité inutile.

---

## Separation of Concerns

Chaque partie possède une responsabilité claire.

Exemple :

```
Controller

↓

Service

↓

Repository

↓

Database
```

---

# 📁 Organisation des repositories

Le projet utilise deux repositories.

---

# Mobile

```
ubers-clap-mobile

src

├── app

├── screens

├── components

├── hooks

├── services

├── stores

├── utils

├── types

└── assets

```

---

# Backend

```
ubers-clap-api

src

├── modules

│   ├── auth

│   ├── users

│   ├── clients

│   ├── courses

│   ├── invoices

│   └── expenses

│

├── common

├── database

├── config

└── main.ts

```

---

# 📦 Architecture Backend

Chaque module suit cette structure :

```
courses

├── courses.controller.ts

├── courses.service.ts

├── courses.module.ts

├── courses.repository.ts

├── dto

├── entities

└── tests

```

---

# Controller

Responsabilité :

- recevoir requête HTTP
- validation entrée
- retourner réponse

Ne contient PAS :

- logique métier
- requêtes SQL complexes

---

# Service

Responsabilité :

- logique métier
- règles application
- orchestration

Exemple :

Créer une course :

1. Vérifier client
2. Vérifier disponibilité
3. Calculer prix
4. Enregistrer

---

# Repository

Responsabilité :

- accès base données
- requêtes

---

# DTO

Tous les inputs API doivent utiliser des DTO.

Exemple :

```ts
CreateCourseDto;

{
  clientId: string;
  date: string;
  price: number;
}
```

---

# 📱 Architecture Mobile

---

# Components

Un composant doit faire une seule chose.

Mauvais :

```
HugeComponent.tsx
1000 lignes
```

---

Correct :

```
CourseCard.tsx

CourseForm.tsx

CourseList.tsx

```

---

# Hooks

Créer des hooks pour la logique réutilisable.

Exemple :

```ts
useCourses();

useAuth();

useProfile();
```

---

# Services API

Toutes les requêtes passent par :

```
services/
```

Jamais directement dans les composants.

---

# State Management

Séparer :

## Server State

Utiliser :

TanStack Query

---

## Client State

Utiliser :

Zustand

Pour :

- utilisateur connecté
- préférences
- configuration

---

# 📝 Naming Convention

---

# Fichiers

Utiliser :

camelCase

Exemple :

```
course.service.ts

client-card.tsx

```

---

# Classes

PascalCase.

Exemple :

```ts
CourseService;
```

---

# Variables

camelCase.

Exemple :

```ts
courseId;

clientName;
```

---

# Constantes

UPPER_CASE.

Exemple :

```ts
MAX_FILE_SIZE;
```

---

# Types

PascalCase.

Exemple :

```ts
CourseStatus;
```

---

# TypeScript

Activer :

```json
strict:true
```

---

# Éviter

```ts
any;
```

---

Préférer :

```ts
unknown;
```

ou un type précis.

---

# 🧪 Tests

Objectif :

Maintenir une application fiable.

---

# Backend

Tests :

## Unitaires

Tester :

- services
- logique métier

---

## Integration

Tester :

- API
- database

---

# Mobile

Tester :

- composants
- navigation
- formulaires

---

# Couverture recommandée

Objectif :

```
80%
```

sur la logique critique.

---

# 🔀 Git Workflow

---

# Branches

Structure :

```
main

develop

feature/*

bugfix/*

hotfix/*
```

---

# Exemple

Nouvelle fonctionnalité :

```
feature/course-creation
```

---

# Pull Request

Obligatoire avant merge.

---

Une PR doit contenir :

- description
- screenshots si UI
- tests
- changements importants

---

# 📝 Commit Convention

Utiliser :

Conventional Commits.

---

Format :

```
type(scope): message
```

---

Exemples :

```
feat(course): add course creation

fix(auth): refresh token issue

docs(api): update endpoints

refactor(client): improve service

```

---

# Types autorisés

```
feat

fix

docs

style

refactor

test

chore
```

---

# 🔍 Code Review

Vérifier :

## Fonctionnalité

- répond au besoin

---

## Qualité

- code lisible
- pas de duplication

---

## Sécurité

- données protégées
- validation présente

---

## Performance

- requêtes optimisées

---

# 🌱 Variables environnement

Jamais dans Git.

---

Interdit :

```
.env
```

dans repository.

---

Utiliser :

```
.env.example
```

---

# 📚 Documentation code

Documenter uniquement ce qui apporte de la valeur.

---

Mauvais :

```ts
// crée un utilisateur
createUser();
```

---

Bon :

```ts
/**
 * Creates a driver account
 * and sends verification email
 */
```

---

# 🚨 Gestion erreurs

Toujours utiliser des erreurs métier.

Exemple :

```ts
CourseNotAvailableException;
```

---

Éviter :

```ts
throw new Error();
```

partout.

---

# ⚡ Performance

Principes :

- éviter requêtes inutiles
- pagination obligatoire
- cache si nécessaire
- chargement progressif

---

# 📦 Dépendances

Avant d'ajouter une librairie :

Vérifier :

- maintenance
- communauté
- sécurité
- besoin réel

---

# 🏁 Definition of Done

Une fonctionnalité est terminée quand :

✅ Code développé

✅ Tests présents

✅ Documentation mise à jour

✅ Review effectuée

✅ Déployée en staging

---

# Conclusion

Ces règles permettent à Cadance de conserver une base technique professionnelle capable d'évoluer rapidement tout en restant maintenable par plusieurs développeurs.
