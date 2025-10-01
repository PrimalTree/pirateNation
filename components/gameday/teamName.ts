export function shortTeam(name?: string): string {
  if (!name) return '';
  const raw = String(name);
  const s = raw.toLowerCase();

  // Direct replacements / abbreviations
  if (s.includes('east carolina')) return 'ECU';
  if (s.includes('florida atlantic')) return 'FAU';
  if (s.includes('south florida')) return 'USF';
  if (s.includes('central florida')) return 'UCF';
  if (s.includes('north carolina state') || s.includes('nc state')) return 'NC State';
  if (s.includes('coastal carolina')) return 'Coastal';
  if (s.includes('brigham young') || s.includes('byu')) return 'BYU';
  if (s.includes('texas-san antonio') || s.includes('utsa')) return 'UTSA';
  if (s.includes('charlotte')) return 'Charlotte';
  if (s.includes('memphis')) return 'Memphis';
  if (s.includes('tulsa')) return 'Tulsa';
  if (s.includes('tulane')) return 'Tulane';
  if (s.includes('temple')) return 'Temple';
  if (s.includes('army')) return 'Army';
  if (s.includes('campbell')) return 'Campbell';

  // Strip common mascot words from the end
  const mascots = new Set([
    'pirates','wolfpack','camels','chanticleers','cougars','knights','wave','hurricane','owls','49ers','tigers','roadrunners','eagles','bearcats','green','golden','black','bulls','mustangs','midshipmen','owl','tiger','huskies','minutemen','blazers','jayhawks','sooners','longhorns','wildcats'
  ]);
  const parts = raw.split(/\s+/);
  while (parts.length > 1 && mascots.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }
  const base = parts.join(' ');
  return base;
}

export function shortMatchup(name?: string): string {
  if (!name) return '';
  const raw = String(name);
  const sep = /\s+(at|vs\.?|vs)\s+/i;
  const m = raw.split(sep);
  if (m.length >= 3) {
    const left = shortTeam(m[0]);
    const mid = m[1].toLowerCase().startsWith('vs') ? 'vs' : 'at';
    const right = shortTeam(m.slice(2).join(' '));
    return `${left} ${mid} ${right}`.trim();
  }
  return shortTeam(raw);
}

export function shortFinalString(finalStr?: string): string {
  if (!finalStr) return '';
  let out = String(finalStr);
  // Replace known long names with shorts by running shortTeam over segments
  // Heuristic: find words followed by score; but simplest is to apply key replacements
  const map: Array<[RegExp,string]> = [
    [/East Carolina[^\d–-]*/gi,'ECU '],
    [/Florida Atlantic[^\d–-]*/gi,'FAU '],
    [/(North Carolina State|NC State)[^\d–-]*/gi,'NC State '],
    [/Coastal Carolina[^\d–-]*/gi,'Coastal '],
    [/Charlotte 49ers/gi,'Charlotte '],
    [/UTSA[^\d–-]*/gi,'UTSA '],
    [/South Florida[^\d–-]*/gi,'USF '],
    [/Central Florida[^\d–-]*/gi,'UCF '],
    [/Tulane[^\d–-]*/gi,'Tulane '],
    [/Tulsa[^\d–-]*/gi,'Tulsa '],
    [/Temple[^\d–-]*/gi,'Temple '],
    [/Memphis[^\d–-]*/gi,'Memphis '],
    [/BYU[^\d–-]*/gi,'BYU '],
    [/Army[^\d–-]*/gi,'Army '],
    [/Campbell[^\d–-]*/gi,'Campbell '],
  ];
  for (const [re, rep] of map) out = out.replace(re, rep);
  return out.replace(/\s+/g,' ').trim();
}

