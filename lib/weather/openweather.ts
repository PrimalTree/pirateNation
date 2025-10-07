export type ForecastSource = 'daily16' | 'onecall' | 'current' | 'none';

export type ForecastDebug = {
  lat: number | null;
  lon: number | null;
  tz?: number | null;
  targetISO?: string | null;
  targetEpoch?: number | null;
  picked_dt?: number | null;
  picked_local_ymd?: string | null;
  city?: string | null;
  state?: string | null;
  method?: ForecastSource;
};

export type ForecastResult = {
  temp_f: number | null;
  temp_max_f?: number | null;
  temp_min_f?: number | null;
  description: string | null;
  icon: string | null;
  wind_mph: number | null;
  humidity: number | null;
  source: ForecastSource;
  debug?: ForecastDebug;
};

type ForecastArgs = {
  apiKey: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  fallbackCity: string;
  fallbackState: string;
  targetISO?: string | null;
};

type GeocodeResult = {
  name: string | null;
  state: string | null;
  lat: number | null;
  lon: number | null;
};

const DAILY16_URL = 'https://api.openweathermap.org/data/2.5/forecast/daily';
const ONECALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export async function getForecastForDate(opts: ForecastArgs): Promise<ForecastResult> {
  const { apiKey, city, state, fallbackCity, fallbackState, targetISO } = opts;
  const country = opts.country ?? 'US';
  const targetDate = parseDateSafe(targetISO);
  const targetEpoch = targetDate ? targetDate.getTime() : null;

  const location =
    (await geocode({ city, state, country, apiKey })) ??
    (await geocode({ city: fallbackCity, state: fallbackState, country, apiKey }));

  if (!location || location.lat == null || location.lon == null) {
    return buildResult('none', null, {
      lat: location?.lat ?? null,
      lon: location?.lon ?? null,
      targetISO: targetISO ?? null,
      targetEpoch,
      city: location?.name ?? null,
      state: location?.state ?? null,
      method: 'none',
    });
  }

  const coord = { lat: location.lat, lon: location.lon };

  // Try 16-day daily forecast first
  const daily16 = await fetchDaily16({ apiKey, coord, targetEpoch, targetISO, city: location.name, state: location.state });
  if (daily16) {
    return daily16;
  }

  // Fallback to One Call daily (8-day)
  const oneCall = await fetchOneCall({ apiKey, coord, targetEpoch, targetISO, city: location.name, state: location.state });
  if (oneCall) {
    return oneCall;
  }

  // Final fallback: current conditions
  const current = await fetchCurrent({ apiKey, coord, targetEpoch, targetISO, city: location.name, state: location.state });
  if (current) {
    return current;
  }

  return buildResult('none', null, {
    lat: coord.lat,
    lon: coord.lon,
    targetISO: targetISO ?? null,
    targetEpoch,
    city: location.name ?? null,
    state: location.state ?? null,
    method: 'none',
  });
}

type GeoArgs = { city?: string | null; state?: string | null; country: string; apiKey: string };

async function geocode({ city, state, country, apiKey }: GeoArgs): Promise<GeocodeResult | null> {
  if (!city) return null;
  const qParts = [city, state, country].filter(Boolean) as string[];
  const url = new URL(GEO_URL);
  url.searchParams.set('q', qParts.join(','));
  url.searchParams.set('limit', '1');
  url.searchParams.set('appid', apiKey);
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as any[];
    const first = Array.isArray(json) && json.length ? json[0] : null;
    if (!first) return null;
    return {
      name: typeof first.name === 'string' ? first.name : city,
      state: typeof first.state === 'string' ? first.state : state ?? null,
      lat: typeof first.lat === 'number' ? first.lat : null,
      lon: typeof first.lon === 'number' ? first.lon : null,
    };
  } catch {
    return null;
  }
}

type DailyArgs = {
  apiKey: string;
  coord: { lat: number; lon: number };
  targetEpoch: number | null;
  targetISO?: string | null;
  city?: string | null;
  state?: string | null;
};

async function fetchDaily16({ apiKey, coord, targetEpoch, targetISO, city, state }: DailyArgs): Promise<ForecastResult | null> {
  try {
    const url = new URL(DAILY16_URL);
    url.searchParams.set('lat', coord.lat.toString());
    url.searchParams.set('lon', coord.lon.toString());
    url.searchParams.set('cnt', '16');
    url.searchParams.set('units', 'imperial');
    url.searchParams.set('appid', apiKey);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json?.list) || !json.list.length) return null;
    const timezone = toNumber(json?.city?.timezone) ?? 0;
    const picked = pickEntry(json.list, timezone, targetEpoch, targetISO);
    if (!picked.entry) return null;
    return buildResult('daily16', picked.entry, {
      lat: coord.lat,
      lon: coord.lon,
      tz: timezone,
      targetISO: targetISO ?? null,
      targetEpoch,
      picked_dt: picked.epoch,
      picked_local_ymd: picked.localYmd,
      city: city ?? null,
      state: state ?? null,
      method: 'daily16',
    });
  } catch {
    return null;
  }
}

