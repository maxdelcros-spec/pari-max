import { AddMatchForm } from "@/components/AddMatchForm";

export default function NewMatchPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-50">Ajouter un match</h1>
        <p className="mt-1 text-sm text-ink-400">
          Renseigne un match à venir (ATP/WTA 250/500/1000) — l'analyse (probabilités, value
          bet) est calculée automatiquement.
        </p>
      </div>
      <AddMatchForm />
    </div>
  );
}
