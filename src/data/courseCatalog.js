/**
 * EZ_UIU - Official B.Sc. CSE Course Catalog
 *
 * Every entry is transcribed from an official UIU Department of CSE source:
 *
 *   CURRICULUM  BSCSE Curriculum, Summer 2026 onwards (47 pages, March 2026)
 *               https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf
 *   OFFERINGS   Course Offerings For B.Sc. in CSE / B.Sc. in Data Science, Spring 2026
 *               https://cse.uiu.ac.bd/notice/course-offerings-bscse-fall-26/
 *
 * Prerequisites come from the official Course Sequence table in the curriculum.
 * Exam day and exam slot come from the official Course Offerings notice, because
 * the department republishes them every trimester.
 *
 * Field meanings
 *   trimester        1-12, the official course sequence position
 *   group            curriculum group the course belongs to (credit accounting)
 *   credit           official credit hours (UIU uses whole and half credits)
 *   prerequisites    official prerequisite course codes
 *   exam_day/exam_slot  exam timetable from the Course Offerings notice
 */

export const CURRICULUM_SOURCE = {
  curriculumUrl:
    'https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf',
  curriculumTitle: 'BSCSE Curriculum, Summer 2026 onwards (updated March 2026)',
  offeringsUrl: 'https://cse.uiu.ac.bd/notice/course-offerings-bscse-fall-26/',
  offeringsTitle: 'Course Offerings For B.Sc. in CSE / B.Sc. in Data Science, Spring 2026',
  offeringsTerm: 'Spring 2026',
};

/**
 * Normalise a course code: "CSE1115" / "cse 1115" -> "CSE 1115".
 *
 * Every module keys its course maps with this, so a transcript entry and a
 * curriculum entry always land on the same record.
 */
