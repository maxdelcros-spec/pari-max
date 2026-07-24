"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetEntry {
  id: string;
  label: string;
  stake: number;
  odds: number;
  result: "pending" | "won" | "lost";
  date: string;
}

const STORAGE_KEY = "courtedge_bankroll_v1";

export function BankrollTracker() {
  const [bankroll, setBankroll] = useState<number>(1000);
  const [entries, setEntries] = useState<BetEntry[]>([]);
  const [form, setForm] = useState({ label: "", stake: "", odds: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setBankroll(parsed.bankroll ?? 1000);
        setEntries(parsed.entries ?? []);
      }
    } catch {
      // localStorage indisponible (SSR ou navigation privée) : on garde les valeurs par défaut
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bankroll, entries }));
    } catch {
      // ignore
    }
  }, [bankroll, entries, loaded]);

  const totalStaked = entries.reduce((s, e) => s + e.stake, 0);
  const profit = entries.reduce((s, e) => {
    if (e.result === "won") return s + e.stake * (e.odds - 1);
    if (e.result === "lost") return s - e.stake;
    return s;
  }, 0);
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;

  function addEntry() {
    const stake = parseFloat(form.stake);
    const odds = parseFloat(form.odds);
    if (!form.label || !stake || !odds) return;
    setEntries((prev) => [
      { id: crypto.randomUUID(), label: form.label, stake, odds, result: "pending", date: new Date().toISOString() },
      ...prev,
    ]);
    setForm({ label: "", stake: "", odds: "" });
  }

  function setResult(id: string, result: BetEntry["result"]) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, result } : e)));
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon={Wallet} label="Bankroll de départ" value={`${bankroll.toFixed(0)} €`} />
        <MetricCard
          icon={profit >= 0 ? TrendingUp : TrendingDown}
          label="Profit / perte cumulé"
          value={`${profit >= 0 ? "+" : ""}${profit.toFixed(2)} €`}
          accent={profit >= 0 ? "court" : "risk"}
        />
        <MetricCard label="ROI" value={`${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`} accent={roi >= 0 ? "court" : "risk"} />
        <MetricCard label="Mises enregistrées" value={entries.length.toString()} />
      </div>

      <div className="rounded-xl border border-base-border bg-base-900 p-4">
        <label className="mb-2 block text-xs font-medium text-ink-400">Bankroll de départ (€)</label>
        <input
          type="number"
          value={bankroll}
          onChange={(e) => setBankroll(parseFloat(e.target.value) || 0)}
          className="w-full max-w-xs rounded-lg border border-base-border bg-base-850 px-3 py-2 text-sm text-ink-50 focus:border-court-dim focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-base-border bg-base-900 p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-ink-50">Ajouter une mise</h3>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            placeholder="Ex: Sinner vs Fritz — Sinner ML"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="rounded-lg border border-base-border bg-base-850 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-dim focus:outline-none"
          />
          <input
            type="number"
            placeholder="Mise (€)"
            value={form.stake}
            onChange={(e) => setForm((f) => ({ ...f, stake: e.target.value }))}
            className="rounded-lg border border-base-border bg-base-850 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-dim focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cote"
            value={form.odds}
            onChange={(e) => setForm((f) => ({ ...f, odds: e.target.value }))}
            className="rounded-lg border border-base-border bg-base-850 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-dim focus:outline-none"
          />
          <button
            onClick={addEntry}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-value-gradient px-4 py-2 text-sm font-semibold text-base-950 transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-base-border bg-base-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-border bg-base-850/60 text-left text-[11px] uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Pari</th>
              <th className="px-4 py-3 font-medium">Mise</th>
              <th className="px-4 py-3 font-medium">Cote</th>
              <th className="px-4 py-3 font-medium">Résultat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-base-border/60 last:border-0">
                <td className="px-4 py-3 text-ink-50">{e.label}</td>
                <td className="px-4 py-3 font-mono text-ink-200 tabular-nums">{e.stake.toFixed(2)} €</td>
                <td className="px-4 py-3 font-mono text-ink-200 tabular-nums">{e.odds.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {(["pending", "won", "lost"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setResult(e.id, r)}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-medium",
                          e.result === r
                            ? r === "won"
                              ? "bg-court/20 text-court-bright"
                              : r === "lost"
                                ? "bg-risk/20 text-risk"
                                : "bg-base-800 text-ink-200"
                            : "text-ink-600 hover:text-ink-300"
                        )}
                      >
                        {r === "pending" ? "En cours" : r === "won" ? "Gagné" : "Perdu"}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeEntry(e.id)} className="text-ink-600 hover:text-risk">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-400">
                  Aucune mise enregistrée pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "court" | "risk";
}) {
  return (
    <div className="rounded-xl border border-base-border bg-base-900 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold tabular-nums",
          accent === "court" && "text-court-bright",
          accent === "risk" && "text-risk",
          !accent && "text-ink-50"
        )}
      >
        {value}
      </p>
    </div>
  );
}
