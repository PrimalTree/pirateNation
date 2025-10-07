"use client";
import { useEffect, useMemo, useState } from "react";
import { shortTeam } from "./teamName";

type Pregame = {
  opponent?: string | null;
  kickoff?: string | null;
  venue?: string | null;
  broadcast?: string | null;
  status?: string | null;
  gameName?: string | null;
  teams?: Array<{ name?: string | null; homeAway?: string | null }> | null;
  weather?: {
    temp_f?: number | null;
    temp_max_f?: number | null;
    temp_min_f?: number | null;
    description?: string | null;
    icon?: string | null;
    wind_mph?: number | null;
    humidity?: number | null;
    at?: string | null;
    source?: string | null;
    debug?: Record<string, unknown> | null;
  } | null;
};

type LinesResponse = {
  team: string;
  opponent: string | null;
  kickoff: string | null;
  isHome: boolean | null;
  bookCount: number;
  bestBook: string | null;
  spread: number | null;
  total: number | null;
  winProbability: number | null;
  lines: BookLine[];
  source: string;
};

type BookLine = {
  provider: string;
  spread: number | null;
  total: number | null;
  winProbability: number | null;
  lastUpdated: string | null;
  rawSpread: number | null;
};

export function PregameInfo() {
  const [data, setData] = useState<Pregame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<LinesResponse | null>(null);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [linesLoading, setLinesLoading] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/stats/pregame", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const body = await res.json();
        if (alive) setData(body);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load pregame info");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const targetYear = useMemo(() => {
    if (data?.kickoff) {
      const d = new Date(data.kickoff);
      if (Number.isFinite(d.getTime())) return d.getFullYear();
    }
    return new Date().getFullYear();
  }, [data?.kickoff]);

  useEffect(() => {
    let alive = true;
    setLinesLoading(true);
    setLinesError(null);
    (async () => {
      try {
        const params = new URLSearchParams({ year: String(targetYear) });
        const res = await fetch(`/api/stats/lines?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const body = (await res.json()) as LinesResponse;
        if (alive) setLines(body);
      } catch (e: any) {
        if (alive) {
          setLines(null);
          setLinesError(e?.message || "Vegas lines unavailable");
        }
      } finally {
        if (alive) setLinesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [targetYear]);

  const kickoffText = data?.kickoff ? new Date(data.kickoff).toLocaleString() : "TBD";

  const opponentShort = useMemo(() => {
    const val = (data?.opponent || "").trim();
    if (val) return shortTeam(val);
    try {
      const teams = Array.isArray(data?.teams) ? (data?.teams as any[]) : [];
      const ecuIndex = teams.findIndex((t: any) => {
        const n = String(t?.name || "").toLowerCase();
        return n.includes("east carolina") || n.split(/[^a-z]/i).includes("ecu");
      });
      const other = teams.find((_: any, idx: number) => idx !== ecuIndex) as any;
      if (other?.name) return shortTeam(other.name);
    } catch {
      // ignore fallback
    }
    return "TBD";
  }, [data?.opponent, data?.teams]);

  const weatherDate = useMemo(() => {
    const at = data?.weather?.at || data?.kickoff || null;
    if (!at) return null;
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [data?.weather?.at, data?.kickoff]);

  const weatherMeta = useMemo(() => {
    if (!data?.weather) return "";
    const parts: string[] = [];
    if (typeof data.weather.wind_mph === "number") {
      parts.push(`Wind ${Math.round(data.weather.wind_mph)} mph`);
    }
    if (typeof data.weather.humidity === "number") {
      parts.push(`Humidity ${data.weather.humidity}%`);
    }
    return parts.join(" | ");
  }, [data?.weather?.wind_mph, data?.weather?.humidity, data?.weather]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pregame</h3>
        {data?.status && (
          <span className="rounded border border-emerald-400/40 px-1.5 py-0.5 text-[10px] text-emerald-200">
            {String(data.status)}
          </span>
        )}
      </div>
      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : (
        <>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <div className="text-zinc-400">Opponent</div>
              <div className="text-zinc-200">{opponentShort}</div>
            </div>
            <div>
              <div className="text-zinc-400">Kickoff</div>
              <div className="text-zinc-200">{kickoffText}</div>
            </div>
            <div>
              <div className="text-zinc-400">Broadcast</div>
              <div className="text-zinc-200">{data?.broadcast ?? "TBD"}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-zinc-400">Venue</div>
              <div className="text-zinc-200">{data?.venue ?? "TBD"}</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-zinc-400">Expected Weather</div>
              {data?.weather ? (
                <div className="mt-1 flex items-center gap-3">
                  {data.weather.icon ? (
                    <img
                      src={`https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`}
                      alt={data.weather.description || "Weather"}
                      className="h-10 w-10 shrink-0"
                    />
                  ) : null}
                  <div className="text-zinc-200">
                    <span className="text-lg font-semibold text-ecu-gold">
                      {typeof data.weather.temp_f === "number"
                        ? `${Math.round(data.weather.temp_f)}${String.fromCharCode(176)}F`
                        : "--"}
                    </span>
                    {data.weather.description ? (
                      <span className="ml-2 capitalize text-zinc-300">{String(data.weather.description)}</span>
                    ) : null}
                    {weatherDate ? (
                      <div className="text-xs text-zinc-400">Forecast around {weatherDate.toLocaleString()}</div>
                    ) : null}
                    {typeof data.weather.temp_max_f === "number" || typeof data.weather.temp_min_f === "number" ? (
                      <div className="text-xs text-zinc-400">
                        {typeof data.weather.temp_max_f === "number" ? `High ${Math.round(data.weather.temp_max_f)}${String.fromCharCode(176)}F` : ""}
                        {typeof data.weather.temp_min_f === "number"
                          ? `${typeof data.weather.temp_max_f === "number" ? " | " : ""}Low ${Math.round(data.weather.temp_min_f)}${String.fromCharCode(176)}F`
                          : ""}
                      </div>
                    ) : null}
                    {weatherMeta ? <div className="text-xs text-zinc-400">{weatherMeta}</div> : null}
                  </div>
                </div>
              ) : (
                <div className="text-zinc-200">TBD</div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <MatchOddsCard lines={lines} loading={linesLoading} error={linesError} />
          </div>
        </>
      )}
    </section>
  );
}

type MatchOddsCardProps = {
  lines: LinesResponse | null;
  loading: boolean;
  error: string | null;
};

function MatchOddsCard({ lines, loading, error }: MatchOddsCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
        Loading odds...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
        {error}
      </div>
    );
  }

  if (!lines || lines.bookCount === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500">
        Vegas lines unavailable.
      </div>
    );
  }

  const spreadText = formatSpread(lines.spread);
  const totalText = formatTotal(lines.total);
  const winText = formatProbability(lines.winProbability);
  const teamAbbrev = shortTeam(lines.team || "Pirates");
  const sparkPoints = lines.lines
    .map((line) => line.spread)
    .filter((value): value is number => typeof value === "number");

  return (
    <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-emerald-300/70">Match Odds</div>
          <div className="mt-1 text-sm text-zinc-100">
            {teamAbbrev} {spreadText}
          </div>
          <div className="text-xs text-zinc-400">Total {totalText}</div>
          <div className="text-xs text-zinc-400">Best book: {lines.bestBook ?? "N/A"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-zinc-400">Implied Win %</div>
          <div className="text-xl font-semibold text-emerald-300">{winText}</div>
        </div>
      </div>
      {sparkPoints.length > 0 ? (
        <div className="mt-3">
          <Sparkline values={sparkPoints} />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-zinc-400">
        {lines.lines.slice(0, 6).map((book) => (
          <div
            key={`${book.provider}-${book.lastUpdated ?? "na"}`}
            className="rounded border border-zinc-800/60 bg-zinc-900 px-2 py-1"
          >
            <span className="text-zinc-300">{book.provider}</span>
            {book.spread != null ? <span className="ml-1 text-zinc-400">{formatSpread(book.spread)}</span> : null}
            {book.total != null ? <span className="ml-1 text-zinc-500">/ {formatTotal(book.total)}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

type SparklineProps = { values: number[] };

function Sparkline({ values }: SparklineProps) {
  if (!values.length) return null;
  const pts = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const domain = max - min || 1;
  const width = (pts.length - 1) * 14;
  const height = 36;
  const coords = pts
    .map((value, index) => {
      const x = index * 14;
      const norm = (value - min) / domain;
      const y = height - norm * height;
      return `${x},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="h-9 w-full text-emerald-300" viewBox={`0 0 ${Math.max(width, 1)} ${height}`} preserveAspectRatio="none">
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function formatSpread(spread: number | null) {
  if (spread == null || Number.isNaN(spread)) return "off";
  const rounded = Math.round(spread * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "" : "";
  return `${sign}${rounded.toFixed(1)}`;
}

function formatTotal(total: number | null) {
  if (total == null || Number.isNaN(total)) return "off";
  return (Math.round(total * 10) / 10).toFixed(1);
}

function formatProbability(prob: number | null) {
  if (prob == null || Number.isNaN(prob)) return "--";
  return `${Math.round(prob * 100)}%`;
}
