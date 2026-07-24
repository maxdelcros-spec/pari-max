import type { Match, ValueBetResult } from "@/lib/types";

/**
 * Value = (probabilité estimée x cote) - 1
 * Un value > 0 signifie que le marché sous-évalue le joueur selon notre modèle.
 * On exprime le résultat en pourcentage pour l'affichage (ex: 0.084 -> "8.4%").
 */
export function computeValueBet(match: Match): ValueBetResult {
  const { prediction, odds } = match;

  const player1Value = prediction.player1WinProb * odds.player1Odds - 1;
  const player2Value = prediction.player2WinProb * odds.player2Odds - 1;

  let bestSide: ValueBetResult["bestSide"] = null;
  let bestValuePct = Math.max(player1Value, player2Value) * 100;

  if (player1Value <= 0 && player2Value <= 0) {
    bestSide = null;
  } else {
    bestSide = player1Value >= player2Value ? "player1" : "player2";
  }

  return {
    player1Value: player1Value * 100,
    player2Value: player2Value * 100,
    bestSide,
    bestValuePct,
  };
}

export function impliedProbabilityFromOdds(odds: number): number {
  return 1 / odds;
}

/** Marge du bookmaker sur le marché 1X2 simplifié (2 issues, tennis) */
export function bookmakerOverround(player1Odds: number, player2Odds: number): number {
  return impliedProbabilityFromOdds(player1Odds) + impliedProbabilityFromOdds(player2Odds) - 1;
}

export function valueTier(valuePct: number): "none" | "low" | "medium" | "high" {
  if (valuePct >= 12) return "high";
  if (valuePct >= 8) return "medium";
  if (valuePct > 0) return "low";
  return "none";
}
