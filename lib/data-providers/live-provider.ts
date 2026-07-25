import type { Match, Player } from "@/lib/types";
import { predictMatch } from "@/lib/calc/predict";
import { listMatches, getMatch, type StoredMatch } from "@/lib/store/matches-store";
import { searchPlayers as searchStoredPlayers, getPlayer as getStoredPlayer } from "@/lib/store/players-store";
import type { DataProvider } from "./types";

function buildMatch(stored: StoredMatch): Match {
  const prediction = predictMatch(
    stored.player1,
    stored.player2,
    stored.surface,
    { player1Wins: stored.h2hPlayer1Wins, player2Wins: stored.h2hPlayer2Wins }
  );

  return {
    id: stored.id,
    tour: stored.tour,
    category: stored.category,
    tournament: stored.tournament,
    round: stored.round,
    surface: stored.surface,
    startTime: stored.startTime,
    player1: stored.player1,
    player2: stored.player2,
    odds: {
      bookmaker: "Betclic",
      player1Odds: stored.player1Odds,
      player2Odds: stored.player2Odds,
      fetchedAt: stored.fetchedAt,
      isLive: false,
    },
    prediction,
    h2h: {
      player1Wins: stored.h2hPlayer1Wins,
      player2Wins: stored.h2hPlayer2Wins,
      lastMeetings: [],
    },
    status: stored.status,
  };
}

/**
 * Implémentation unique. Les matchs ET les joueurs sont désormais saisis à
 * la main et stockés dans Upstash Redis (voir lib/store/matches-store.ts et
 * lib/store/players-store.ts) — plus aucune source externe (l'ancienne
 * source live Jeff Sackmann a été retirée).
 */
export class LiveDataProvider implements DataProvider {
  async getUpcomingMatches(): Promise<Match[]> {
    const stored = await listMatches();
    return stored.map(buildMatch);
  }

  async getMatchById(id: string): Promise<Match | null> {
    const stored = await getMatch(id);
    return stored ? buildMatch(stored) : null;
  }

  /** Recherche parmi les joueurs déjà saisis à la main (voir players-store.ts). */
  async searchPlayers(query: string): Promise<Player[]> {
    return searchStoredPlayers(query);
  }

  async getPlayerById(id: string): Promise<Player | null> {
    return getStoredPlayer(id);
  }
}
