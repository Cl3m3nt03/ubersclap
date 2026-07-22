# 🚀 MVP_SCOPE.md

# Uber's Clap

> Définition du périmètre MVP (Version 1.0)

Version : 0.1.0

---

# 📖 Introduction

Le MVP (Minimum Viable Product) représente la première version exploitable d'Uber's Clap.

L'objectif est de sortir rapidement une application utile aux chauffeurs VTC indépendants.

Le MVP doit résoudre le problème principal :

> "Permettre à un chauffeur VTC de gérer ses clients, ses courses et son activité depuis une seule application."

---

# 🎯 Objectif MVP

À la fin du MVP, un chauffeur doit pouvoir :

✅ Créer son compte professionnel
✅ Ajouter ses clients
✅ Organiser ses courses
✅ Visualiser son planning
✅ Générer des factures
✅ Suivre son activité principale

---

# 🧩 Fonctionnalités incluses MVP

---

# 1. Authentification

## Priorité

P0 — Obligatoire

---

Fonctionnalités :

- Création compte
- Connexion
- Déconnexion
- Gestion session
- Profil chauffeur

---

Informations profil :

- Nom
- Prénom
- Téléphone
- Email
- Société
- Logo

---

# 2. Dashboard principal

## Priorité

P0

---

Objectif :

Donner une vision immédiate de la journée.

---

Afficher :

## Aujourd'hui

- Nombre de courses
- Prochaine course
- Revenus estimés
- Temps travaillé

---

Exemple :

```
Bonjour Jean 👋

Aujourd'hui :

🚗 6 courses

💰 420€

📍 145 km

Prochaine course :
14h30 CDG → Paris
```

---

# 3. Gestion clients

## Priorité

P0

---

Fonctionnalités :

- Liste clients
- Recherche
- Création client
- Modification
- Suppression
- Historique simple

---

Informations :

- Nom
- Prénom
- Téléphone
- Email
- Adresse favorite
- Notes

---

# 4. Gestion des courses

## Priorité

P0

---

Fonctionnalité principale.

---

Créer une course :

Informations :

## Client

- Client existant
- Nouveau client

---

## Trajet

- Départ
- Destination

---

## Horaire

- Date
- Heure

---

## Tarif

- Prix prévu
- Prix final

---

## Options

- Aller simple
- Aller retour
- Aéroport
- Gare

---

Statuts disponibles :

```
Prévue

Confirmée

En cours

Terminée

Annulée
```

---

# 5. Planning

## Priorité

P0

---

Fonctionnalités :

- Vue journée
- Vue semaine

---

Actions :

- Voir courses
- Modifier course
- Ajouter course

---

# 6. Facturation simple

## Priorité

P0

---

Objectif :

Créer rapidement une facture.

---

Fonctionnalités :

- Génération PDF
- Numérotation automatique
- Informations chauffeur
- Informations client
- Prix course

---

# 7. Notifications basiques

## Priorité

P1

---

Fonctionnalités :

- Rappel prochaine course
- Notification nouvelle course

---

# 🟡 Fonctionnalités reportées

Ces fonctionnalités sont importantes mais hors MVP.

---

# Signature numérique

Version future :

- Signature tactile client
- Preuve prestation

---

# Gestion dépenses

Version future :

- Essence
- Péage
- Entretien
- Rentabilité

---

# IA

Version future :

- Création course automatique
- Assistant métier

---

# SMS automatique

Version future :

- Confirmation client
- Rappel réservation

---

# Multi véhicules

Version future :

- Plusieurs voitures
- Flotte

---

# Multi chauffeurs

Version entreprise.

---

# Marketplace

Hors roadmap initiale.

---

# 📱 Écrans MVP nécessaires

---

# Auth

```
Splash

↓

Login

↓

Register

```

---

# Application principale

Navigation :

```
Dashboard

Planning

Courses

Clients

Profil

```

---

# Écrans détaillés

---

## Dashboard

Contient :

- résumé journée
- prochaine course
- statistiques simples

---

## Planning

Contient :

- calendrier
- liste courses

---

## Course

Pages :

- liste courses
- détail course
- création course
- modification course

---

## Client

Pages :

- liste clients
- détail client
- création client

---

## Facture

Pages :

- liste factures
- détail facture
- export PDF

---

# 🏗️ Découpage développement

---

# Sprint 1

## Fondations

Durée estimée :

1-2 semaines

---

Tâches :

- Setup backend
- Setup mobile
- Database
- Auth

---

# Sprint 2

## Clients

Durée :

1 semaine

---

Tâches :

- CRUD clients
- Recherche
- Interface mobile

---

# Sprint 3

## Courses

Durée :

2 semaines

---

Tâches :

- Création course
- Statuts
- Historique

---

# Sprint 4

## Planning

Durée :

1 semaine

---

Tâches :

- Calendrier
- Organisation journée

---

# Sprint 5

## Facturation

Durée :

1 semaine

---

Tâches :

- Génération PDF
- Historique facture

---

# Sprint 6

## Stabilisation

Durée :

1-2 semaines

---

Tâches :

- Tests
- Corrections
- Optimisation
- Beta utilisateurs

---

# ✅ Critères validation MVP

Le MVP est considéré terminé quand :

---

## Utilisateur

Un chauffeur peut :

✅ créer un compte

✅ ajouter un client

✅ créer une course

✅ retrouver la course dans son planning

✅ terminer une course

✅ générer une facture

---

## Technique

Le système doit avoir :

✅ API fonctionnelle

✅ Base sécurisée

✅ Application mobile stable

✅ Déploiement staging

---

# 🎯 Objectif Beta

Tester avec :

```
10-50 chauffeurs VTC
```

Objectifs :

- récolter feedback
- identifier problèmes
- améliorer UX

---

# Conclusion

Le MVP Uber's Clap doit rester simple mais apporter une vraie valeur quotidienne.

La priorité est de créer un outil fiable que les chauffeurs ouvrent chaque jour, avant d'ajouter des fonctionnalités avancées.
