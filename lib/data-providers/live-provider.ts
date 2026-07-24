import type { Match, Player } from "@/lib/types";
import { predictMatch } from "@/lib/calc/predict";
import { listMatches, getMatch, type StoredMatch } from "@/lib/store/matches-store";
import { searchTopPlayers, getPlayerLiveStats, parsePlayerId } from "./sackmann-live";
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

export class LiveDataProvider implements DataProvider {
  async getUpcomingMatches(): Promise<Match[]> {
    const stored = await listMatches();
    return stored.map(buildMatch);
  }

  async getMatchById(id: string): Promise<Match | null> {
    const stored = await getMatch(id);
    return stored ? buildMatch(stored) : null;
  }

  /** Recherche dans le top 400 ATP + top 400 WTA, en direct (voir sackmann-live.ts). */
  async searchPlayers(query: string): Promise<Player[]> {
    return searchTopPlayers(query);
  }

  /** Stats complètes calculées en direct pour un joueur du top 400. */
  async getPlayerById(id: string): Promise<Player | null> {
    const parsed = parsePlayerId(id);
    if (!parsed) return null;
    return getPlayerLiveStats(parsed.tour, parsed.sackmannId);
  }
}
