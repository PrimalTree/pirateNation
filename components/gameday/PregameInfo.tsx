"use client";
import { useEffect, useState } from 'react';

type Pregame = {
  opponent?: string | null;
  kickoff?: string | null;
  venue?: string | null;
  broadcast?: string | null;
  status?: string | null;
  weather?: {
    temp_f?: number | null;
    description?: string | null;
    icon?: string | null;
    wind_mph?: number | null;
    humidity?: number | null;
  } | null;
};

export function PregameInfo() {
  const [data, setData] = useState<Pregame | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/stats/pregame', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const body = await res.json();
        if (alive) setData(body);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load pregame info');
      }
    })();
    return () => { alive = false; };
  }, []);

  const kickoffText = data?.kickoff ? new Date(data.kickoff).toLocaleString() : 'TBD';

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pregame</h3>
        {data?.status && (
          <span className="rounded px-1.5 py-0.5 text-[10px] border border-emerald-400/40 text-emerald-200">{String(data.status)}</span>
        )}
      </div>
      {error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : (
        <div className="grid gap-3 text-sm md:grid-cols-3">
          {/* Opponent */}
          <div>
            <div className="text-zinc-400">Opponent</div>
            <div className="text-zinc-200">{data?.opponent ?? 'TBD'}</div>
          </div>
          {/* Kickoff */}
          <div>
            <div className="text-zinc-400">Kickoff</div>
            <div className="text-zinc-200">{kickoffText}</div>
          </div>
          {/* Broadcast */}
          <div>
            <div className="text-zinc-400">Broadcast</div>
            <div className="text-zinc-200">{data?.broadcast ?? 'TBD'}</div>
          </div>
          {/* Venue */}
          <div className="md:col-span-2">
            <div className="text-zinc-400">Venue</div>
            <div className="text-zinc-200">{data?.venue ?? 'TBD'}</div>
          </div>
          {/* Weather */}
          <div className="md:col-span-3">
            <div className="text-zinc-400">Weather</div>
            {data && data.weather ? (
              <div className="mt-1 flex items-center gap-3">
                {data.weather.icon ? (
                  <img
                    src={`https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`}
                    alt={data.weather.description || 'Weather'}
                    className="h-10 w-10 shrink-0"
                  />
                ) : null}
                <div className="text-zinc-200">
                  <span className="text-lg font-semibold text-ecu-gold">
                    {typeof data.weather.temp_f === 'number' ? Math.round(data.weather.temp_f) + '°F' : '—'}
                  </span>
                  {data.weather.description ? (
                    <span className="ml-2 capitalize text-zinc-300">{String(data.weather.description)}</span>
                  ) : null}
                  <div className="text-xs text-zinc-400">
                    {(typeof data.weather.wind_mph === 'number' && `Wind ${Math.round(data.weather.wind_mph)} mph`) || ''}
                    {(typeof data.weather.humidity === 'number' && (typeof data.weather.wind_mph === 'number' ? ' • ' : '') + `Humidity ${data.weather.humidity}%`) || ''}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-200">TBD</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
