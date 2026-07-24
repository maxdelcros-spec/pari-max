"use client";

import { useEffect, useState } from "react";
import { Circle } from "lucide-react";

export function TopBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-base-border bg-base-900/60 px-4 py-3.5 backdrop-blur md:px-8">
      <div>
        <p className="font-display text-lg font-semibold text-ink-50">
          {now?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) ??
            "—"}
        </p>
        <p className="text-xs text-ink-400">
          {now?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? "—"} · Fuseau
          local
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-base-border bg-base-850 px-3 py-1.5">
        <Circle className="h-2 w-2 fill-court-bright text-court-bright animate-pulseGlow" />
        <span className="text-xs font-medium text-ink-200">Cotes Betclic connectées</span>
      </div>
    </header>
  );
}
