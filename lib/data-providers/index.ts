import { LiveDataProvider } from "./live-provider";
import type { DataProvider } from "./types";

/**
 * Point d'entrée unique. Joueurs et matchs sont saisis à la main et
 * stockés dans Upstash Redis (voir lib/store/players-store.ts et
 * lib/store/matches-store.ts), avec repli en mémoire si Upstash n'est pas
 * configuré (pratique pour `npm run dev`).
 */
export const dataProvider: DataProvider = new LiveDataProvider();
