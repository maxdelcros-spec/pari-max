"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { computeValueBet } from "@/lib/calc/value-bet";
import { countryFlag, formatOdds, formatProb, formatTime, cn } from "@/lib/utils";
import { ValueGauge } from "./ValueGauge";
import { ArrowRight, MapPin, Trash2, X, Loader2 } from "lucide-react";
import { deleteMatch } from "@/lib/actions/matches";

const SURFACE_DOT: Record<string, string> = {
  Hard: "bg-sky-400",
  Clay: "bg-orange-500",
  Grass: "bg-emerald-400",
  "Indoor Hard": "bg-violet-400",
};

export function MatchCard({ match }: { match: Match }) {
  const router = useRouter();
  const value = computeValueBet(match);
  const p1IsValue = value.bestSide === "player1";
  const p2IsValue = value.bestSide === "player2";

  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!code) {
      setDeleteError("Code requis.");
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteMatch(match.id, code);
        router.refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-base-border bg-base-900 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-base-600">
      <div className="flex items-center justify-between border-b border-base-border/70 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-medium text-ink-400">
          <span className="rounded bg-base-800 px-1.5 py-0.5 text-ink-200">{match.tour}</span>
          <span className="truncate">{match.tournament}</span>
          <span className="text-ink-600">·</span>
          <span>{match.round}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-ink-400">
          <span className={cn("h-1.5 w-1.5 rounded-full", SURFACE_DOT[match.surface])} />
          {match.surface}
          <button
            type="button"
            onClick={() => setConfirming((c) => !c)}
            className="ml-1 rounded p-1 text-ink-600 hover:bg-base-800 hover:text-red-400"
            title="Supprimer ce match"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {confirming && (
        <div className="flex flex-col gap-2 border-b border-base-border/70 bg-base-850 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code d'accès"
              className="min-w-0 flex-1 rounded-lg border border-base-border bg-base-900 px-2.5 py-1.5 text-xs text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setCode("");
                setDeleteError(null);
              }}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-base-800 hover:text-ink-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {deleteError && <p className="text-[11px] text-red-400">{deleteError}</p>}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4">
        <PlayerRow
          name={match.player1.name}
          country={match.player1.country}
          ranking={match.player1.ranking}
          odds={match.odds.player1Odds}
          prob={match.prediction.player1WinProb}
          isValue={p1IsValue}
        />

        <div className="flex flex-col items-center gap-1">
          <ValueGauge valuePct={value.bestValuePct} />
          <span className="flex items-center gap-1 text-[11px] font-medium text-ink-400">
            <MapPin className="h-3 w-3" />
            {formatTime(match.startTime)}
          </span>
        </div>

        <PlayerRow
          name={match.player2.name}
          country={match.player2.country}
          ranking={match.player2.ranking}
          odds={match.odds.player2Odds}
          prob={match.prediction.player2WinProb}
          isValue={p2IsValue}
          align="right"
        />
      </div>

      <Link
        href={`/match/${match.id}`}
        className="flex items-center justify-center gap-1.5 border-t border-base-border/70 bg-base-850/60 py-2.5 text-[13px] font-medium text-ink-200 transition-colors hover:bg-base-800 hover:text-court-bright"
      >
        Analyse détaillée
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function PlayerRow({
  name,
  country,
  ranking,
  odds,
  prob,
  isValue,
  align = "left",
}: {
  name: string;
  country: string;
  ranking: number;
  odds: number;
  prob: number;
  isValue: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", align === "right" && "items-end text-right")}>
      <div className={cn("flex items-center gap-1.5", align === "right" && "flex-row-reverse")}>
        <span className="text-base">{countryFlag(country)}</span>
        <span className="truncate text-[13px] font-semibold text-ink-50">{name}</span>
      </div>
      <span className="text-[11px] text-ink-400">#{ranking} mondial</span>

      <div className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        <span
          className={cn(
            "rounded-md px-2 py-1 font-mono text-[13px] font-semibold tabular-nums",
            isValue
              ? "bg-edge/15 text-edge-bright shadow-glow-edge"
              : "bg-base-800 text-ink-200"
          )}
        >
          {formatOdds(odds)}
        </span>
        <span className="font-mono text-[11px] text-ink-400 tabular-nums">{formatProb(prob)}</span>
      </div>
    </div>
  );
}
