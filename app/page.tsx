import { dataProvider } from "@/lib/data-providers";
import { DashboardBoard } from "@/components/DashboardBoard";

export const revalidate = 60; // re-fetch cotes/prédictions toutes les 60s en prod

export default async function DashboardPage() {
  const matches = await dataProvider.getUpcomingMatches();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">
          Matchs du jour
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Cotes Betclic, probabilités du modèle et value bets — ATP, WTA, Challenger, ITF.
        </p>
      </div>
      <DashboardBoard matches={matches} />
    </div>
  );
}
