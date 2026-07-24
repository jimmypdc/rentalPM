"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const AXIS = { fontSize: 12, fill: "#64748b" };
const money = (v: number) => formatCurrency(v, { compact: true });

function ChartTooltip({
  active,
  payload,
  label,
  currency = true,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums text-foreground">
            {currency ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceChart({
  data,
}: {
  data: { month: string; income: number; expenses: number; net: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={money} tick={AXIS} axisLine={false} tickLine={false} width={54} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar dataKey="income" name="Income" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expenses" name="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Line dataKey="net" name="Net Cash Flow" stroke="#16a34a" strokeWidth={2.5} dot={false} type="monotone" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const OCCUPANCY_COLORS: Record<string, string> = {
  OCCUPIED: "#16a34a",
  VACANT: "#f59e0b",
  NOTICE_GIVEN: "#8b5cf6",
  UNDER_RENOVATION: "#94a3b8",
};

export function OccupancyDonut({
  data,
}: {
  data: { name: string; value: number; key: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={OCCUPANCY_COLORS[d.key] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip currency={false} />} />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 24, fontWeight: 600 }}
        >
          {total}
        </text>
        <text x="50%" y="57%" textAnchor="middle" style={{ fontSize: 11, fill: "#64748b" }}>
          units
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart({
  data,
  color = "#2563eb",
  currency = true,
}: {
  data: { label: string; value: number }[];
  color?: string;
  currency?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={currency ? money : undefined}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={currency ? 54 : 30}
        />
        <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({
  data,
  color = "#2563eb",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={money} tick={AXIS} axisLine={false} tickLine={false} width={54} />
        <Tooltip content={<ChartTooltip />} />
        <Area dataKey="value" stroke={color} strokeWidth={2} fill="url(#trendFill)" type="monotone" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
