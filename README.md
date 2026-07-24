# CourtEdge — Dashboard Value Betting Tennis

Outil d'analyse tennis (ATP/WTA) : cotes, probabilités modèle, value bets,
comparaison de joueurs. Design sombre "pro betting tool", construit avec
Next.js 15 + TypeScript + Tailwind.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000. Aucune clé API n'est requise pour démarrer : les
stats joueurs sont récupérées en direct, et les matchs sont stockés en
mémoire tant qu'Upstash n'est pas configuré (voir plus bas).

## Architecture des données

Deux sources bien séparées, volontairement pas de base de données pour les
stats joueurs :

### 1. Stats joueurs (top 400 ATP + top 400 WTA) — 100% en direct

`lib/data-providers/sackmann-live.ts` va chercher, à chaque requête et SANS
AUCUN CACHE, les données publiques du dataset ouvert **Jeff Sackmann**
(github.com/JeffSackmann/tennis_atp et tennis_wta — pas l'API officielle
ATP/WTA, qui n'existe pas gratuitement, mais une référence largement utilisée
en analyse tennis).

- La **liste** (top 400 par tour, nom/classement/pays) est rapide : elle ne
  lit que les petits fichiers classement + fiches joueurs.
- Les **stats complètes** d'un joueur (forme, winrate par surface, stats
  avancées) demandent de parcourir les résultats de la saison — c'est fait
  à la demande, un seul joueur à la fois, uniquement quand il est
  sélectionné dans `/players` ou impliqué dans un match affiché. Ça prend
  quelques secondes (assumé : c'est le prix de "zéro stockage, zéro cache").
- Rien n'est jamais écrit en base : aucune donnée joueur ne persiste nulle
  part.

### 2. Matchs et cotes — saisis à la main, stockés dans Redis

Il n'existe pas d'API tennis gratuite et fiable pour le calendrier ATP/WTA en
direct. Les matchs à venir sont donc saisis manuellement via `/matches/new`
(tournoi, round, surface, date, les 2 joueurs, cotes Betclic). Au moment de
l'ajout, les stats des 2 joueurs (récupérées en direct comme ci-dessus) sont
enregistrées en snapshot avec le match — l'analyse (probabilité, value bet)
est donc figée à l'instant de l'ajout pour un match donné (contrairement à la
fiche joueur dans `/players`, elle, toujours recalculée en direct).

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
   premiers matchs.

### Limites à connaître

- **Lenteur assumée** : sans aucun cache, ouvrir la fiche d'un joueur ou
  la page `/players` peut prendre plusieurs secondes (téléchargement +
  parsing de CSV à chaque fois).
- Le rapprochement joueur ↔ dataset Sackmann se fait par nom lors de la
  recherche/l'ajout ; en cas d'homonymie ou d'orthographe différente, un
  joueur peut ne pas apparaître dans le top 400.
- Un joueur en dehors du top 400 (ou hors ATP/WTA) peut être ajouté "à la
  main" dans `/matches/new`, mais démarre avec des stats neutres (pas de
  fiche Sackmann à rapprocher).
- Le dataset Sackmann ne distingue pas Hard indoor/outdoor ; les deux
  utilisent le même winrate "Hard".
- Les cotes ne sont **pas** live pendant le match (nécessiterait une API
  payante).

## Architecture

```
app/
  page.tsx                  Dashboard (matchs enregistrés + analyse)
  match/[id]/page.tsx        Analyse détaillée
  players/page.tsx           Recherche joueur (top 400 ATP/WTA, live)
  value-bets/page.tsx        Table value bets
  bankroll/page.tsx          Bankroll tracker (localStorage)
  history/page.tsx           Historique
  methodology/page.tsx       Méthodologie

components/                  UI (client components pour l'interactivité)
  AddMatchForm.tsx            Formulaire d'ajout de match
  PlayersExplorer.tsx          Liste top 400 + fetch live au clic
lib/
  types.ts                   Types du domaine (Player, Match, Odds...)
  calc/predict.ts             Modèle de probabilité (documenté, poids explicites)
  calc/value-bet.ts           Formule de value bet
  actions/
    matches.ts                 Server Action : createMatch (snapshot joueurs inclus)
    players.ts                  Server Actions : searchPlayersAction, getPlayerLiveStatsAction
  store/matches-store.ts       Stockage Redis (Upstash) des matchs, repli mémoire en dev
  data-providers/
    types.ts                  Interface DataProvider
    live-provider.ts           Implémentation unique (Redis + Sackmann live)
    sackmann-live.ts            Fetch + calcul des stats joueurs, sans cache ni stockage

app/matches/new/page.tsx     Formulaire d'ajout de match
```

## Déploiement

- **Frontend** : Vercel (zero-config pour Next.js 15 App Router). Renseigne
  `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans les env vars
  Vercel.
- Pas de tâche planifiée (cron) nécessaire : tout est calculé à la demande.

## Avertissement

Cet outil fournit une aide à la décision statistique, pas une garantie de
gain. Les paris sportifs comportent un risque de perte en capital.
