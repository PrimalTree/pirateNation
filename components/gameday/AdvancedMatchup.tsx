"use client";
import { useEffect, useState } from "react";
import { shortTeam } from "./teamName";

type MetricKind = "percent" | "epa" | "explosiveness";

type MetricConfig = {
  key: string;
  label: string;
  kind: MetricKind;
  invert: boolean;
};

type MetricRow = MetricConfig & {
  teamValue: number | null;
  oppValue: number | null;
};

type TeamAdvanced = {
  team: string;
  conference: string | null;
  offense: {
    successRate: number | null;
    ppa: number | null;
    explosiveness: number | null;
  };
  defense: {
    successRate: number | null;
    ppa: number | null;
    explosiveness: number | null;
  };
};

type AdvancedPayload = {
  source: string;
  team: TeamAdvanced | null;
  opponent: TeamAdvanced | null;
  opponentName?: string | null;
  inferredOpponent?: string | null;
};

const METRICS: MetricConfig[] = [
  { key: "offense.successRate", label: "Off Success Rate", kind: "percent", invert: false },
  { key: "defense.successRate", label: "Def Success Rate", kind: "percent", invert: true },
  { key: "offense.ppa", label: "EPA / Play", kind: "epa", invert: false },
  { key: "offense.explosiveness", label: "Explosiveness", kind: "explosiveness", invert: false },
];

export function AdvancedMatchup() {
  const [data, setData] = useState<AdvancedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams({ year: String(new Date().getFullYear()) });
        const res = await fetch(`/api/stats/season/advanced?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const body = (await res.json()) as AdvancedPayload;
        if (alive) setData(body);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load advanced matchup");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <h3 className="mb-2 text-sm font-semibold">Advanced Matchup</h3>
        <div className="text-sm text-red-400">{error}</div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <h3 className="mb-2 text-sm font-semibold">Advanced Matchup</h3>
        <div className="h-20 animate-pulse rounded-lg bg-zinc-800/40" />
      </section>
    );
  }

  const team = data?.team ?? null;
  const opponent = data?.opponent ?? null;
  const teamLabel = team ? shortTeam(team.team) : "Team";
  const opponentLabel = shortTeam(opponent?.team || data?.opponentName || "Opponent");

  if (!team || !opponent) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Advanced Matchup</h3>
        </div>
        <div className="text-sm text-zinc-400">
          Advanced opponent metrics are unavailable. Once CFBD data is accessible, this section will populate automatically.
        </div>
      </section>
    );
  }

  const rows: MetricRow[] = METRICS.map((metric) => ({
    ...metric,
    teamValue: pluckMetric(team, metric.key),
    oppValue: pluckMetric(opponent, metric.key),
  }));

  const [left, right] = splitColumns(rows);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Advanced Matchup</h3>
        {data?.inferredOpponent ? (
          <span className="text-xs uppercase text-zinc-500">Opponent inferred from schedule</span>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="space-y-3">
          {left.map((metric) => (
            <MetricCard key={metric.key} metric={metric} teamLabel={teamLabel} opponentLabel={opponentLabel} />
          ))}
        </div>
        <div className="space-y-3">
          {right.map((metric) => (
            <MetricCard key={metric.key} metric={metric} teamLabel={teamLabel} opponentLabel={opponentLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}

type MetricCardProps = {
  metric: MetricRow;
  teamLabel: string;
  opponentLabel: string;
};

function MetricCard({ metric, teamLabel, opponentLabel }: MetricCardProps) {
  const { teamValue, oppValue, invert, kind, label } = metric;
  const domain = computeDomain(teamValue, oppValue);
  const delta = computeDelta(teamValue, oppValue, invert);
  const adjustedDelta = delta ? (invert ? -delta.value : delta.value) : null;
  const deltaDisplay = formatValue(adjustedDelta, kind, true);
  const deltaClass = delta ? (delta.positive ? "text-emerald-300" : delta.negative ? "text-red-400" : "text-zinc-400") : "text-zinc-500";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-wide text-zinc-400">{label}</span>
        <span className={`font-semibold ${deltaClass}`}>{delta ? deltaDisplay : "--"}</span>
      </div>
      <div className="mt-2 space-y-2 text-sm">
        <TeamBar
          label={teamLabel}
          value={teamValue}
          kind={kind}
          width={computeWidth(teamValue, domain)}
          highlight
        />
        <TeamBar
          label={opponentLabel}
          value={oppValue}
          kind={kind}
          width={computeWidth(oppValue, domain)}
        />
      </div>
    </div>
  );
}

type TeamBarProps = {
  label: string;
  value: number | null;
  kind: MetricKind;
  width: number;
  highlight?: boolean;
};

function TeamBar({ label, value, kind, width, highlight = false }: TeamBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="text-zinc-200">{formatValue(value, kind)}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded bg-zinc-800">
        <div
          className={`${highlight ? "bg-emerald-400" : "bg-zinc-500"} h-full transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function pluckMetric(team: TeamAdvanced, path: string): number | null {
  const segments = path.split(".");
  let current: any = team;
  for (const segment of segments) {
    if (current == null) return null;
    current = current?.[segment];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : null;
}

function splitColumns(metrics: MetricRow[]): [MetricRow[], MetricRow[]] {
  const left: MetricRow[] = [];
  const right: MetricRow[] = [];
  metrics.forEach((metric, idx) => {
    if (idx % 2 === 0) left.push(metric);
    else right.push(metric);
  });
  return [left, right];
}

function computeDomain(a: number | null, b: number | null): { min: number; max: number } {
  const values = [a, b].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!values.length) return { min: 0, max: 1 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    if (min === 0) {
      max = 1;
    } else if (min < 0) {
      max = 0;
    } else {
      min = 0;
    }
  }
  return { min, max };
}

function computeWidth(value: number | null, domain: { min: number; max: number }): number {
  if (value == null || !Number.isFinite(value)) return 0;
  const { min, max } = domain;
  if (max === min) return 50;
  const ratio = (value - min) / (max - min);
  return Math.min(100, Math.max(4, ratio * 100));
}

type DeltaResult = { value: number; positive: boolean; negative: boolean } | null;

function computeDelta(team: number | null, opp: number | null, invert: boolean): DeltaResult {
  if (team == null || opp == null || !Number.isFinite(team) || !Number.isFinite(opp)) return null;
  const diff = team - opp;
  const adjusted = invert ? -diff : diff;
  return {
    value: diff,
    positive: adjusted > 0.0001,
    negative: adjusted < -0.0001,
  };
}

function formatValue(value: number | null, kind: MetricKind, includeSign = false): string {
  if (value == null || Number.isNaN(value)) return "--";
  if (kind === "percent") {
    const pct = value * 100;
    const formatted = Math.round(pct * 10) / 10;
    const sign = includeSign && formatted > 0 ? "+" : "";
    return `${sign}${formatted.toFixed(1)}%`;
  }
  if (kind === "epa") {
    const rounded = Math.round(value * 100) / 100;
    const sign = (includeSign || rounded > 0) && rounded > 0 ? "+" : "";
    return `${sign}${rounded.toFixed(2)}`;
  }
  const rounded = Math.round(value * 100) / 100;
  const sign = includeSign && rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}`;
}
