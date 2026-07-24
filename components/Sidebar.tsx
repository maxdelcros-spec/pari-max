"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Search,
  Target,
  History,
  Wallet,
  BookOpen,
  Radar,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/matches/new", label: "Ajouter un match", icon: PlusCircle },
  { href: "/value-bets", label: "Value Bets", icon: Target },
  { href: "/players", label: "Joueurs", icon: Search },
  { href: "/history", label: "Historique", icon: History },
  { href: "/bankroll", label: "Bankroll", icon: Wallet },
  { href: "/methodology", label: "Méthodologie", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-base-border bg-base-900 md:flex md:flex-col">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-value-gradient shadow-glow-court">
          <Radar className="h-4 w-4 text-base-950" strokeWidth={2.5} />
        </div>
        <div className="font-display text-[17px] font-semibold tracking-tight text-ink-50">
          Court<span className="text-court-bright">Edge</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-base-800 text-ink-50"
                  : "text-ink-400 hover:bg-base-850 hover:text-ink-200"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-court-bright" : "text-ink-600 group-hover:text-ink-400"
                )}
                strokeWidth={2}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-court-bright shadow-glow-court" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-base-border px-6 py-4">
        <p className="text-[11px] leading-relaxed text-ink-600">
          Cotes Betclic · Données à titre indicatif.
          <br />
          Pariez avec modération. 18+
        </p>
      </div>
    </aside>
  );
}
