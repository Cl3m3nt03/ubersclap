# Déploiement — faire tester à distance

Objectif : un bêta-testeur installe l'app **de chez lui**, sans que ton PC soit
allumé. Deux morceaux : une **API en ligne** et une **app installable**.

## Recommandation : API sur Railway + APK Android

Le chemin le plus simple, gratuit, sans store ni compte Apple :

1. **API publique** → Railway (Postgres inclus, déploie depuis GitHub).
2. **App** → build **APK Android** (`eas build`) : un fichier installable par
   lien, **aucun compte, aucun store, aucun frais**. Le testeur ouvre le lien,
   installe, ça marche — même quand ton PC est éteint.

> iOS ne permet pas ça : un `.ipa` hors App Store exige un compte Apple
> Developer (99 $/an) + l'UDID du device. Si le testeur est sur iPhone et que tu
> ne veux pas payer, le seul chemin gratuit reste Expo Go + `expo start --tunnel`
> (ton Metro doit tourner). Sur Android, l'APK est sans contrainte.

---

## 1. API sur Railway

Le `Dockerfile` à la racine est prêt (build monorepo + migrations au démarrage).

1. https://railway.app → **New Project** → **Deploy from GitHub repo** →
   `Cl3m3nt03/ubersclap`.
2. Railway détecte le `Dockerfile`. Laisse.
3. **+ New** → **Database** → **PostgreSQL**. Railway crée `DATABASE_URL`.
4. Sur le service API, onglet **Variables**, ajoute :
   - `DATABASE_URL` → référence la variable du plugin Postgres
     (`${{Postgres.DATABASE_URL}}`).
   - `JWT_ACCESS_SECRET` → une valeur longue et aléatoire.
   - `JWT_REFRESH_SECRET` → une autre.
     ```
     node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
     ```
   - (`PORT` est fourni par Railway, ne pas y toucher.)
5. Déploie. Une fois vert, **Settings → Networking → Generate Domain**.
   → URL du type `https://ubersclap-api-production.up.railway.app`.
6. Vérifie : ouvre `.../v1/health` → `{"status":"ok","database":"ok"}`.

> Les migrations tournent automatiquement au démarrage (`db:migrate` dans le
> `CMD`). Rien à lancer à la main.

## 2. APK Android (installable par lien)

```powershell
cd apps/mobile
npx eas-cli login          # compte Expo (gratuit)
npx eas-cli init           # crée le projectId
```

Mets l'URL Railway dans `apps/mobile/eas.json`, profil `preview` :
```json
"env": { "EXPO_PUBLIC_API_URL": "https://TON-URL.up.railway.app/v1" }
```

Build :
```powershell
npx eas-cli build --platform android --profile preview
```
À la fin, EAS donne un **lien** (page expo.dev) → le testeur l'ouvre sur son
Android, télécharge l'APK, installe (autoriser « sources inconnues »), crée un
compte dans l'app. Fonctionne de partout, ton PC éteint.

## 3. iOS (si le testeur est sur iPhone)

- **Avec** compte Apple Developer : `npx eas-cli build --platform ios --profile
  preview` → lien d'install (device à enregistrer).
- **Sans** compte : Expo Go + `expo start --tunnel` (ton Metro doit tourner) —
  voir plus bas.

---

## Alternative sans rien déployer (ton PC doit rester allumé)

Tunnel du localhost + Expo Go. Bien pour un test ponctuel, pas pour du durable.

```powershell
# T1
pnpm api
# T2 (cloudflared téléchargé une fois)
./cloudflared.exe tunnel --url http://localhost:3000   # copie l'URL https
# T3
cd apps/mobile
$env:EXPO_PUBLIC_API_URL="https://xxx.trycloudflare.com/v1"
npx expo start --tunnel
```
Prérequis : `docker compose up -d` (Postgres).
