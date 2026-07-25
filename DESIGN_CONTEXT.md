# DESIGN_CONTEXT.md — Landing page Cadance

> Source de vérité pour la landing page marketing. À lire au début de chaque session.
> Ne pas dupliquer les tokens produit : ils vivent dans `packages/shared/src/design-tokens.ts`.
> Ce fichier ne décrit que **le web**, ses ajouts et ses règles propres.

---

## 1. Le produit

**Cadance** — application mobile pour chauffeurs VTC indépendants (France).

Le chauffeur jongle aujourd'hui entre WhatsApp, Google Agenda, Maps, Excel, un logiciel de facturation et l'app Notes. Cadance réunit tout : carnet clients, agenda de courses, facturation PDF conforme, dépenses, tableau de bord, **mode hors-ligne complet**.

**Persona cible : le chauffeur VTC généraliste intra-muros.** Il enchaîne des
courses courtes dans Paris — République → Bastille, Montparnasse → Gare du
Nord — environ 200 courses par mois à ~24 € de panier moyen, ~1 300 km à la
vitesse réelle de circulation parisienne (~12 km/h). Pas le spécialiste des
transferts aéroport : les longues courses existent mais restent minoritaires.
Toutes les données de démonstration de la page doivent lui ressembler — c'est
à ce chauffeur-là que le visiteur doit pouvoir se comparer.

**VTC, jamais « taxi ».** VTC et taxi sont deux professions juridiquement
distinctes ; le mot « taxi » n'apparaît nulle part sur la page. Faute
rédhibitoire pour la cible.

**Mission :** passer son temps à conduire plutôt qu'à gérer son administratif.

**Offres :** Solo (indépendant) et Entreprise (plusieurs chauffeurs, rôles Administrateur / Manager / Chauffeur). Essai gratuit.

**Le produit n'existe qu'en application mobile.** La landing ne doit jamais laisser croire qu'il existe une interface web. Aucun mockup de bureau, aucune capture d'écran d'ordinateur, aucune mention de « tableau de bord en ligne ».

**Nom de marque :** un seul token, `--brand-name` / constante `BRAND_NAME`. Jamais écrit en dur dans une section, jamais figé dans un PNG.

---

## 2. Le concept

### « La vitrine calme »

La page est une salle d'exposition sobre et chaude. **L'application est le seul objet vivant et coloré à l'intérieur.**

Tout le reste — fonds, titres, textes, boutons — est calme, chaud, discipliné. La couleur, le mouvement et la densité d'information sont réservés à l'app elle-même, montrée dans un cadre de téléphone. Le contraste entre la page silencieuse et l'écran vivant est le mécanisme central du design.

Conséquence directe et non négociable : **les trois gradients de la marque n'apparaissent qu'à l'intérieur des écrans d'app.** Jamais sur le chrome de la page. Voir §4.

### Le nom porte le rythme

*Cadance* → cadence. La page a un tempo régulier : même rythme vertical entre les sections, même durée d'animation partout, rien qui accélère ou s'emballe. La régularité **est** l'argument — celui d'un métier où l'on enchaîne des courses sans à-coups.

### L'élément signature

**La section interactive à onglets** (§7). C'est le seul endroit où l'on dépense de l'audace. Tout le reste de la page doit rester délibérément sage pour qu'elle ressorte.

---

## 3. Typographie

**Famille unique : Plus Jakarta Sans.** Aucune seconde famille. `woff2`, sous-ensemble latin, `font-display: swap`, `preload` sur 400/700/800, métriques de fallback (`size-adjust`) pour éviter le CLS.

### Le traitement « impact »

C'est la signature typographique, reprise de la référence validée : **graisse 800, capitales, tracking négatif, très grande taille.**

```css
.type-impact {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  line-height: 0.95;
}
```

**Règle absolue : trois usages maximum dans toute la page.**

1. Le `<h1>` du hero
2. Le chiffre ou la déclaration forte de la section hors-ligne
3. Le `<h2>` du CTA final

Partout ailleurs : casse normale, graisse 700. C'est le contraste qui rend le procédé fort ; appliqué à tous les titres il s'annule et la page se met à crier — l'inverse de la direction.

Si Jakarta 800 manque de nervosité à l'essai, la **seule** substitution autorisée est Archivo Black ou Archivo Expanded, en display uniquement, et il faut alors mettre à jour ce fichier.

### Échelle web

```
impact     clamp(40px, 7vw, 92px)   800  uppercase  ls -0.02em  lh 0.95
display    clamp(30px, 3.6vw, 48px) 700  ls -0.02em  lh 1.1     /* H2 de section */
title      clamp(20px, 2.2vw, 28px) 700  lh 1.25                /* H3 */
body-lg    clamp(17px, 1.3vw, 20px) 400  lh 1.55  color: inkMuted
body       16px 400 lh 1.6
label      13px 600
micro      12px 800 uppercase ls 0.12em                         /* eyebrows */
```

### Règles

- **Jamais de titre en gradient.** Aplat `ink` ou `indigo`. Arbitrage déjà tranché côté mobile, le web suit.
- **`font-variant-numeric: tabular-nums` sur tous les chiffres** — montants, heures, distances, compteurs, tarifs. Non négociable : c'est le produit d'un chauffeur qui lit un montant en deux secondes.
- Format français partout : virgule décimale, **espace insécable avant `€`**, dates `jj/mm/aaaa`.
- **Heures : `14 h 30` dans la prose de la page, `14:30` dans les interfaces reconstruites.** Les deux sont corrects — la convention typographique française s'applique au texte rédigé, le format horloge aux interfaces et aux données. Les mockups restent fidèles à l'app, qui affiche `14:30`.
- Paragraphes : `max-width: 62ch`.
- Capitales interdites hors `type-impact`, eyebrow et badge.

