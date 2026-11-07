import { COURSE_CATALOG } from './courseCatalog';

export const MAJOR_TRACKS = {
  'Software Engineering': {
    id: 'se',
    title: 'Software Engineering',
    description: 'Modern full-stack, mobile, cloud architectures, and scalable software systems.',
    minElectives: 4, // 4 courses for Summer 2026+ curriculum; 3 courses for legacy batches
    courses: [
      {
        course_code: 'CSE 4451',
        course_name: 'Human Computer Interaction',
        credit: 3,
        prerequisites: ['CSE 3411'],
        difficulty: 'Easy',
        exam_day: 'Day 2',
        exam_slot: 'T2',
      },
      {
        course_code: 'CSE 4435',
        course_name: 'Software Architecture and Design Patterns',
        credit: 3,
        prerequisites: ['CSE 3411'],
        difficulty: 'Medium',
        exam_day: 'Day 5',
        exam_slot: 'T1',
      },
      {
        course_code: 'CSE 4181',
        course_name: 'Mobile Application Development',
        credit: 3,
        prerequisites: ['CSE 3411'],
        difficulty: 'Medium',
        exam_day: 'Day 3',
        exam_slot: 'T2',
      },
      {
        course_code: 'CSE 4495',
        course_name: 'Software Quality Assurance and Testing',
        credit: 3,
        prerequisites: ['CSE 3411'],
        difficulty: 'Medium',
        exam_day: 'Day 6',
        exam_slot: 'T3',
      },
      {
        course_code: 'CSE 4945',
        course_name: 'UI: Concepts and Design',
        credit: 3,
        prerequisites: ['CSE 3411'],
        difficulty: 'Easy',
        exam_day: 'Day 4',
        exam_slot: 'T1',
      },
    ],
  },
  'Data Science': {
    id: 'ds',
    title: 'AI & Data Science',
    description: 'Statistical modeling, deep learning, big data mining, and predictive intelligence pipelines.',
    minElectives: 4,
    courses: [
      {
        course_code: 'CSE 4889',
        course_name: 'Machine Learning',
        credit: 3,
        prerequisites: ['CSE 3811'],
        difficulty: 'Hard',
        exam_day: 'Day 1',
        exam_slot: 'T3',
      },
      {
        course_code: 'CSE 4891',
        course_name: 'Data Mining',
        credit: 3,
        prerequisites: ['CSE 3811'],
        difficulty: 'Medium',
        exam_day: 'Day 7',
        exam_slot: 'T1',
      },
      {
        course_code: 'CSE 4817',
        course_name: 'Big Data Analytics',
        credit: 3,
        prerequisites: ['CSE 3521'],
        difficulty: 'Hard',
        exam_day: 'Day 5',
        exam_slot: 'T2',
      },
      {
        course_code: 'CSE 4893',
        course_name: 'Introduction to Bioinformatics',
        credit: 3,
        prerequisites: ['CSE 2215'],
        difficulty: 'Medium',
        exam_day: 'Day 4',
        exam_slot: 'T3',
      },
    ],
  },
  'Network and Communications': {
    id: 'net',
    title: 'Network & Cybersecurity',
    description: 'Protocols, distributed infrastructure, threat defense, and modern applied cryptography.',
    minElectives: 4,
    courses: [
      {
        course_code: 'CSE 4783',
        course_name: 'Cryptography',
        credit: 3,
        prerequisites: ['CSE 2213'],
        difficulty: 'Hard',
        exam_day: 'Day 6',
        exam_slot: 'T2',
      },
      {
        course_code: 'CSE 4777',
        course_name: 'Network Security',
        credit: 3,
        prerequisites: ['CSE 3711'],
        difficulty: 'Medium',
        exam_day: 'Day 3',
        exam_slot: 'T3',
      },
      {
        course_code: 'CSE 4791',
        course_name: 'Wireless and Mobile Communication',
        credit: 3,
        prerequisites: ['CSE 3711'],
        difficulty: 'Medium',
        exam_day: 'Day 2',
        exam_slot: 'T3',
      },
      {
        course_code: 'CSE 4779',
        course_name: 'Distributed Systems',
        credit: 3,
        prerequisites: ['CSE 3711', 'CSE 4509'],
        difficulty: 'Hard',
        exam_day: 'Day 7',
        exam_slot: 'T2',
      },
    ],
  },
  'Systems': {
    id: 'sys',
    title: 'Systems & Cloud',
    description: 'Low-level OS abstractions, GPU graphics pipelines, and cloud cluster computing.',
    minElectives: 4,
    courses: [
      {
        course_code: 'CSE 4621',
        course_name: 'Computer Graphics',
        credit: 3,
        prerequisites: ['MATH 2183', 'MATH 2201'],
        difficulty: 'Medium',
        exam_day: 'Day 2',
        exam_slot: 'T1',
      },
      {
        course_code: 'CSE 4587',
        course_name: 'Cloud Computing',
        credit: 3,
        prerequisites: ['CSE 4509', 'CSE 3711'],
        difficulty: 'Medium',
        exam_day: 'Day 3',
        exam_slot: 'T3',
      },
      {
        course_code: 'CSE 4511',
        course_name: 'Embedded Systems & IoT',
        credit: 3,
        prerequisites: ['CSE 3313'],
        difficulty: 'Medium',
        exam_day: 'Day 5',
        exam_slot: 'T3',
      },
      {
        course_code: 'CSE 4515',
        course_name: 'Parallel and High Performance Computing',
        credit: 3,
        prerequisites: ['CSE 4509'],
        difficulty: 'Hard',
        exam_day: 'Day 1',
        exam_slot: 'T2',
      },
    ],
  },
  'Computational Theory': {
    id: 'theory',
    title: 'Computational Theory',
    description: 'Formal language models, grammar parsing, automata, and advanced computational geometry.',
    minElectives: 4,
    courses: [
      {
        course_code: 'CSE 4611',
        course_name: 'Compiler Design',
        credit: 3,
        prerequisites: ['CSE 2233'],
        difficulty: 'Hard',
        exam_day: 'Day 4',
        exam_slot: 'T1',
      },
      {
        course_code: 'CSE 4633',
        course_name: 'Computational Geometry',
        credit: 3,
        prerequisites: ['CSE 2217'],
        difficulty: 'Hard',
        exam_day: 'Day 5',
        exam_slot: 'T1',
      },
      {
        course_code: 'CSE 4635',
        course_name: 'Advanced Algorithms',
        credit: 3,
        prerequisites: ['CSE 2217'],
        difficulty: 'Hard',
        exam_day: 'Day 6',
        exam_slot: 'T2',
      },
      {
        course_code: 'CSE 4637',
        course_name: 'Quantum Computing',
        credit: 3,
        prerequisites: ['MATH 2183'],
        difficulty: 'Hard',
        exam_day: 'Day 7',
        exam_slot: 'T3',
      },
    ],
  },
};

