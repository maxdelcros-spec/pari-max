"use client";

import { useMemo, useState } from "react";
import type { Match, Tour, Surface } from "@/lib/types";
import { computeValueBet } from "@/lib/calc/value-bet";
import { MatchCard } from "./MatchCard";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, TrendingUp } from "lucide-react";

const TOURS: (Tour | "Tous")[] = ["Tous", "ATP", "WTA", "Challenger", "ITF"];
const SURFACES: (Surface | "Toutes")[] = ["Toutes", "Hard", "Clay", "Grass", "Indoor Hard"];
const VALUE_THRESHOLDS = [
  { label: "Tous", min: -Infinity },
  { label: "Value > 0%", min: 0 },
  { label: "Value > 8%", min: 8 },
  { label: "Value > 12%", min: 12 },
];

export function DashboardBoard({ matches }: { matches: Match[] }) {
  const [tour, setTour] = useState<(typeof TOURS)[number]>("Tous");
  const [surface, setSurface] = useState<(typeof SURFACES)[number]>("Toutes");
  const [valueIdx, setValueIdx] = useState(0);
  const [sortByValue, setSortByValue] = useState(true);

  const enriched = useMemo(
    () => matches.map((m) => ({ match: m, value: computeValueBet(m) })),
    [matches]
  );

  const filtered = useMemo(() => {
    let list = enriched.filter(({ match, value }) => {
      if (tour !== "Tous" && match.tour !== tour) return false;
      if (surface !== "Toutes" && match.surface !== surface) return false;
      if (value.bestValuePct < VALUE_THRESHOLDS[valueIdx].min) return false;
      return true;
    });
    if (sortByValue) {
      list = [...list].sort((a, b) => b.value.bestValuePct - a.value.bestValuePct);
    } else {
      list = [...list].sort(
        (a, b) => new Date(a.match.startTime).getTime() - new Date(b.match.startTime).getTime()
      );
    }
    return list;
  }, [enriched, tour, surface, valueIdx, sortByValue]);

  const valueBetsCount = enriched.filter((e) => e.value.bestValuePct > 8).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Matchs aujourd'hui" value={matches.length.toString()} />
        <StatTile
          label="Value bets (> 8%)"
          value={valueBetsCount.toString()}
          accent="edge"
        />
        <StatTile
          label="Meilleure value"
          value={
            enriched.length
              ? `+${Math.max(...enriched.map((e) => e.value.bestValuePct)).toFixed(1)}%`
              : "—"
          }
          accent="court"
        />
        <StatTile label="Tournois couverts" value={new Set(matches.map((m) => m.tournament)).size.toString()} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-base-border bg-base-900 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <SlidersHorizontal className="mr-1 h-3.5 w-3.5 text-ink-600" />
          {TOURS.map((t) => (
            <Chip key={t} active={tour === t} onClick={() => setTour(t)}>
              {t}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-base-border" />
          {SURFACES.map((s) => (
            <Chip key={s} active={surface === s} onClick={() => setSurface(s)}>
              {s}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {VALUE_THRESHOLDS.map((v, i) => (
            <Chip key={v.label} active={valueIdx === i} onClick={() => setValueIdx(i)} tone="edge">
              {v.label}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-base-border" />
          <button
            onClick={() => setSortByValue((s) => !s)}
            className="flex items-center gap-1.5 rounded-full border border-base-border px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-court-dim hover:text-court-bright"
          >
            <TrendingUp className="h-3 w-3" />
            {sortByValue ? "Trié par value" : "Trié par horaire"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-border py-16 text-center text-sm text-ink-400">
          Aucun match ne correspond à ces filtres. Élargis les critères pour voir plus d'opportunités.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ match }) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "court" | "edge";
}) {
  return (
    <div className="rounded-xl border border-base-border bg-base-900 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold tabular-nums",
          accent === "court" && "text-court-bright",
          accent === "edge" && "text-edge-bright",
          !accent && "text-ink-50"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  tone = "court",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: "court" | "edge";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? tone === "edge"
            ? "border-edge bg-edge/15 text-edge-bright"
            : "border-court bg-court/15 text-court-bright"
          : "border-base-border text-ink-400 hover:border-base-600 hover:text-ink-200"
      )}
    >
      {children}
    </button>
  );
}
