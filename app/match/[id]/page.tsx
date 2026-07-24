import { notFound } from "next/navigation";
import Link from "next/link";
import { dataProvider } from "@/lib/data-providers";
import { computeValueBet } from "@/lib/calc/value-bet";
import { countryFlag, formatOdds, formatProb, formatTime, cn } from "@/lib/utils";
import { RadarComparison } from "@/components/RadarComparison";
import { CompareBar } from "@/components/CompareBar";
import { FormStrip } from "@/components/FormStrip";
import { ValueGauge } from "@/components/ValueGauge";
import { ArrowLeft, Info } from "lucide-react";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await dataProvider.getMatchById(id);
  if (!match) notFound();

  const value = computeValueBet(match);
  const { player1: p1, player2: p2 } = match;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour au dashboard
      </Link>

      {/* Header match */}
      <div className="rounded-2xl border border-base-border bg-base-900 p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-ink-400">
          <span className="rounded bg-base-800 px-2 py-0.5 font-medium text-ink-200">{match.tour}</span>
          <span>{match.tournament}</span>
          <span className="text-ink-600">·</span>
          <span>{match.round}</span>
          <span className="text-ink-600">·</span>
          <span>{match.surface}</span>
          <span className="text-ink-600">·</span>
          <span>{formatTime(match.startTime)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <PlayerHeader player={{ name: p1.name, country: p1.country, ranking: p1.ranking }} odds={match.odds.player1Odds} prob={match.prediction.player1WinProb} isValue={value.bestSide === "player1"} valuePct={value.player1Value} />
          <div className="flex flex-col items-center gap-2">
            <ValueGauge valuePct={value.bestValuePct} size={80} />
            <span className="font-display text-lg font-semibold text-ink-600">VS</span>
          </div>
          <PlayerHeader player={{ name: p2.name, country: p2.country, ranking: p2.ranking }} odds={match.odds.player2Odds} prob={match.prediction.player2WinProb} isValue={value.bestSide === "player2"} valuePct={value.player2Value} align="right" />
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-base-border bg-base-850 p-3 text-xs text-ink-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-edge-bright" />
          <p>
            Confiance du modèle : <strong className="text-ink-200">{match.prediction.confidence}</strong>.{" "}
            {match.prediction.method}. Cotes Betclic récupérées à{" "}
            {new Date(match.odds.fetchedAt).toLocaleTimeString("fr-FR")}.
          </p>
        </div>
      </div>

      {/* Radar comparison */}
      <Section title="Comparaison des profils de jeu">
        <RadarComparison p1={p1} p2={p2} />
      </Section>

      {/* Forme récente */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title={`Forme récente — ${p1.name}`}>
          <FormStrip results={p1.formLast10} />
        </Section>
        <Section title={`Forme récente — ${p2.name}`}>
          <FormStrip results={p2.formLast10} />
        </Section>
      </div>

      {/* Stats avancées */}
      <Section title="Statistiques avancées">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <CompareBar label="1er service (in)" p1Value={p1.advanced.firstServeInPct * 100} p2Value={p2.advanced.firstServeInPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Points gagnés 1er service" p1Value={p1.advanced.firstServeWinPct * 100} p2Value={p2.advanced.firstServeWinPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Points gagnés 2e service" p1Value={p1.advanced.secondServeWinPct * 100} p2Value={p2.advanced.secondServeWinPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Balles de break sauvées" p1Value={p1.advanced.breakPointsSavedPct * 100} p2Value={p2.advanced.breakPointsSavedPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Balles de break converties" p1Value={p1.advanced.breakPointsConvertedPct * 100} p2Value={p2.advanced.breakPointsConvertedPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Tie-breaks gagnés" p1Value={p1.advanced.tieBreakWinPct * 100} p2Value={p2.advanced.tieBreakWinPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Sets décisifs gagnés" p1Value={p1.advanced.decidingSetWinPct * 100} p2Value={p2.advanced.decidingSetWinPct * 100} format={(v) => `${v.toFixed(0)}%`} max={100} />
          <CompareBar label="Aces / match" p1Value={p1.advanced.acesPerMatch} p2Value={p2.advanced.acesPerMatch} format={(v) => v.toFixed(1)} />
        </div>
      </Section>

      {/* Surface stats */}
      <Section title={`Performance sur ${match.surface}`}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <CompareBar
            label="Winrate sur la surface"
            p1Value={p1.surfaceWinPct[match.surface] * 100}
            p2Value={p2.surfaceWinPct[match.surface] * 100}
            format={(v) => `${v.toFixed(0)}%`}
            max={100}
          />
        </div>
      </Section>

      {/* H2H */}
      <Section title="Confrontations directes (H2H)">
        <div className="mb-4 flex items-center justify-center gap-6">
          <span className="font-display text-3xl font-bold text-court-bright">{match.h2h.player1Wins}</span>
          <span className="text-sm text-ink-400">victoires</span>
          <span className="font-display text-3xl font-bold text-edge-bright">{match.h2h.player2Wins}</span>
        </div>
        <div className="flex flex-col divide-y divide-base-border">
          {match.h2h.lastMeetings.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-400">Aucune confrontation enregistrée.</p>
          )}
          {match.h2h.lastMeetings.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm">
              <span className="text-ink-400">{m.tournament}</span>
              <span
                className={cn(
                  "font-medium",
                  m.winner === "player1" ? "text-court-bright" : "text-edge-bright"
                )}
              >
                {m.winner === "player1" ? p1.name : p2.name}
              </span>
              <span className="font-mono text-ink-400 tabular-nums">{m.score}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PlayerHeader({
  player,
  odds,
  prob,
  isValue,
  valuePct,
  align = "left",
}: {
  player: { name: string; country: string; ranking: number };
  odds: number;
  prob: number;
  isValue: boolean;
  valuePct: number;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex flex-col gap-2", align === "right" && "items-end text-right")}>
      <div className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        <span className="text-2xl">{countryFlag(player.country)}</span>
        <div>
          <p className="font-display text-lg font-semibold text-ink-50">{player.name}</p>
          <p className="text-xs text-ink-400">#{player.ranking} mondial</p>
        </div>
      </div>
      <div className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}>
        <span
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
            isValue ? "bg-edge/15 text-edge-bright shadow-glow-edge" : "bg-base-800 text-ink-200"
          )}
        >
          {formatOdds(odds)}
        </span>
        <span className="font-mono text-xs text-ink-400 tabular-nums">modèle {formatProb(prob)}</span>
      </div>
      {isValue && valuePct > 0 && (
        <span className="rounded-full bg-edge/10 px-2.5 py-0.5 text-[11px] font-semibold text-edge-bright">
          Value bet +{valuePct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-base-border bg-base-900 p-6 shadow-card">
      <h2 className="mb-4 font-display text-base font-semibold text-ink-50">{title}</h2>
      {children}
    </div>
  );
}
