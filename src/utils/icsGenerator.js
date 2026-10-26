/**
 * EZ_UIU - Official Academic Calendar & .ics iCalendar Generator
 * Generates standards-compliant iCalendar files with accurate Dhaka timezones and makeup days.
 */

import { DAYS, DAYS_WD, WD } from './routineSolver';

const TZ = 'Asia/Dhaka';

function icsEsc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function clock(m) {
  return pad2(Math.floor(m / 60)) + pad2(m % 60) + '00';
}

function addDays(d, n) {
  return new Date(d.getTime() + n * 864e5);
}

function key(d) {
  return d.toISOString().slice(0, 10);
}

function ymd(d) {
  return key(d).replace(/-/g, '');
}

function fromKey(k) {
  const p = String(k || '').split('-').map(Number);
  if (p.length !== 3 || p.some(isNaN)) return null;
  return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16) + s.length.toString(16);
}

export function generateICS({
  sections = [],
  customCourses = [],
  calendar = null,
  firstDateStr = '',
  lastDateStr = '',
  alarmEnabled = true,
  alarmMinutes = 15,
}) {
  if (!calendar) throw new Error('Please choose an academic calendar.');
  const first = fromKey(firstDateStr);
  const last = fromKey(lastDateStr);
  if (!first || !last) throw new Error('Set the first and last class day.');
  if (last < first) throw new Error('The last class day cannot be before the first class day.');

  if (!sections.length && !customCourses.length) {
    throw new Error('Please select at least one course.');
  }

  const entries = [];
  function addEntry(title, meetings, faculty) {
    const groups = {};
    (meetings || []).forEach(m => {
      const k = m[1] + '|' + m[2] + '|' + (m[3] || '');
      if (!groups[k]) groups[k] = { start: m[1], end: m[2], room: m[3] || '', days: [] };
      const wd = DAYS_WD[DAYS.indexOf(m[0])];
      if (wd !== undefined) groups[k].days.push(wd);
    });
    Object.keys(groups).forEach(k => {
      const g = groups[k];
      entries.push({ title, days: g.days, start: g.start, end: g.end, room: g.room, faculty: faculty || '' });
    });
  }

  sections.forEach(sec => {
    addEntry(`${sec.code} (${sec.section}) - ${sec.title}`, sec.meetings, (sec.faculty || []).join(', '));
  });
  customCourses.forEach(c => {
    addEntry(c.title, c.meetings, c.faculty || '');
  });

  const evs = calendar.events || [];
  const blocked = {};
  evs.filter(e => ['exam', 'holiday', 'suspend'].indexOf(e.kind) !== -1).forEach(e => {
    const sDate = fromKey(e.start);
    const eDate = fromKey(e.end);
    if (sDate && eDate) {
      for (let d = sDate; d <= eDate; d = addDays(d, 1)) blocked[key(d)] = 1;
    }
  });

  const makeup = {};
  evs.filter(e => e.kind === 'makeup').forEach(e => {
    const sDate = fromKey(e.start);
    const eDate = fromKey(e.end);
    if (sDate && eDate) {
      for (let d = sDate; d <= eDate; d = addDays(d, 1)) makeup[key(d)] = e.wd;
    }
  });

  const termName = calendar.title.replace(/\s*Trimester.*$/i, '') || calendar.title;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EZ_UIU Routine Builder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsEsc('UIU ' + termName + ' schedule'),
    'X-WR-TIMEZONE:' + TZ,
    'BEGIN:VTIMEZONE',
    'TZID:' + TZ,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0600',
    'TZOFFSETTO:+0600',
    'TZNAME:+06',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

  function pushEvent(body) {
    lines.push('BEGIN:VEVENT', 'DTSTAMP:' + stamp, ...body, 'END:VEVENT');
  }

  let totalClasses = 0;
  let lastClassDate = null;
  let totalMakeups = 0;

  for (let d = first; d <= last; d = addDays(d, 1)) {
    const k = key(d);
    if (blocked[k]) continue;
    const isMk = Object.prototype.hasOwnProperty.call(makeup, k);
    const wd = isMk ? makeup[k] : d.getUTCDay();
    const todays = entries.filter(e => e.days.indexOf(wd) !== -1);
    if (isMk) totalMakeups++;

    todays.forEach(e => {
      const body = [
        'UID:' + hash(e.title + k + e.start) + '@ez-uiu-routine',
        'DTSTART;TZID=' + TZ + ':' + ymd(d) + 'T' + clock(e.start),
        'DTEND;TZID=' + TZ + ':' + ymd(d) + 'T' + clock(e.end),
        'SUMMARY:' + icsEsc((isMk ? '[Makeup · Online] ' : '') + e.title),
        'LOCATION:' + icsEsc(isMk ? 'Online' : (e.room ? e.room + ', UIU Campus' : 'UIU Campus')),
        'DESCRIPTION:' + icsEsc(
          (e.faculty ? 'Faculty: ' + e.faculty + '\n' : '') +
          (isMk ? 'Online class, follows ' + WD[wd] + ' routine' : '') +
          (calendar ? '\nTerm: ' + calendar.title : '')
        ),
      ];

      if (alarmEnabled && alarmMinutes > 0) {
        body.push(
          'BEGIN:VALARM',
          'TRIGGER:-PT' + alarmMinutes + 'M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Class upcoming',
          'END:VALARM'
        );
      }

      pushEvent(body);
      totalClasses++;
      lastClassDate = d;
    });
  }

  lines.push('END:VCALENDAR');
  const icsContent = lines.join('\r\n');

  return {
    content: icsContent,
    stats: {
      classes: totalClasses,
      lastClass: lastClassDate,
      makeups: totalMakeups,
    },
  };
}

export function downloadICS(icsString, filename = 'UIU_Routine_Schedule.ics') {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
