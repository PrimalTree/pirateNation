import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchEspnTeamSchedule, normalizeEspnTeamSchedule, fetchEspnTeamRoster, normalizeEspnTeamRoster } from '../services/fetcher/espn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECU_TEAM_ID = '151';

async function main() {
  console.log('Updating data files...');

  try {
    const scheduleData = await fetchEspnTeamSchedule(ECU_TEAM_ID);
    const normalizedGames = normalizeEspnTeamSchedule(scheduleData);

    const schedule = {
      season: new Date().getFullYear(),
      games: normalizedGames,
    };

    const rosterData = await fetchEspnTeamRoster(ECU_TEAM_ID);
    const normalizedRoster = normalizeEspnTeamRoster(rosterData);

    const roster = {
      team: 'East Carolina Pirates',
      season: new Date().getFullYear(),
      players: normalizedRoster,
    };

    const schedulePath = path.join(__dirname, '../../apps/web/data/public/schedule.json');
    const rosterPath = path.join(__dirname, '../../apps/web/data/public/roster.json');

    await fs.writeFile(schedulePath, JSON.stringify(schedule, null, 2));
    await fs.writeFile(rosterPath, JSON.stringify(roster, null, 2));

    console.log('Data files updated successfully.');
  } catch (error) {
    console.error('Error updating data files:', error);
    process.exit(1);
  }
}

main();
