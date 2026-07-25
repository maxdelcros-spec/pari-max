"use server";

import { searchPlayers } from "@/lib/store/players-store";
import type { Player } from "@/lib/types";

/**
 * Recherche parmi les joueurs déjà enregistrés (saisis à la main lors d'un
 * ajout de match précédent) — plus de source live externe. `tour` filtre
 * ATP/WTA quand fourni (utilisé par le sélecteur du formulaire d'ajout).
 */
export async function searchPlayersAction(query: string, tour?: "ATP" | "WTA"): Promise<Player[]> {
  try {
    return await searchPlayers(query, tour);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[searchPlayersAction] échec:", err);
    return [];
  }
}
