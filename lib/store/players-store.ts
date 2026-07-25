import { Redis } from "@upstash/redis";
import type { Player } from "@/lib/types";

/**
 * Base des joueurs saisis manuellement. Chaque joueur créé via le
 * formulaire d'ajout de match est enregistré ici avec toutes ses stats —
 * il peut ensuite être retrouvé et réutilisé pour les prochains matchs
 * sans tout ressaisir.
 *
 * Même Redis (Upstash) que lib/store/matches-store.ts, clé différente.
 * Repli en mémoire si Upstash n'est pas configuré (perdu au redémarrage).
 */

const INDEX_KEY = "courtedge:players:index"; // set des IDs joueurs
const playerKey = (id: string) => `courtedge:players:${id}`;

function redisIsConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

const memoryStore = new Map<string, Player>();

/** Enregistre (ou met à jour) un joueur. Appelé à chaque création de match. */
export async function savePlayer(player: Player): Promise<void> {
  if (!redisIsConfigured()) {
    memoryStore.set(player.id, player);
    return;
  }
  const redis = getRedis();
  await redis.set(playerKey(player.id), player);
  await redis.sadd(INDEX_KEY, player.id);
}

export async function listPlayers(): Promise<Player[]> {
  if (!redisIsConfigured()) {
    return Array.from(memoryStore.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  const redis = getRedis();
  const ids = await redis.smembers(INDEX_KEY);
  if (!ids.length) return [];
  const results = await Promise.all(ids.map((id) => redis.get<Player>(playerKey(id))));
  return results
    .filter((p): p is Player => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlayer(id: string): Promise<Player | null> {
  if (!redisIsConfigured()) {
    return memoryStore.get(id) ?? null;
  }
  const redis = getRedis();
  return redis.get<Player>(playerKey(id));
}

/** Recherche par nom (insensible à la casse) parmi les joueurs déjà enregistrés, filtrée par tour si fourni. */
export async function searchPlayers(query: string, tour?: "ATP" | "WTA"): Promise<Player[]> {
  const all = await listPlayers();
  const scoped = tour ? all.filter((p) => p.tour === tour) : all;
  const q = query.trim().toLowerCase();
  if (!q) return scoped;
  return scoped.filter((p) => p.name.toLowerCase().includes(q));
}

export async function deletePlayer(id: string): Promise<void> {
  if (!redisIsConfigured()) {
    memoryStore.delete(id);
    return;
  }
  const redis = getRedis();
  await redis.del(playerKey(id));
  await redis.srem(INDEX_KEY, id);
}
