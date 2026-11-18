/**
 * EZ_UIU - Official B.Sc. CSE Major / Specialization Tracks
 *
 * Source: BSCSE Curriculum, Summer 2026 onwards, section (G) Elective Courses.
 * https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/04/BSCSE_Curriculum__UIU_2026.pdf
 *
 * Official rules transcribed from the same document:
 *   - A student takes five elective courses (15 credits), taken in trimesters
 *     10, 11 and 12 as Elective I, II, III, IV and V.
 *   - "A specialization will be declared in one of the following areas if at
 *     least four courses are completed from the elective courses: AI & Data
 *     Science, Software Engineering, Network & Cybersecurity, Embedded System
 *     & Robotics, and Business System Engineering."
 *   - The Spring 2023 to Spring 2026 curriculum required at least three courses
 *     and offered seven areas: computational theory, communication, hardware,
 *     systems, software, data science, and Information and Communication
 *     Technology.
 *
 * Prerequisites come from the "Prerequisite Course" line under each elective in
 * the curriculum's Course Contents section.
 *
 * Exam slots are only published for the electives the department offered in a
 * given trimester, so an elective without a slot simply has not been scheduled
 * in the most recent Course Offerings notice yet.
 */

import {
  COURSE_CATALOG,
  GED_ELECTIVE_CODES,
  COURSE_EQUIVALENCE,
  normalizeCourseCode,
} from './courseCatalog';

/** 2026 curriculum: four courses from the chosen area earn the specialization. */
export const CURRENT_MAJOR_MIN_ELECTIVES = 4;

/** Spring 2023 - Spring 2026 curriculum: three courses earn the specialization. */
export const LEGACY_MAJOR_MIN_ELECTIVES = 3;

/** Number of electives a student must take overall, in any area. */
export const TOTAL_ELECTIVES_REQUIRED = 5;

/**
 * The trimesters the official course sequence opens the elective and general
 * education optional seats: Trimester 10 (Elective I, GED OPT1), Trimester 11
 * (Electives II-III, GED OPT2) and Trimester 12 (Electives IV-V, GED OPT3).
 */
export const ELECTIVE_TRIMESTERS = [10, 11, 12];
export const GED_TRIMESTERS = [10, 11, 12];

const withEquivalents = (codes) => {
  const map = new Map();
  for (const row of COURSE_EQUIVALENCE) {
    map.set(row.main, row.equivalent);
    map.set(row.equivalent, row.main);
  }
  return codes.map((code) => map.get(code)).filter(Boolean);
};

