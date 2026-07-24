import { cn } from "@/lib/utils";
import { valueTier } from "@/lib/calc/value-bet";

/**
 * Jauge radiale "edge" — élément signature du dashboard.
 * L'arc se remplit proportionnellement à la value (0 -> 20%+),
 * avec un dégradé vert (favori du modèle) -> violet (edge fort).
 */
export function ValueGauge({ valuePct, size = 64 }: { valuePct: number; size?: number }) {
  const tier = valueTier(valuePct);
  const clamped = Math.max(0, Math.min(valuePct, 20));
  const pct = clamped / 20;

  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270° arc
  const offset = arcLength - pct * arcLength;

  const tierColor =
    tier === "high" ? "#A78BFA" : tier === "medium" ? "#8B6CF6" : tier === "low" ? "#3DDC97" : "#3B4353";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1B212C"
          strokeWidth={5}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {valuePct > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tierColor}
            strokeWidth={5}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={cn(
            "font-mono text-[13px] font-semibold leading-none",
            valuePct > 0 ? "text-ink-50" : "text-ink-600"
          )}
        >
          {valuePct > 0 ? `+${valuePct.toFixed(1)}` : "—"}
        </span>
        {valuePct > 0 && <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-ink-400">edge</span>}
      </div>
    </div>
  );
}
