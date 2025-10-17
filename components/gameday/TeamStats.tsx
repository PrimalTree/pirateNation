"use client";
import React from "react";
import { useEffect, useState } from "react";

type Leader = { name: string; value: number };
type TeamBlock = {
  team: string;
  perGame: {
    pointsPerGame?: number;
    pointsAgainstPerGame?: number;
    passYdsPerGame?: number;
    rushYdsPerGame?: number;
    totalOffensePerGame?: number;
    totalDefensePerGame?: number;
    thirdDownPct?: number;
    redZonePct?: number;
    turnoverMargin?: number;
    penaltiesPerGame?: number;
    penaltyYdsPerGame?: number;
  };
  leaders: {
    passing?: Leader;
    rushing?: Leader;
    receiving?: Leader;
    tackles?: Leader;
    interceptions?: Leader;
  };
};

type GamedayPayload = {
  team: TeamBlock;
  opponent?: TeamBlock;
  inferredOpponent?: string;
};

export function TeamStats() {
  const [data, setData] = useState<GamedayPayload | null>(null);
  const [tab, setTab] = useState<"team" | "opp">("team");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/stats/gameday", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        if (alive) {
          setData({
            team: j.team,
            opponent: j.opponent ?? undefined,
            inferredOpponent: j.inferredOpponent ?? undefined,
          });
        }
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load team stats");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fmt = (n?: number) => (typeof n === "number" && Number.isFinite(n) ? n.toFixed(1) : "");

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <h3 className="mb-2 text-sm font-semibold">Team Stats</h3>
        <div className="text-sm text-red-400">{error}</div>
      </section>
    );
  }
  if (!data) return null;

  const block = tab === "team" ? data.team : data.opponent ?? data.team;
  const pg = block.perGame || {};
  const oppLabel = data.opponent?.team || data.inferredOpponent || "Opponent";
  const canViewOpp = Boolean(data.opponent);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Team Stats</h3>
        <div className="inline-flex shrink-0 gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
          <button
            type="button"
            onClick={() => setTab("team")}
            className={`px-2 py-1 text-xs rounded-md ${
              tab === "team" ? "bg-ecu-gold text-black" : "text-zinc-300 hover:text-white"
            }`}
          >
            {data.team.team}
          </button>
          <button
            type="button"
            onClick={() => setTab("opp")}
            className={`px-2 py-1 text-xs rounded-md ${
              tab === "opp" ? "bg-ecu-gold text-black" : "text-zinc-300 hover:text-white"
            } ${!canViewOpp ? "opacity-40 cursor-not-allowed" : ""}`}
            disabled={!canViewOpp}
          >
            {oppLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <div>
          <div className="text-zinc-400">Points For (PPG)</div>
          <div className="text-zinc-200">{fmt(pg.pointsPerGame)}</div>
        </div>
        <div>
          <div className="text-zinc-400">Points Against (PAPG)</div>
          <div className="text-zinc-200">{fmt(pg.pointsAgainstPerGame)}</div>
        </div>
        <div>
          <div className="text-zinc-400">Pass Yds/G</div>
          <div className="text-zinc-200">{fmt(pg.passYdsPerGame)}</div>
        </div>
        <div>
          <div className="text-zinc-400">Rush Yds/G</div>
          <div className="text-zinc-200">{fmt(pg.rushYdsPerGame)}</div>
        </div>
        <div>
          <div className="text-zinc-400">3rd Down %</div>
          <div className="text-zinc-200">{fmt(pg.thirdDownPct)}</div>
        </div>
        <div>
          <div className="text-zinc-400">TO Margin</div>
          <div className="text-zinc-200">{fmt(pg.turnoverMargin)}</div>
        </div>
        {pg.totalOffensePerGame != null && (
          <div>
            <div className="text-zinc-400">Total Offense/G</div>
            <div className="text-zinc-200">{fmt(pg.totalOffensePerGame)}</div>
          </div>
        )}
        {pg.totalDefensePerGame != null && (
          <div>
            <div className="text-zinc-400">Total Defense/G (allowed)</div>
            <div className="text-zinc-200">{fmt(pg.totalDefensePerGame)}</div>
          </div>
        )}
        {pg.penaltiesPerGame != null && (
          <div>
            <div className="text-zinc-400">Penalties / G</div>
            <div className="text-zinc-200">{fmt(pg.penaltiesPerGame)}</div>
          </div>
        )}
        {pg.penaltyYdsPerGame != null && (
          <div>
            <div className="text-zinc-400">Penalty Yds / G</div>
            <div className="text-zinc-200">{fmt(pg.penaltyYdsPerGame)}</div>
          </div>
        )}
      </div>
    </section>
  );
}
