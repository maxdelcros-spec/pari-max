"use client";

import { useEffect, useMemo, useState } from "react";
import type { Player } from "@/lib/types";
import { countryFlag, cn } from "@/lib/utils";
import { FormStrip } from "./FormStrip";
import { Search, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { getPlayerLiveStatsAction } from "@/lib/actions/players";

/**
 * `players` : liste rapide (nom, classement, pays) du top 400 ATP/WTA, sans
 * stats détaillées. Les stats complètes d'un joueur (winrate surface, forme,
 * indices...) sont calculées en direct et récupérées UNIQUEMENT au moment où
 * il est sélectionné — jamais préchargées pour les 400, ni mises en cache.
 */
export function PlayersExplorer({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(players[0]?.id ?? null);
  const [fullPlayer, setFullPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  const basicSelected = players.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    const id = basicSelected?.id;
    if (!id) {
      setFullPlayer(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getPlayerLiveStatsAction(id)
      .then((p) => {
        if (!cancelled) setFullPlayer(p);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicSelected?.id]);

  const selected = fullPlayer && fullPlayer.id === basicSelected?.id ? fullPlayer : basicSelected;

  const surfaceData = selected
    ? Object.entries(selected.surfaceWinPct).map(([surface, pct]) => ({
        surface,
        winrate: Math.round(pct * 100),
      }))
    : [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-base-border bg-base-900 px-3 py-2">
          <Search className="h-4 w-4 text-ink-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un joueur..."
            className="w-full bg-transparent text-sm text-ink-50 placeholder:text-ink-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-base-border bg-base-900 p-1.5">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                selected?.id === p.id ? "bg-base-800 text-ink-50" : "text-ink-400 hover:bg-base-850"
              )}
            >
              <span>{countryFlag(p.country)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-[11px] text-ink-600">
                  {p.tour} · #{p.ranking}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-ink-600">Aucun joueur trouvé.</p>
          )}
        </div>
      </div>

      {selected ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-base-border bg-base-900 p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{countryFlag(selected.country)}</span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-50">{selected.name}</h2>
                  <p className="text-xs text-ink-400">
                    {selected.tour} · #{selected.ranking} mondial · {selected.age} ans · {selected.heightCm} cm ·{" "}
                    {selected.plays}
                  </p>
                </div>
              </div>
              {loading ? (
                <span className="flex items-center gap-1.5 text-xs text-ink-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calcul des stats en direct...
                </span>
              ) : (
                <FormStrip results={selected.formLast10} />
              )}
            </div>
            {loadError && <p className="mt-3 text-xs text-red-400">{loadError}</p>}
          </div>

          <div className="rounded-2xl border border-base-border bg-base-900 p-6 shadow-card">
            <h3 className="mb-4 font-display text-base font-semibold text-ink-50">Winrate par surface</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={surfaceData} barCategoryGap={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E252F" vertical={false} />
                <XAxis dataKey="surface" tick={{ fill: "#8A93A3", fontSize: 12 }} axisLine={{ stroke: "#1E252F" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#8A93A3", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0F131A", border: "1px solid #1E252F", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#F3F5F7" }}
                  formatter={(v: number) => [`${v}%`, "Winrate"]}
                />
                <Bar dataKey="winrate" radius={[6, 6, 0, 0]} fill="#12B886" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-base-border bg-base-900 p-6 shadow-card">
            <h3 className="mb-4 font-display text-base font-semibold text-ink-50">Indices de jeu</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Object.entries(selected.ratings).map(([k, v]) => (
                <RatingTile key={k} label={k} value={v} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-base-border bg-base-900 p-6 shadow-card">
            <h3 className="mb-4 font-display text-base font-semibold text-ink-50">Stats avancées (saison)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <StatItem label="1er service" value={`${(selected.advanced.firstServeInPct * 100).toFixed(0)}%`} />
              <StatItem label="Pts / 1er service" value={`${(selected.advanced.firstServeWinPct * 100).toFixed(0)}%`} />
              <StatItem label="Pts / 2e service" value={`${(selected.advanced.secondServeWinPct * 100).toFixed(0)}%`} />
              <StatItem label="BP sauvées" value={`${(selected.advanced.breakPointsSavedPct * 100).toFixed(0)}%`} />
              <StatItem label="BP converties" value={`${(selected.advanced.breakPointsConvertedPct * 100).toFixed(0)}%`} />
              <StatItem label="Tie-breaks" value={`${(selected.advanced.tieBreakWinPct * 100).toFixed(0)}%`} />
              <StatItem label="Aces / match" value={selected.advanced.acesPerMatch.toFixed(1)} />
              <StatItem label="Doubles fautes / match" value={selected.advanced.doubleFaultsPerMatch.toFixed(1)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-base-border py-20 text-center text-sm text-ink-400">
          Sélectionne un joueur pour voir son profil complet.
        </div>
      )}
    </div>
  );
}

const LABELS: Record<string, string> = {
  service: "Service",
  retour: "Retour",
  filet: "Filet",
  endurance: "Endurance",
  mental: "Mental",
  regularite: "Régularité",
};

function RatingTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-400">{LABELS[label] ?? label}</span>
        <span className="font-mono font-semibold text-ink-50">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-base-800">
        <div className="h-full bg-value-gradient" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-base-border bg-base-850 px-3 py-2.5">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="mt-0.5 font-mono text-base font-semibold text-ink-50">{value}</p>
    </div>
  );
}
