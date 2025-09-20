import { RawGame } from '../types';

/**
 * Returns the week number for this date. dowOffset is the day of week the week
 * "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
 * the week returned is the ISO 8601 week number.
 * @param int dowOffset
 * @return int
 */
function getWeek(date: Date, dowOffset: number) {
  dowOffset = typeof dowOffset == 'number' ? dowOffset : 0; //default dowOffset to zero
  const newYear = new Date(date.getFullYear(), 0, 1);
  let day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = day >= 0 ? day : day + 7;
  const daynum =
    Math.floor(
      (date.getTime() -
        newYear.getTime() -
        (date.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
        86400000
    ) + 1;
  let weeknum;
  //if the year starts before the middle of a week
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      const nYear = new Date(date.getFullYear() + 1, 0, 1);
      let nday = nYear.getDay() - dowOffset;
      nday = nday >= 0 ? nday : nday + 7;
      /*if the next year starts before the middle of the week, it is week #1 of that year*/
      weeknum = nday < 4 ? 1 : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
}


export function cfbdProvider(apiKey: string) {
  const BASE_URL = 'https://api.collegefootballdata.com';
  const AUTH_HEADER = `Bearer ${apiKey}`;

  async function getGamesByDate(dateISO: string, team?: string): Promise<RawGame[]> {
    const url = new URL(`${BASE_URL}/games`);
    const date = new Date(dateISO);
    url.searchParams.append('year', date.getFullYear().toString());
    url.searchParams.append('week', getWeek(date, 1).toString());
    url.searchParams.append('seasonType', 'regular');
    if (team) {
      url.searchParams.append('team', team);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: AUTH_HEADER,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch games from CFBD API: ${response.statusText}`);
    }

    const games = (await response.json()) as RawGame[];
    return games.filter(
      (game: RawGame) => new Date(game.start_date).toISOString().substring(0, 10) === dateISO.substring(0, 10)
    );
  }

  return {
    getGamesByDate,
  };
}
