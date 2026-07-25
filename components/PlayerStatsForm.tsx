"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player, Surface } from "@/lib/types";

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const SURFACES: Surface[] = ["Hard", "Clay", "Grass", "Indoor Hard"];

const RATING_FIELDS: { key: keyof Player["ratings"]; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "retour", label: "Retour" },
  { key: "filet", label: "Filet" },
  { key: "endurance", label: "Endurance" },
  { key: "mental", label: "Mental" },
  { key: "regularite", label: "Régularité" },
];

const ADVANCED_PCT_FIELDS: { key: keyof Player["advanced"]; label: string }[] = [
  { key: "firstServeInPct", label: "1er service (in)" },
  { key: "firstServeWinPct", label: "Pts gagnés / 1er service" },
  { key: "secondServeWinPct", label: "Pts gagnés / 2e service" },
  { key: "breakPointsSavedPct", label: "Balles de break sauvées" },
  { key: "breakPointsConvertedPct", label: "Balles de break converties" },
  { key: "tieBreakWinPct", label: "Tie-breaks gagnés" },
  { key: "decidingSetWinPct", label: "Sets décisifs gagnés" },
];

type StrRatings = Record<keyof Player["ratings"], string>;
type StrSurface = Record<Surface, string>;
type StrAdvanced = Record<keyof Player["advanced"], string>;

const emptyRatings: StrRatings = { service: "", retour: "", filet: "", endurance: "", mental: "", regularite: "" };
const emptySurface: StrSurface = { Hard: "", Clay: "", Grass: "", "Indoor Hard": "" };
const emptyAdvanced: StrAdvanced = {
  firstServeInPct: "",
  firstServeWinPct: "",
  secondServeWinPct: "",
  breakPointsSavedPct: "",
  breakPointsConvertedPct: "",
  tieBreakWinPct: "",
  decidingSetWinPct: "",
  acesPerMatch: "",
  doubleFaultsPerMatch: "",
};

function pct01(v: string) {
  return Math.max(0, Math.min(100, parseFloat(v))) / 100;
}

function clamp0100(v: string) {
  return Math.max(0, Math.min(100, Math.round(parseFloat(v))));
}

/**
 * Formulaire de création d'un joueur avec TOUTES ses stats saisies à la
 * main (aucune valeur neutre par défaut) — nécessaire pour que le modèle
 * (lib/calc/predict.ts) dispose d'un signal réel sur chacun de ses 5
 * facteurs. Le joueur créé est ensuite enregistré dans la base joueurs au
 * moment de la validation du match (voir lib/actions/matches.ts).
 */
