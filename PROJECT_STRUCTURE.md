# 📂 PROJECT_STRUCTURE.md

# Uber's Clap

> Organisation du projet et conventions techniques

Version : 0.1.0

---

# 📖 Introduction

Uber's Clap est composé de plusieurs applications et services.

L'objectif est d'avoir une organisation claire permettant :

- développement parallèle
- maintenance facile
- montée en charge
- collaboration équipe

---

# 🏗️ Organisation générale

Le projet est séparé en plusieurs repositories.

Architecture recommandée :

```
Uber-Clap/

├── mobile/

├── backend/

├── admin/

├── docs/

└── infrastructure/

```

---

# 📱 Mobile Repository

Nom :

```
uber-clap-mobile
```

---

Technologies :

```
React Native

Expo

TypeScript

NativeWind

```

---

Structure :

```
mobile/

├── app/

├── assets/

├── components/

├── features/

├── hooks/

├── services/

├── store/

├── database/

├── utils/

├── types/

├── constants/

├── config/

└── package.json

```

---

# 📁 Dossier app

Gestion navigation.

```
app/

├── index.tsx

├── (auth)/

│   ├── login.tsx

│   └── register.tsx


├── (tabs)/

│   ├── dashboard.tsx

│   ├── planning.tsx

│   ├── courses.tsx

│   ├── clients.tsx

│   └── profile.tsx

```

---

# 🧩 Dossier features

Organisation métier.

---

Exemple :

```
features/

└── courses/

    ├── components/

    ├── hooks/

    ├── api.ts

    ├── schemas.ts

    ├── types.ts

```

---

Avantages :

- code regroupé
- meilleure maintenance
- moins de fichiers dispersés

---

# 🖥️ Backend Repository

Nom :

```
uber-clap-api
```

---

Technologies :

```
NestJS

TypeScript

PostgreSQL

Prisma

Redis

```

---

Structure :

```
backend/

├── src/

│
├── auth/

├── users/

├── drivers/

├── clients/

├── courses/

├── planning/

├── invoices/

├── expenses/

├── notifications/

├── analytics/

├── ai/

│
├── common/

├── database/

├── config/

├── workers/

└── main.ts

```

---

# 🧩 Module Backend

Chaque module suit :

```
module/

├── controller.ts

├── service.ts

├── repository.ts

├── module.ts

├── dto/

├── entities/

└── tests/

```

---

# 🛠️ Admin Repository

Nom :

```
uber-clap-admin
```

---

Objectif :

Back-office interne.

---

Fonctions :

- gestion utilisateurs
- abonnements
- support
- statistiques
- monitoring

---

Technologies :

```
Next.js

TypeScript

Tailwind

```

---

Structure :

```
admin/

├── app/

├── components/

├── features/

├── services/

└── utils/

```

---

# 📚 Documentation Repository

Nom :

```
uber-clap-docs
```

---

Contient :

```
docs/

├── README.md

├── PRD.md

├── ARCHITECTURE.md

├── DATABASE_SCHEMA.md

├── API_DOCUMENTATION.md

├── SECURITY.md

└── ROADMAP.md

```

---

# ☁️ Infrastructure Repository

Nom :

```
uber-clap-infrastructure
```

---

Contient :

- Docker
- CI/CD
- cloud configuration
- monitoring

---

Structure :

```
infrastructure/

├── docker/

├── github-actions/

├── terraform/

├── kubernetes/

└── monitoring/

```

---

# 🌳 Git Workflow

Workflow recommandé :

```
main

↓

develop

↓

feature branches

```

---

# Branches

---

Production :

```
main
```

---

Développement :

```
develop
```

---

Fonctionnalité :

```
feature/course-management
```

---

Correction :

```
fix/payment-error
```

---

Hotfix :

```
hotfix/security-patch
```

---

# 📝 Convention commits

Utiliser :

```
Conventional Commits
```

---

Format :

```
type(scope): message
```

---

Exemples :

```
feat(course): add course creation

fix(auth): refresh token bug

docs(api): update endpoint documentation

```

---

# 📌 Types commits

```
feat

fix

docs

style

refactor

test

chore

perf

```

---

# 🔍 Pull Request

Toute modification passe par PR.

---

Checklist :

☑ Code review

☑ Tests OK

☑ Documentation mise à jour

☑ Pas de secrets

---

# 🔐 Gestion secrets

Interdit :

```
.env

API keys

Passwords

Tokens

```

dans Git.

---

Utiliser :

- GitHub Secrets
- Vault
- Cloud Secret Manager

---

# 📦 Gestion dépendances

Toujours :

- versions contrôlées
- lock files commités

---

Exemple :

```
package-lock.json

pnpm-lock.yaml

```

---

# 🧪 Qualité code

Outils :

---

Lint :

```
ESLint
```

---

Format :

```
Prettier
```

---

Analyse :

```
SonarQube
```

---

# 📊 Documentation code

Obligatoire pour :

- logique complexe
- règles métier
- fonctions critiques

---

Exemple :

```ts
/**
 * Calculate driver profit
 * Revenue - Expenses
 */
```

---

# 🏷️ Versioning

Utiliser :

```
Semantic Versioning
```

Format :

```
MAJOR.MINOR.PATCH
```

---

Exemple :

```
1.2.0
```

---

# 🚀 Environnement

Trois environnements :

---

# Development

```
dev
```

---

# Staging

```
staging
```

---

# Production

```
production
```

---

# Conclusion

Une bonne structure de projet permet à Uber's Clap de rester maintenable pendant toute son évolution.

Cette organisation prépare le projet pour passer d'un développeur seul à une équipe complète.
