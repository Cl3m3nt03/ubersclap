# 🎨 DESIGN_DIRECTION.md

# Uber's Clap — Direction artistique

> Document manquant, référencé par le README sous le nom `UI_UX.md`.

Version : 2.0.0 — 2026-07-22

**Source de vérité visuelle :** le projet Superdesign
`superdesign.dev/share/dc47d2a2…2490c1` — 5 pages, 2 composants, design
context sauvegardé.

Ce document ne propose pas une direction : il **transcrit celle qui est déjà
validée**, la porte en React Native, et liste les points à corriger avant de
coder.

---

# La direction retenue

Clair, vibrant, gradients, formes très arrondies, généreux en espace.
Typo unique : **Plus Jakarta Sans**.

Le registre est celui d'une app grand public moderne, pas d'un outil de gestion
austère. C'est un choix cohérent : le chauffeur doit avoir envie de l'ouvrir
plusieurs fois par jour (c'est l'indicateur de succès n°1 de `BUSINESS.md`), et
un outil qui ressemble à un logiciel comptable ne déclenche pas ça.

---

# Tokens

À figer dans `packages/shared/design-tokens.ts` (voir ADR-002 du canon), pour
être consommés à la fois par NativeWind et par le générateur de PDF.

```ts
export const color = {
  // Gradients — cartes de mise en avant
  teal:   ['#0D9488', '#2DD4BF'], // CA, valeurs positives
  coral:  ['#F43F5E', '#FB7185'], // courses, volume
  purple: ['#7C3AED', '#A78BFA'], // temps, heures

  // Aplats
  indigo:     '#4F46E5', // primaire : CTA, onglet actif
  indigoSoft: '#818CF8',

  bg:      '#FDFDFD',
  surface: '#FFFFFF',

  ink:      '#1A1C1E',
  inkMuted: '#6B7280',
  inkFaint: '#9CA3AF',

  // Sémantique — à figer, absents du design context
  success: '#059669', // payé, encaissé
  warning: '#D97706', // en attente, retard
  danger:  '#DC2626', // annulé, conflit
} as const;

export const radius = {
  sm:   12, // chips, badges
  md:   16, // boutons, inputs
  lg:   24, // cartes
} as const;

export const space = {
  screen:  24, // padding horizontal d'écran
  card:    20,
  section: 32, // entre deux blocs
  grid:    16, // entre cartes d'une grille
} as const;

export const font = {
  family: 'PlusJakartaSans',
  // poids réellement utilisés
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extra: 800 },
} as const;
```

## Rôle de chaque couleur

Règle à tenir, sinon le vibrant devient du bruit :

| Couleur    | Signifie                    | Où                                   |
| ---------- | --------------------------- | ------------------------------------ |
| Teal       | L'argent gagné              | Carte CA, montants encaissés         |
| Coral      | Le volume d'activité        | Nombre de courses                    |
| Purple     | Le temps                    | Heures travaillées, durées           |
| Indigo     | L'action et la navigation   | CTA, onglet actif, liens             |
| Success    | Payé                        | Badges de facture                    |
| Warning    | En attente                  | Badges, rappels                      |
| Danger     | Annulé, conflit             | Badges, alertes de planning          |

Un gradient signale **une valeur importante**, jamais une décoration. Trois
gradients maximum par écran — au-delà, plus rien ne ressort.

---

# Points à corriger avant de coder

Le design system actuel vient d'un prototype HTML. Six points cassent en usage
réel ou en React Native. Chacun coûte peu maintenant, cher plus tard.

## 1. Chiffres tabulaires — manquant, critique

Aucune mention de `tabular-nums` dans le design context. Sans ça, dans une liste
de courses, `120,00 €` et `65,00 €` ne s'alignent pas verticalement : les
chiffres ont des largeurs différentes, la colonne devient illisible.

C'est **l'app d'un chauffeur qui lit des montants en 2 secondes**. Non
négociable :

```ts
// composant MoneyText, à écrire AVANT tout écran
style={{ fontVariant: ['tabular-nums'] }}
```

Idem pour les heures et les distances. À encapsuler dans `MoneyText`, `TimeText`,
`DistanceText` — jamais dispersé dans les écrans.

## 2. Cibles tactiles : 44 px insuffisant

Le design context dit « minimum 44px tap targets ». C'est la norme iOS pour un
usage assis, au calme, à deux mains.

Contexte réel ici : dans une voiture, une seule main, parfois des gants,
véhicule qui peut bouger.

**Recommandation :** 56 px pour toute action primaire (CTA, boutons de la barre
d'onglets, boutons d'appel client). 44 px acceptable pour le secondaire.

## 3. Aucun mode sombre

Le système est entièrement clair (`#FDFDFD`). Une part importante de l'activité
VTC est nocturne — un écran blanc plein phare dans un habitacle la nuit
éblouit et met plusieurs secondes à se dissiper.

**Recommandation :** prévoir la variante sombre **dès les tokens**, même si elle
n'est implémentée qu'en v1.1. Ajouter le mode sombre après coup implique de
reprendre chaque écran.

