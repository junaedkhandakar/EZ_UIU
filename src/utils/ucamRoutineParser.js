/**
 * EZ_UIU - UCAM Class Routine PDF & Text Parser Engine
 * Extracts courses, sections, rooms, time slots, student metadata,
 * automatically matches with the current UIU Academic Calendar,
 * and synthesizes the full term schedule.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { CALENDARS_DATA } from '../data/calendarData';

// Configure PDF.js worker for client-side execution
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export const SAMPLE_UCAM_ROUTINE_TEXT = `Formal Code Course Title Day Room Time Slot Section
CSE 4451 Human Computer Interaction
Sat
328 
Permanent 
Campus
03:11:PM - 04:30:PM C
Tue
328 
Permanent 
Campus
03:11:PM - 04:30:PM C
CSE 4509 Operating Systems
Wed
406 
Permanent 
Campus
11:11:AM - 12:30:PM F
Sun
406 
Permanent 
Campus
11:11:AM - 12:30:PM F
CSE 4510 Operating Systems Laboratory Sun
826 
Permanent 
Campus
02:00:PM - 04:30:PM C
CSE 4891 Data Mining
Wed
406 
Permanent 
Campus
12:31:PM - 01:50:PM F
Sun
406 
Permanent 
Campus
12:31:PM - 01:50:PM F
MATH 2201 Coordinate Geometry and Vector 
Analysis
Sat
605 
Permanent 
Campus
01:51:PM - 03:10:PM D
Tue
605 
Permanent 
Campus
01:51:PM - 03:10:PM D
Address: United City, Madani Avenue, Badda, Dhaka - 1212, Bangladesh, Email: info@uiu.ac.bd, Phone +88 0964 848 848
United International University
Student ID : 0112330072 Session : 263 - Fall 2026 (Trimester)
Student Name : Md. Junaed Khandakar`;

/**
 * Extract plain text from an uploaded PDF File or ArrayBuffer
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      fullText += strings.join('\n') + '\n';
    }

    return fullText;
  } catch (err) {
    throw new Error(`Failed to read PDF file: ${err.message || 'Worker or format error'}`);
  }
}

/**
 * Parse time string e.g. "03:11:PM" or "11:11:AM" into minutes from midnight
 */
