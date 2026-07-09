/**
 * Semplice parser per determinare se il locale è aperto ora.
 * Legge orari nel formato "Lun-Ven 12:00-15:00, 19:00-23:00" ecc.
 * Restituisce: 'open' | 'closed' | 'unknown'
 */
export function parseOpenStatus(orari: string | null | undefined): 'open' | 'closed' | 'unknown' {
  if (!orari || orari.trim() === '') return 'unknown';

  const now = new Date();
  const dayNames = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const dayNamesEn = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDayIt = dayNames[now.getDay()];
  const currentDayEn = dayNamesEn[now.getDay()];
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const toMin = (hhmm: string) => {
    const parts = hhmm.trim().split(':');
    if (parts.length < 2) return -1;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  // Cerca tutte le fasce orarie "HH:MM-HH:MM" nel testo
  const timeRangeRegex = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

  // Controlla se la riga/blocco di testo si riferisce al giorno corrente
  const lowerOrari = orari.toLowerCase();
  const relevantLines = orari.split(/[\n,;]+/).filter(line => {
    const low = line.toLowerCase();
    return (
      low.includes(currentDayIt) ||
      low.includes(currentDayEn) ||
      // Se non ci sono riferimenti a giorni specifici, include tutto
      (!/lun|mar|mer|gio|ven|sab|dom|mon|tue|wed|thu|fri|sat|sun/.test(low))
    );
  });

  const textToCheck = relevantLines.length > 0 ? relevantLines.join(' ') : orari;

  let match;
  const regex = new RegExp(timeRangeRegex.source, 'g');
  while ((match = regex.exec(textToCheck)) !== null) {
    const start = toMin(match[1]);
    const end = toMin(match[2]);
    if (start < 0 || end < 0) continue;
    // Gestisce fasce a cavallo della mezzanotte (es. 22:00-02:00)
    if (end < start) {
      if (currentMin >= start || currentMin <= end) return 'open';
    } else {
      if (currentMin >= start && currentMin <= end) return 'open';
    }
  }

  // Se abbiamo trovato orari ma nessuna fascia attiva → chiuso
  const hasAnyTime = /\d{1,2}:\d{2}/.test(textToCheck);
  if (hasAnyTime) return 'closed';
  return 'unknown';
}
