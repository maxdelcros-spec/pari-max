import { dataProvider } from "@/lib/data-providers";
import { ValueBetsTable } from "@/components/ValueBetsTable";

export const revalidate = 60;

export default async function ValueBetsPage() {
  const matches = await dataProvider.getUpcomingMatches();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">Value Bets du jour</h1>
        <p className="mt-1 text-sm text-ink-400">
          Value = (probabilité du modèle × cote Betclic) − 1. Trie par colonne, filtre par seuil.
        </p>
      </div>
      <ValueBetsTable matches={matches} />
    </div>
  );
}
