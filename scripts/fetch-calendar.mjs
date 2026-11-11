/**
 * Fetches the official UIU academic calendars straight from uiu.ac.bd and
 * regenerates src/data/calendarData.js.
 *
 *   node scripts/fetch-calendar.mjs          # fetch + write
 *   node scripts/fetch-calendar.mjs --check  # fetch + compare, write nothing
 *
 * Source: https://www.uiu.ac.bd/academics/calendar/ (WordPress RSS feed)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'calendarData.js');

const FEED_URL = 'https://www.uiu.ac.bd/academics/calendar/feed';
const CHECK = process.argv.includes('--check');

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, '-');
}

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ');
const collapse = (s) => decodeEntities(s).replace(/\s+/g, ' ').trim();

const ymd = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const FULL_RE = /^([A-Za-z]{3,9})\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/; // "Oct 24" | "Dec 19, 2026" | "Feb 9 2026"
const DAY_RE = /^(\d{1,2})\s*,?\s*(\d{4})$/; // "26, 2026" | "9 2026"

/**
 * Handles every date-cell shape UIU uses:
 *   "Oct 26, 2026"              single day
 *   "Oct 24 - 26, 2026"         same-month range
 *   "Dec 12-18, 2026"           no spaces
 *   "Jan 30- Feb 9 2026"        missing comma before year
 *   "Jan 25 - Feb 1, 2027"      cross-month range
 *   "Dec 19, 2026 - Jan 5, 2027" cross-year range
 */
function parseDateCell(raw) {
  const s = collapse(raw);
  const sep = s.search(/\s*[-–—]\s*/);

  if (sep === -1) {
    const m = s.match(FULL_RE);
    if (!m || !m[3]) return null;
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (!mo) return null;
    const d = ymd(Number(m[3]), mo, Number(m[2]));
    return { start: d, end: d };
  }

  const left = s.slice(0, sep).trim();
  const right = s.slice(sep).replace(/\s*[-–—]\s*/, ' ').trim();

  const lm = left.match(FULL_RE);
  if (!lm) return null;
  const mo1 = MONTHS[lm[1].slice(0, 3).toLowerCase()];
  const d1 = Number(lm[2]);
  if (!mo1 || !d1) return null;

  let mo2 = mo1;
  let d2;
  let year;
  const yearFromLeft = lm[3] ? Number(lm[3]) : null;
  const rd = right.match(DAY_RE);
  if (rd) {
    d2 = Number(rd[1]);
    year = Number(rd[2]);
  } else {
    const rm = right.match(FULL_RE);
    if (!rm) return null;
    mo2 = MONTHS[rm[1].slice(0, 3).toLowerCase()];
    d2 = Number(rm[2]);
    year = Number(rm[3] || yearFromLeft);
  }
  if (!mo2 || !d2 || !year) return null;
  // Cross-year ranges ("Dec 21, 2025 - Jan 7, 2026"): start keeps the LEFT year.
  const startYear = yearFromLeft || year;
  return { start: ymd(startYear, mo1, d1), end: ymd(year, mo2, d2) };
}

/**
 * UIU occasionally publishes an impossible date (the Fall 2026 calendars list
 * "Dec 25, 2027" for Christmas). Shift out-of-window dates back into the
 * trimester they belong to and log it. Windows are derived from the actual
 * term spans, including B.Pharm's semester schedule (Aug-Jan / Jan-Jul).
 */
function termWindow(meta) {
  const { term, year, program } = meta;
  const isPharm = program === 'B. Pharm';
  if (term === 'fall') {
    return isPharm
      ? [`${year}-08-01`, `${year + 1}-02-28`]
      : [`${year}-10-01`, `${year + 1}-03-31`];
  }
  if (term === 'spring') {
    return isPharm
      ? [`${year}-01-01`, `${year}-08-31`]
      : [`${year}-02-01`, `${year}-08-31`];
  }
  return [`${year}-06-01`, `${year}-11-30`]; // summer trimester
}

function clampToTerm(dateStr, [winStart, winEnd], log) {
  let d = dateStr;
  let guard = 0;
  while (d > winEnd && guard++ < 3) {
    const [y, m, day] = d.split('-').map(Number);
    d = ymd(y - 1, m, day);
    log(`shifted ${dateStr} -> ${d} (site date outside term window)`);
  }
  guard = 0;
  while (d < winStart && guard++ < 3) {
    const [y, m, day] = d.split('-').map(Number);
    d = ymd(y + 1, m, day);
    log(`shifted ${dateStr} -> ${d} (site date outside term window)`);
  }
  return d;
}

