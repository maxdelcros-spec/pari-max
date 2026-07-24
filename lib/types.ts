export type Surface = "Hard" | "Clay" | "Grass" | "Indoor Hard";

export type Tour = "ATP" | "WTA" | "Challenger" | "ITF";

// Catégorie du tournoi. Utilisée pour filtrer les matchs saisis manuellement
// (ATP/WTA 250/500/1000) ; GrandSlam et Masters1000 ajoutés pour couvrir les
// tournois majeurs sans forcer un mauvais mapping.
export type TourCategory =
  | "ATP250"
  | "ATP500"
  | "ATP1000"
  | "WTA250"
  | "WTA500"
  | "WTA1000"
  | "GrandSlam";

export interface Player {
  id: string;
  name: string;
  country: string; // ISO code, e.g. "FRA"
  ranking: number;
  tour: "ATP" | "WTA";
  age: number;
  heightCm: number;
  plays: "Droitier" | "Gaucher";
  // Season / rolling aggregates, 0-100 scaled indices used for the radar chart
  ratings: {
    service: number;
    retour: number;
    filet: number;
    endurance: number;
    mental: number;
    regularite: number;
  };
  formLast10: ("W" | "L")[]; // most recent last
  surfaceWinPct: Record<Surface, number>; // 0-1
  advanced: {
    firstServeInPct: number;
    firstServeWinPct: number;
    secondServeWinPct: number;
    breakPointsSavedPct: number;
    breakPointsConvertedPct: number;
    tieBreakWinPct: number;
    decidingSetWinPct: number;
    acesPerMatch: number;
    doubleFaultsPerMatch: number;
  };
}

export interface OddsSnapshot {
  bookmaker: "Betclic";
  player1Odds: number;
  player2Odds: number;
  fetchedAt: string; // ISO timestamp
  isLive: boolean;
}

export interface ModelPrediction {
  player1WinProb: number; // 0-1
  player2WinProb: number; // 0-1
  method: string; // short description of the model version
  confidence: "Faible" | "Moyenne" | "Elevee";
}

export interface ValueBetResult {
  player1Value: number; // (prob * odds) - 1
  player2Value: number;
  bestSide: "player1" | "player2" | null;
  bestValuePct: number; // best of the two, as %
}

export interface Match {
  id: string;
  tour: Tour;
  category?: TourCategory; // renseigné pour les matchs ajoutés manuellement
  tournament: string;
  round: string;
  surface: Surface;
  startTime: string; // ISO
  player1: Player;
  player2: Player;
  odds: OddsSnapshot;
  prediction: ModelPrediction;
  h2h: { player1Wins: number; player2Wins: number; lastMeetings: { date: string; winner: "player1" | "player2"; tournament: string; score: string }[] };
  status: "scheduled" | "live" | "finished";
}
