"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { computeValueBet, valueTier } from "@/lib/calc/value-bet";
import { formatOdds, formatProb, formatTime, cn } from "@/lib/utils";
import { ArrowUpDown, ArrowRight } from "lucide-react";

type Row = {
  match: Match;
  side: "player1" | "player2";
  playerName: string;
  opponentName: string;
  odds: number;
  prob: number;
  valuePct: number;
};

type SortKey = "value" | "odds" | "prob" | "time";

export function ValueBetsTable({ matches }: { matches: Match[] }) {
  const [minValue, setMinValue] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const match of matches) {
      const v = computeValueBet(match);
      if (v.player1Value > 0) {
        out.push({
          match,
          side: "player1",
          playerName: match.player1.name,
          opponentName: match.player2.name,
          odds: match.odds.player1Odds,
          prob: match.prediction.player1WinProb,
          valuePct: v.player1Value,
        });
      }
      if (v.player2Value > 0) {
        out.push({
          match,
          side: "player2",
          playerName: match.player2.name,
          opponentName: match.player1.name,
          odds: match.odds.player2Odds,
          prob: match.prediction.player2WinProb,
          valuePct: v.player2Value,
        });
      }
    }
    return out;
  }, [matches]);

  const filteredSorted = useMemo(() => {
    let list = rows.filter((r) => r.valuePct >= minValue);
    list = [...list].sort((a, b) => {
      const dir = sortDir;
      switch (sortKey) {
        case "value":
          return (a.valuePct - b.valuePct) * dir;
        case "odds":
          return (a.odds - b.odds) * dir;
        case "prob":
          return (a.prob - b.prob) * dir;
        case "time":
          return (new Date(a.match.startTime).getTime() - new Date(b.match.startTime).getTime()) * dir;
      }
    });
    return list;
  }, [rows, minValue, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { label: "Tous", v: 0 },
          { label: "> 8%", v: 8 },
          { label: "> 12%", v: 12 },
          { label: "> 20%", v: 20 },
        ].map((f) => (
          <button
            key={f.label}
            onClick={() => setMinValue(f.v)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              minValue === f.v
                ? "border-edge bg-edge/15 text-edge-bright"
                : "border-base-border text-ink-400 hover:border-base-600 hover:text-ink-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-base-border bg-base-900 shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-base-border bg-base-850/60 text-left text-[11px] uppercase tracking-wide text-ink-400">
              <Th label="Joueur (pari)" />
              <Th label="Adversaire" />
              <SortableTh label="Heure" onClick={() => toggleSort("time")} active={sortKey === "time"} dir={sortDir} />
              <SortableTh label="Cote" onClick={() => toggleSort("odds")} active={sortKey === "odds"} dir={sortDir} />
              <SortableTh label="Proba modèle" onClick={() => toggleSort("prob")} active={sortKey === "prob"} dir={sortDir} />
              <SortableTh label="Value" onClick={() => toggleSort("value")} active={sortKey === "value"} dir={sortDir} />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filteredSorted.map((r, i) => {
              const tier = valueTier(r.valuePct);
              return (
                <tr key={`${r.match.id}-${r.side}`} className={cn("border-b border-base-border/60 last:border-0", i % 2 === 1 && "bg-base-850/30")}>
                  <td className="px-4 py-3 font-medium text-ink-50">{r.playerName}</td>
                  <td className="px-4 py-3 text-ink-400">vs {r.opponentName}</td>
                  <td className="px-4 py-3 font-mono text-ink-400 tabular-nums">{formatTime(r.match.startTime)}</td>
                  <td className="px-4 py-3 font-mono text-ink-200 tabular-nums">{formatOdds(r.odds)}</td>
                  <td className="px-4 py-3 font-mono text-ink-200 tabular-nums">{formatProb(r.prob)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums",
                        tier === "high" && "bg-edge/20 text-edge-bright",
                        tier === "medium" && "bg-edge/15 text-edge-bright",
                        tier === "low" && "bg-court/15 text-court-bright"
                      )}
                    >
                      +{r.valuePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/match/${r.match.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-court-bright"
                    >
                      Analyser <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                  Aucune value bet ne dépasse ce seuil pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ label }: { label: string }) {
  return <th className="px-4 py-3 font-medium">{label}</th>;
}

function SortableTh({
  label,
  onClick,
  active,
  dir,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: 1 | -1;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button onClick={onClick} className={cn("flex items-center gap-1 hover:text-ink-200", active && "text-ink-200")}>
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active && (dir === 1 ? "rotate-180" : ""))} />
      </button>
    </th>
  );
}
