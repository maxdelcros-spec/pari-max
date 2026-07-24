"use server";

import type { Player, Surface, Tour, TourCategory } from "@/lib/types";
import { saveMatch, deleteMatch as deleteMatchFromStore, type StoredMatch } from "@/lib/store/matches-store";

// Code requis pour ajouter/supprimer un match. Personnalisable via la
// variable d'env MATCHES_ACCESS_CODE (sinon "0000" par défaut).
const ACCESS_CODE = process.env.MATCHES_ACCESS_CODE || "0000";

function checkAccessCode(code: string) {
  if (code !== ACCESS_CODE) {
    throw new Error("Code d'accès incorrect.");
  }
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface CreateMatchInput {
  tour: Tour;
  category: TourCategory;
  tournament: string;
  round: string;
  surface: Surface;
  startTime: string; // ISO, saisi par l'utilisateur
  player1: Player; // snapshot complet (déjà résolu côté formulaire)
  player2: Player;
  player1Odds: number;
  player2Odds: number;
  h2hPlayer1Wins?: number;
  h2hPlayer2Wins?: number;
  accessCode: string;
}

/**
 * Enregistre un match. Les deux joueurs sont stockés tels quels (snapshot
 * de leurs stats au moment de l'ajout) : il n'existe pas de table "players"
 * séparée, puisque les stats ne sont jamais persistées (voir
 * lib/data-providers/sackmann-live.ts). Le dashboard, lui, va chercher les
 * stats à jour en direct à chaque affichage — seul ce snapshot du match
 * (tournoi, cotes, H2H) est conservé.
 */
export async function createMatch(input: CreateMatchInput) {
  checkAccessCode(input.accessCode);

  const id = `m-${slug(input.tournament)}-${slug(input.round)}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const match: StoredMatch = {
    id,
    tour: input.tour,
    category: input.category,
    tournament: input.tournament,
    round: input.round,
    surface: input.surface,
    startTime: input.startTime,
    player1: input.player1,
    player2: input.player2,
    player1Odds: input.player1Odds,
    player2Odds: input.player2Odds,
    h2hPlayer1Wins: input.h2hPlayer1Wins ?? 0,
    h2hPlayer2Wins: input.h2hPlayer2Wins ?? 0,
    fetchedAt: now,
    status: "scheduled",
    createdAt: now,
  };

  await saveMatch(match);
  return { id };
}

/** Supprime un match. Nécessite le même code d'accès que l'ajout. */
export async function deleteMatch(id: string, accessCode: string) {
  checkAccessCode(accessCode);
  await deleteMatchFromStore(id);
  return { id };
}
