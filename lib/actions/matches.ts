"use server";

import type { Player, Surface, Tour, TourCategory } from "@/lib/types";
import { saveMatch, deleteMatch as deleteMatchFromStore, type StoredMatch } from "@/lib/store/matches-store";
import { savePlayer } from "@/lib/store/players-store";

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
 * Enregistre un match. Le snapshot complet des deux joueurs (au moment de
 * l'ajout) est conservé avec le match — l'analyse reste donc figée à cet
 * instant. Les deux joueurs sont aussi (ré)enregistrés dans la base
 * joueurs séparée (players-store.ts) pour être réutilisables plus tard.
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
  // Les deux joueurs sont (re)enregistrés dans la base joueurs à chaque
  // ajout de match : un nouveau joueur y entre pour la première fois, un
  // joueur déjà connu voit son snapshot mis à jour avec ses stats les plus
  // récentes — utile pour la recherche des prochains matchs.
  await Promise.all([savePlayer(input.player1), savePlayer(input.player2)]);
  return { id };
}

/** Supprime un match. Nécessite le même code d'accès que l'ajout. */
export async function deleteMatch(id: string, accessCode: string) {
  checkAccessCode(accessCode);
  await deleteMatchFromStore(id);
  return { id };
}
