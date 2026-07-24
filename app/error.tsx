"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-24 text-center">
      <h1 className="font-display text-xl font-semibold text-ink-50">
        Une erreur est survenue
      </h1>
      <p className="text-sm text-ink-400">
        Le chargement des données en direct (joueurs, stats) a échoué ou a
        pris trop de temps. Réessaie dans quelques instants.
      </p>
      {error.digest && (
        <p className="text-xs text-ink-600">Référence : {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-lg border border-base-border bg-base-850 px-4 py-2 text-sm text-ink-50 hover:bg-base-800"
      >
        <RefreshCw className="h-4 w-4" />
        Réessayer
      </button>
    </div>
  );
}
