import type { Match, Player } from "@/lib/types";

/**
 * Contrat commun à toute source de données. Implémentation unique :
 * `LiveDataProvider` (voir live-provider.ts) — joueurs et matchs saisis à
 * la main, tous deux stockés dans Redis.
 */
export interface DataProvider {
  /** Matchs programmés dans les `days` prochains jours (2 par défaut). */
  getUpcomingMatches(days?: number): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | null>;
  searchPlayers(query: string): Promise<Player[]>;
  getPlayerById(id: string): Promise<Player | null>;
}
