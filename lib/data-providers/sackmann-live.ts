import { parse } from "csv-parse/sync";
import type { Player, Surface } from "@/lib/types";

/**
 * Accès EN DIRECT aux données publiques Jeff Sackmann (github.com/JeffSackmann),
 * sans base de données et SANS CACHE : chaque appel retélécharge et reparse
 * les CSV sources. C'est un choix assumé (voulu par le porteur du projet) —
 * ça implique des temps de réponse plus longs (plusieurs secondes) que la
 * moyenne d'un site web, en échange de ne jamais stocker la moindre donnée
 * joueur nulle part.
 *
 * Deux niveaux de coût très différents :
 *  - `getTopPlayers` (liste top 400) : ne lit QUE les fichiers classement +
 *    fiches joueurs (petits, ~qq centaines de Ko). Rapide.
 *  - `getPlayerLiveStats` (un joueur précis) : doit en plus lire les fichiers
 *    de résultats de la saison (plusieurs Mo) pour calculer forme, winrate
 *    par surface, stats avancées. Volontairement fait à la demande, joueur
 *    par joueur, jamais pour les 400 d'un coup.
 */

export type TourKey = "ATP" | "WTA";

const REPO: Record<TourKey, string> = { ATP: "tennis_atp", WTA: "tennis_wta" };
const PREFIX: Record<TourKey, string> = { ATP: "atp", WTA: "wta" };

export const TOP_N = 400;