export const GED_ELECTIVES = [
  {
    course_code: 'ECO 4101',
    course_name: 'Economics',
    credit: 3,
    type: 'GED_ELECTIVE',
    prerequisites: [],
    difficulty: 'Easy',
    exam_day: 'Day 6',
    exam_slot: 'T1',
  },
  {
    course_code: 'ACT 2111',
    course_name: 'Financial and Managerial Accounting',
    credit: 3,
    type: 'GED_ELECTIVE',
    prerequisites: [],
    difficulty: 'Medium',
    exam_day: 'Day 2',
    exam_slot: 'T3',
  },
  {
    course_code: 'IPE 3401',
    course_name: 'Industrial and Operational Management',
    credit: 3,
    type: 'GED_ELECTIVE',
    prerequisites: [],
    difficulty: 'Easy',
    exam_day: 'Day 1',
    exam_slot: 'T1',
  },
  {
    course_code: 'TEC 2499',
    course_name: 'Technology Entrepreneurship',
    credit: 3,
    type: 'GED_ELECTIVE',
    prerequisites: [],
    difficulty: 'Easy',
    exam_day: 'Day 3',
    exam_slot: 'T2',
  },
];

// Unified catalog with core courses, major electives, and GED electives
const allTrackCourses = Object.values(MAJOR_TRACKS).flatMap((t) => t.courses);
const combinedMap = new Map();

COURSE_CATALOG.forEach((c) => combinedMap.set(c.course_code.toUpperCase(), { ...c, category: 'CORE' }));
GED_ELECTIVES.forEach((c) => combinedMap.set(c.course_code.toUpperCase(), { ...c, category: 'GED' }));
allTrackCourses.forEach((c) => {
  const code = c.course_code.toUpperCase();
  if (!combinedMap.has(code)) {
    combinedMap.set(code, { ...c, category: 'MAJOR_ELECTIVE', type: 'Elective' });
  }
});

export const ALL_COURSES = Array.from(combinedMap.values());
export const ADVISOR_COURSE_MAP = Object.fromEntries(combinedMap);
