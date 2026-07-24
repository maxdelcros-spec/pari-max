import { cn } from "@/lib/utils";

export function FormStrip({ results }: { results: ("W" | "L")[] }) {
  return (
    <div className="flex items-center gap-1">
      {results.map((r, i) => (
        <span
          key={i}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
            r === "W" ? "bg-court/20 text-court-bright" : "bg-risk/15 text-risk"
          )}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
