import { dataProvider } from "@/lib/data-providers";
import { computeValueBet } from "@/lib/calc/value-bet";
import { formatOdds, formatProb, cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export default async function HistoryPage() {
  // Affiche les matchs enregistrés (Redis) ; le résultat final pourrait être
  // ajouté une fois le match joué (non implémenté ici).
  const matches = await dataProvider.getUpcomingMatches();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">Historique des analyses</h1>
        <p className="mt-1 text-sm text-ink-400">
          Retrouve les matchs que tu as consultés récemment et leur value au moment de l&apos;analyse.
        </p>
      </div>

      <div className="rounded-2xl border border-base-border bg-base-900 shadow-card">
        <div className="flex flex-col divide-y divide-base-border">
          {matches.map((m) => {
            const value = computeValueBet(m);
            return (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-base-850/60"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-ink-600" />
                  <div>
                    <p className="text-sm font-medium text-ink-50">
                      {m.player1.name} vs {m.player2.name}
                    </p>
                    <p className="text-xs text-ink-400">
                      {m.tournament} · {m.round} · cotes {formatOdds(m.odds.player1Odds)} / {formatOdds(m.odds.player2Odds)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 font-mono text-xs font-semibold",
                      value.bestValuePct > 0 ? "bg-edge/15 text-edge-bright" : "bg-base-800 text-ink-400"
                    )}
                  >
                    {value.bestValuePct > 0 ? `+${value.bestValuePct.toFixed(1)}%` : "—"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-court-bright" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