export const MAJOR_TRACKS = {
  'AI & Data Science': {
    id: 'aids',
    title: 'AI & Data Science',
    description:
      'Natural language processing, deep learning, generative AI, bioinformatics, image and speech processing, and large-scale data analytics.',
    minElectives: CURRENT_MAJOR_MIN_ELECTIVES,
    curriculum: 'Summer 2026 onwards',
    courses: [
      { course_code: 'CSE 4811', course_name: 'Natural Language Processing', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4813', course_name: 'Deep Learning', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4815', course_name: 'Large Language Model and Generative AI', credit: 3, prerequisites: ['CSE 4811'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4893', course_name: 'Introduction to Bioinformatics', credit: 3, prerequisites: ['CSE 4889'], exam_day: 'Day 4', exam_slot: 'T3' },
      { course_code: 'CSE 4883', course_name: 'Digital Image Processing', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4819', course_name: 'AI for Autonomous Systems', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4891', course_name: 'Data Mining', credit: 3, prerequisites: ['CSE 4889'], exam_day: 'Day 7', exam_slot: 'T1' },
      { course_code: 'CSE 4871', course_name: 'Data Analytics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4817', course_name: 'Big Data Analytics', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4825', course_name: 'Speech Processing and Recognition', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4949', course_name: 'IT Audit: Concepts and Practice', credit: 3, prerequisites: ['CSE 3421'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4599', course_name: 'Special Topics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
    ],
  },

  'Software Engineering': {
    id: 'se',
    title: 'Software Engineering',
    description:
      'Software architecture, mobile application development, testing and quality assurance, cloud computing, databases, compilers and human-computer interaction.',
    minElectives: CURRENT_MAJOR_MIN_ELECTIVES,
    curriculum: 'Summer 2026 onwards',
    courses: [
      { course_code: 'CSE 4435', course_name: 'Software Architecture', credit: 3, prerequisites: [], exam_day: 'Day 4', exam_slot: 'T2' },
      { course_code: 'CSE 4181', course_name: 'Mobile Application Development', credit: 3, prerequisites: ['CSE 1115', 'CSE 1116'], exam_day: 'Day 6', exam_slot: 'T3' },
      { course_code: 'CSE 4495', course_name: 'Software Testing and Quality Assurance', credit: 3, prerequisites: ['CSE 3421'], exam_day: 'Day 7', exam_slot: 'T3' },
      { course_code: 'CSE 4587', course_name: 'Cloud Computing', credit: 3, prerequisites: ['CSE 4509', 'CSE 3711'], exam_day: 'Day 3', exam_slot: 'T3' },
      { course_code: 'CSE 4567', course_name: 'Advanced Database Management Systems', credit: 3, prerequisites: ['CSE 3521'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4413', course_name: 'Virtual Reality/Augmented Reality System Design', credit: 3, prerequisites: ['CSE 3421'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4611', course_name: 'Compiler Design', credit: 3, prerequisites: ['CSE 2233'], exam_day: 'Day 4', exam_slot: 'T1' },
      { course_code: 'CSE 4123', course_name: 'Software and Application Security', credit: 3, prerequisites: ['CSE 4531'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4945', course_name: 'UI: Concepts and Design', credit: 3, prerequisites: [], exam_day: 'Day 1', exam_slot: 'T2' },
      { course_code: 'CSE 4871', course_name: 'Data Analytics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4299', course_name: 'Special Topics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4133', course_name: 'Business Intelligence', credit: 3, prerequisites: ['CSE 3411'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4451', course_name: 'Human Computer Interaction', credit: 3, prerequisites: ['CSE 3411'], exam_day: 'Day 3', exam_slot: 'T1' },
      { course_code: 'CSE 4485', course_name: 'Game Design and Development', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4519', course_name: 'Distributed Systems', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4523', course_name: 'Simulation and Modeling', credit: 3, prerequisites: ['MATH 2205'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4621', course_name: 'Computer Graphics', credit: 3, prerequisites: ['MATH 2183', 'MATH 2201'], exam_day: 'Day 2', exam_slot: 'T1' },
      { course_code: 'CSE 4601', course_name: 'Mathematical Analysis for Computer Science', credit: 3, prerequisites: ['MATH 2205'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4633', course_name: 'Basic Graph Theory', credit: 3, prerequisites: ['CSE 2213'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4655', course_name: 'Algorithm Engineering', credit: 3, prerequisites: ['CSE 2217'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4547', course_name: 'Multimedia Systems Design', credit: 3, prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4613', course_name: 'Computational Geometry', credit: 3, prerequisites: ['MATH 2201'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4949', course_name: 'IT Audit: Concepts and Practice', credit: 3, prerequisites: ['CSE 3421'], exam_day: null, exam_slot: null },
    ],
  },

  'Network & Cybersecurity': {
    id: 'ncs',
    title: 'Network & Cybersecurity',
    description:
      'Security monitoring, wireless and cellular communication, ethical hacking and network defense, cloud and IoT security, cryptography, forensics and IT audit.',
    minElectives: CURRENT_MAJOR_MIN_ELECTIVES,
    curriculum: 'Summer 2026 onwards',
    courses: [
      { course_code: 'CSE 4121', course_name: 'Security Monitoring', credit: 3, prerequisites: ['CSE 4531'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4759', course_name: 'Wireless and Cellular Communication', credit: 3, prerequisites: ['CSE 3715'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4123', course_name: 'Software and Application Security', credit: 3, prerequisites: ['CSE 4531'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4125', course_name: 'Ethical Hacking and Network Defense', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4127', course_name: 'Cloud Security', credit: 3, prerequisites: ['CSE 4531'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4129', course_name: 'Digital Forensics', credit: 3, prerequisites: ['CSE 4531'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4131', course_name: 'Internet of Things (IoT) Security', credit: 3, prerequisites: ['CSE 4531'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 3715', course_name: 'Data Communication', credit: 3, prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4199', course_name: 'Special Topics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4793', course_name: 'Advanced Network Services and Management', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4783', course_name: 'Cryptography', credit: 3, prerequisites: ['CSE 4531'], exam_day: 'Day 6', exam_slot: 'T2' },
      { course_code: 'CSE 4777', course_name: 'Network Security', credit: 3, prerequisites: ['CSE 4531'], exam_day: 'Day 3', exam_slot: 'T3' },
      { course_code: 'CSE 4943', course_name: 'Web Application Security', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4949', course_name: 'IT Audit: Concepts and Practice', credit: 3, prerequisites: ['CSE 3421'], exam_day: null, exam_slot: null },
    ],
  },

  'Embedded System & Robotics': {
    id: 'esr',
    title: 'Embedded System & Robotics',
    description:
      'Real-time embedded systems, robotics, VLSI design, Internet of Things, digital system design, interfacing, deep learning and autonomous systems.',
    minElectives: CURRENT_MAJOR_MIN_ELECTIVES,
    curriculum: 'Summer 2026 onwards',
    courses: [
      { course_code: 'CSE 4379', course_name: 'Real-time Embedded Systems', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4337', course_name: 'Robotics', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4399', course_name: 'Special Topics on Embedded System and Robotics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4327', course_name: 'VLSI Design', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4853', course_name: 'Internet of Things (IoT)', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4819', course_name: 'AI for Autonomous Systems', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4813', course_name: 'Deep Learning', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4815', course_name: 'Large Language Model and Generative AI', credit: 3, prerequisites: ['CSE 4811'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4329', course_name: 'Digital System Design', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4397', course_name: 'Interfacing', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
    ],
  },

  'Business System Engineering': {
    id: 'bse',
    title: 'Business System Engineering',
    description:
      'Business intelligence, data mining, data analytics, data-driven decision making, big data analytics, digital marketing, enterprise systems and electronic commerce.',
    minElectives: CURRENT_MAJOR_MIN_ELECTIVES,
    curriculum: 'Summer 2026 onwards',
    courses: [
      { course_code: 'CSE 4133', course_name: 'Business Intelligence', credit: 3, prerequisites: ['CSE 3411'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4891', course_name: 'Data Mining', credit: 3, prerequisites: ['CSE 4889'], exam_day: 'Day 7', exam_slot: 'T1' },
      { course_code: 'CSE 4871', course_name: 'Data Analytics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4823', course_name: 'Data Driven Decision Making', credit: 3, prerequisites: ['CSE 4133'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4817', course_name: 'Big Data Analytics', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4821', course_name: 'Digital Marketing', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4945', course_name: 'UI: Concepts and Design', credit: 3, prerequisites: [], exam_day: 'Day 1', exam_slot: 'T2' },
      { course_code: 'CSE 4451', course_name: 'Human Computer Interaction', credit: 3, prerequisites: ['CSE 3411'], exam_day: 'Day 3', exam_slot: 'T1' },
      { course_code: 'CSE 4941', course_name: 'Enterprise Systems: Concepts and Practice', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4765', course_name: 'Electronic Commerce', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4949', course_name: 'IT Audit: Concepts and Practice', credit: 3, prerequisites: ['CSE 3421'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4499', course_name: 'Special Topics', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
    ],
  },
};

/**
 * Tracks from the Spring 2023 - Spring 2026 curriculum. A student of those
 * batches needs three courses from one of these areas to declare a
 * specialization, and the course lists are different from the 2026 ones.
 */
export const LEGACY_MAJOR_TRACKS = {
  'Computational Theory': {
    id: 'ct',
    title: 'Computational Theory',
    description:
      'Mathematical analysis, graph theory, algorithm engineering, compiler design, computational geometry and computer graphics.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 4601', course_name: 'Mathematical Analysis for Computer Science', credit: 3, prerequisites: ['MATH 2205'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4633', course_name: 'Basic Graph Theory', credit: 3, prerequisites: ['CSE 2213'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4655', course_name: 'Algorithm Engineering', credit: 3, prerequisites: ['CSE 2217'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4611', course_name: 'Compiler Design', credit: 3, prerequisites: ['CSE 2233'], exam_day: 'Day 4', exam_slot: 'T1' },
      { course_code: 'CSE 4613', course_name: 'Computational Geometry', credit: 3, prerequisites: ['MATH 2201'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4621', course_name: 'Computer Graphics', credit: 3, prerequisites: ['MATH 2183', 'MATH 2201'], exam_day: 'Day 2', exam_slot: 'T1' },
    ],
  },

  'Network and Communications': {
    id: 'nc',
    title: 'Network and Communications',
    description:
      'Data communication, wireless and cellular communication, advanced network services and management, cryptography, network security and electronic business.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 3715', course_name: 'Data Communication', credit: 3, prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4759', course_name: 'Wireless and Cellular Communication', credit: 3, prerequisites: ['CSE 3715'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4793', course_name: 'Advanced Network Services and Management', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4783', course_name: 'Cryptography', credit: 3, prerequisites: ['CSE 4531'], exam_day: 'Day 6', exam_slot: 'T2' },
      { course_code: 'CSE 4777', course_name: 'Networks Security', credit: 3, prerequisites: ['CSE 4531'], exam_day: 'Day 3', exam_slot: 'T3' },
      { course_code: 'CSE 4763', course_name: 'Electronic Business', credit: 3, prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
    ],
  },

  'Systems': {
    id: 'sys',
    title: 'Systems',
    description:
      'Multimedia systems design, distributed systems, simulation and modeling, computer graphics, cloud computing and advanced database management systems.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 4547', course_name: 'Multimedia Systems Design', credit: 3, prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4519', course_name: 'Distributed Systems', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4523', course_name: 'Simulation and Modeling', credit: 3, prerequisites: ['MATH 2205'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4621', course_name: 'Computer Graphics', credit: 3, prerequisites: ['MATH 2183', 'MATH 2201'], exam_day: 'Day 2', exam_slot: 'T1' },
      { course_code: 'CSE 4587', course_name: 'Cloud Computing', credit: 3, prerequisites: ['CSE 4509', 'CSE 3711'], exam_day: 'Day 3', exam_slot: 'T3' },
      { course_code: 'CSE 4567', course_name: 'Advanced Database Management Systems', credit: 3, prerequisites: ['CSE 3521'], exam_day: null, exam_slot: null },
    ],
  },

  'Data Science': {
    id: 'ds',
    title: 'Data Science',
    description:
      'Machine learning, data mining, bioinformatics, digital image processing and big data analytics.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 4889', course_name: 'Machine Learning', credit: 3, prerequisites: ['CSE 3811'], exam_day: 'Day 1', exam_slot: 'T3' },
      { course_code: 'CSE 4891', course_name: 'Data Mining', credit: 3, prerequisites: ['CSE 4889'], exam_day: 'Day 7', exam_slot: 'T1' },
      { course_code: 'CSE 4893', course_name: 'Introduction to Bioinformatics', credit: 3, prerequisites: ['CSE 4889'], exam_day: 'Day 4', exam_slot: 'T3' },
      { course_code: 'CSE 4883', course_name: 'Digital Image Processing', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4817', course_name: 'Big Data Analytics', credit: 3, prerequisites: ['CSE 4889'], exam_day: null, exam_slot: null },
    ],
  },

  'Software Engineering': {
    id: 'se',
    title: 'Software Engineering',
    description:
      'Human computer interaction, software architecture, web and mobile application development, testing, and game design.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 4451', course_name: 'Human Computer Interaction', credit: 3, prerequisites: ['CSE 3411'], exam_day: 'Day 3', exam_slot: 'T1' },
      { course_code: 'CSE 4435', course_name: 'Software Architecture', credit: 3, prerequisites: [], exam_day: 'Day 4', exam_slot: 'T2' },
      { course_code: 'CSE 4165', course_name: 'Web Programming', credit: 3, prerequisites: ['CSE 1115', 'CSE 1116'], exam_day: 'Day 7', exam_slot: 'T1' },
      { course_code: 'CSE 4181', course_name: 'Mobile Application Development', credit: 3, prerequisites: ['CSE 1115', 'CSE 1116'], exam_day: 'Day 6', exam_slot: 'T3' },
      { course_code: 'CSE 4495', course_name: 'Software Testing and Quality Assurance', credit: 3, prerequisites: ['CSE 3421'], exam_day: 'Day 7', exam_slot: 'T3' },
      { course_code: 'CSE 4485', course_name: 'Game Design and Development', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
    ],
  },

  'Hardware': {
    id: 'hw',
    title: 'Hardware',
    description:
      'Digital system design, real-time embedded systems, VLSI design, robotics and interfacing.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 4329', course_name: 'Digital System Design', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4379', course_name: 'Real-time Embedded Systems', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4327', course_name: 'VLSI Design', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4337', course_name: 'Robotics', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4397', course_name: 'Interfacing', credit: 3, prerequisites: ['CSE 4325'], exam_day: null, exam_slot: null },
    ],
  },

  'Information and Communication Technology': {
    id: 'ict',
    title: 'Information and Communication Technology',
    description:
      'Enterprise systems, web application security, electronic business, web and mobile development, UI design, IT audit and cloud computing.',
    minElectives: LEGACY_MAJOR_MIN_ELECTIVES,
    curriculum: 'Spring 2023 - Spring 2026',
    courses: [
      { course_code: 'CSE 4941', course_name: 'Enterprise Systems: Concepts and Practice', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4943', course_name: 'Web Application Security', credit: 3, prerequisites: [], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4763', course_name: 'Electronic Business', credit: 3, prerequisites: ['CSE 3711'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4165', course_name: 'Web Programming', credit: 3, prerequisites: ['CSE 1115', 'CSE 1116'], exam_day: 'Day 7', exam_slot: 'T1' },
      { course_code: 'CSE 4181', course_name: 'Mobile Application Development', credit: 3, prerequisites: ['CSE 1115', 'CSE 1116'], exam_day: 'Day 6', exam_slot: 'T3' },
      { course_code: 'CSE 4945', course_name: 'UI: Concepts and Design', credit: 3, prerequisites: [], exam_day: 'Day 1', exam_slot: 'T2' },
      { course_code: 'CSE 4949', course_name: 'IT Audit: Concepts and Practice', credit: 3, prerequisites: ['CSE 3421'], exam_day: null, exam_slot: null },
      { course_code: 'CSE 4587', course_name: 'Cloud Computing', credit: 3, prerequisites: ['CSE 4509', 'CSE 3711'], exam_day: 'Day 3', exam_slot: 'T3' },
      { course_code: 'CSE 4495', course_name: 'Software Testing and Quality Assurance', credit: 3, prerequisites: ['CSE 3421'], exam_day: 'Day 7', exam_slot: 'T3' },
    ],
  },
};

/**
 * Industry Internship (CSE 3542) is listed as an elective in every major track
 * of the 2026 curriculum. The curriculum states its prerequisite as
 * "Completion of all credits except CSE 3542".
 */
export const INDUSTRY_INTERNSHIP = {
  course_code: 'CSE 3542',
  course_name: 'Industry Internship',
  credit: 3,
  requiresAllOtherCredits: true,
  note: 'Prerequisite Course: Completion of all credits except CSE 3542.',
};

/** Every elective code that appears in any track, de-duplicated. */
export const ALL_ELECTIVE_CODES = Array.from(
  new Set(
    Object.values(MAJOR_TRACKS)
      .flatMap((t) => t.courses)
      .map((c) => c.course_code)
  )
);

/** Equivalent-code lookup, so "CSE 4763" also resolves to "CSE 4765". */
export const EQUIVALENT_CODE_MAP = withEquivalents(
  Array.from(
    new Set([
      ...ALL_ELECTIVE_CODES,
      ...Object.values(LEGACY_MAJOR_TRACKS)
        .flatMap((t) => t.courses)
        .map((c) => c.course_code),
    ])
  )
);

/**
 * The single course registry for the whole app.
 *
 * It merges the official curriculum sequence, the elective courses of every
 * specialisation track, and the general education optionals into one map
 * keyed by normalised course code. Every module - the advisor tools, the
 * advisor engine, the UI - reads from this one registry, so a course can never
 * carry two different categories in two different places.
 *
 * `group` keeps the curriculum's own section name. `category` is the coarse
 * label the advisor reasons over.
 */
export const COURSE_CATEGORY = {
  CORE: 'Core',
  ELECTIVE: 'Elective',
  GED: 'GED',
  PROJECT: 'Project',
};

export const COURSE_REGISTRY = (() => {
  const map = new Map();

  const put = (course, { category, group, trimester = null, prerequisites }) => {
    const code = normalizeCourseCode(course.course_code);
    if (!code) return;

    const existing = map.get(code);
    // The curriculum sequence is authoritative. A course that is also listed
    // as an elective in a track (CSE 4889 Machine Learning, CSE 4165 Web
    // Programming) keeps its curriculum category, credit and prerequisites,
    // so it is never planned twice or counted as one of the five electives.
    const alreadyInCurriculum = existing?.inCurriculum === true;

    map.set(code, {
      ...existing,
      ...course,
      course_code: code,
      course_name: course.course_name || existing?.course_name || code,
      credit: course.credit ?? existing?.credit ?? 3,
      group: group ?? existing?.group ?? null,
      category: alreadyInCurriculum
        ? existing.category
        : (category ?? existing?.category ?? COURSE_CATEGORY.CORE),
      inCurriculum: alreadyInCurriculum,
      trimester: trimester ?? existing?.trimester ?? null,
      prerequisites:
        (alreadyInCurriculum && existing.prerequisites?.length
          ? existing.prerequisites
          : prerequisites) ?? existing?.prerequisites ?? [],
      exam_day: course.exam_day ?? existing?.exam_day ?? null,
      exam_slot: course.exam_slot ?? existing?.exam_slot ?? null,
    });
  };

  // 1. The official curriculum sequence. A course that also appears as an
  //    elective keeps the curriculum's own credit and prerequisites.
  for (const course of COURSE_CATALOG) {
    put(course, {
      category:
        course.group === 'Final Year Design Project'
          ? COURSE_CATEGORY.PROJECT
          : COURSE_CATEGORY.CORE,
      group: course.group,
      trimester: course.trimester,
      prerequisites: course.prerequisites,
    });
    map.get(normalizeCourseCode(course.course_code)).inCurriculum = true;
  }

  // 2. The general education optionals.
  for (const course of GED_ELECTIVE_CODES) {
    put(course, {
      category: COURSE_CATEGORY.GED,
      group: 'General Education Optional',
      trimester: null,
      prerequisites: [],
    });
  }

  // 3. The electives of the current specialisation areas.
  for (const track of Object.values(MAJOR_TRACKS)) {
    for (const course of track.courses) {
      put(course, {
        category: COURSE_CATEGORY.ELECTIVE,
        group: 'Elective',
        trimester: null,
        prerequisites: course.prerequisites,
      });
    }
  }

  // 4. The electives of the previous curriculum's areas, for the batches that
  //    still declare a specialisation under the old rules.
  for (const track of Object.values(LEGACY_MAJOR_TRACKS)) {
    for (const course of track.courses) {
      put(course, {
        category: COURSE_CATEGORY.ELECTIVE,
        group: 'Elective',
        trimester: null,
        prerequisites: course.prerequisites,
      });
    }
  }

  // 5. The industry internship, an elective in every area of the curriculum.
  put(INDUSTRY_INTERNSHIP, {
    category: COURSE_CATEGORY.ELECTIVE,
    group: 'Elective',
    trimester: null,
    prerequisites: [],
  });

  return map;
})();

/**
 * Look up a course by code, in any spelling.
 */
export function lookupCourse(code) {
  return COURSE_REGISTRY.get(normalizeCourseCode(code)) || null;
}

/**
 * Every course the advisor knows about.
 */
export const ALL_COURSES = Array.from(COURSE_REGISTRY.values());

/** Course lookup by normalised code. */
export const ADVISOR_COURSE_MAP = Object.fromEntries(COURSE_REGISTRY);

export default MAJOR_TRACKS;