async function fetchOneCall({ apiKey, coord, targetEpoch, targetISO, city, state }: DailyArgs): Promise<ForecastResult | null> {
  try {
    const url = new URL(ONECALL_URL);
    url.searchParams.set('lat', coord.lat.toString());
    url.searchParams.set('lon', coord.lon.toString());
    url.searchParams.set('exclude', 'current,minutely,hourly,alerts');
    url.searchParams.set('units', 'imperial');
    url.searchParams.set('appid', apiKey);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json?.daily) || !json.daily.length) return null;
    const timezoneOffset = toNumber(json?.timezone_offset) ?? 0;
    const picked = pickEntry(json.daily, timezoneOffset, targetEpoch, targetISO);
    if (!picked.entry) return null;
    return buildResult('onecall', picked.entry, {
      lat: coord.lat,
      lon: coord.lon,
      tz: timezoneOffset,
      targetISO: targetISO ?? null,
      targetEpoch,
      picked_dt: picked.epoch,
      picked_local_ymd: picked.localYmd,
      city: city ?? null,
      state: state ?? null,
      method: 'onecall',
    });
  } catch {
    return null;
  }
}

async function fetchCurrent({ apiKey, coord, targetEpoch, targetISO, city, state }: DailyArgs): Promise<ForecastResult | null> {
  try {
    const url = new URL(CURRENT_URL);
    url.searchParams.set('lat', coord.lat.toString());
    url.searchParams.set('lon', coord.lon.toString());
    url.searchParams.set('units', 'imperial');
    url.searchParams.set('appid', apiKey);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const timezone = toNumber(json?.timezone) ?? 0;
    const pickedEpoch = typeof json?.dt === 'number' ? json.dt * 1000 : null;
    const pickedLocalYmd = pickedEpoch != null ? formatLocalYmd(pickedEpoch, timezone) : null;
    const debug: ForecastDebug = {
      lat: coord.lat,
      lon: coord.lon,
      tz: timezone,
      targetISO: targetISO ?? null,
      targetEpoch,
      picked_dt: pickedEpoch,
      picked_local_ymd: pickedLocalYmd,
      city: city ?? null,
      state: state ?? null,
      method: 'current',
    };
    return buildResult(
      'current',
      {
        temp: json?.main?.temp,
        temp_min: json?.main?.temp_min,
        temp_max: json?.main?.temp_max,
        weather: json?.weather,
        wind_speed: json?.wind?.speed,
        humidity: json?.main?.humidity,
      },
      debug
    );
  } catch {
    return null;
  }
}

type EntryPick = {
  entry: any | null;
  epoch: number | null;
  localYmd: string | null;
};

function pickEntry(list: any[], timezoneOffset: number, targetEpoch: number | null, targetISO?: string | null): EntryPick {
  if (!list.length) return { entry: null, epoch: null, localYmd: null };
  const entries = list
    .map((item) => {
      const dt = typeof item?.dt === 'number' ? item.dt * 1000 : null;
      return { item, epoch: dt };
    })
    .filter((row) => row.epoch != null);
  if (!entries.length) return { entry: null, epoch: null, localYmd: null };

  const target = targetEpoch ?? parseDateSafe(targetISO)?.getTime() ?? null;
  let picked = entries[0];
  if (target != null) {
    const targetLocal = formatLocalYmd(target, timezoneOffset);
    const match = entries.find((row) => formatLocalYmd(row.epoch!, timezoneOffset) === targetLocal);
    if (match) {
      picked = match;
    } else {
      picked = entries
        .slice()
        .sort((a, b) => Math.abs((a.epoch ?? 0) - target) - Math.abs((b.epoch ?? 0) - target))[0];
    }
  }

  const localYmd = picked?.epoch != null ? formatLocalYmd(picked.epoch, timezoneOffset) : null;
  return { entry: picked?.item ?? null, epoch: picked?.epoch ?? null, localYmd };
}

function buildResult(source: ForecastSource, entry: any | null, debug?: ForecastDebug): ForecastResult {
  if (!entry) {
    return { temp_f: null, temp_max_f: null, temp_min_f: null, description: null, icon: null, wind_mph: null, humidity: null, source, debug };
  }
  const tempBlock = entry?.temp ?? entry;
  const temp = toNumber(tempBlock?.day ?? tempBlock?.temp ?? entry?.main?.temp);
  const tempMax = toNumber(tempBlock?.max ?? entry?.temp_max);
  const tempMin = toNumber(tempBlock?.min ?? entry?.temp_min);
  const weatherItem = Array.isArray(entry?.weather) && entry.weather.length ? entry.weather[0] : null;
  const description = typeof weatherItem?.description === 'string' ? weatherItem.description : null;
  const icon = typeof weatherItem?.icon === 'string' ? weatherItem.icon : null;
  const wind = toNumber(entry?.speed ?? entry?.wind_speed ?? entry?.wind?.speed);
  const humidity = toNumber(entry?.humidity ?? entry?.main?.humidity);

  return {
    temp_f: temp,
    temp_max_f: tempMax ?? null,
    temp_min_f: tempMin ?? null,
    description,
    icon,
    wind_mph: wind,
    humidity,
    source,
    debug,
  };
}

function parseDateSafe(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(value: any): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function formatLocalYmd(epochMs: number, offsetSeconds: number): string {
  const localMs = epochMs + offsetSeconds * 1000;
  const d = new Date(localMs);
  return d.toISOString().slice(0, 10);
}
