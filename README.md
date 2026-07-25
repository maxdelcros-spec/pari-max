# CourtEdge — Dashboard Value Betting Tennis

Outil d'analyse tennis (ATP/WTA) : cotes, probabilités modèle, value bets,
comparaison de joueurs. Design sombre "pro betting tool", construit avec
Next.js 15 + TypeScript + Tailwind.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000. Aucune clé API n'est requise pour démarrer :
matchs et joueurs sont stockés en mémoire tant qu'Upstash n'est pas
configuré (voir plus bas).

## Architecture des données

Tout est saisi à la main, tout est stocké dans **Upstash Redis** — il n'y a
plus aucune source de données externe (l'ancienne intégration en direct
avec le dataset Jeff Sackmann a été retirée).

### 1. Joueurs — saisis à la main, stockés dans Redis

`lib/store/players-store.ts` : chaque joueur est créé via le formulaire
d'ajout de match (`/matches/new`), avec **toutes ses stats** (classement,
âge, indices de jeu, forme sur 10 matchs, winrate par surface, stats
avancées service/retour). Tous les champs sont obligatoires à la création :
le modèle de prédiction (voir `lib/calc/predict.ts`) combine 5 facteurs, et
une valeur neutre/manquante sur l'un d'eux fausserait le calcul.

Un joueur créé une première fois est ensuite **cherchable** (par nom) pour
les prochains matchs, sans avoir à ressaisir ses stats — voir le sélecteur
dans `AddMatchForm`/`PlayerPicker`. Au moment de la validation d'un match,
les deux joueurs sont (ré)enregistrés dans la base avec leur snapshot du
moment (voir `lib/actions/matches.ts`).

### 2. Matchs et cotes — saisis à la main, stockés dans Redis

Il n'existe pas d'API tennis gratuite et fiable pour le calendrier ATP/WTA en
direct. Les matchs à venir sont donc saisis manuellement via `/matches/new`
(tournoi, round, surface, date, les 2 joueurs, cotes Betclic). Les stats des
2 joueurs (saisies ou reprises depuis la base joueurs) sont enregistrées en
snapshot avec le match — l'analyse (probabilité, value bet) est donc figée
à l'instant de l'ajout pour un match donné.

Stockage : **Upstash Redis** (gratuit, REST, pas de schéma à créer) — voir
`lib/store/matches-store.ts`.

**Protection par code** : ajouter (`/matches/new`) ou supprimer un match
demande un code (`0000` par défaut, changeable via `MATCHES_ACCESS_CODE`
dans `.env.local`). Vérification faite côté serveur dans
`lib/actions/matches.ts`. À noter : c'est une protection légère (anti
"n'importe qui qui tombe sur l'URL"), pas une authentification — le code est
le même pour tout le monde et transite en clair.

### Mise en route (prod)

1. Crée une base sur [upstash.com](https://upstash.com) (Redis, plan
   gratuit).
2. Copie `.env.example` vers `.env.local`, renseigne `UPSTASH_REDIS_REST_URL`
   et `UPSTASH_REDIS_REST_TOKEN` (onglet "REST API" de la base Upstash).
3. `npm install && npm run dev`, va sur `/matches/new` pour ajouter tes
   premiers matchs (et joueurs).

### Limites à connaître

- Toutes les stats sont saisies manuellement : leur fiabilité dépend
  entièrement de ce que tu renseignes (pas de recoupement automatique avec
  une source externe).
- Un joueur est retrouvé par recherche sur son nom exact — deux orthographes
  différentes pour la même personne créeront deux entrées séparées.
- Les cotes ne sont **pas** live pendant le match (nécessiterait une API
  payante).

## Architecture

```
app/
  page.tsx                  Dashboard (matchs enregistrés + analyse)
  match/[id]/page.tsx        Analyse détaillée
  matches/new/page.tsx       Formulaire d'ajout de match + joueurs
  value-bets/page.tsx        Table value bets
  bankroll/page.tsx          Bankroll tracker (localStorage)
  history/page.tsx           Historique
  methodology/page.tsx       Méthodologie

components/                  UI (client components pour l'interactivité)
  AddMatchForm.tsx            Formulaire d'ajout de match (+ sélecteur joueur)
  PlayerStatsForm.tsx          Formulaire de saisie complète d'un nouveau joueur
lib/
  types.ts                   Types du domaine (Player, Match, Odds...)
  calc/predict.ts             Modèle de probabilité (documenté, poids explicites)
  calc/value-bet.ts           Formule de value bet
  actions/
    matches.ts                 Server Action : createMatch (enregistre aussi les joueurs)
    players.ts                  Server Action : searchPlayersAction (recherche en base)
  store/
    matches-store.ts            Stockage Redis (Upstash) des matchs, repli mémoire en dev
    players-store.ts            Stockage Redis (Upstash) des joueurs, repli mémoire en dev
  data-providers/
    types.ts                  Interface DataProvider
    live-provider.ts           Implémentation unique (matches-store + players-store)
```

## Déploiement

- **Frontend** : Vercel (zero-config pour Next.js 15 App Router). Renseigne
  `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans les env vars
  Vercel — indispensable en prod (sans ça, chaque requête serverless repart
  d'un stockage en mémoire vide).
- Pas de tâche planifiée (cron) nécessaire : tout est calculé à la demande.

## Avertissement

Cet outil fournit une aide à la décision statistique, pas une garantie de
gain. Les paris sportifs comportent un risque de perte en capital.