/** "Fall 2026 Trimester Undergraduate Programs [Revised]" -> id/term/year/kind/program/isRevised/label */
function metaFromTitle(rawTitle) {
  const isRevised = /\[\s*Revised\s*\]/i.test(rawTitle);
  const cleanTitle = rawTitle.replace(/\[\s*Revised\s*\]/gi, ' ').replace(/\s+/g, ' ').trim();
  const m = cleanTitle.match(/^(Fall|Spring|Summer)\s+(\d{4})\s+(Trimester|Semester)\s+(.+)$/i);
  if (!m) return null;
  const term = m[1].toLowerCase();
  const year = Number(m[2]);
  const kind = m[3].toLowerCase(); // 'trimester' | 'semester'
  const progRaw = m[4].trim();

  let program;
  let slug;
  if (/undergraduate/i.test(progRaw)) {
    program = 'Undergraduate';
    slug = 'undergraduate';
  } else if (/graduate/i.test(progRaw)) {
    program = 'Graduate';
    slug = 'graduate';
  } else if (/pharm/i.test(progRaw)) {
    program = 'B. Pharm';
    slug = 'b-pharm';
  } else {
    program = progRaw;
    slug = progRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const termCapital = term.charAt(0).toUpperCase() + term.slice(1);
  const kindCapital = kind.charAt(0).toUpperCase() + kind.slice(1);
  const revisedTag = isRevised ? ' [Revised]' : '';
  const label = `${termCapital} ${year} — ${kindCapital} (${program})${revisedTag}`;
  const fullTitle = `${termCapital} ${year} ${kindCapital} ${program}${revisedTag}`;

  return {
    id: `${term}-${year}-${slug}`,
    title: fullTitle,
    label,
    term,
    year,
    kind,
    program,
    isRevised,
  };
}

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items.map((it) => {
    const title = (it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const link = (it.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    return { title: collapse(title), link: collapse(link), pubDate: collapse(pubDate) };
  }).filter((x) => x.title && x.link);
}

function parseCalendarPage(html, meta) {
  const tables = [...html.matchAll(/<div class="calender-table">([\s\S]*?)<\/table>/g)];
  if (!tables.length) return [];
  const window = termWindow(meta);
  const log = (msg) => console.warn(`[calendar]   ! ${meta.id}: ${msg}`);
  const events = [];
  for (const table of tables) {
    for (const row of table[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
      const tds = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
      if (tds.length < 3) continue;
      const rawDate = collapse(stripTags(tds[0]));
      const date = parseDateCell(rawDate);
      const text = collapse(stripTags(tds[2]));
      if (!text) continue;
      if (!date) {
        log(`unparsed date cell: "${rawDate}"`);
        continue;
      }
      events.push({
        start: clampToTerm(date.start, window, log),
        end: clampToTerm(date.end, window, log),
        text,
      });
    }
  }
  return events;
}

async function fetchText(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (compatible; EZ_UIU calendar fetcher; +https://github.com/junaedkhandakar/EZ_UIU)',
        },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Imunify/anti-bot interstitial instead of the real page
      if (url.includes('uiu.ac.bd/academics/calendar/') && !url.endsWith('/feed') && !text.includes('calender-table')) {
        throw new Error('bot-check interstitial');
      }
      return text;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

function serialize(calendars, source) {
  return (
    `export const CALENDARS_DATA = ${JSON.stringify(calendars)};\n\n` +
    `export const CALENDAR_SOURCE = ${JSON.stringify(source, null, 2)};\n`
  );
}

async function main() {
  console.log(`[calendar] fetching ${FEED_URL}`);
  const feed = await fetchText(FEED_URL);
  const items = parseFeed(feed);
  const lastBuild = (feed.match(/<lastBuildDate>([\s\S]*?)<\/lastBuildDate>/) || [])[1]?.trim() || '';
  console.log(`[calendar] ${items.length} calendar posts in feed (last build: ${lastBuild})`);

  const fresh = [];
  const failed = [];
  for (const item of items) {
    const meta = metaFromTitle(item.title);
    if (!meta) {
      console.warn(`[calendar] skip unrecognized title: ${item.title}`);
      continue;
    }
    try {
      const html = await fetchText(item.link);
      const events = parseCalendarPage(html, meta);
      if (!events.length) throw new Error('no events parsed');
      fresh.push({ ...meta, events });
      console.log(`[calendar]   ${meta.id}: ${events.length} events`);
    } catch (err) {
      failed.push(meta.id);
      console.warn(`[calendar]   FAILED ${meta.id}: ${err.message}`);
    }
  }

  if (!fresh.length) {
    console.error('[calendar] everything failed — refusing to touch calendarData.js');
    process.exit(1);
  }

  // Preserve existing calendars the feed no longer lists (archive entries).
  let existing = [];
  try {
    const mod = await import(`file://${OUT_FILE}?t=${Date.now()}`);
    existing = mod.CALENDARS_DATA || [];
  } catch {}
  const freshIds = new Set(fresh.map((c) => c.id));
  const kept = existing.filter((c) => !freshIds.has(c.id));
  const calendars = [...fresh, ...kept];

  const source = {
    source: 'uiu.ac.bd/academics/calendar',
    feed: FEED_URL,
    fetchedAt: new Date().toISOString(),
    feedLastBuild: lastBuild,
    calendars: calendars.length,
  };

  const next = serialize(calendars, source);
  let current = '';
  try {
    current = fs.readFileSync(OUT_FILE, 'utf8');
  } catch {}

  if (CHECK) {
    // Compare only the data (ignore the source block, which changes every run).
    const dataOf = (s) => (s.match(/export const CALENDARS_DATA = (\[[\s\S]*?\]);/) || [])[1] || '';
    const same = dataOf(current) === dataOf(next);
    console.log(same ? '[calendar] up to date with uiu.ac.bd' : '[calendar] STALE — rerun without --check to update');
    if (!same) process.exitCode = 1;
    return;
  }

  fs.writeFileSync(OUT_FILE, next, 'utf8');
  console.log(
    `[calendar] wrote ${calendars.length} calendars to src/data/calendarData.js` +
      (failed.length ? ` (${failed.length} failed, kept previous: ${failed.join(', ')})` : '')
  );
}

main().catch((err) => {
  console.error('[calendar] fatal:', err.message);
  process.exit(1);
});
