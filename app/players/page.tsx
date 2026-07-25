import { dataProvider } from "@/lib/data-providers";
import { PlayersExplorer } from "@/components/PlayersExplorer";

// Le chargement du top 400 ATP + WTA en direct (sans cache) peut prendre
// plusieurs secondes ; on augmente la limite par défaut de la fonction pour
// éviter un timeout côté serveur (10s par défaut sur Vercel).
export const maxDuration = 60;

export default async function PlayersPage() {
  let players: Awaited<ReturnType<typeof dataProvider.searchPlayers>> = [];
  let loadError: string | null = null;

  try {
    players = await dataProvider.searchPlayers("");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[players/page] échec searchPlayers:", err);
    loadError =
      "Impossible de récupérer la liste des joueurs pour le moment (source de données indisponible ou trop lente). Réessaie dans quelques instants.";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">Recherche joueur</h1>
        <p className="mt-1 text-sm text-ink-400">
          Stats globales, évolution de forme et forces/faiblesses par surface.
        </p>
      </div>
      {loadError ? (
        <div className="rounded-2xl border border-base-border bg-base-900 p-5 text-sm text-ink-400">
          {loadError}
        </div>
      ) : (
        <PlayersExplorer players={players} />
      )}
    </div>
  );
}
