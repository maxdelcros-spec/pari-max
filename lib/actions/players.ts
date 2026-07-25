"use server";

import { dataProvider } from "@/lib/data-providers";
import type { Player } from "@/lib/types";

/** Liste rapide (top 400 ATP/WTA), stats neutres tant qu'on n'a pas sélectionné le joueur. */
export async function searchPlayersAction(query: string): Promise<Player[]> {
  try {
    return await dataProvider.searchPlayers(query);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[searchPlayersAction] échec:", err);
    return [];
  }
}

/** Stats complètes calculées en direct (aucun cache) — appelée à la sélection d'un joueur. */
export async function getPlayerLiveStatsAction(id: string): Promise<Player | null> {
  try {
    return await dataProvider.getPlayerById(id);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[getPlayerLiveStatsAction] échec:", err);
    return null;
  }
}
