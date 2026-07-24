import { cn } from "@/lib/utils";

export function CompareBar({
  label,
  p1Value,
  p2Value,
  format = (v: number) => v.toString(),
  max,
}: {
  label: string;
  p1Value: number;
  p2Value: number;
  format?: (v: number) => string;
  max?: number;
}) {
  const total = max ?? Math.max(p1Value + p2Value, 1);
  const p1Pct = (p1Value / total) * 100;
  const p2Pct = (p2Value / total) * 100;
  const p1Wins = p1Value >= p2Value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] text-ink-400">
        <span className={cn("font-mono font-semibold", p1Wins ? "text-court-bright" : "text-ink-400")}>
          {format(p1Value)}
        </span>
        <span className="font-medium uppercase tracking-wide text-ink-600">{label}</span>
        <span className={cn("font-mono font-semibold", !p1Wins ? "text-edge-bright" : "text-ink-400")}>
          {format(p2Value)}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-base-800">
        <div className="bg-court-dim" style={{ width: `${p1Pct}%` }} />
        <div className="ml-auto bg-edge-dim" style={{ width: `${p2Pct}%` }} />
      </div>
    </div>
  );
}