export function normalizeCourseCode(code) {
  if (!code) return '';
  const clean = String(code).toUpperCase().trim();
  const match = clean.match(/^([A-Z]{2,4})\s*(\d{4}[A-Z]?)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return clean;
}

/**
 * Official course sequence (curriculum PDF) + exam slots (course offerings notice).
 * `X` in the curriculum prerequisite column means "no prerequisite".
 */
export const COURSE_CATALOG = [
  // ---- Trimester 1 : 9.0 credits ----
  { trimester: 1, course_code: 'ENG 1011', course_name: 'English I', credit: 3, group: 'Language', prerequisites: [], exam_day: 'Day 1', exam_slot: 'T1' },
  { trimester: 1, course_code: 'BDS 1201', course_name: 'History of the Emergence of Bangladesh', credit: 2, group: 'General Education', prerequisites: [], exam_day: 'Day 6', exam_slot: 'T1' },
  { trimester: 1, course_code: 'CSE 1110', course_name: 'Introduction to Computer Systems', credit: 1, group: 'Core', prerequisites: [], exam_day: null, exam_slot: null },
  { trimester: 1, course_code: 'MATH 1151', course_name: 'Fundamental Calculus', credit: 3, group: 'Mathematics', prerequisites: [], exam_day: 'Day 2', exam_slot: 'T2' },

  // ---- Trimester 2 : 10.0 credits ----
  { trimester: 2, course_code: 'ENG 1013', course_name: 'English II', credit: 3, group: 'Language', prerequisites: ['ENG 1011'], exam_day: 'Day 1', exam_slot: 'T2' },
  { trimester: 2, course_code: 'CSE 1111', course_name: 'Structured Programming Language', credit: 3, group: 'Core', prerequisites: ['CSE 1110'], exam_day: 'Day 4', exam_slot: 'T2' },
  { trimester: 2, course_code: 'CSE 1112', course_name: 'Structured Programming Language Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 1110'], exam_day: null, exam_slot: null },
  { trimester: 2, course_code: 'CSE 2213', course_name: 'Discrete Mathematics', credit: 3, group: 'Core', prerequisites: [], exam_day: 'Day 3', exam_slot: 'T2' },

  // ---- Trimester 3 : 11.0 credits ----
  { trimester: 3, course_code: 'MATH 2183', course_name: 'Calculus and Linear Algebra', credit: 3, group: 'Mathematics', prerequisites: ['MATH 1151'], exam_day: 'Day 1', exam_slot: 'T3' },
  { trimester: 3, course_code: 'PHY 2105', course_name: 'Physics', credit: 3, group: 'Basic Sciences', prerequisites: [], exam_day: 'Day 7', exam_slot: 'T3' },
  { trimester: 3, course_code: 'PHY 2106', course_name: 'Physics Laboratory', credit: 1, group: 'Basic Sciences', prerequisites: ['PHY 2105'], exam_day: null, exam_slot: null },
  { trimester: 3, course_code: 'CSE 2215', course_name: 'Data Structure and Algorithms I', credit: 3, group: 'Core', prerequisites: ['CSE 1111'], exam_day: 'Day 4', exam_slot: 'T2' },
  { trimester: 3, course_code: 'CSE 2216', course_name: 'Data Structure and Algorithms I Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 1112'], exam_day: null, exam_slot: null },

  // ---- Trimester 4 : 11.0 credits ----
  { trimester: 4, course_code: 'MATH 2201', course_name: 'Coordinate Geometry and Vector Analysis', credit: 3, group: 'Mathematics', prerequisites: ['MATH 1151'], exam_day: 'Day 5', exam_slot: 'T1' },
  { trimester: 4, course_code: 'CSE 1325', course_name: 'Digital Logic Design', credit: 3, group: 'Core', prerequisites: [], exam_day: 'Day 3', exam_slot: 'T3' },
  { trimester: 4, course_code: 'CSE 1326', course_name: 'Digital Logic Design Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 1325'], exam_day: null, exam_slot: null },
  { trimester: 4, course_code: 'CSE 1115', course_name: 'Object Oriented Programming', credit: 3, group: 'Core', prerequisites: ['CSE 2215'], exam_day: 'Day 6', exam_slot: 'T2' },
  { trimester: 4, course_code: 'CSE 1116', course_name: 'Object Oriented Programming Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 2216'], exam_day: null, exam_slot: null },

  // ---- Trimester 5 : 13.0 credits ----
  { trimester: 5, course_code: 'MATH 2205', course_name: 'Probability and Statistics', credit: 3, group: 'Mathematics', prerequisites: ['MATH 1151'], exam_day: 'Day 2', exam_slot: 'T3' },
  { trimester: 5, course_code: 'SOC 2101', course_name: 'Society, Environment and Engineering Ethics', credit: 3, group: 'General Education', prerequisites: [], exam_day: 'Day 1', exam_slot: 'T3' },
  { trimester: 5, course_code: 'CSE 2217', course_name: 'Data Structure and Algorithms II', credit: 3, group: 'Core', prerequisites: ['CSE 2215'], exam_day: 'Day 5', exam_slot: 'T2' },
  { trimester: 5, course_code: 'CSE 2218', course_name: 'Data Structure and Algorithms II Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 2216'], exam_day: null, exam_slot: null },
  { trimester: 5, course_code: 'EEE 2113', course_name: 'Electrical Circuits', credit: 3, group: 'Other Engineering', prerequisites: [], exam_day: 'Day 6', exam_slot: 'T3' },

  // ---- Trimester 6 : 11.0 credits ----
  { trimester: 6, course_code: 'CSE 3521', course_name: 'Database Management Systems', credit: 3, group: 'Core', prerequisites: ['CSE 2215'], exam_day: 'Day 2', exam_slot: 'T1' },
  { trimester: 6, course_code: 'CSE 3522', course_name: 'Database Management Systems Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 2216'], exam_day: null, exam_slot: null },
  { trimester: 6, course_code: 'EEE 2123', course_name: 'Electronics', credit: 3, group: 'Other Engineering', prerequisites: ['EEE 2113'], exam_day: 'Day 6', exam_slot: 'T3' },
  { trimester: 6, course_code: 'EEE 2124', course_name: 'Electronics Laboratory', credit: 1, group: 'Other Engineering', prerequisites: ['EEE 2123'], exam_day: null, exam_slot: null },
  { trimester: 6, course_code: 'CSE 4165', course_name: 'Web Programming', credit: 3, group: 'Core', prerequisites: ['CSE 1115', 'CSE 1116'], exam_day: 'Day 7', exam_slot: 'T1' },

  // ---- Trimester 7 : 11.0 credits ----
  { trimester: 7, course_code: 'CSE 3313', course_name: 'Computer Architecture', credit: 3, group: 'Core', prerequisites: ['CSE 1325'], exam_day: 'Day 1', exam_slot: 'T3' },
  { trimester: 7, course_code: 'CSE 2118', course_name: 'Advanced Object Oriented Programming Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 1116'], exam_day: null, exam_slot: null },
  { trimester: 7, course_code: 'BIO 3105', course_name: 'Biology for Engineers', credit: 3, group: 'Basic Sciences', prerequisites: [], exam_day: 'Day 3', exam_slot: 'T3' },
  { trimester: 7, course_code: 'CSE 3411', course_name: 'System Analysis and Design', credit: 3, group: 'Core', prerequisites: ['CSE 3521'], exam_day: 'Day 5', exam_slot: 'T1' },
  { trimester: 7, course_code: 'CSE 3412', course_name: 'System Analysis and Design Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 3522'], exam_day: null, exam_slot: null },

  // ---- Trimester 8 : 12.0 credits ----
  { trimester: 8, course_code: 'CSE 4325', course_name: 'Microprocessors and Microcontrollers', credit: 3, group: 'Core', prerequisites: ['CSE 3313'], exam_day: 'Day 2', exam_slot: 'T2' },
  { trimester: 8, course_code: 'CSE 4326', course_name: 'Microprocessors and Microcontrollers Laboratory', credit: 1, group: 'Core', prerequisites: ['EEE 2124'], exam_day: null, exam_slot: null },
  { trimester: 8, course_code: 'CSE 3421', course_name: 'Software Engineering', credit: 3, group: 'Core', prerequisites: ['CSE 3411'], exam_day: 'Day 5', exam_slot: 'T3' },
  { trimester: 8, course_code: 'CSE 3422', course_name: 'Software Engineering Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 3412'], exam_day: null, exam_slot: null },
  { trimester: 8, course_code: 'CSE 3811', course_name: 'Artificial Intelligence', credit: 3, group: 'Core', prerequisites: ['MATH 2205', 'CSE 2217'], exam_day: 'Day 3', exam_slot: 'T1' },
  { trimester: 8, course_code: 'CSE 3812', course_name: 'Artificial Intelligence Laboratory', credit: 1, group: 'Core', prerequisites: ['MATH 2205', 'CSE 2218'], exam_day: null, exam_slot: null },

  // ---- Trimester 9 : 13.0 credits ----
  { trimester: 9, course_code: 'CSE 2233', course_name: 'Theory of Computation', credit: 3, group: 'Core', prerequisites: [], exam_day: 'Day 7', exam_slot: 'T2' },
  { trimester: 9, course_code: 'PMG 4101', course_name: 'Project Management', credit: 3, group: 'General Education', prerequisites: ['CSE 3411'], exam_day: 'Day 3', exam_slot: 'T2' },
  { trimester: 9, course_code: 'CSE 3711', course_name: 'Computer Networks', credit: 3, group: 'Core', prerequisites: ['CSE 2217'], exam_day: 'Day 4', exam_slot: 'T3' },
  { trimester: 9, course_code: 'CSE 3712', course_name: 'Computer Networks Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
  { trimester: 9, course_code: 'CSE 4889', course_name: 'Machine Learning', credit: 3, group: 'Core', prerequisites: ['CSE 3811', 'CSE 3812', 'MATH 2183'], exam_day: 'Day 1', exam_slot: 'T3' },

  // ---- Trimester 10 : 12.0 credits ----
  { trimester: 10, course_code: 'CSE 4000A', course_name: 'Final Year Design Project - I', credit: 2, group: 'Final Year Design Project', prerequisites: [], exam_day: null, exam_slot: null },
  { trimester: 10, course_code: 'CSE 4509', course_name: 'Operating Systems', credit: 3, group: 'Core', prerequisites: ['CSE 2217', 'CSE 3313'], exam_day: 'Day 1', exam_slot: 'T1' },
  { trimester: 10, course_code: 'CSE 4510', course_name: 'Operating Systems Laboratory', credit: 1, group: 'Core', prerequisites: ['CSE 2218'], exam_day: null, exam_slot: null },
  { trimester: 12, course_code: 'EEE 4261', course_name: 'Green Computing', credit: 3, group: 'Other Engineering', prerequisites: [], exam_day: 'Day 5', exam_slot: 'T1' },

  // ---- Trimester 11 : 14.0 credits ----
  { trimester: 11, course_code: 'CSE 4000B', course_name: 'Final Year Design Project - II', credit: 2, group: 'Final Year Design Project', prerequisites: ['CSE 4000A'], exam_day: null, exam_slot: null },
  { trimester: 11, course_code: 'CSE 4531', course_name: 'Computer Security', credit: 3, group: 'Core', prerequisites: ['CSE 3711', 'CSE 4509'], exam_day: 'Day 6', exam_slot: 'T3' },

  // ---- Trimester 12 : 14.0 credits ----
  { trimester: 12, course_code: 'CSE 4000C', course_name: 'Final Year Design Project - III', credit: 2, group: 'Final Year Design Project', prerequisites: ['CSE 4000A', 'CSE 4000B'], exam_day: null, exam_slot: null },
];

