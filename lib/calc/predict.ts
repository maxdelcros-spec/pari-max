import type { Player, Surface, ModelPrediction } from "@/lib/types";

/**
 * Modèle heuristique multi-facteurs (v1).
 * Ce n'est PAS un modèle Elo entraîné sur données historiques — c'est une
 * pondération transparente de plusieurs signaux, pensée pour être simple à
 * auditer et à remplacer par un vrai modèle (Elo surface-spécifique, ou
 * gradient boosting entraîné sur Tennis Abstract / Ultimate Tennis Statistics).
 *
 * Facteurs (poids par défaut) :
 *  - Classement ATP/WTA (delta logarithmique)      : 30%
 *  - Winrate sur la surface du match                : 25%
 *  - Forme récente (10 derniers matchs)              : 20%
 *  - Indices de jeu (service/retour/mental/endurance): 15%
 *  - H2H direct                                      : 10%
 *
 * Chaque facteur produit un score dans [-1, 1] en faveur du joueur 1,
 * on combine puis on passe par une fonction logistique pour obtenir
 * une probabilité bornée dans ]0,1[.
 */

const WEIGHTS = {
  ranking: 0.3,
  surface: 0.25,
  form: 0.2,
  ratings: 0.15,
  h2h: 0.1,
};

function rankingScore(p1: Player, p2: Player): number {
  // Delta logarithmique borné : évite qu'un écart #1 vs #300 écrase tout
  const diff = Math.log(p2.ranking + 1) - Math.log(p1.ranking + 1);
  return clamp(diff / Math.log(50), -1, 1);
}

function surfaceScore(p1: Player, p2: Player, surface: Surface): number {
  const diff = p1.surfaceWinPct[surface] - p2.surfaceWinPct[surface];
  return clamp(diff * 4, -1, 1);
}

function formScore(p1: Player, p2: Player): number {
  const wr = (results: ("W" | "L")[]) => results.filter((r) => r === "W").length / (results.length || 1);
  const diff = wr(p1.formLast10) - wr(p2.formLast10);
  return clamp(diff * 2.5, -1, 1);
}

function ratingsScore(p1: Player, p2: Player): number {
  const avg = (r: Player["ratings"]) =>
    (r.service + r.retour + r.filet + r.endurance + r.mental + r.regularite) / 6;
  const diff = (avg(p1.ratings) - avg(p2.ratings)) / 100;
  return clamp(diff * 3, -1, 1);
}

function h2hScore(p1Wins: number, p2Wins: number): number {
  const total = p1Wins + p2Wins;
  if (total === 0) return 0;
  return clamp(((p1Wins - p2Wins) / total) * 0.8, -1, 1);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function predictMatch(
  p1: Player,
  p2: Player,
  surface: Surface,
  h2h: { player1Wins: number; player2Wins: number }
): ModelPrediction {
  const composite =
    WEIGHTS.ranking * rankingScore(p1, p2) +
    WEIGHTS.surface * surfaceScore(p1, p2, surface) +
    WEIGHTS.form * formScore(p1, p2) +
    WEIGHTS.ratings * ratingsScore(p1, p2) +
    WEIGHTS.h2h * h2hScore(h2h.player1Wins, h2h.player2Wins);

  // Facteur d'échelle pour que des écarts "typiques" donnent des probas réalistes (55-80%)
  const player1WinProb = logistic(composite * 3.1);
  const player2WinProb = 1 - player1WinProb;

  const spread = Math.abs(composite);
  const confidence: ModelPrediction["confidence"] =
    spread > 0.45 ? "Elevee" : spread > 0.2 ? "Moyenne" : "Faible";

  return {
    player1WinProb,
    player2WinProb,
    method: "Heuristique multi-facteurs v1 (classement, surface, forme, indices, H2H)",
    confidence,
  };
}
