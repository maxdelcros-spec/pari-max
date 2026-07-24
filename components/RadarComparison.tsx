"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Player } from "@/lib/types";

const LABELS: Record<keyof Player["ratings"], string> = {
  service: "Service",
  retour: "Retour",
  filet: "Filet",
  endurance: "Endurance",
  mental: "Mental",
  regularite: "Régularité",
};

export function RadarComparison({ p1, p2 }: { p1: Player; p2: Player }) {
  const data = (Object.keys(LABELS) as (keyof Player["ratings"])[]).map((key) => ({
    stat: LABELS[key],
    [p1.name]: p1.ratings[key],
    [p2.name]: p2.ratings[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#1E252F" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: "#8A93A3", fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name={p1.name}
          dataKey={p1.name}
          stroke="#3DDC97"
          fill="#12B886"
          fillOpacity={0.28}
          strokeWidth={2}
        />
        <Radar
          name={p2.name}
          dataKey={p2.name}
          stroke="#A78BFA"
          fill="#8B6CF6"
          fillOpacity={0.22}
          strokeWidth={2}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#C7CED8" }}
          iconType="circle"
        />
        <Tooltip
          contentStyle={{
            background: "#0F131A",
            border: "1px solid #1E252F",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#F3F5F7" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