/**
 * Official credit distribution across the twelve trimesters (curriculum PDF).
 */
export const TRIMESTER_CREDIT_PLAN = [
  { trimester: 1, credits: 9 },
  { trimester: 2, credits: 10 },
  { trimester: 3, credits: 11 },
  { trimester: 4, credits: 11 },
  { trimester: 5, credits: 13 },
  { trimester: 6, credits: 11 },
  { trimester: 7, credits: 11 },
  { trimester: 8, credits: 12 },
  { trimester: 9, credits: 13 },
  { trimester: 10, credits: 12 },
  { trimester: 11, credits: 14 },
  { trimester: 12, credits: 14 },
];

/**
 * Official General Education Optional list. A student picks any three (9 credits).
 * GED 4003 Technology Entrepreneurship is the current code; TEC 2499 is its
 * official equivalent (see the course equivalence table).
 */
export const GED_ELECTIVE_CODES = [
  { course_code: 'ECO 4101', course_name: 'Economics', credit: 3 },
  { course_code: 'SOC 4101', course_name: 'Introduction to Sociology', credit: 3 },
  { course_code: 'ACT 2111', course_name: 'Financial and Managerial Accounting', credit: 3 },
  { course_code: 'IPE 3401', course_name: 'Industrial and Operational Management', credit: 3 },
  { course_code: 'GED 4003', course_name: 'Technology Entrepreneurship', credit: 3 },
  { course_code: 'PSY 2101', course_name: 'Psychology', credit: 3 },
  { course_code: 'BDS 2201', course_name: 'Bangladesh Studies', credit: 3 },
  { course_code: 'BAN 2501', course_name: 'Bangla', credit: 3 },
  { course_code: 'SOC 4301', course_name: 'Introduction to Anthropology', credit: 3 },
  { course_code: 'FLN 1101', course_name: 'Introduction to a Foreign Language', credit: 3 },
  { course_code: 'SWL 4101', course_name: 'Software and Law', credit: 3 },
  { course_code: 'BHV 2101', course_name: 'Introduction to Behavioral Science', credit: 3 },
  { course_code: 'URC 1101', course_name: 'Life Skill for Success', credit: 3 },
  { course_code: 'TEC 2499', course_name: 'Technology Entrepreneurship', credit: 3, equivalentTo: 'GED 4003' },
];

