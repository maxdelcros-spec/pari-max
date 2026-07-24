import { Redis } from "@upstash/redis";
import type { Player, Surface, Tour, TourCategory } from "@/lib/types";

/**
 * Stockage des matchs saisis manuellement (PAS des stats joueurs, qui ne
 * sont jamais stockées — voir lib/data-providers/sackmann-live.ts).
 * Upstash Redis : choisi parce que c'est le plus simple à brancher sur
 * Vercel (pas de schéma, juste une clé/valeur JSON), gratuit pour ce volume.
 *
 * Si les variables d'env Upstash ne sont pas configurées, on retombe sur un
 * stockage en mémoire (perdu à chaque redémarrage du serveur) pour que
 * `npm run dev` fonctionne sans rien configurer.
 */

export interface StoredMatch {
  id: string;
  tour: Tour;
  category?: TourCategory;
  tournament: string;
  round: string;
  surface: Surface;
  startTime: string;
  player1: Player; // snapshot complet au moment de l'ajout
  player2: Player; // snapshot complet au moment de l'ajout
  player1Odds: number;
  player2Odds: number;
  h2hPlayer1Wins: number;
  h2hPlayer2Wins: number;
  fetchedAt: string;
  status: "scheduled" | "live" | "finished";
  createdAt: string;
}

const INDEX_KEY = "courtedge:matches:index"; // set of match ids
const matchKey = (id: string) => `courtedge:matches:${id}`;

function redisIsConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

// Fallback mémoire (dev sans Upstash configuré)
const memoryStore = new Map<string, StoredMatch>();

export async function saveMatch(match: StoredMatch): Promise<void> {
  if (!redisIsConfigured()) {
    memoryStore.set(match.id, match);
    return;
  }
  const redis = getRedis();
  await redis.set(matchKey(match.id), match);
  await redis.sadd(INDEX_KEY, match.id);
}

export async function listMatches(): Promise<StoredMatch[]> {
  if (!redisIsConfigured()) {
    return Array.from(memoryStore.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  const redis = getRedis();
  const ids = await redis.smembers(INDEX_KEY);
  if (!ids.length) return [];
  const results = await Promise.all(ids.map((id) => redis.get<StoredMatch>(matchKey(id))));
  return results
    .filter((m): m is StoredMatch => m !== null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function getMatch(id: string): Promise<StoredMatch | null> {
  if (!redisIsConfigured()) {
    return memoryStore.get(id) ?? null;
  }
  const redis = getRedis();
  return redis.get<StoredMatch>(matchKey(id));
}

export async function deleteMatch(id: string): Promise<void> {
  if (!redisIsConfigured()) {
    memoryStore.delete(id);
    return;
  }
  const redis = getRedis();
  await redis.del(matchKey(id));
  await redis.srem(INDEX_KEY, id);
}
