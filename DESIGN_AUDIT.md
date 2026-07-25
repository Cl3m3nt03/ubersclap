# DESIGN_AUDIT.md — Tokens et composants extraits du repo

> Généré depuis le code réel (`packages/shared/src`, `apps/mobile/components`, `apps/mobile/app`).
> Toute valeur absente du repo est marquée **ABSENTE**. Rien n'est inventé.
> Sources : `design-tokens.ts` · `plans.ts` · `format.ts` · `money.ts` · `course.ts` · `schemas.ts` · `planning.ts` · composants mobiles.

---

## 1. Tokens — `packages/shared/src/design-tokens.ts`

### Couleurs — thème clair (`light`)

| Token | Valeur | Usage documenté |
|---|---|---|
| `indigo` | `#4F46E5` | Primaire : CTA, onglet actif, liens |
| `indigoSoft` | `#818CF8` | — |
| `bg` | `#FDFDFD` | Fond d'écran |
| `surface` | `#FFFFFF` | Cartes, champs |
| `border` | `#F3F4F6` | Filets, bordures |
| `ink` | `#1A1C1E` | Texte principal |
| `inkMuted` | `#6B7280` | Texte secondaire |
| `inkFaint` | `#9CA3AF` | Texte tertiaire, placeholders |
| `success` | `#059669` | Sémantique |
| `warning` | `#D97706` | Sémantique |
| `danger` | `#DC2626` | Sémantique |

### Couleurs — thème sombre (`dark`)

| Token | Valeur |
|---|---|
| `indigo` | `#818CF8` |
| `indigoSoft` | `#A5B4FC` |
| `bg` | `#0F1115` |
| `surface` | `#181B21` |
| `border` | `#252932` |
| `ink` | `#F4F5F7` |
| `inkMuted` | `#9BA3AF` |
| `inkFaint` | `#6B7280` |
| `success` | `#34D399` |
| `warning` | `#FBBF24` |
| `danger` | `#F87171` |

Note du code : le thème sombre est défini dès maintenant mais « n'est branché qu'en v1.1 ». Les gradients fonctionnent tels quels sur fond sombre.

### Gradients — « signalent une VALEUR importante, jamais une décoration »

| Nom | Couleurs (135°) | Sens |
|---|---|---|
| `teal` | `#0D9488 → #2DD4BF` | L'argent gagné : CA, montants encaissés |
| `coral` | `#F43F5E → #FB7185` | Le volume d'activité : nombre de courses |
| `purple` | `#7C3AED → #A78BFA` | Le temps : heures travaillées, durées |

Règle du code (`Card.tsx`) : trois dégradés maximum par écran.

### Rayons (`radius`)

| Token | Valeur | Usage |
|---|---|---|
| `sm` | 12 | Chips, badges |
| `md` | 16 | Boutons, champs de saisie |
| `lg` | 24 | Cartes |

`--r-xl 32px` et `--r-pill 999px` : **ABSENTS** des tokens mobiles (ajouts web déclarés dans DESIGN_CONTEXT.md §5).

### Espacements (`space`)

| Token | Valeur | Usage |
|---|---|---|
| `screen` | 24 | Padding horizontal d'écran |
| `card` | 20 | Padding de carte |
| `section` | 32 | Entre deux blocs |
| `grid` | 16 | Entre cartes d'une grille |

### Cibles tactiles (`touch`)

| Token | Valeur | Justification du code |
|---|---|---|
| `primary` | 56 | Voiture, une main, parfois des gants (pas la norme iOS 44) |
| `secondary` | 44 | Action secondaire |

### Typographie (`font`)

- Famille : `PlusJakartaSans` (unique).
- Graisses : `400 regular` · `500 medium` · `600 semibold` · `700 bold` · `800 extra`.

| Taille | Valeur | Note du code |
|---|---|---|
| `micro` | 12 | Plus petit label admissible — 10 px illisible en voiture |
| `label` | 13 | |
| `body` | 16 | |
| `title` | 20 | |
| `display` | 28 | |
| `hero` | 40 | |