export function parseTime(t) {
  if (!t) return 0;
  const m = t.match(/(\d{1,2}):(\d{2}):?(AM|PM)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const meridiem = m[3].toUpperCase();
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

/**
 * Format minutes from midnight to readable string e.g. 911 -> "03:11 PM"
 */
export function formatMinutes(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = min < 10 ? `0${min}` : min;
  return `${displayH}:${displayM} ${ampm}`;
}

/**
 * Robust parser for UCAM Class Routine PDF text output
 */
export function parseUcamRoutineText(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Routine text is empty. Please upload a valid UCAM PDF or paste the routine text.');
  }

  // 1. Extract student metadata
  const studentIdMatch = rawText.match(/Student\s*ID\s*:\s*([0-9]+)/i);
  const studentNameMatch = rawText.match(/Student\s*Name\s*:\s*([^\n\r]+)/i);
  const sessionMatch = rawText.match(/Session\s*:\s*([^\n\r]+)/i);

  const studentId = studentIdMatch ? studentIdMatch[1].trim() : 'Unknown';
  const studentName = studentNameMatch ? studentNameMatch[1].trim() : 'UIU Student';
  const rawSession = sessionMatch ? sessionMatch[1].trim() : '';

  // Extract term and year
  const termMatch = rawSession.match(/(Fall|Spring|Summer)\s*(\d{4})/i);
  const term = termMatch ? termMatch[1] : 'Fall';
  const year = termMatch ? parseInt(termMatch[2], 10) : 2026;

  // 2. Parse Course Entries & Schedule Lines
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const courses = [];
  let currentCourse = null;

  const dayRegex = /^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/i;
  const timeSlotRegex = /(\d{1,2}:\d{2}:?(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}:?(?:AM|PM))(?:\s+([A-Z0-9]+))?/i;
  const roomRegex = /^(\d{3,4})\s*(?:Permanent\s*Campus)?$/i;

  let pendingDay = null;
  let pendingRoom = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line starts with course code (e.g., CSE 4451, MATH 2201)
    const codeMatch = line.match(/^([A-Z]{2,4}\s*\d{4}[A-Z]?)(?:\s+(.*))?$/);
    if (
      codeMatch &&
      !line.includes('Student') &&
      !line.includes('Session') &&
      !line.includes('Formal Code')
    ) {
      const code = codeMatch[1].replace(/\s+/, ' ').trim();
      let title = (codeMatch[2] || '').trim();

      // Check if Day is attached to title (e.g. "Operating Systems Laboratory Sun")
      const trailingDayMatch = title.match(/\b(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/i);
      if (trailingDayMatch) {
        pendingDay =
          trailingDayMatch[1].charAt(0).toUpperCase() +
          trailingDayMatch[1].slice(1).toLowerCase();
        title = title.slice(0, trailingDayMatch.index).trim();
      }

      // Check if next line is wrapped title (e.g. "Analysis")
      if (
        lines[i + 1] &&
        !dayRegex.test(lines[i + 1]) &&
        !roomRegex.test(lines[i + 1]) &&
        !timeSlotRegex.test(lines[i + 1]) &&
        !lines[i + 1].match(/^[A-Z]{2,4}\s*\d{4}/)
      ) {
        if (
          !lines[i + 1].includes('Campus') &&
          !lines[i + 1].includes('Address') &&
          !lines[i + 1].includes('Student')
        ) {
          title = `${title} ${lines[i + 1]}`.trim();
          i++;
        }
      }

      const isLab = /Lab|Laboratory/i.test(title);
      const credit = isLab ? (code.includes('4510') || code.includes('1112') ? 1 : 2) : 3;

      currentCourse = {
        code,
        title,
        isLab,
        credit,
        meetings: [],
        section: '',
      };
      courses.push(currentCourse);
      pendingRoom = null;
      continue;
    }

    if (!currentCourse) continue;

    // Check standalone Day
    if (dayRegex.test(line)) {
      pendingDay = line.slice(0, 3);
      pendingDay = pendingDay.charAt(0).toUpperCase() + pendingDay.slice(1).toLowerCase();
      continue;
    }

    // Check Room
    const rMatch = line.match(roomRegex);
    if (rMatch) {
      pendingRoom = rMatch[1];
      continue;
    }

    // Check Time slot & Section
    const timeMatch = line.match(timeSlotRegex);
    if (timeMatch) {
      const startStr = timeMatch[1];
      const endStr = timeMatch[2];
      const sec =
        timeMatch[3] || (lines[i + 1] && /^[A-Z0-9]$/.test(lines[i + 1]) ? lines[++i] : '');

      const startMin = parseTime(startStr);
      const endMin = parseTime(endStr);
      const room = pendingRoom || 'TBA';
      const day = pendingDay || 'Sat';

      if (sec && !currentCourse.section) {
        currentCourse.section = sec;
      }

      currentCourse.meetings.push([day, startMin, endMin, room]);
      pendingDay = null;
      pendingRoom = null;
      continue;
    }
  }

  if (courses.length === 0) {
    throw new Error(
      'Could not detect any course sections in the provided text. Ensure this is an official UCAM Class Routine.'
    );
  }

  // 3. Match with UIU Academic Calendar
  const matchedCalendar = matchAcademicCalendar(term, year);

  // 4. Synthesize Full Trimester Schedule
  const termSynthesis = synthesizeFullTermSchedule(courses, matchedCalendar);

  return {
    studentId,
    studentName,
    session: rawSession || `${term} ${year}`,
    term,
    year,
    courses,
    totalCredits: courses.reduce((sum, c) => sum + (c.credit || 3), 0),
    matchedCalendar,
    termSynthesis,
  };
}

/**
 * Match parsed term and year with the official UIU Academic Calendar
 */
export function matchAcademicCalendar(term = 'Fall', year = 2026) {
  const normTerm = term.toLowerCase();
  const searchId = `${normTerm}-${year}-undergraduate`;

  // Look for exact ID match
  let found = CALENDARS_DATA.find((c) => c.id === searchId);

  // Fallback to closest term match
  if (!found) {
    found = CALENDARS_DATA.find(
      (c) => c.term?.toLowerCase() === normTerm && c.year === year
    );
  }

  // Fallback to default active calendar
  if (!found) {
    found = CALENDARS_DATA[0];
  }

  return found;
}

/**
 * Synthesize the full term schedule combining course meetings and the academic calendar
 */
export function synthesizeFullTermSchedule(courses = [], calendar = null) {
  if (!calendar) return null;

  const events = calendar.events || [];

  const classesBeginEvent = events.find((e) => /classes begin/i.test(e.text));
  const midtermEvent = events.find((e) => /mid-term/i.test(e.text));
  const finalExamEvent = events.find((e) => /final exam/i.test(e.text));

  // Find holidays and online class makeup days
  const holidays = events.filter((e) => /holiday/i.test(e.text));
  const onlineMakeupDays = events.filter((e) => /regular .* class/i.test(e.text));

  // Total weekly class sessions
  const totalWeeklyMeetings = courses.reduce((sum, c) => sum + c.meetings.length, 0);

  // Standard UIU trimester duration: ~13-14 weeks of active classes
  const estimatedTotalSessions = totalWeeklyMeetings * 13;

  return {
    calendarTitle: calendar.title,
    classesBegin: classesBeginEvent ? classesBeginEvent.start : '2026-10-27',
    midtermPeriod: midtermEvent ? `${midtermEvent.start} to ${midtermEvent.end}` : '2026-12-05 to 2026-12-12',
    finalExamPeriod: finalExamEvent ? `${finalExamEvent.start} to ${finalExamEvent.end}` : '2027-02-06 to 2027-02-15',
    holidaysCount: holidays.length,
    holidaysList: holidays.map((h) => `${h.start}: ${h.text}`),
    onlineMakeupDaysCount: onlineMakeupDays.length,
    onlineMakeupList: onlineMakeupDays.map((m) => `${m.start}: ${m.text}`),
    totalWeeklyMeetings,
    estimatedTotalSessions,
  };
}
