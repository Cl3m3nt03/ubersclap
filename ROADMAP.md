# 🛣️ ROADMAP.md

# Uber's Clap

> Plan de développement du projet

Version : 0.1.0

---

# 📖 Introduction

Cette roadmap définit les différentes étapes nécessaires pour construire Uber's Clap.

L'objectif est de commencer par un MVP simple mais utilisable, puis d'ajouter progressivement des fonctionnalités avancées.

La priorité est de créer une application apportant une vraie valeur quotidienne aux chauffeurs VTC.

---

# 🎯 Objectif MVP

Créer une première version permettant à un chauffeur indépendant de :

- créer son compte
- gérer ses clients
- créer ses courses
- organiser son planning
- générer des factures
- suivre son activité

---

# Phase 0 — Préparation du projet

## Objectif

Mettre en place les fondations techniques.

---

## Tâches

### Documentation

- [x] Définition de la vision produit
- [x] Documentation métier
- [x] Choix stack technique
- [x] Architecture système

---

### Infrastructure

- [ ] Création repository GitHub
- [ ] Configuration Git
- [ ] Configuration Docker
- [ ] Mise en place environnements

---

# Phase 1 — Base technique

## Objectif

Créer l'environnement de développement.

---

## Backend

- [ ] Initialisation NestJS
- [ ] Configuration PostgreSQL
- [ ] Configuration ORM
- [ ] Configuration Redis
- [ ] Swagger API
- [ ] Gestion variables environnement

---

## Mobile

- [ ] Création projet React Native Expo
- [ ] Configuration TypeScript
- [ ] Navigation
- [ ] Architecture dossiers
- [ ] Design system de base

---

# Phase 2 — Authentification

## Objectif

Permettre au chauffeur d'avoir son espace personnel.

---

Fonctionnalités :

- [ ] Inscription
- [ ] Connexion
- [ ] Déconnexion
- [ ] Refresh Token
- [ ] Gestion profil
- [ ] Modification informations personnelles

---

# Phase 3 — Gestion clients

## Objectif

Créer le CRM chauffeur.

---

Fonctionnalités :

- [ ] Liste clients
- [ ] Recherche
- [ ] Création client
- [ ] Modification client
- [ ] Suppression client
- [ ] Historique client
- [ ] Import contacts téléphone

---

# Phase 4 — Gestion des courses

## Objectif

Créer le cœur métier.

---

Fonctionnalités :

- [ ] Création course
- [ ] Modification course
- [ ] Suppression course
- [ ] Types de courses
- [ ] Gestion statuts
- [ ] Association client
- [ ] Association véhicule
- [ ] Notes privées

---

# Phase 5 — Planning

## Objectif

Permettre au chauffeur d'organiser son activité.

---

Fonctionnalités :

- [ ] Vue journée
- [ ] Vue semaine
- [ ] Vue mois
- [ ] Ajout rapide course
- [ ] Détection conflits horaires
- [ ] Notifications planning

---

# Phase 6 — Cartographie

## Objectif

Automatiser les informations trajet.

---

Fonctionnalités :

- [ ] Google Maps API
- [ ] Autocomplete adresse
- [ ] Calcul distance
- [ ] Calcul durée
- [ ] Estimation coût trajet

---

# Phase 7 — Signature numérique

## Objectif

Créer une preuve de prestation.

---

Fonctionnalités :

- [ ] Interface signature client
- [ ] Sauvegarde signature
- [ ] Association course
- [ ] Génération document

---

# Phase 8 — Facturation

## Objectif

Permettre au chauffeur de gérer son administratif.

---

Fonctionnalités :

- [ ] Création facture automatique
- [ ] Numérotation
- [ ] Génération PDF
- [ ] Envoi email
- [ ] Suivi paiement

---

# Phase 9 — Gestion financière

## Objectif

Calculer la rentabilité réelle.

---

Fonctionnalités :

## Dépenses

- [ ] Essence
- [ ] Péages
- [ ] Parking
- [ ] Entretien

---

## Analyse

- [ ] Coût kilomètre
- [ ] Bénéfice réel
- [ ] Evolution revenus

---

# Phase 10 — Dashboard

## Objectif

Donner une vision rapide.

---

Fonctionnalités :

- [ ] Chiffre affaires
- [ ] Nombre courses
- [ ] Distance parcourue
- [ ] Temps travaillé
- [ ] Dépenses
- [ ] Graphiques

---

# Phase 11 — Automatisation

## Objectif

Réduire les actions manuelles.

---

Fonctionnalités :

- [ ] SMS confirmation
- [ ] Rappel automatique
- [ ] Email facture
- [ ] Notifications intelligentes

---

# Phase 12 — Intelligence artificielle

## Objectif

Créer un assistant métier.

---

Fonctionnalités :

- [ ] Création course depuis texte
- [ ] Analyse activité
- [ ] Conseils revenus
- [ ] Optimisation planning
- [ ] Assistant conversationnel

---

# Phase 13 — Version Business

## Objectif

Passer d'un chauffeur indépendant à une entreprise VTC.

---

Fonctionnalités :

- [ ] Organisations
- [ ] Gestion équipes
- [ ] Plusieurs chauffeurs
- [ ] Répartition courses
- [ ] Statistiques équipe

---

# Phase 14 — Marketplace et intégrations

## Objectif

Créer un écosystème.

---

Possibilités :

- Connexion Uber
- Connexion Bolt
- Partenaires assurance
- Partenaires entretien véhicule
- Services financiers

---

# Priorisation MVP

## Must Have

Indispensable au lancement :

✅ Authentification
✅ Clients
✅ Courses
✅ Planning
✅ Factures PDF
✅ Dashboard simple

---

## Should Have

Important mais après :

🟡 SMS automatiques
🟡 Signature
🟡 Dépenses
🟡 Gestion véhicule

---

## Nice To Have

Evolution :

🟢 IA
🟢 Multi chauffeurs
🟢 Marketplace
🟢 Intégrations externes

---

# Objectif final

Construire une application qui devient le centre de gestion complet du chauffeur VTC.

L'utilisateur doit pouvoir démarrer sa journée, gérer ses courses, suivre son argent et terminer sa journée sans utiliser d'autres outils.
