import { LiveDataProvider } from "./live-provider";
import type { DataProvider } from "./types";

/**
 * Point d'entrée unique. Les stats joueurs sont toujours récupérées en
 * direct depuis le dataset Sackmann (aucun cache, aucun stockage — voir
 * sackmann-live.ts). Les matchs saisis manuellement sont stockés dans
 * Upstash Redis (voir lib/store/matches-store.ts), avec repli en mémoire
 * si Upstash n'est pas configuré (pratique pour `npm run dev`).
 */
export const dataProvider: DataProvider = new LiveDataProvider();