Échelle web fluide (`clamp`) : **ABSENTE** du repo — définie uniquement dans DESIGN_CONTEXT.md §3.

### Ombres

Aucun token d'ombre dans `design-tokens.ts`. La seule ombre codée est `softShadow` dans `Card.tsx` :

- iOS : `shadowColor #1A1C1E`, offset `0/4`, opacité `0.06`, radius `16` — équivaut à `0 4px 16px rgba(26,28,30,0.06)`.
- Android : `elevation: 3`.

`--shadow-lift`, `--shadow-cta`, `--shadow-cta-hover`, `--shadow-device` : **ABSENTS** du repo (définis dans DESIGN_CONTEXT.md §5 uniquement).

### Couleurs en dur repérées hors tokens (à connaître, ne pas propager)

Fonds de badges/pastilles à opacité simulée, écrits en dur dans les composants mobiles : `#EEF2FF` (info/indigo 12 %), `#ECFDF5` (success), `#FFFBEB` (warning), `#FEF2F2` (danger), `#F3F4F6` (neutral). Côté web, préférer `color-mix`/opacité sur les tokens (règle « fond couleur à 12 % » de DESIGN_CONTEXT.md §9).

### Tailwind mobile (`apps/mobile/tailwind.config.js`)

Duplication assumée des tokens (Tailwind ne lit pas le TS). Alias notables : `canvas` = bg, `hairline` = border. `design-tokens.ts` reste la source de vérité.

---

## 2. Inventaire des composants mobiles — `apps/mobile/components/`

| Composant | Props | Variantes / états | Notes de design |
|---|---|---|---|
| `Button` | `label, onPress, variant, icon, loading, disabled, full=true` | `primary` (fond indigo, texte blanc) · `secondary` (bordure indigo, fond transparent) · `ghost` (transparent, hauteur 44) · `danger` (fond danger). États : disabled/loading → `opacity 0.5`, press → `scale 0.97` en 120 ms (respecte Reduce Motion) | Hauteur 56 (primaire), 44 (ghost). Radius `md`, texte bold 16, gap 8 |
| `GradientButton` | `label, onPress, colors, icon` | Dégradé 135° passé en prop | « Pour l'action principale d'un écran vide ». Hauteur 56 |
| `Card` | `ViewProps` | — | Radius `lg`, `surface`, pad 20 (`p-5`), `softShadow` |
| `StatCard` | `tone (teal/coral/purple), label, children, footer` | 3 gradients | Radius `lg`, pad 20. Label 12px 800 uppercase tracking-widest `white/80`. Max 3 par écran |
| `StatusBadge` | `status: CourseStatus` | 5 tons : neutral/info/success/warning/danger | Pilule radius `sm`, px 10 py 4, texte 12px 800 uppercase tracking-wider, fond pastel + texte couleur pleine. Libellé toujours depuis `COURSE_STATUS_LABEL` |
| `MoneyText` | `cents, hideSymbol` | — | Seul composant autorisé à rendre de l'argent : `tabular-nums`, format FR, centimes entiers |
| `NumericText` | `TextProps` | — | `tabular-nums` pour heures et distances |
| `TextField` | `label, error, hint` + props TextInput | erreur (bordure danger + message 13px bold dessous) · hint | Hauteur 56, radius `md`, fond `surface`, bordure 1px `border`, label 12px 800 uppercase tracking-widest `ink-faint` au-dessus |
| `AddressField` | `value: Address, onChange, placeholder` | focus (bordure indigo) · résolu (check indigo) · liste de suggestions | Hauteur 56, icône `map-pin` |
| `DateTimeField` | `value, onChange` | slot date + slot heure, actif = bordure indigo | Hauteur 56, icônes `calendar-days` / `clock` |
| `ContactPicker` | `visible, onClose, onSelect` | modal de recherche de contact | Permission demandée à l'ouverture seulement |
| `CourseRow` | `course: CourseRowData, onPress, conflict` | conflit (bordure danger + chip « Conflit ») · `pendingSync` (chip « À synchroniser » warning) · sinon StatusBadge | Hiérarchie imposée : heure > client > lieu > montant. Heure à gauche (52px, extra 17), séparateur 1px vertical, montant extra 15 à droite. minHeight 56, radius `lg` |
| `OfflineBanner` | — | 2 états : hors-ligne sans envoi (fond `warning`, `cloud-off`, « Hors ligne — données du dernier chargement ») · synchronisation (fond `indigo`, `refresh-cw`, « Synchronisation de N modification(s)… ») + état intermédiaire hors-ligne avec N en attente | Texte 13px semibold blanc. `accessibilityRole="alert"` |
| `PageHeader` | `greeting, title, onNotifications, unreadCount, right` | cloche 44px avec point danger si non-lus | Titre 28px extra tracking-tight **aplat indigo — jamais de gradient sur titre** (arbitrage documenté) |
| `EmptyState` | `icon, title, hint, actionLabel, onAction` | — | Cercle 64px fond `#EEF2FF`, icône 28 indigo, titre 17 bold, hint 14, bouton primaire |
| `LoadingState` (QueryState) | `label` | — | Spinner indigo + label 14 faint |
| `ErrorState` (QueryState) | `error, onRetry` | hors-ligne (warning, cloud-off) vs erreur serveur (danger, triangle-alert) | Bouton « Réessayer » secondary |