export function PlayerStatsForm({
  tour,
  initialName = "",
  onSave,
  onCancel,
}: {
  tour: "ATP" | "WTA";
  initialName?: string;
  onSave: (player: Player) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState("");
  const [ranking, setRanking] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [plays, setPlays] = useState<"Droitier" | "Gaucher">("Droitier");

  const [ratings, setRatings] = useState<StrRatings>(emptyRatings);
  const [surfaceWinPct, setSurfaceWinPct] = useState<StrSurface>(emptySurface);
  const [advanced, setAdvanced] = useState<StrAdvanced>(emptyAdvanced);
  const [formLast10, setFormLast10] = useState<(("W" | "L") | null)[]>(Array(10).fill(null));

  const [error, setError] = useState<string | null>(null);

  function cycleForm(i: number) {
    setFormLast10((prev) => {
      const next = [...prev];
      next[i] = next[i] === null ? "W" : next[i] === "W" ? "L" : null;
      return next;
    });
  }

  function handleSave() {
    const identity = [name, country, ranking, age, heightCm];
    const allNumeric = [...Object.values(ratings), ...Object.values(surfaceWinPct), ...Object.values(advanced)];

    if (identity.some((v) => v.trim() === "")) {
      setError("Merci de renseigner l'identité complète du joueur.");
      return;
    }
    if (allNumeric.some((v) => v.trim() === "")) {
      setError("Merci de renseigner toutes les stats — elles servent au calcul du modèle.");
      return;
    }
    if (formLast10.every((r) => r === null)) {
      setError("Renseigne au moins un résultat pour la forme récente.");
      return;
    }

    const player: Player = {
      id: `player-${slug(name)}-${Date.now().toString(36)}`,
      name: name.trim(),
      country: country.trim().toUpperCase(),
      ranking: parseInt(ranking, 10),
      tour,
      age: parseInt(age, 10),
      heightCm: parseInt(heightCm, 10),
      plays,
      ratings: {
        service: clamp0100(ratings.service),
        retour: clamp0100(ratings.retour),
        filet: clamp0100(ratings.filet),
        endurance: clamp0100(ratings.endurance),
        mental: clamp0100(ratings.mental),
        regularite: clamp0100(ratings.regularite),
      },
      formLast10: formLast10.filter((r): r is "W" | "L" => r !== null),
      surfaceWinPct: {
        Hard: pct01(surfaceWinPct.Hard),
        Clay: pct01(surfaceWinPct.Clay),
        Grass: pct01(surfaceWinPct.Grass),
        "Indoor Hard": pct01(surfaceWinPct["Indoor Hard"]),
      },
      advanced: {
        firstServeInPct: pct01(advanced.firstServeInPct),
        firstServeWinPct: pct01(advanced.firstServeWinPct),
        secondServeWinPct: pct01(advanced.secondServeWinPct),
        breakPointsSavedPct: pct01(advanced.breakPointsSavedPct),
        breakPointsConvertedPct: pct01(advanced.breakPointsConvertedPct),
        tieBreakWinPct: pct01(advanced.tieBreakWinPct),
        decidingSetWinPct: pct01(advanced.decidingSetWinPct),
        acesPerMatch: parseFloat(advanced.acesPerMatch),
        doubleFaultsPerMatch: parseFloat(advanced.doubleFaultsPerMatch),
      },
    };

    onSave(player);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-base-border bg-base-850 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-50">Nouveau joueur {tour}</p>
        <button type="button" onClick={onCancel} className="rounded p-1 text-ink-500 hover:bg-base-800 hover:text-ink-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Identité */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom complet" value={name} onChange={setName} placeholder="ex. Carlos Alcaraz" span2 />
        <Field label="Pays (code ISO3)" value={country} onChange={setCountry} placeholder="ESP" />
        <Field label="Classement" value={ranking} onChange={setRanking} placeholder="1" type="number" />
        <Field label="Âge" value={age} onChange={setAge} placeholder="21" type="number" />
        <Field label="Taille (cm)" value={heightCm} onChange={setHeightCm} placeholder="183" type="number" />
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-400">Main</label>
          <select
            value={plays}
            onChange={(e) => setPlays(e.target.value as "Droitier" | "Gaucher")}
            className="w-full rounded-lg border border-base-border bg-base-900 px-3 py-2 text-sm text-ink-50 focus:border-court-bright focus:outline-none"
          >
            <option value="Droitier">Droitier</option>
            <option value="Gaucher">Gaucher</option>
          </select>
        </div>
      </div>

      {/* Indices de jeu */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">Indices de jeu (0-100)</p>
        <div className="grid grid-cols-3 gap-3">
          {RATING_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={ratings[f.key]}
              onChange={(v) => setRatings((r) => ({ ...r, [f.key]: v }))}
              placeholder="70"
              type="number"
            />
          ))}
        </div>
      </div>

      {/* Forme récente */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
          Forme récente (du plus ancien au plus récent — clique pour cycler)
        </p>
        <div className="flex items-center gap-1.5">
          {formLast10.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => cycleForm(i)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded text-[11px] font-bold transition-colors",
                r === "W" && "bg-court/20 text-court-bright",
                r === "L" && "bg-risk/15 text-risk",
                r === null && "bg-base-800 text-ink-600"
              )}
            >
              {r ?? "–"}
            </button>
          ))}
        </div>
      </div>

      {/* Winrate par surface */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">Winrate par surface (%)</p>
        <div className="grid grid-cols-4 gap-3">
          {SURFACES.map((s) => (
            <Field
              key={s}
              label={s}
              value={surfaceWinPct[s]}
              onChange={(v) => setSurfaceWinPct((p) => ({ ...p, [s]: v }))}
              placeholder="60"
              type="number"
            />
          ))}
        </div>
      </div>

      {/* Stats avancées */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">Stats avancées (saison)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ADVANCED_PCT_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={advanced[f.key] as string}
              onChange={(v) => setAdvanced((a) => ({ ...a, [f.key]: v }))}
              placeholder="65"
              type="number"
            />
          ))}
          <Field
            label="Aces / match"
            value={advanced.acesPerMatch}
            onChange={(v) => setAdvanced((a) => ({ ...a, acesPerMatch: v }))}
            placeholder="8.5"
            type="number"
          />
          <Field
            label="Doubles fautes / match"
            value={advanced.doubleFaultsPerMatch}
            onChange={(v) => setAdvanced((a) => ({ ...a, doubleFaultsPerMatch: v }))}
            placeholder="2.5"
            type="number"
          />
        </div>
      </div>

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center justify-center gap-2 rounded-lg bg-value-gradient px-4 py-2.5 text-sm font-semibold text-base-950 hover:opacity-90"
      >
        <Check className="h-4 w-4" />
        Valider ce joueur
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  span2 = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : undefined}>
      <label className="mb-1 block text-[11px] font-medium text-ink-400">{label}</label>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-base-border bg-base-900 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-600 focus:border-court-bright focus:outline-none"
      />
    </div>
  );
}