---

## 4. Couleurs

### Tokens produit (source : `design-tokens.ts` — ne rien inventer)

**Clair**
```
--indigo      #4F46E5    /* primaire : CTA, liens, nav active, focus */
--indigo-soft #818CF8
--bg          #FDFDFD
--surface     #FFFFFF
--border      #F3F4F6
--ink         #1A1C1E
--ink-muted   #6B7280
--ink-faint   #9CA3AF
--success     #059669
--warning     #D97706
--danger      #DC2626
```

**Sombre**
```
--indigo      #818CF8
--indigo-soft #A5B4FC
--bg          #0F1115
--surface     #181B21
--border      #252932
--ink         #F4F5F7
--ink-muted   #9BA3AF
--ink-faint   #6B7280
--success     #34D399
--warning     #FBBF24
--danger      #F87171
```

### Ajout web-only — le panneau chaud

```
--panel       #FAF3E8    /* clair : fond des panneaux de démonstration */
--panel-edge  #EFE4D2    /* bordure 1px du panneau, clair */
```

**Déclaré comme ajout web, absent des tokens mobile.** Justification : le blanc froid `#FDFDFD` rend la page clinique ; le panneau crème apporte la chaleur et la sensation de calme qui portent tout le concept. L'écart avec `--bg` doit se voir : un beige assumé, pas un blanc sali.

**Portée stricte :** uniquement le fond des panneaux qui contiennent une démonstration produit (section interactive, section hors-ligne, section conformité). Jamais le fond global de la page — `--bg` reste `#FDFDFD`.

**En thème sombre, le crème ne se traduit pas.** Ne pas tenter un « crème sombre » : les panneaux passent à `--surface` avec `border: 1px solid var(--border)`. La chaleur est remplacée par la profondeur.

### Les trois gradients — règle de confinement

```
teal   linear-gradient(135deg, #0D9488, #2DD4BF)   /* l'argent gagné */
coral  linear-gradient(135deg, #F43F5E, #FB7185)   /* le volume d'activité */
purple linear-gradient(135deg, #7C3AED, #A78BFA)   /* le temps */
```

**Ils n'apparaissent QUE dans l'interface de l'app reconstruite** : StatCards à l'intérieur d'un cadre de téléphone, ou fragments d'UI en orbite autour de ce cadre (§7).

Interdit : fond de section, bandeau pleine largeur, bouton, titre, icône décorative, halo, bordure. Un gradient sur le chrome de la page casse le concept entier.

Ils fonctionnent tels quels sur fond sombre — ne pas les modifier.

**Contraste — résolu par la composition, pas par la couleur.** Ne pas modifier les gradients, ne pas poser de voile sombre. WCAG applique 3:1 au grand texte (≥24px, ou ≥18,66px en gras) et 4,5:1 au texte courant. Les valeurs en 800 à ~30px passent sur les débuts de gradient (3,74 / 3,67 / 5,70:1). La règle est structurelle (voir §9, StatCard) : tout le texte vit dans les 60 % supérieurs-gauche de la carte, côté sombre du 135° ; la fin claire n'apparaît qu'en bas à droite, où il n'y a rien.

### Rôles sémantiques

| Couleur | Signifie | Où |
|---|---|---|
| Teal | L'argent gagné | CA, montants encaissés |
| Coral | Le volume | Nombre de courses |
| Purple | Le temps | Heures, durées |
| Indigo | L'action | CTA, liens, nav, focus |
| Success / Warning / Danger | Statuts | Badges dans les mockups uniquement |

### Thèmes

Deux thèmes obligatoires. `prefers-color-scheme` par défaut, toggle explicite qui écrase dans les deux sens (`:root[data-theme="dark"]` / `[data-theme="light"]`), persisté en `localStorage`, script inline de pré-hydratation pour éviter le flash. Balise `theme-color` adaptée aux deux via `media`.

**L'écran du téléphone reste toujours en thème clair, y compris quand la page est en sombre.**

Raison : le thème sombre de l'app n'est pas encore implémenté (prévu v1.1) — un mockup sombre serait une invention. Mais la contrainte donne un meilleur résultat que la liberté : un écran allumé sur une page sombre est exactement ce qu'on voit dans la vraie vie, et l'écran devient une source de lumière. Cela renforce le concept — l'app est le seul objet vivant de la page.

Traitement en thème sombre : bezel `#1A1C1E`, `--shadow-device` remplacée par un halo lumineux très diffus autour du cadre, aucun voile sur l'écran lui-même. À réévaluer quand le thème sombre de l'app existera.

---

## 5. Formes, espace, profondeur

### Rayons
```
--r-sm   12px   chips, badges
--r-md   16px   boutons, champs
--r-lg   24px   cartes
--r-xl   32px   panneaux, conteneurs de mockup   (ajout web)
--r-pill 999px  pilules de nav, toggles
```
Rien d'anguleux. Aucun `border-radius: 0` sauf séparateur 1px.

### Espacements
Base 4px. Référence mobile : `screen 24` · `card 20` · `section 32` · `grid 16`.

```
--container    max-width 1200px
--pad-inline   24px → 40px (≥768) → 64px (≥1280)
--section-y    clamp(72px, 6.4vw, 112px)
--block-gap    clamp(32px, 4vw, 56px)
--grid-gap     16px → 24px (≥768) → 32px (≥1280)
--card-pad     20px → 28px (≥768)
```