/**
 * Official course equivalence table (curriculum PDF). Used for credit transfer
 * and for the FYDP "equivalent course" rule.
 */
export const COURSE_EQUIVALENCE = [
  { main: 'CSE 4853', mainTitle: 'Internet of Things', equivalent: 'EEE 4523', equivalentTitle: 'Internet of Things - I' },
  { main: 'CSE 4379', mainTitle: 'Real-time Embedded Systems', equivalent: 'EEE 4513', equivalentTitle: 'Real Time Embedded System Design' },
  { main: 'CSE 4337', mainTitle: 'Robotics', equivalent: 'EEE 4515', equivalentTitle: 'Industrial Automation and Robotics' },
  { main: 'CSE 4327', mainTitle: 'VLSI Design', equivalent: 'EEE 4121', equivalentTitle: 'VLSI Design' },
  { main: 'CSE 4399', mainTitle: 'Special Topics on Embedded System and Robotics', equivalent: 'EEE 4519', equivalentTitle: 'Special Topics on Embedded System and Robotics' },
  { main: 'CSE 4821', mainTitle: 'Digital Marketing', equivalent: 'MKT 4313', equivalentTitle: 'Digital Marketing' },
  { main: 'CSE 4765', mainTitle: 'Electronic Commerce', equivalent: 'CSE 4763', equivalentTitle: 'Electronic Business' },
  { main: 'GED 4003', mainTitle: 'Technology Entrepreneurship', equivalent: 'TEC 2499', equivalentTitle: 'Technology Entrepreneurship' },
];

export default COURSE_CATALOG;