### Écrans (`apps/mobile/app/`)

Onglets : tableau de bord (`index`), `agenda`, `clients`, `factures`, `profil`. Hors onglets : fiche client `client/[id]`, création/édition client, course `course/[id]` et `course/nouvelle`, `depenses` + `depense/nouvelle`, `facture/nouvelle`, `profil/legal`. Auth : `connexion`, `inscription`.

---

## 3. Offres et features — `packages/shared/src/plans.ts`

### Tiers

| Tier | Libellé |
|---|---|
| `SOLO` | Solo |
| `BUSINESS` | Entreprise |

**Prix : ABSENTS.** Aucun prix, mensuel ou annuel, n'existe dans le repo. La landing doit afficher `{{PRIX_SOLO}}` / `{{PRIX_ENTREPRISE}}`.
**Durée d'essai gratuit : ABSENTE** (seul le statut `TRIALING` existe).

### Statuts d'abonnement

`TRIALING` · `ACTIVE` · `PAST_DUE` · `CANCELLED`. Accès si `ACTIVE` ou `TRIALING`.

### Rôles (BUSINESS)

| Rôle | Libellé | Permissions |
|---|---|---|
| `ADMIN` | Administrateur | tout (+ `members:manage`, `org:manage`, `billing:manage`) |
| `MANAGER` | Manager | driver + `courses:all`, `courses:assign`, `clients:write`, `invoices:all` |
| `DRIVER` | Chauffeur | `courses:own`, `clients:read`, `expenses:own`, `invoices:own` |

En SOLO, le chauffeur est ADMIN de son organisation d'une personne.

### Features par tier

| Feature | SOLO | BUSINESS |
|---|---|---|
| `clients` · `courses` · `invoicing` · `expenses` · `stats` · `pdf_export` · `agenda` | ✓ | ✓ |
| `multi_user` · `course_dispatch` · `shared_clients` · `shared_history` · `central_billing` · `role_permissions` | — | ✓ |

Libellés marketing des features : **ABSENTS** (identifiants techniques seulement).

---

## 4. Formatage FR — `format.ts` et `money.ts`