Le rythme vertical est **régulier** — c'est la cadence. Ne pas resserrer une section « parce qu'elle est courte ».

**Un panneau épouse son contenu.** Deux colonnes de hauteurs très différentes ne s'alignent pas en haut en laissant le vide s'accumuler en bas : la colonne courte se centre verticalement, et le panneau ne s'étire jamais au-delà de ce que son contenu exige. La pièce maîtresse d'un panneau (l'aperçu de facture en conformité) se dimensionne comme telle — pas en vignette.

### Ombres
```
--shadow-soft      0 4px 16px rgba(26,28,30,0.06)
--shadow-lift      0 12px 32px rgba(26,28,30,0.10)   /* hover de carte */
--shadow-cta       0 8px 24px rgba(79,70,229,0.28)
--shadow-cta-hover 0 12px 32px rgba(79,70,229,0.38)
--shadow-device    0 32px 80px rgba(26,28,30,0.16)   /* cadre de téléphone */
```
Sombre : réduire l'opacité, compenser par `border: 1px solid var(--border)`. Jamais d'ombre noire opaque sur fond sombre.

Interdit : ombres empilées, neumorphisme, `box-shadow` colorée autre que l'indigo du CTA.

### Glassmorphism — trois usages, pas un de plus
1. Barre de navigation sticky : `rgba(253,253,253,0.72)` + `backdrop-filter: blur(20px) saturate(180%)` + bordure basse 1px. Sombre : `rgba(15,17,21,0.72)`. **Le verre à 0,72 ne vaut que pour l'état initial, en haut de page, où rien ne passe dessous. Dès l'état condensé (scroll > 40px), le fond passe à l'OPAQUE COMPLET (`var(--bg)` plein) + bordure basse 1px + ombre légère : même 6 % de transparence laissent l'encre d'un type-impact 92px se lire à travers — aucune opacité partielle ne suffit.**
2. Bandeau flottant de statut dans les mockups (reprise de `OfflineBanner`).
3. Overlay de carte posé sur un mockup.

Ailleurs : surfaces opaques. Toujours un fallback `@supports not (backdrop-filter: blur(1px))`.

### Icônes
**Lucide exclusivement**, SVG inline, stroke 1.75–2, `currentColor`, jamais de remplissage. 20px inline · 24px features · 28px cartes.

Jeu attendu : `calendar-days`, `users`, `file-text`, `receipt`, `wallet`, `trending-up`, `map-pin`, `clock`, `car`, `cloud-off`, `refresh-cw`, `check-circle-2`, `shield-check`, `download`, `bell`, `chart-column`, et les icônes de la barre d'onglets de l'app — tracées jusqu'à `apps/mobile/app/(tabs)/_layout.tsx` : `layout-dashboard` (Tableau), `calendar` (Agenda), `users` (Clients), `file-text` (Factures), `settings` (Profil).

`cloud-off` et non `wifi-off` : c'est l'icône du code, et elle est sémantiquement plus juste — le mode hors-ligne parle de synchronisation de données, pas de signal réseau.

Aucune autre librairie. **Aucun emoji dans l'UI.**

### Éléments graphiques autorisés
- Mockups d'écrans dans un cadre de téléphone
- Fragments d'UI réels sortis de leur écran (StatCard, CourseRow, StatusBadge, ligne de facture)
- Grille de fond 1px `--border` à 40 % d'opacité, masquée en radial-gradient, **hero uniquement**
- Un seul halo radial indigo à 6 % derrière le hero
- La ligne de trajet stylisée (départ → arrivée), motif discret, uniquement dans « Comment ça marche ». **Une SEULE ligne continue traverse les trois étapes** : point plein au début de la première, anneau d'arrivée à la FIN de la troisième — jamais trois tronçons par carte, jamais l'arrivée avant la route. En pile mobile la ligne devient verticale et reste continue. C'est le seul motif métier de la page : il raconte une course.

Interdit : illustration de personnage, stock photo, blob abstrait, illustration corporate flat.

---

## 6. Mockups — traitement

- **Cadre neutre sans marque** : radius 44px, bezel 10px `#1A1C1E`, écran radius 36px, `overflow: hidden`, `--shadow-device`.
- **Toute interface d'app apparaît DANS un cadre de téléphone, sans exception.** Un bandeau, une carte ou une ligne d'app posés nus sur la page ne se lisent plus comme le produit — ils se lisent comme des éléments de la page (le bandeau hors-ligne étiré pleine largeur devient un gros bouton orange). Seuls les fragments d'orbite (§7) sortent du cadre, et ils chevauchent son bezel. À taille réelle dans le cadre, le texte d'un bandeau repasse sous 24px : le seuil de contraste est 4,5:1, pas 3:1 — à vérifier à la taille rendue.
- Encoche stylisée, barre d'état simulée cohérente : **9:41**, réseau plein, batterie pleine. Jamais une vraie capture avec une heure aléatoire.
- **Contenu reconstruit en HTML/CSS, pas en image.** Il hérite des vrais tokens, reste net à toute résolution, s'adapte au thème sombre, pèse moins qu'un PNG et peut s'animer. Les captures de l'app servent de **référence de fidélité**, pas d'asset final.
- Données plausibles et françaises : noms crédibles, adresses de région parisienne, `120,00 €` avec espace insécable, dates cohérentes entre elles, statuts variés. **Aucun lorem ipsum, aucun `$1,234.56`.**
- **Déterminisme : les fixtures se génèrent depuis une date de référence FIGÉE** (constante exportée), jamais depuis le jour du build — sinon les tests de régression visuelle expirent chaque jour et les chiffres dérivent seuls en production. **À l'écran, uniquement des dates RELATIVES** : « Aujourd'hui », « Demain », noms de jours. Aucune date absolue visible dans un mockup.
- Le mockup hero est **strictement de face**. Règle unique, tenue partout — pas de perspective sur certains et pas sur d'autres.
- Parallax léger sur le mockup hero : 40px de translation maximum.

---

## 7. Section interactive — l'élément signature

### Principe
Une rangée d'onglets pilote un bloc unique. Chaque onglet change **trois choses simultanément** : le titre, les trois arguments, et la démonstration. La démonstration n'est pas une vidéo ni un GIF : c'est du **DOM réel animé**.

### Anatomie

```
┌──────────────────────────────────────────────────────────┐
│  [ Agenda ] [ Clients ] [ Facturation ] [ Dépenses ] […] │  ← onglets, barre de progression
├────────────────────────┬─────────────────────────────────┤
│  H2                    │   ╭──── panneau crème ────╮     │
│  ✓ argument 1          │   │   ┌──────┐            │     │
│  ✓ argument 2          │   │   │      │  ◀ fragment│     │
│  ✓ argument 3          │   │   │phone │            │     │
│  → En savoir plus      │   │   │      │  fragment ▶│     │
│                        │   │   └──────┘            │     │
│                        │   ╰───────────────────────╯     │
└────────────────────────┴─────────────────────────────────┘
```

Le téléphone est étroit (390px). **Ne pas chercher à remplir la largeur avec lui** : la largeur est occupée par les fragments d'UI en orbite — une StatCard teal, un CourseRow, un StatusBadge — qui débordent du cadre et changent avec l'onglet.

**Trois règles des fragments :**

1. **Un fragment AJOUTE une information que l'écran ne montre pas** — jamais la répétition d'une valeur déjà affichée. Le modèle : sur Carnet clients, la fiche avec « 12 courses · total encaissé » complète la liste qui n'affiche que noms et téléphones.
2. **Un fragment reste dans le sujet de son onglet** — pas de CA sur l'onglet Dépenses.
3. **Aucun fragment ne recouvre du texte ni un élément de navigation de l'écran** — il chevauche le bezel ou les zones vides, jamais le contenu.
4. **Toute valeur chiffrée d'un fragment est CALCULÉE depuis les données du jeu de démonstration, jamais saisie** — un fragment qui annonce un total doit être la somme exacte de ce que l'écran affiche ou de ce que les données contiennent.
5. **La dispense de label (StatCard d'orbite, valeur seule) n'est valable que là où le titre de la section fournit le sens** — dans la section interactive, « Votre mois, en trois chiffres vrais » explique la valeur nue. Partout ailleurs (hero inclus), un fragment doit être auto-porteur : soit une ligne de contexte (contraste 4,5:1 — pastille sombre ou texte HORS gradient), soit un fragment qui se lit tout seul (ligne de facture avec numéro, client, montant, statut). Un seul fragment lisible vaut mieux que deux dont un est muet.
6. **La boîte d'un fragment épouse son contenu** — jamais de largeur figée d'où le texte déborde ; c'est la boîte qui s'adapte, le texte ne sort pas de sa pastille. Et dans un crossfade, les deux états se RELAIENT, jamais ne se superposent : à aucun instant les deux textes ne sont simultanément lisibles (opacités complémentaires strictes, pas de chevauchement de mi-fondu).

**Règles de micro-action :**

- **Cohérence d'état de bout en bout** : à chaque milliseconde de la boucle, l'écran montre un état POSSIBLE dans l'app. Une facture générée ne coexiste pas avec le bouton « Générer » au repos — dans l'app, une course facturée quitte la liste des facturables : elle s'efface pendant que la facture apparaît.
- **Transformer plutôt que supprimer** : un retrait qui laisse un trou dans la mise en page est interdit. L'élément consommé par la micro-action DEVIENT son résultat (la carte de courses facturables devient la ligne de facture en tête de liste), ou la liste se referme en `transform`. Jamais une bande vide pendant la lecture.
- **Traçabilité des affordances** : chaque élément d'interface introduit par une micro-action (bouton, cadre, geste) est tracé jusqu'à un composant réel de l'app, fichier et ligne — même discipline que pour les puces marketing. Un geste que l'app ne sait pas faire ne s'anime pas. L'écran reste PLEIN (§6) à chaque instant de la boucle, dans les deux états.
- **Le résultat de la micro-action est le moment de récompense** : il porte le chiffre le plus fort de l'écran, pas le plus petit. Facturation groupée plutôt qu'une course isolée — c'est la démonstration d'ADR-005, pas son affirmation.
- **Boucle de 3 600 ms**, segments : repos 400 · appui 120 (`--dur-fast`) · action 420 (`--dur-slow`, `--ease-out`) · lecture 2 200 · sortie 220 (`--dur-base`) · ré-armement 240. Le temps mort total ne dépasse jamais ~18 % de la boucle.
- **Hors écran, la boucle s'arrête** : l'observateur de visibilité de la section reste actif en permanence — pause des micro-actions et de l'enchaînement à la sortie du viewport, reprise à l'entrée. La règle « une seule fois, observateur déconnecté » (§10) vaut pour les révélations ponctuelles, pas pour une animation continue.
- **Synchronisation** : la durée d'affichage d'un onglet en enchaînement automatique est un multiple entier de la boucle — 7 200 ms (deux boucles).

### Les cinq onglets et leur micro-action

Chaque écran **exécute un geste** en boucle de 3 à 4 secondes, comme si quelqu'un se servait de l'app.

| Onglet | Micro-action |
|---|---|
| **Agenda et courses** | Une course se pose dans le créneau de 14 h 30 |
| **Carnet clients** | Une fiche s'ouvre, l'historique de courses se remplit |
| **Facturation** | Course terminée → appui → la facture PDF glisse vers le haut |
| **Dépenses** | La saisie d'une dépense (catégorie · montant · Enregistrer) devient la ligne en tête de liste, le total du mois suit |
| **Tableau de bord** | Les trois StatCards comptent : teal, coral, purple |

> **Note Dépenses** : la capture photo d'un ticket n'existe pas dans l'app (non tracée) — remplacée par la saisie réelle (`depense/nouvelle.tsx`, `mutations.ts:80`). Dans l'app, cette saisie est un écran distinct, pas une ligne dans la liste : la version fidèle (liste → l'écran de saisie glisse → retour avec la dépense en tête) est **notée au backlog de la section**, la compression actuelle est conservée — les composants montrés (chip de catégorie, montant, bouton Enregistrer) restent tracés, seul le conteneur diffère.

Le dernier onglet est le seul moment de la page où les trois gradients apparaissent ensemble. La page étant calme partout ailleurs, l'effet est net.

**Le mode hors-ligne n'est pas un onglet** — il a sa propre section (§8), c'est l'argument différenciant et il se noierait ici.

### Comportement

- **Tous les panneaux dans le DOM en permanence.** Le JS ne fait que basculer la visibilité. Contenu indexable, lisible sans JS, aucun chargement au clic.
- Enchaînement automatique, barre de progression fine sur l'onglet actif.
- **Au premier clic de l'utilisateur, l'enchaînement s'arrête définitivement.** Ne jamais reprendre la main après une interaction.
- Pause au survol.
- Transition entre panneaux : fondu + translation 12px, 220ms.
- Le cadre du téléphone ne bouge pas entre les onglets — seul son contenu change. C'est ce qui donne la sensation d'une seule app.

### Accessibilité
Pattern ARIA d'onglets complet : `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, `aria-controls`, navigation aux flèches, `Home`/`End`. Les micro-actions sont décoratives → `aria-hidden` sur les éléments animés, le sens porté par le texte.

### `prefers-reduced-motion`
Plus d'enchaînement automatique, plus de micro-actions, plus de parallax. Chaque écran s'affiche à son **état final** (facture déjà générée, montant déjà rempli, compteurs à leur valeur). Le contenu reste intégralement accessible.

### Mobile
Onglets en rangée à défilement horizontal avec `scroll-snap`, téléphone en dessous. **Les fragments d'orbite sont cachés sous 768px, mais leur information ne disparaît pas : le fragment principal devient une ligne de légende sous le téléphone** — même donnée calculée, qui change avec l'onglet. Aucun scroll horizontal de page.

---

## 8. Structure — 11 blocs

1. **Navigation sticky** — logo · Fonctionnalités · Tarifs · FAQ · toggle de thème · Connexion (ghost) · CTA primaire 44px. Mobile : menu plein écran, focus piégé, fermeture `Escape`, scroll du body verrouillé.
2. **Hero** — eyebrow « Pour les chauffeurs VTC indépendants » · `<h1>` en `type-impact`, traitement retenu en G1 : **« Le contour »** — « Conduisez. » en creux (contour `ink`, intérieur vide), « On tient le reste. » en aplat `indigo`, aligné à gauche. **La ligne en contour porte son propre tracking positif (~+0,01em), indépendant de type-impact** : le creux a besoin d'air là où le plein supporte le tracking négatif. La ligne en contour est rendue en **SVG** (texte avec stroke + paint-order) : text-stroke CSS laisse l'auto-intersection des glyphes visible (le trait du N traverse la contreforme), inacceptable sur le h1. **Repli mobile (<640px) :** le trait devient illisible en petit — « Conduisez. » passe en aplat `--ink-faint`, même hiérarchie, le voile puis le plein. · sous-titre 2 lignes qui nomme le problème des six applications · CTA primaire + secondaire · ligne de réassurance (essai gratuit · sans carte bancaire · factures conformes) · mockup + 2 fragments flottants.
   **Fragments du hero : ils GRAVITENT, ils ne flottent pas** — collés au cadre jusqu'à chevaucher le bezel (comme dans la section interactive), jamais dans la colonne de texte, jamais coupés par le bord du conteneur. **L'écran du hero montre l'état POST-micro-action** (facture 2026-00039 émise, encours 642,00 €) pendant que l'onglet Facturation de la section interactive garde l'état « à facturer » : même écran, deux moments — pas de redite.
3. **Section interactive** (§7) — le cœur de la page.
4. **Hors-ligne** — panneau pleine largeur. Séquence animée complète : hors-ligne → 1 modification en attente → synchronisation → validé. *« Un parking souterrain, un tunnel, une zone blanche : vous saisissez quand même. Rien n'est perdu. »* Deuxième usage de `type-impact`.
5. **Conformité et facturation** — mentions légales, TVA 10 % ou franchise en base, registre VTC, numérotation immuable, Factur-X. Aperçu du PDF : **fond blanc, encre `#1A1C1E`, filets fins, une seule touche d'indigo, aucun gradient**. Cette sobriété est l'argument.
6. **Comment ça marche** — 3 étapes, reliées par la ligne de trajet. La numérotation est légitime ici : c'est une vraie séquence.
7. **Tarifs** — Solo et Entreprise, issus de `plans.ts`. Toggle mensuel/annuel. Carte recommandée : bordure indigo, badge, `--shadow-lift`. Features avec `check-circle-2` en `success`, absentes en `ink-faint`. **Si un prix n'est pas dans le repo, laisser `{{PRIX_SOLO}}` bien visible — jamais un chiffre inventé.**
8. **Réassurance** — **bande compacte, PAS une grille de cartes** (la grille de six cartes icône-titre-texte est le motif le plus reconnaissable du design généré par IA — face au slop on retire, on ne restyle pas) : une ou deux lignes d'affirmations courtes, icônes en ligne, aucune carte, aucune ombre. Chiffrement, RGPD, sauvegarde automatique, hors-ligne. « Aucune commission » et « export des données » vivent dans la section Tarifs, là où le visiteur se pose la question.
9. **FAQ** — 6 à 8 questions en `<details>/<summary>` stylés. Conformité, TVA, hors-ligne, reprise des données existantes, plusieurs chauffeurs, résiliation, iOS/Android, support.
10. **CTA final** — **vraie bande CRÈME bord à bord, pleine largeur** (fond `--panel`, bordures haut/bas `--panel-edge` — elle referme la boucle ouverte par la bande de démonstration du milieu et donne une fin à la page ; en sombre : `--surface` + bordures, comme les panneaux), halo indigo diffus par-dessus, `<h2>` en `type-impact` (troisième et dernier usage), **un seul CTA**, réassurance en une ligne. Centré (§9).
11. **Footer** — 4 colonnes : Produit / Ressources / Entreprise / Légal. Logo + tagline, badges App Store et Google Play, réseaux en icônes Lucide, année dynamique.

### Sections délibérément absentes
- **Barre de chiffres de preuve** — rien de vérifiable aujourd'hui. À rouvrir avec de vraies données.
- **Le problème en 6 outils** — le hero et la section interactive le disent déjà.
- **Témoignages** — aucun utilisateur réel à ce jour. Le composant est construit (carte d'avis, note store, carrousel) mais la section **reste hors ligne** jusqu'aux trois premiers vrais chauffeurs. Des témoignages inventés sur une page dont l'argument central est la conformité légale sont un risque disproportionné. Modèle à reprendre le moment venu : notes Trustpilot / App Store / Play Store avec avis réels.

---

## 9. Composants

Bibliothèque réutilisable, jamais des sections codées à la main. Chaque composant hérite des tokens et déclare sa filiation mobile.

| Web | Dérivé de | Notes |
|---|---|---|
| `Button` | `Button.tsx` | primary / secondary / ghost / danger / gradient. **56px pour toute action primaire**, 44px secondaire — l'app est utilisée dans une voiture, à une main. Radius `md`, 700, gap 8px. |
| `Card` | `Card.tsx` | radius `lg`, `--surface`, pad 20px, `--shadow-soft`. Hover `translateY(-4px)` + `--shadow-lift`. |
| `StatCard` | `StatCard` | Fond gradient teal/coral/purple. Valeur 800 blanche tabular-nums, compteur animé. **white-space: nowrap sur toute valeur — c'est la taille qui s'ajuste, jamais le texte qui se scinde.** **Tout le texte dans les 60 % supérieurs-gauche, côté sombre du 135° ; la fin claire reste vide en bas à droite.** **La règle dépend de l'emplacement** : dans un cadre de téléphone → label 12px 800 uppercase ls 0.12em, fidèle à l'app (reproduction, contenu `aria-hidden`, WCAG ne s'applique pas) ; en fragment d'orbite hors du cadre → **pas de label du tout**, valeur seule en 800 à 28px minimum (vrai contenu de page, WCAG s'applique, 3:1 grand texte tenu). |
| `StatusBadge` | `StatusBadge.tsx` | Pilule radius `sm`, fond couleur à 12 %, texte couleur pleine. **Toujours accompagné d'un mot** — jamais la couleur seule. |
| `SectionHeader` | `PageHeader.tsx` | Eyebrow + H2 + sous-titre. Aligné à gauche par défaut ; **centré uniquement FAQ et CTA final** (le hero est à gauche, imposé par le §8 — l'ancienne formulation « hero et FAQ » était fausse). |
| `Field` | `TextField.tsx` | 56px, radius `md`, focus bordure indigo + anneau 3px `rgba(79,70,229,0.12)`, erreur en `danger` avec message texte. |
| `PhoneMockup` | — | Nouveau, web-only. |
| `FeatureTabs` | — | Nouveau, web-only. La section signature. |
| `Navbar` `Footer` `PricingCard` `FaqItem` `ThemeToggle` `LogoWall` | — | Nouveaux, web-only. |

États de `Button` : repos / hover (`translateY(-1px)` + `--shadow-cta-hover`, 160ms) / active (`scale(0.97)`, 120ms — reprise exacte du mobile) / focus-visible (anneau 2px indigo, offset 3px) / disabled (`opacity .5`) / loading (`aria-busy`).

---

## 10. Mouvement

```
--ease-out    cubic-bezier(0.22, 1, 0.36, 1)   /* entrées, révélations */
--ease-in-out cubic-bezier(0.65, 0, 0.35, 1)   /* déplacements */
--dur-fast    120ms   /* press */
--dur-base    220ms   /* hover, toggle, bascule d'onglet */
--dur-slow    420ms   /* révélation au scroll */
```

Une seule grammaire, un seul tempo — c'est la cadence.

- Animer **uniquement** `transform` et `opacity`. Jamais `width`, `height`, `top`, `left`, `box-shadow` en boucle.
- Hero orchestré en cascade, stagger 60ms : eyebrow → h1 → sous-titre → CTA → mockup. Rien ne se déplace de plus de 24px. **Aucun préchargeur.**
- Révélation au scroll via `IntersectionObserver` (seuil 0.15, `rootMargin: -10%`), stagger 60ms. **Une seule fois** — observateur déconnecté ensuite, pas de re-jeu au scroll inverse.
- Compteurs animés au premier passage en vue, 1200ms, tabular-nums pour éviter le tremblement.
- Nav condensée après 40px de scroll, 220ms.
- Hover : cartes `-4px` + `lift` + bordure vers `indigo-soft` 30 % · liens soulignement qui se dessine · CTA lift + ombre renforcée. **Aucun hover ne dépasse 6px.**
- Press `scale(0.97)` 120ms sur tout élément cliquable.
- Accordéon : `grid-template-rows: 0fr → 1fr`, chevron 180°.

**`prefers-reduced-motion: reduce`** — obligatoire et complet. Supprime translations, parallax, compteurs (valeur finale affichée), enchaînement d'onglets, micro-actions. Conserve les fondus ≤ 150ms.

---

## 11. Ton rédactionnel

Français, vouvoiement, direct, concret. Phrases courtes. Le lecteur est un professionnel occupé, pas un early adopter tech.

- ✅ « Votre facture est prête avant que le client soit descendu de voiture. »
- ❌ « Une solution innovante propulsée par l'IA pour révolutionner votre workflow. »

Nommer les choses par ce que la personne contrôle, pas par la façon dont c'est construit. Voix active. Un libellé de CTA fait exactement ce qu'il annonce, et garde le même nom sur toute la page.

Aucun anglicisme évitable (tableau de bord, fonctionnalités). Aucun superlatif non prouvé. Aucune promesse chiffrée non vérifiable. S'aligner sur `BUSINESS.md` et `FEATURES.md`.

**Un seul libellé de CTA primaire dans toute la page.** La répétition construit la mémorisation ; deux libellés concurrents la détruisent. Il apparaît dans la nav, le hero, le milieu et le CTA final.

---

## 12. Responsive

Breakpoints : `<640` mobile · `640–1023` tablette · `1024–1439` desktop · `≥1440` large.

Mobile-first réel : conçu à 375px puis étendu. C'est le site d'une app mobile, la majorité du trafic sera mobile.

- ≥1440 : le container ne dépasse pas 1200px, l'espace va au fond, pas au contenu.
- **Aucun scroll horizontal, à aucune largeur ≥ 320px.** Les blocs larges scrollent dans leur propre conteneur.
- Cibles tactiles ≥ 44px, **56px sur les actions primaires**.
- Tester : 320, 375, 390, 768, 1024, 1280, 1440, 1920.
- `env(safe-area-inset-*)` sur les éléments fixes.

---

## 13. Qualité — seuils bloquants

### Accessibilité — WCAG 2.2 AA
Contraste ≥ 4,5:1 texte et ≥ 3:1 interface · un seul `<h1>`, hiérarchie sans saut · `<nav>` `<main>` `<section aria-labelledby>` `<footer>` · navigation clavier complète · `:focus-visible` toujours visible, jamais `outline: none` sans remplacement · lien « Aller au contenu » en premier focusable · `aria-expanded` + focus piégé sur le menu mobile · `alt` descriptif ou `alt=""` + `aria-hidden` · information jamais portée par la couleur seule · zoom 200 % sans perte · `<label>` associé, erreurs en `aria-live="polite"` · `lang="fr"`.

### Performance
LCP < 1,8 s · CLS < 0,05 · INP < 200 ms · Lighthouse ≥ 95 sur les 4 catégories.

JavaScript total < 30 KB gzip. Aucun framework d'animation si CSS + `IntersectionObserver` suffisent. Images AVIF avec fallback WebP, `srcset` + `sizes`, `width`/`height` explicites sur **chaque** image, `loading="lazy"` + `decoding="async"` sauf l'image LCP (`fetchpriority="high"`). CSS critique en ligne. `contain: layout paint` sur les sections lourdes. Place réservée avant animation pour les mockups, compteurs et accordéons.

### SEO
`<title>` 55–60 caractères contenant « VTC » et un bénéfice · `<meta description>` 150–160 orientée bénéfice · Open Graph et Twitter Card complets (`og:image` 1200×630 montrant un mockup, `og:locale=fr_FR`) · URL canonique · `sitemap.xml` et `robots.txt` · **JSON-LD** `SoftwareApplication` (`applicationCategory: BusinessApplication`, `operatingSystem: iOS, Android`, `offers`), `Organization`, `FAQPage` synchronisé avec la vraie FAQ · mots-clés naturels : *application chauffeur VTC, facturation VTC, gestion de courses, logiciel chauffeur VTC indépendant, facture conforme VTC* · texte réel en HTML, jamais dans une image · favicon complet dérivé de `apps/mobile/assets/icon.png` + `site.webmanifest`, `theme-color` `#4F46E5`.

---

## 14. Interdits

Lorem ipsum · stock photo · emoji dans l'UI · gradient hors mockup · titre en gradient · seconde famille de police · `type-impact` plus de trois fois · icône hors Lucide · chiffre non tabulaire · statistique inventée présentée comme vérifiée · témoignage attribué à une personne inventée · mockup ou interface de bureau · animation sur `width`/`height`/`top`/`left` · `outline: none` sans alternative · scroll horizontal · valeur de couleur en dur hors variable · nom de marque écrit en dur.

---

## 15. À valider par un humain

Tenir cette liste à jour à chaque session ; ne jamais combler un trou par une invention.

- [ ] **Urgent et irréversible** — `ios.bundleIdentifier` et `android.package` encore en `dev.ubersclap.app`. À changer avant toute publication sur les stores, définitif ensuite.
- [ ] Domaines `cadance.fr` / `cadance.com` à réserver, plus `cadence.fr` si disponible (orthographe que les gens taperont)
- [ ] Fixtures : les agrégats doivent être crédibles pour un chauffeur à plein temps (60 à 80 courses par mois, CA de l'ordre de 4 800 €). Un CA mensuel à trois chiffres décrédibilise la page auprès de la cible.
- [ ] **Pages légales et ressources absentes** — jetons visibles dans le footer plutôt que des liens morts : `{{PAGE_MENTIONS_LEGALES}}`, `{{PAGE_CONFIDENTIALITE}}`, `{{PAGE_CGU}}`, `{{PAGE_CGV}}`, `{{PAGE_COOKIES}}`, `{{PAGE_SUPPORT}}`, `{{PAGE_GUIDE}}`, `{{PAGE_CONTACT}}`. À rédiger et valider juridiquement avant mise en ligne.
- [ ] **Badges stores** — placeholders texte « App Store » / « Google Play » sans lien : les apps ne sont pas publiées. Remplacer par les vrais badges officiels + liens au moment de la publication.
- [ ] **Réseaux sociaux du footer** — icônes X et LinkedIn avec `href="#x"` / `href="#linkedin"` : aucun compte n'existe. Créer les comptes ou retirer les icônes avant mise en ligne.
- [ ] **Liens Connexion / CTA** — `#connexion` et `#essai` pointent vers la section CTA finale : aucune app web d'inscription ou de connexion n'existe dans le repo. Décider de la destination réelle (formulaire d'accès anticipé, e-mail, stores) avant mise en ligne.
- [ ] **FAQ « support »** — la réponse dit « depuis l'application ou par e-mail » : aucun canal de support n'est engagé dans le repo. Confirmer le canal réel (e-mail dédié ?) avant mise en ligne.
- [ ] **Contraste du bandeau hors-ligne** (reproduction mockup) : blanc sur warning `#D97706` = 3,19:1 à taille réelle — fidèle à l'app, `aria-hidden`, même arbitrage que les labels StatCard. Remontée produit déjà consignée dans BACKLOG.md.
- [ ] **SEO de la phase 9 restant** : OG/Twitter card + `og:image` 1200×630, sitemap.xml, robots.txt, JSON-LD `SoftwareApplication` + `Organization` (FAQPage déjà en place), favicon dérivé de l'icône mobile, `theme-color`.
- [ ] Prix Solo et Entreprise — jetons `{{PRIX_SOLO}}` / `{{PRIX_ENTREPRISE}}` tant qu'ils ne sont pas dans `plans.ts`
- [x] Contraste du texte blanc sur les gradients — **tranché en G1 : résolu par la composition** (§4, §9). Le texte vit dans les 60 % supérieurs-gauche, côté sombre du 135° ; label 14px 800 blanc pur ; la fin claire reste vide. **Mesuré aux positions réelles** (scripts/check-gradient-contrast.mjs --live) : valeurs 28px 800 (grand texte, seuil 3:1) → teal 3,21 · coral 3,29 · purple 3,77 — **toutes conformes**. Labels 14px 800 (seuil 4,5:1) → teal 3,03 · coral 3,31 · purple 4,00 — sous le seuil, et c'est **irréductible par composition** : même le point le plus sombre du teal (`#0D9488`) ne donne que 3,74:1 et le coral 3,67:1. Atteindre 4,5:1 exigerait de toucher aux couleurs (interdit). État de fait assumé : le label est un intitulé décoratif redondant (l'information est portée par la valeur, conforme) — à réévaluer si un audit WCAG formel l'exige, la seule issue serait alors un label ≥18,66px ou hors gradient.
- [ ] Toute affirmation de conformité légale (TVA, Factur-X, registre VTC) — relecture juridique obligatoire
- [ ] **« Hébergement France/UE » retiré de la section Réassurance** — aucune région d'hébergement n'est engagée dans le repo (DEPLOYMENT.md liste AWS en option, sans région choisie). À réintégrer quand l'hébergeur et la région seront actés.
- [ ] **« Aucune commission sur les courses »** — exact aujourd'hui (modèle abonnement, MONETIZATION.md:15), mais MONETIZATION.md:318-324 évoque une commission 1-2 % sur un futur paiement intégré optionnel. Si cette option se lance, reformuler la carte de réassurance avant.
- [ ] **Factur-X : vérifié dans le code** — le XML EST embarqué dans le PDF (`invoice-pdf.service.ts:227`, `pdf.attach(..., AFRelationship.Alternative)`, object streams désactivés :238 pour garder la pièce jointe lisible). Ce qui manque : la conformité **PDF/A-3 du conteneur** (profil ICC, XMP — :235-237) et les profils au-delà de MINIMUM (`factur-x.ts:10-16`). Formulations exactes : « embarque un XML Factur-X en pièce jointe (profil minimum) » ✓ ; « PDF/A-3 » ou « conforme Factur-X » ✗ — un PDF avec pièce jointe n'est pas encore un PDF/A-3 valide. À valider juridiquement avant publication.
- [ ] Section témoignages — reste hors ligne jusqu'à trois vrais utilisateurs
- [ ] Orthographe définitive du nom de marque, et disponibilité INPI
