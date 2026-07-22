# 📋 PRODUCT_REQUIREMENTS_DOCUMENT.md

# Uber's Clap

> Product Requirements Document (PRD)

Version : 0.1.0

---

# 📖 Introduction

Uber's Clap est une application mobile professionnelle destinée aux chauffeurs VTC indépendants.

L'objectif est de centraliser toute la gestion quotidienne d'un chauffeur dans une seule application :

- organisation des courses
- gestion clients
- planning
- facturation
- suivi financier
- automatisation administrative

---

# 🎯 Vision produit

Créer l'assistant professionnel indispensable pour les chauffeurs VTC.

Aujourd'hui, beaucoup de chauffeurs utilisent plusieurs outils :

- agenda téléphone
- Excel
- WhatsApp
- notes personnelles
- applications de facturation

Uber's Clap regroupe tout dans une seule plateforme.

---

# ❌ Problème actuel

Les chauffeurs indépendants rencontrent plusieurs difficultés :

---

## Organisation

Problèmes :

- oubli de courses
- mauvaise gestion du temps
- difficulté à organiser plusieurs réservations

---

## Gestion clients

Problèmes :

- contacts dispersés
- aucune vision historique
- difficulté à fidéliser

---

## Administratif

Problèmes :

- création factures manuelle
- suivi paiement compliqué
- perte de temps

---

## Rentabilité

Problèmes :

- difficulté à connaître le vrai bénéfice
- dépenses mal suivies
- absence de statistiques

---

# 💡 Solution proposée

Une application mobile permettant de :

```
Planifier

↓

Réaliser

↓

Facturer

↓

Analyser

```

chaque course.

---

# 👥 Personas utilisateurs

---

# Persona 1 — Chauffeur indépendant

## Profil

Nom :

Jean

Âge :

35 ans

Métier :

Chauffeur VTC indépendant

---

## Situation

Jean travaille seul.

Il possède son véhicule.

Il gère environ :

```
5 à 15 courses par jour
```

---

## Problèmes

- Beaucoup de messages clients
- Difficulté à suivre ses revenus
- Temps administratif important

---

## Objectif

"Je veux passer moins de temps à gérer et plus de temps à conduire."

---

# Persona 2 — Chauffeur premium

## Profil

Sophie

Chauffe principalement :

- entreprises
- hôtels
- événements

---

## Besoin

- fidéliser clients
- envoyer confirmations professionnelles
- avoir une image premium

---

# Persona 3 — Petite entreprise VTC

## Profil

Entreprise :

5 chauffeurs

---

## Besoin

- planning partagé
- suivi activité
- gestion équipe

---

# 🎯 Objectifs produit

---

# Court terme

Créer un MVP permettant :

✅ Gestion clients

✅ Gestion courses

✅ Planning

✅ Factures

✅ Dashboard simple

---

# Moyen terme

Ajouter :

- automatisations
- statistiques avancées
- gestion dépenses
- IA

---

# Long terme

Devenir :

"La plateforme complète de gestion VTC."

---

# 📱 Parcours utilisateur principal

---

# Première utilisation

```mermaid
flowchart LR

A[Création compte]

B[Configuration profil]

C[Ajout véhicule]

D[Ajout premier client]

E[Création première course]

F[Utilisation quotidienne]


A --> B
B --> C
C --> D
D --> E
E --> F

```

---

# Parcours quotidien

```mermaid
flowchart LR

A[Ouverture application]

B[Voir planning]

C[Effectuer course]

D[Mettre statut terminé]

E[Facturer]

F[Analyser journée]


A --> B
B --> C
C --> D
D --> E
E --> F

```

---

# 📌 User Stories

---

# Authentification

## US-001

En tant que chauffeur,

je veux créer un compte,

afin d'utiliser l'application.

Critères :

- inscription fonctionnelle
- validation email
- connexion possible

---

# Clients

## US-010

En tant que chauffeur,

je veux créer un client,

afin de retrouver rapidement ses informations.

Critères :

- nom obligatoire
- téléphone obligatoire
- historique disponible

---

# Courses

## US-020

En tant que chauffeur,

je veux créer une course,

afin d'organiser mon planning.

Critères :

- client obligatoire
- date obligatoire
- trajet obligatoire

---

# Planning

## US-030

En tant que chauffeur,

je veux voir mes courses dans un calendrier,

afin d'organiser ma journée.

Critères :

- vue jour
- vue semaine
- accès rapide détail

---

# Facturation

## US-040

En tant que chauffeur,

je veux générer une facture,

afin de professionnaliser mon activité.

Critères :

- PDF généré
- numéro facture
- informations client

---

# Statistiques

## US-050

En tant que chauffeur,

je veux voir mes revenus,

afin de connaître ma rentabilité.

Critères :

- revenus
- dépenses
- bénéfices

---

# 🤖 IA

## US-060

En tant que chauffeur,

je veux créer une course avec un message,

afin de gagner du temps.

Exemple :

"Demain 10h gare Lyon pour Dupont"

---

# 📊 Indicateurs de réussite

---

# Activation

Objectif :

Un nouvel utilisateur doit réaliser rapidement :

- création profil
- premier client
- première course

---

# Engagement

Mesurer :

- courses créées/semaine
- clients ajoutés
- temps passé dans application

---

# Rétention

Mesurer :

- utilisateurs actifs
- abonnement conservé
- utilisation mensuelle

---

# Business

Mesurer :

- conversion Premium
- revenu mensuel
- satisfaction utilisateur

---

# 🚫 Hors périmètre MVP

Pour éviter la complexité :

Pas dans la première version :

❌ Marketplace

❌ Paiement intégré

❌ IA avancée

❌ Multi chauffeurs

❌ Connexion Uber/Bolt

---

# Priorité fonctionnalités

## P0 — Obligatoire

- Auth
- Clients
- Courses
- Planning
- Factures

---

## P1 — Important

- Dépenses
- Notifications
- Signature
- Dashboard avancé

---

## P2 — Evolution

- IA
- Multi chauffeurs
- Marketplace

---

# Contraintes produit

---

# Mobile First

L'application doit être pensée pour être utilisée :

- rapidement
- en déplacement
- avec une seule main

---

# Performance

Objectifs :

Ouverture application :

< 2 secondes

---

Action principale :

< 1 seconde

---

# Simplicité

Un chauffeur ne doit pas avoir besoin d'une formation.

---

# Conclusion

Uber's Clap doit devenir l'outil central de gestion quotidienne des chauffeurs VTC.

La réussite du produit dépendra de sa capacité à faire gagner du temps et améliorer la rentabilité des professionnels.
