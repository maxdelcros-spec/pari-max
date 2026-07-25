"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player, Surface, TourCategory } from "@/lib/types";
import { createMatch } from "@/lib/actions/matches";
import { searchPlayersAction } from "@/lib/actions/players";
import { PlayerStatsForm } from "./PlayerStatsForm";

const CATEGORIES: TourCategory[] = ["ATP250", "ATP500", "ATP1000", "WTA250", "WTA500", "WTA1000", "GrandSlam"];
const SURFACES: Surface[] = ["Hard", "Clay", "Grass", "Indoor Hard"];

function tourFromCategory(c: TourCategory): "ATP" | "WTA" {
  return c.startsWith("WTA") ? "WTA" : "ATP";
}

/**
 * Sélecteur de joueur : cherche parmi les joueurs déjà enregistrés (base
 * Redis alimentée à chaque ajout de match précédent — voir players-store.ts)
 * ou permet d'en créer un nouveau avec toutes ses stats (PlayerStatsForm).
 */
function PlayerPicker({
  label,
  tour,
  value,
  onChange,
}: {
  label: string;
  tour: "ATP" | "WTA";
  value: Player | null;
  onChange: (p: Player | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await searchPlayersAction(query, tour);
        setResults(r.slice(0, 8));
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query, open, tour]);

  if (creating) {
    return (
      <div className="flex-1">
        <label className="mb-1.5 block text-[11px] font-medium text-ink-400">{label}</label>
        <PlayerStatsForm
          tour={tour}
          initialName={query}
          onCancel={() => setCreating(false)}
          onSave={(p) => {
            onChange(p);
            setCreating(false);
            setOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <label className="mb-1.5 block text-[11px] font-medium text-ink-400">{label}</label>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-base-border bg-base-850 px-3 py-2.5">
          <span className="text-sm font-medium text-ink-50">{value.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="text-[11px] text-ink-400 hover:text-ink-200"
          >
            Changer
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={`Rechercher un joueur ${tour} déjà enregistré...`}
              className="w-full rounded-lg border border-base-border bg-base-850 py-2.5 pl-9 pr-3 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
            />
          </div>
          {open && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-base-border bg-base-900 shadow-card">
              {pending && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-[12px] text-ink-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recherche...
                </div>
              )}
              {!pending &&
                query.trim() &&
                results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-ink-200 hover:bg-base-800"
                  >
                    <span>{p.name}</span>
                    <span className="text-[11px] text-ink-500">#{p.ranking}</span>
                  </button>
                ))}
              {!pending && query.trim() && results.length === 0 && (
                <p className="px-3 py-2.5 text-[12px] text-ink-500">Aucun joueur enregistré avec ce nom.</p>
              )}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 border-t border-base-border px-3 py-2.5 text-left text-sm text-court-bright hover:bg-base-800"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Nouveau joueur {tour}
                {query.trim() ? ` : "${query.trim()}"` : ""}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function AddMatchForm() {
  const router = useRouter();
  const [category, setCategory] = useState<TourCategory>("ATP250");
  const [tournament, setTournament] = useState("");
  const [round, setRound] = useState("1er tour");
  const [surface, setSurface] = useState<Surface>("Hard");
  const [date, setDate] = useState("");
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [odds1, setOdds1] = useState("");
  const [odds2, setOdds2] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tour = tourFromCategory(category);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tournament || !date || !player1 || !player2 || !odds1 || !odds2 || !accessCode) {
      setError("Merci de remplir tous les champs, y compris le code d'accès.");
      return;
    }
    if (player1.id === player2.id) {
      setError("Les deux joueurs doivent être différents.");
      return;
    }
    setSubmitting(true);
    try {
      await createMatch({
        tour,
        category,
        tournament,
        round,
        surface,
        startTime: new Date(date).toISOString(),
        player1,
        player2,
        player1Odds: parseFloat(odds1),
        player2Odds: parseFloat(odds2),
        accessCode,
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-base-border bg-base-900 p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TourCategory)}
            className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 focus:border-court-bright focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Surface</label>
          <select
            value={surface}
            onChange={(e) => setSurface(e.target.value as Surface)}
            className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 focus:border-court-bright focus:outline-none"
          >
            {SURFACES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Tournoi</label>
          <input
            value={tournament}
            onChange={(e) => setTournament(e.target.value)}
            placeholder="ex. Open de Rosmalen"
            className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Round</label>
          <input
            value={round}
            onChange={(e) => setRound(e.target.value)}
            placeholder="ex. 1er tour, 1/4 de finale..."
            className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Date et heure</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 focus:border-court-bright focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <PlayerPicker label="Joueur 1" tour={tour} value={player1} onChange={setPlayer1} />
        <PlayerPicker label="Joueur 2" tour={tour} value={player2} onChange={setPlayer2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Cote joueur 1 (Betclic)</label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            value={odds1}
            onChange={(e) => setOdds1(e.target.value)}
            placeholder="1.85"
            className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Cote joueur 2 (Betclic)</label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            value={odds2}
            onChange={(e) => setOdds2(e.target.value)}
            placeholder="1.95"
            className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-ink-400">Code d'accès</label>
        <input
          type="password"
          inputMode="numeric"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="••••"
          className="w-full rounded-lg border border-base-border bg-base-850 px-3 py-2.5 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
        />
      </div>

      {error && <p className="text-[13px] text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg bg-value-gradient px-4 py-3 text-sm font-semibold text-base-950 transition-opacity",
          submitting && "opacity-60"
        )}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ajouter le match
      </button>
      <p className="text-[11px] leading-relaxed text-ink-600">
        Un joueur créé ici est enregistré dans la base au moment de la validation du match, avec
        toutes ses stats — il sera ensuite proposé directement dans la recherche pour tes prochains
        matchs, sans avoir à les ressaisir.
      </p>
    </form>
  );
}
