import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOdds(o: number): string {
  return o.toFixed(2);
}

export function formatPct(p: number, digits = 1): string {
  return `${p.toFixed(digits)}%`;
}

export function formatProb(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function countryFlag(iso3: string): string {
  const map: Record<string, string> = {
    ITA: "🇮🇹", ESP: "🇪🇸", SRB: "🇷🇸", RUS: "🇷🇺", DEN: "🇩🇰",
    USA: "🇺🇸", POL: "🇵🇱", BLR: "🇧🇾", KAZ: "🇰🇿", CRO: "🇭🇷", FRA: "🇫🇷",
  };
  return map[iso3] ?? "🎾";
}
