import { dataProvider } from "@/lib/data-providers";
import { PlayersExplorer } from "@/components/PlayersExplorer";

export default async function PlayersPage() {
  const players = await dataProvider.searchPlayers("");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">Recherche joueur</h1>
        <p className="mt-1 text-sm text-ink-400">
          Stats globales, évolution de forme et forces/faiblesses par surface.
        </p>
      </div>
      <PlayersExplorer players={players} />
    </div>
  );
}