Les gradients teal / coral / purple fonctionnent tels quels sur fond sombre. Ce
qui change : `bg`, `surface`, `ink*`.

## 4. Le titre en gradient coûte cher en React Native

```html
<h1 class="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">
```

`background-clip: text` n'existe pas en React Native. Il faut
`@react-native-masked-view` + `expo-linear-gradient` pour chaque titre — trois
composants imbriqués pour un effet décoratif, sur un élément présent sur les
5 écrans.

**Recommandation :** titre en `indigo` plein. Garder les gradients sur les
cartes, où ils portent une information (voir tableau des rôles). Le titre gagne
en contraste et l'écran en lisibilité.

## 5. Labels 10 px trop petits

`text-[10px] font-black uppercase` sur la barre d'onglets. En majuscules,
graisse 900, à 10 px, dans une voiture : illisible.

**Recommandation :** 12 px minimum, graisse 700 plutôt que 900. Les majuscules
en graisse très lourde perdent en lisibilité, elles ne la gagnent pas.

## 6. Navigation incohérente avec les pages

La barre a 4 onglets : **Tableau · Agenda · Bilan · Profil**.
Les pages créées sont : Tableau de Bord, Calendrier, Nouvelle Course, Mes
Factures, Carnet Clients.

→ **Factures** et **Clients** n'ont aucun onglet. Ce sont pourtant deux des
usages quotidiens. Et **Bilan** n'a pas de page.

Deux options :

**A.** 5 onglets : Tableau · Agenda · Clients · Factures · Profil.
Le Bilan devient une section du Tableau. Simple, tout est atteignable en un tap.

**B.** Garder 4 onglets, et atteindre Clients et Factures depuis les « Accès
rapides » du Tableau. Barre plus aérée, mais deux taps pour des écrans
quotidiens.

**Recommandation : A.** « Facturer » est l'action qui justifie l'abonnement
(voir ADR-015 du canon, le mur du plan gratuit est sur la facture). L'enterrer
à deux taps est contre-productif.

---

# Portage React Native

Le design context est du Tailwind web avec Alpine. Traductions nécessaires :

| Prototype HTML                  | React Native                            |
| ------------------------------- | --------------------------------------- |
| `bg-gradient-to-br`             | `expo-linear-gradient`                  |
| `shadow-[0_-4px_20px_...]`      | `elevation` (Android) + `shadow*` (iOS) |
| `<iconify-icon icon="lucide:…">`| `lucide-react-native`                   |
| `:href` / `@click` (Alpine)     | `onPress`, `expo-router` `<Link>`       |
| `backdrop-blur`                 | `expo-blur` `<BlurView>`                |
| `hover:` / `transition-*`       | `Pressable` + `react-native-reanimated` |
| `active:scale-95`               | `Pressable` + `useAnimatedStyle`        |
| `pt-14` / `pb-[34px]` (safe area)| `react-native-safe-area-context`       |

Les safe areas codées en dur (`pt-14`, `pb-[34px]`) doivent passer par
`useSafeAreaInsets()`. Les valeurs fixes sont justes sur un iPhone à encoche et
fausses sur tout le reste — y compris sur Android, qui est majoritaire chez les
chauffeurs.

---

# Ordre de construction

```
1. design-tokens.ts          ← packages/shared
2. MoneyText / TimeText      ← garantit tabular-nums + format FR
3. Button                    ← 56px, variantes primary / secondary / ghost
4. Card                      ← radius 24, variantes plain / gradient
5. StatusBadge               ← success / warning / danger
6. PageHeader                ← depuis Superdesign, titre en aplat (point 4)
7. BottomNavigation          ← 5 onglets (point 6), labels 12px (point 5)
8. CourseRow                 ← la ligne de course, réutilisée sur 3 écrans
```

`MoneyText` avant tout écran. Il porte `tabular-nums`, le format français
(virgule décimale, espace insécable avant le `€`) et la conversion depuis les
centimes entiers (ADR-009 du canon). Un formatage d'argent dispersé dans
quarante composants est impossible à rattraper.

---

# Le PDF de facture

Les 5 écrans sont couverts, **le document de facture ne l'est pas** — alors que
c'est le seul artefact qui sort de l'app et qui représente le chauffeur auprès
de son client.

Il ne doit pas reprendre les gradients. Un document commercial se lit et
s'imprime : fond blanc, encre `#1A1C1E`, filets fins, **une seule** touche
d'indigo. La sobriété est ici le signal de professionnalisme.

Contenu obligatoire et règles de numérotation : **ADR-012 du canon** — mentions
légales, TVA 10 % ou franchise, registre VTC, immuabilité, Factur-X.

---

# ⚠️ Rappel

Voir **ADR-016** dans `00_CANON.md`. Le nom du produit contient une marque
déposée activement défendue, sur un produit destiné aux stores. À trancher avant
d'investir davantage dans l'identité visuelle.
