// lib/weather/openweather.ts
type NormWeather = {
    temp_f?: number | null;
    description?: string | null;
    icon?: string | null;
    wind_mph?: number | null;
    humidity?: number | null;
    source?: 'daily16' | 'onecall' | 'current' | 'none';
  };
  
  const OW_BASE_GEO = 'https://api.openweathermap.org/geo/1.0/direct';
  const OW_BASE_DAILY16 = 'https://api.openweathermap.org/data/2.5/forecast/daily'; // up to 16 days (paid tier)
  const OW_BASE_ONECALL = 'https://api.openweathermap.org/data/3.0/onecall';
  const UNITS = 'imperial'; // °F, mph
  
  function toYMD(d: Date) {
    return d.toISOString().slice(0,10);
  }
  
  export async function getForecastForDate(opts: {
    apiKey: string;
    city?: string;
    state?: string;
    country?: string;
    fallbackCity?: string;      // e.g. 'Greenville'
    fallbackState?: string;     // e.g. 'NC'
    targetISO?: string | null;  // kickoff date/time
  }): Promise<NormWeather> {
    const {
      apiKey, city, state, country = 'US',
      fallbackCity = 'Greenville',
      fallbackState = 'NC',
      targetISO
    } = opts;
  
    if (!apiKey) return { source: 'none' };
  
    // 1) Geocode: prefer venue city/state, else fallback
    const qCity = (city && state) ? `${city},${state},${country}` :
                 fallbackState ? `${fallbackCity},${fallbackState},${country}` :
                 `${fallbackCity},${country}`;
  
    let lat: number | undefined, lon: number | undefined;
    try {
      const geo = await fetch(`${OW_BASE_GEO}?q=${encodeURIComponent(qCity)}&limit=1&appid=${apiKey}`, { cache: 'no-store' });
      if (geo.ok) {
        const arr = await geo.json();
        if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
          lat = arr[0].lat; lon = arr[0].lon;
        }
      }
    } catch {}
    if (lat == null || lon == null) return { source: 'none' };
  
    // Helper: normalize a "daily" item (either daily16 or onecall daily)
    const normalizeDaily = (item: any): NormWeather => {
      // daily16: item.temp.day, item.weather[0].icon, item.speed (wind), item.humidity
      // onecall: item.temp.day, item.weather[0].icon, item.wind_speed, item.humidity
      const tempDay = item?.temp?.day ?? item?.temp; // some variants
      const wind = item?.wind_speed ?? item?.speed;
      const desc = item?.weather?.[0]?.description ?? null;
      const icon = item?.weather?.[0]?.icon ?? null;
      return {
        temp_f: typeof tempDay === 'number' ? tempDay : null,
        description: desc,
        icon,
        wind_mph: typeof wind === 'number' ? wind : null,
        humidity: typeof item?.humidity === 'number' ? item.humidity : null,
      };
    };
  
    // 2) Determine target day (UTC date match is good enough for display)
    const target = targetISO ? new Date(targetISO) : null;
    const targetYMD = target ? toYMD(target) : null;
  
    // 3) Try 16-day forecast first
    try {
      const url = `${OW_BASE_DAILY16}?lat=${lat}&lon=${lon}&cnt=16&units=${UNITS}&appid=${apiKey}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        const list: any[] = Array.isArray(j?.list) ? j.list : [];
        if (list.length) {
          let pick = list[0];
          if (targetYMD) {
            // find by closest day to target
            let best = { diff: Infinity, item: list[0] };
            for (const it of list) {
              const d = new Date((it?.dt ?? 0) * 1000);
              const diff = Math.abs((target?.getTime() ?? 0) - d.getTime());
              if (diff < best.diff) best = { diff, item: it };
            }
            pick = best.item;
          }
          return { ...normalizeDaily(pick), source: 'daily16' };
        }
      }
    } catch {}
  
    // 4) Fallback to One Call (≈8 days)
    try {
      const url = `${OW_BASE_ONECALL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=${UNITS}&appid=${apiKey}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        const list: any[] = Array.isArray(j?.daily) ? j.daily : [];
        if (list.length) {
          let pick = list[0];
          if (targetYMD) {
            let best = { diff: Infinity, item: list[0] };
            for (const it of list) {
              const d = new Date((it?.dt ?? 0) * 1000);
              const diff = Math.abs((target?.getTime() ?? 0) - d.getTime());
              if (diff < best.diff) best = { diff, item: it };
            }
            pick = best.item;
          }
          return { ...normalizeDaily(pick), source: 'onecall' };
        }
      }
    } catch {}
  
    // 5) Last resort: current conditions
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${UNITS}&appid=${apiKey}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const w = await r.json();
        return {
          temp_f: typeof w?.main?.temp === 'number' ? w.main.temp : null,
          description: w?.weather?.[0]?.description ?? null,
          icon: w?.weather?.[0]?.icon ?? null,
          wind_mph: typeof w?.wind?.speed === 'number' ? w.wind.speed : null,
          humidity: typeof w?.main?.humidity === 'number' ? w.main.humidity : null,
          source: 'current',
        };
      }
    } catch {}
  
    return { source: 'none' };
  }
  