Écrit à la main (pas d'`Intl`) pour que PDF serveur et écran mobile produisent la même chaîne.

| Fonction | Entrée → Sortie | Règle |
|---|---|---|
| `formatEuros(cents)` | `12000` → `120,00 €` | Virgule décimale, **espace insécable** avant € et comme séparateur de milliers, centimes entiers |
| `parseEuros(input)` | `"120,50"` ou `"120.50"` → `12050` | null si invalide |
| `formatLongDate` | → `Mercredi 22 juillet` | Jour capitalisé, mois minuscule, sans année |
| `formatShortDate` | → `22/07/2026` | Format des documents légaux, `jj/mm/aaaa` |
| `formatTime` | → `11:00` | **Deux-points, pas « 14 h 30 »** — voir écart ci-dessous |
| `formatRelativeDay` | → `Aujourd'hui` / `Demain` / `Hier` / date longue | Jours calendaires, pas 24 h glissantes |
| `formatDistance(m)` | `38200` → `38 km` · `<10 km` → 1 décimale virgule (`5,2 km`) | Espace insécable avant `km` |
| `formatDuration(min)` | `380` → `6 h 20` · `52` → `52 min` | Espaces insécables ; minutes sur 2 chiffres si heures |
| `initials` | `Jean, Dupont` → `JD` | Avatars |

⚠️ **Écart à arbitrer** : DESIGN_CONTEXT.md demande les heures au format « 14 h 30 », mais `formatTime` du repo produit « 14:30 » (c'est ce que l'app affiche réellement, `CourseRow` inclus). Ne pas trancher en silence — signalé en fin d'audit.

### TVA et argent (`money.ts`)

- Argent **toujours en centimes entiers** (ADR-009).
- `VAT_RATE.PASSENGER_TRANSPORT = 0.10` (transport de personnes, taux réduit) · `VAT_RATE.FRANCHISE = 0` avec mention obligatoire « TVA non applicable, art. 293 B du CGI ».
- Régimes : `FRANCHISE` | `NORMAL`. `breakdownFromInclTax` est le sens courant (le chauffeur annonce un prix TTC).
- Tarif indicatif par défaut : prise en charge `500` cts, `200` cts/km, `0` cts/min, arrondi aux 50 centimes. Indicatif, jamais imposé.

---

## 5. Statuts et vocabulaire produit

### Courses (`course.ts`)

| Statut | Libellé | Ton badge | Transitions |
|---|---|---|---|
| `DRAFT` | Brouillon | neutral | → CONFIRMED, CANCELLED |
| `CONFIRMED` | Confirmée | info | → IN_PROGRESS, CANCELLED |
| `IN_PROGRESS` | En cours | warning | → COMPLETED, CANCELLED |
| `COMPLETED` | Terminée | success | terminal |
| `CANCELLED` | Annulée | danger | terminal |

`INVOICED`/`PAID` ne sont pas des statuts de course : l'état de facturation appartient à la facture (une facture couvre N courses, ADR-005).

Types de course : Aller simple · Aller-retour · Aéroport · Gare · Évènement · Mise à disposition · Autre.

### Factures (`schemas.ts`)

- Statuts : `DRAFT` Brouillon · `SENT` Envoyée · `PAID` Payée · `OVERDUE` En retard · `CANCELLED` Annulée.
- Numérotation : `AAAA-NNNNN` (regex `^\d{4}-\d{5}$`), chronologique continue sans trou, attribuée en base à l'émission (ADR-012).
- Une facture = 1 client, N courses.

### Dépenses (`schemas.ts`)

Catégories : `FUEL` Carburant · `TOLL` Péage · `PARKING` Stationnement · `MAINTENANCE` Entretien · `INSURANCE` Assurance · `OTHER` Autre. Montant TTC en centimes, strictement positif.

### Clients (`schemas.ts`)

Catégories : `VIP` · `BUSINESS` Entreprise · `REGULAR` Régulier · `OCCASIONAL` Occasionnel (défaut) · `PROSPECT` Prospect. Stats calculées en base : `courseCount`, `totalCents`, `lastCourseAt`.

### Agenda (`planning.ts`)

Conflit = chevauchement des fenêtres temporelles (départ → arrivée estimée). Durée par défaut sans itinéraire : 60 min. Courses annulées exclues. Bornes strictes : deux courses qui s'enchaînent pile ne sont pas en conflit.

---

## 6. Mouvement et accessibilité observés dans le code mobile

### États du bandeau hors-ligne — `OfflineBanner.tsx` (source, lecture seule)

La séquence de la section hors-ligne de la landing se reproduit depuis cette
source, pas depuis une capture. Le composant est masqué quand tout va bien
(`online && pending === 0` → `null`). Trois états visibles :

| État | Condition | Fond | Icône | Libellé exact |
|---|---|---|---|---|
| Hors ligne, rien à envoyer | `!online && pending === 0` | `warning` | `cloud-off` 15px blanc | `Hors ligne — données du dernier chargement` |
| Hors ligne, saisies en attente | `!online && pending > 0` | `warning` | `cloud-off` 15px blanc | `1 modification en attente d'envoi` / `N modifications en attente d'envoi` |
| Synchronisation (réseau revenu) | `online && pending > 0` | `indigo` | `refresh-cw` 15px blanc | `Synchronisation de 1 modification…` / `Synchronisation de N modifications…` |

Détails fidèles à reproduire : pluriel sur « modification·s » dès `N > 1` ;
points de suspension `…` (caractère unique) en fin de libellé de
synchronisation ; texte 13px semibold blanc ; contenu centré, `gap 8px` ;
`accessibilityRole="alert"`. Le bandeau reste affiché tant que le rejeu n'est
pas terminé, même réseau revenu — puis disparaît (c'est le « validé » de la
séquence : la disparition du bandeau, pas un quatrième état).

Le décompte `pending` vient des mutations TanStack en pause
(`state.isPaused`) : « en attente » signifie « en file, pas perdu », jamais
« échoué ».

- Press : `scale 0.97`, 120 ms, `ReduceMotion.System` respecté (`Button`).
- Titres : aplat indigo, jamais de gradient (arbitrage `PageHeader`, « gagne aussi en contraste »).
- Icônes : `lucide-react-native` exclusivement. Repérées : `bell`, `map-pin`, `check`, `calendar-days`, `clock`, `cloud-off`, `refresh-cw`, `arrow-right`, `triangle-alert`, `search`, `x`, `user`.
  ⚠️ L'app utilise `cloud-off` pour le hors-ligne ; DESIGN_CONTEXT.md liste `wifi-off`.
- Montants lus par lecteur d'écran en euros (`accessibilityLabel={formatEuros(cents)}`).
- Erreur de champ sous le champ, jamais en alerte.
- Écran vide = invitation à agir (titre + hint + bouton), jamais « Aucune donnée » seul.

---

## 7. Valeurs ABSENTES du repo (ne rien inventer)

| Valeur | Statut |
|---|---|
| Prix Solo / Entreprise (mensuel, annuel) | **ABSENTE** → `{{PRIX_SOLO}}` / `{{PRIX_ENTREPRISE}}` |
| Durée de l'essai gratuit | **ABSENTE** |
| Libellés marketing des features de plans | **ABSENTS** |
| Échelle typographique web (clamp) | **ABSENTE** (web-only, DESIGN_CONTEXT.md §3) |
| Ombres `lift` / `cta` / `cta-hover` / `device` | **ABSENTES** (web-only, §5) |
| Rayons `xl 32px` / `pill 999px` | **ABSENTS** (web-only, §5) |
| Panneau crème `--panel #FBF6EF` / `--panel-edge #F2EAE0` | **ABSENT** (ajout web déclaré, §4) |
| Easings / durées web (`--ease-out`, 220 ms…) | **ABSENTS** (web-only, §10) |
| Témoignages, statistiques d'usage, note store | **ABSENTS** |
| Logo / identité visuelle (hors `apps/mobile/assets/icon.png`) | **ABSENTE** |

### Écarts repo ↔ DESIGN_CONTEXT.md — tranchés (DESIGN_CONTEXT.md du 24/07)

1. **Heures** : `14 h 30` dans la prose de la page, `14:30` dans les
   interfaces reconstruites — les deux sont corrects, contextes différents.
   Les mockups restent fidèles à l'app, qui affiche `14:30`.
2. **Icône hors-ligne** : `cloud-off`, conforme au code — sémantiquement plus
   juste (synchronisation de données, pas signal réseau).
3. **Ombre soft** : le repo n'a que `softShadow` ; les 4 ombres web sont des ajouts à créer dans `tokens.css`.