function rawUrl(tour: TourKey, file: string) {
  return `https://raw.githubusercontent.com/JeffSackmann/${REPO[tour]}/master/${file}`;
}

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Échec du téléchargement ${url} (${res.status})`);
  const text = await res.text();
  return parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function num(v: string | undefined, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function mapSurface(s: string): Surface | null {
  if (s === "Hard") return "Hard";
  if (s === "Clay") return "Clay";
  if (s === "Grass") return "Grass";
  return null;
}

function neutralStats(): Pick<Player, "ratings" | "formLast10" | "surfaceWinPct" | "advanced"> {
  return {
    ratings: { service: 50, retour: 50, filet: 50, endurance: 50, mental: 50, regularite: 50 },
    formLast10: [],
    surfaceWinPct: { Hard: 0.5, Clay: 0.5, Grass: 0.5, "Indoor Hard": 0.5 },
    advanced: {
      firstServeInPct: 0.6,
      firstServeWinPct: 0.65,
      secondServeWinPct: 0.5,
      breakPointsSavedPct: 0.6,
      breakPointsConvertedPct: 0.4,
      tieBreakWinPct: 0.5,
      decidingSetWinPct: 0.5,
      acesPerMatch: 5,
      doubleFaultsPerMatch: 3,
    },
  };
}

export function playerIdFor(tour: TourKey, sackmannId: string): string {
  return `live-${tour}-${sackmannId}`;
}

export function parsePlayerId(id: string): { tour: TourKey; sackmannId: string } | null {
  const m = /^live-(ATP|WTA)-(.+)$/.exec(id);
  if (!m) return null;
  return { tour: m[1] as TourKey, sackmannId: m[2] };
}

interface SackmannPlayerRow {
  player_id: string;
  name_first?: string;
  name_last?: string;
  ioc?: string;
  hand?: string;
  dob?: string;
  height?: string;
}

interface RankingRow {
  ranking_date: string;
  rank: string;
  player: string;
  points: string;
}

/**
 * Liste rapide : top `TOP_N` joueurs du tour, stats neutres (non calculées).
 * Utilisée pour l'explorateur / la recherche, où charger les stats complètes
 * de 400 joueurs à chaque requête serait beaucoup trop lent.
 */
export async function getTopPlayers(tour: TourKey, limit = TOP_N): Promise<Player[]> {
  const prefix = PREFIX[tour];
  const [players, rankings] = await Promise.all([
    fetchCsv(rawUrl(tour, `${prefix}_players.csv`)),
    fetchCsv(rawUrl(tour, `${prefix}_rankings_current.csv`)),
  ]);

  const maxDate = (rankings as unknown as RankingRow[]).reduce(
    (max, r) => (r.ranking_date > max ? r.ranking_date : max),
    ""
  );
  const latest = (rankings as unknown as RankingRow[])
    .filter((r) => r.ranking_date === maxDate)
    .sort((a, b) => num(a.rank, 9999) - num(b.rank, 9999))
    .slice(0, limit);

  const byId = new Map<string, SackmannPlayerRow>();
  for (const p of players as unknown as SackmannPlayerRow[]) byId.set(p.player_id, p);

  const out: Player[] = [];
  for (const r of latest) {
    const sp = byId.get(r.player);
    if (!sp) continue;
    const name = `${sp.name_first ?? ""} ${sp.name_last ?? ""}`.trim();
    if (!name) continue;
    const dob = sp.dob && sp.dob.length === 8 ? sp.dob : null;
    const age = dob
      ? Math.floor(
          (Date.now() - Date.UTC(Number(dob.slice(0, 4)), Number(dob.slice(4, 6)) - 1, Number(dob.slice(6, 8)))) /
            (365.25 * 24 * 3600 * 1000)
        )
      : 0;

    out.push({
      id: playerIdFor(tour, r.player),
      name,
      country: sp.ioc ?? "",
      ranking: num(r.rank, 9999),
      tour,
      age,
      heightCm: num(sp.height) || 0,
      plays: sp.hand === "L" ? "Gaucher" : "Droitier",
      ...neutralStats(),
    });
  }
  return out;
}

export async function searchTopPlayers(query: string, limit = TOP_N): Promise<Player[]> {
  const [atp, wta] = await Promise.all([getTopPlayers("ATP", limit), getTopPlayers("WTA", limit)]);
  const all = [...atp, ...wta];
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((p) => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
}

interface MatchAgg {
  results: { date: string; win: boolean }[];
  surfaceWins: Record<Surface, number>;
  surfaceTotals: Record<Surface, number>;
  firstIn: number;
  svpt: number;
  firstWon: number;
  secondWon: number;
  secondPts: number;
  bpSaved: number;
  bpFaced: number;
  bpConverted: number;
  bpOpportunities: number;
  aces: number;
  dfs: number;
  matches: number;
  decidingSetWon: number;
  decidingSetTotal: number;
}

function emptyAgg(): MatchAgg {
  return {
    results: [],
    surfaceWins: { Hard: 0, Clay: 0, Grass: 0, "Indoor Hard": 0 },
    surfaceTotals: { Hard: 0, Clay: 0, Grass: 0, "Indoor Hard": 0 },
    firstIn: 0,
    svpt: 0,
    firstWon: 0,
    secondWon: 0,
    secondPts: 0,
    bpSaved: 0,
    bpFaced: 0,
    bpConverted: 0,
    bpOpportunities: 0,
    aces: 0,
    dfs: 0,
    matches: 0,
    decidingSetWon: 0,
    decidingSetTotal: 0,
  };
}

/** N'agrège QUE les lignes concernant `sackmannId` — pas les 400 joueurs. */
function aggregateForPlayer(matches: Record<string, string>[], sackmannId: string): MatchAgg {
  const agg = emptyAgg();
  const sorted = [...matches].sort((a, b) => num(a.tourney_date) - num(b.tourney_date));

  for (const m of sorted) {
    const side = m.winner_id === sackmannId ? "w" : m.loser_id === sackmannId ? "l" : null;
    if (!side) continue;
    const opp = side === "w" ? "l" : "w";
    const isWinner = side === "w";
    const surface = mapSurface(m.surface);

    agg.results.push({ date: m.tourney_date, win: isWinner });
    agg.matches += 1;

    if (surface) {
      agg.surfaceTotals[surface] += 1;
      if (isWinner) agg.surfaceWins[surface] += 1;
    }

    agg.aces += num(m[`${side}_ace`]);
    agg.dfs += num(m[`${side}_df`]);
    agg.svpt += num(m[`${side}_svpt`]);
    agg.firstIn += num(m[`${side}_1stIn`]);
    agg.firstWon += num(m[`${side}_1stWon`]);
    agg.secondWon += num(m[`${side}_2ndWon`]);
    agg.secondPts += Math.max(0, num(m[`${side}_svpt`]) - num(m[`${side}_1stIn`]));
    agg.bpSaved += num(m[`${side}_bpSaved`]);
    agg.bpFaced += num(m[`${side}_bpFaced`]);

    const oppBpFaced = num(m[`${opp}_bpFaced`]);
    const oppBpSaved = num(m[`${opp}_bpSaved`]);
    agg.bpOpportunities += oppBpFaced;
    agg.bpConverted += Math.max(0, oppBpFaced - oppBpSaved);

    const sets = (m.score || "").trim().split(" ").filter(Boolean);
    const bestOf = num(m.best_of, 3);
    if (sets.length >= bestOf) {
      agg.decidingSetTotal += 1;
      if (isWinner) agg.decidingSetWon += 1;
    }
  }

  return agg;
}

function statsFromAgg(agg: MatchAgg): Pick<Player, "ratings" | "formLast10" | "surfaceWinPct" | "advanced"> {
  if (agg.matches === 0) return neutralStats();

  const firstServeInPct = agg.svpt > 0 ? agg.firstIn / agg.svpt : 0.6;
  const firstServeWinPct = agg.firstIn > 0 ? agg.firstWon / agg.firstIn : 0.65;
  const secondServeWinPct = agg.secondPts > 0 ? agg.secondWon / agg.secondPts : 0.5;
  const breakPointsSavedPct = agg.bpFaced > 0 ? agg.bpSaved / agg.bpFaced : 0.6;
  const breakPointsConvertedPct = agg.bpOpportunities > 0 ? agg.bpConverted / agg.bpOpportunities : 0.4;
  const decidingSetWinPct = agg.decidingSetTotal > 0 ? agg.decidingSetWon / agg.decidingSetTotal : 0.5;
  const acesPerMatch = agg.aces / agg.matches;
  const doubleFaultsPerMatch = agg.dfs / agg.matches;

  const surfaceWinPct: Player["surfaceWinPct"] = {
    Hard: agg.surfaceTotals.Hard > 0 ? agg.surfaceWins.Hard / agg.surfaceTotals.Hard : 0.5,
    Clay: agg.surfaceTotals.Clay > 0 ? agg.surfaceWins.Clay / agg.surfaceTotals.Clay : 0.5,
    Grass: agg.surfaceTotals.Grass > 0 ? agg.surfaceWins.Grass / agg.surfaceTotals.Grass : 0.5,
    "Indoor Hard": agg.surfaceTotals.Hard > 0 ? agg.surfaceWins.Hard / agg.surfaceTotals.Hard : 0.5,
  };

  const formLast10 = agg.results.slice(-10).map((r) => (r.win ? "W" : "L")) as ("W" | "L")[];

  return {
    ratings: {
      service: clamp(Math.round(firstServeWinPct * 70 + secondServeWinPct * 30), 0, 100),
      retour: clamp(Math.round(breakPointsConvertedPct * 150), 0, 100),
      filet: 50,
      endurance: clamp(Math.round(decidingSetWinPct * 100), 0, 100),
      mental: clamp(Math.round((breakPointsSavedPct * 0.5 + decidingSetWinPct * 0.5) * 100), 0, 100),
      regularite: clamp(Math.round(firstServeInPct * 100), 0, 100),
    },
    formLast10,
    surfaceWinPct,
    advanced: {
      firstServeInPct,
      firstServeWinPct,
      secondServeWinPct,
      breakPointsSavedPct,
      breakPointsConvertedPct,
      tieBreakWinPct: 0.5,
      decidingSetWinPct,
      acesPerMatch,
      doubleFaultsPerMatch,
    },
  };
}

/**
 * Stats complètes d'UN joueur, calculées en direct (aucun cache). Doit lire
 * les fichiers de résultats de la saison en cours + précédente pour ce tour.
 */
export async function getPlayerLiveStats(tour: TourKey, sackmannId: string): Promise<Player | null> {
  const prefix = PREFIX[tour];
  const currentYear = new Date().getFullYear();

  const [players, rankings] = await Promise.all([
    fetchCsv(rawUrl(tour, `${prefix}_players.csv`)),
    fetchCsv(rawUrl(tour, `${prefix}_rankings_current.csv`)),
  ]);

  const sp = (players as unknown as SackmannPlayerRow[]).find((p) => p.player_id === sackmannId);
  if (!sp) return null;

  const maxDate = (rankings as unknown as RankingRow[]).reduce(
    (max, r) => (r.ranking_date > max ? r.ranking_date : max),
    ""
  );
  const rankingRow = (rankings as unknown as RankingRow[]).find(
    (r) => r.ranking_date === maxDate && r.player === sackmannId
  );

  let matches: Record<string, string>[] = [];
  for (const year of [currentYear, currentYear - 1]) {
    try {
      const rows = await fetchCsv(rawUrl(tour, `${prefix}_matches_${year}.csv`));
      matches = matches.concat(rows);
    } catch {
      // pas grave si une saison manque, on continue avec le reste
    }
  }

  const agg = aggregateForPlayer(matches, sackmannId);
  const stats = statsFromAgg(agg);

  const name = `${sp.name_first ?? ""} ${sp.name_last ?? ""}`.trim();
  const dob = sp.dob && sp.dob.length === 8 ? sp.dob : null;
  const age = dob
    ? Math.floor(
        (Date.now() - Date.UTC(Number(dob.slice(0, 4)), Number(dob.slice(4, 6)) - 1, Number(dob.slice(6, 8)))) /
          (365.25 * 24 * 3600 * 1000)
      )
    : 0;

  return {
    id: playerIdFor(tour, sackmannId),
    name,
    country: sp.ioc ?? "",
    ranking: rankingRow ? num(rankingRow.rank, 9999) : 9999,
    tour,
    age,
    heightCm: num(sp.height) || 0,
    plays: sp.hand === "L" ? "Gaucher" : "Droitier",
    ...stats,
  };
}

/** Rapprochement par nom, utilisé pour retrouver l'ID Sackmann d'un joueur créé à la volée. */
export async function findSackmannIdByName(tour: TourKey, name: string): Promise<string | null> {
  const prefix = PREFIX[tour];
  const players = await fetchCsv(rawUrl(tour, `${prefix}_players.csv`));
  const target = normalizeName(name);
  const found = (players as unknown as SackmannPlayerRow[]).find(
    (p) => normalizeName(`${p.name_first ?? ""} ${p.name_last ?? ""}`) === target
  );
  return found?.player_id ?? null;
}
