/**
 * Schools, departments and programs from "5. Academic Master Plan - Academic Programs".
 * `phase1` lists programs scheduled for Phase I (2027-2028); `phase2` lists programs introduced in Phase II (2029-2030).
 * Every program is seeded as PROPOSED: none is offered yet.
 */
export interface SeedDepartment {
  name: string;
  phase1: string[];
  phase2: string[];
}
export interface SeedSchool {
  name: string;
  shortName: string;
  description: string;
  image?: string;
  departments: SeedDepartment[];
}

export const SCHOOLS: SeedSchool[] = [
  {
    name: 'School of Education',
    shortName: 'SoE',
    description:
      'Planned school for teacher education, educational leadership, psychology and counselling, and technical and vocational education, building on BIIT\'s long record of training university teachers.',
    departments: [
      { name: 'Department of Teaching & Learning', phase1: ['BEd in Education', 'MA in Teaching & Learning', 'PGD in Teaching & Learning'], phase2: [] },
      { name: 'Department of Educational Management & Leadership', phase1: ['MA in Educational Management & Leadership', 'PGD in Educational Management & Leadership'], phase2: [] },
      { name: 'Department of Psychology & Counselling', phase1: ['MSc in Psychology & Counselling', 'PGD in Psychotherapy / Clinical Psychology'], phase2: ['BSc in Psychology & Counselling'] },
      { name: 'Department of Technical and Vocational Education', phase1: ['BSc in Technical Education', 'MSc in Technical Education'], phase2: [] },
    ],
  },
  {
    name: 'School of Humanities and Social Sciences',
    shortName: 'SHSS',
    image: 'shss-signage.jpg',
    description: 'Planned school for public policy and governance, economics and development, and law and human rights.',
    departments: [
      { name: 'Department of Policy & Governance', phase1: ['MA in Public Policy & Governance', 'PGD in Public Policy / Governance'], phase2: ['BA in Public Policy & Governance'] },
      { name: 'Department of Economics & Development', phase1: ['MA in Economics & Development', 'PGD in Islamic Economics'], phase2: ['BA in Economics & Development'] },
      { name: 'Department of Law & Human Rights', phase1: ['LLM in Law & Justice', 'PGD in Human Rights'], phase2: ['LLB in Law & Justice'] },
    ],
  },
  {
    name: 'School of Business and Entrepreneurship',
    shortName: 'SBE',
    description: 'Planned school for business administration, entrepreneurship and business and technology management.',
    departments: [
      { name: 'Department of Business & Entrepreneurship', phase1: ['BBA in Business Administration', 'MBA in Business & Entrepreneurship', 'PGD in Entrepreneurship'], phase2: [] },
      { name: 'Department of Business & Technology Management', phase1: ['BBA in Business & Technology Management', 'MBA in Business & Technology Management'], phase2: [] },
    ],
  },
  {
    name: 'School of Science and Engineering',
    shortName: 'SSE',
    description:
      'Planned school for computing, electrical and electronic engineering, artificial intelligence, cyber security, quantum computing and the natural sciences.',
    departments: [
      { name: 'Department of Computer Science & Engineering', phase1: ['BSc in Computer Science & Engineering', 'MSc in Computer Science & Engineering', 'MSc in Data Science'], phase2: [] },
      { name: 'Department of Electrical & Electronic Engineering', phase1: ['BSc in Electrical & Electronic Engineering', 'MSc in Electrical & Electronic Engineering'], phase2: [] },
      { name: 'Department of Artificial Intelligence & Robotics Engineering', phase1: [], phase2: ['BSc in Artificial Intelligence & Robotics Engineering', 'MSc in Artificial Intelligence & Robotics Engineering'] },
      { name: 'Department of AI Methods & Application', phase1: [], phase2: ['BSc in AI Methods & Application', 'MSc in AI Methods & Application'] },
      { name: 'Department of Cyber Security Analysis & Operations', phase1: ['PGD in Cyber Security Analysis & Operations'], phase2: ['BSc in Cyber Security Analysis & Operations', 'MSc in Cyber Security Analysis & Operations'] },
      { name: 'Department of Quantum Computing', phase1: [], phase2: ['BSc in Quantum Computing', 'MSc in Quantum Computing'] },
      { name: 'Department of Mathematics', phase1: ['MSc in Mathematics'], phase2: [] },
      { name: 'Department of Physics', phase1: ['MSc in Physics'], phase2: [] },
      { name: 'Department of Chemistry', phase1: ['MSc in Chemistry'], phase2: [] },
    ],
  },
  {
    name: 'School of Health and Life Sciences',
    shortName: 'SHLS',
    description:
      'Planned school for public health, nursing and midwifery, pharmacy, biotechnology, health technology, halal and organic food sciences and sustainable technology.',
    departments: [
      { name: 'Department of Public Health', phase1: ['MSc in Public Health', 'PGD in Health & Well-being'], phase2: ['BSc in Public Health'] },
      { name: 'Department of Nursing & Midwifery', phase1: ['BSc in Nursing & Midwifery', 'Diploma in Nursing & Midwifery'], phase2: [] },
      { name: 'Department of Pharmacy', phase1: ['BPharm in Pharmacy', 'MPharm in Pharmacy'], phase2: [] },
      { name: 'Department of Biotechnology and Bio-Economy', phase1: ['MSc in Biotechnology, Bio-Manufacturing and Bio-Economy'], phase2: ['BSc in Biotechnology, Bio-Manufacturing and Bio-Economy'] },
      { name: 'Department of Health Technology', phase1: [], phase2: ['BSc in Health Technology', 'MSc in Health Technology'] },
      { name: 'Department of Halal & Organic Food Sciences', phase1: [], phase2: ['BSc in Halal & Organic Food Sciences', 'MSc in Halal & Organic Food Sciences'] },
      { name: 'Department of Sustainable Technology', phase1: [], phase2: ['MSc in Renewable Energy', 'MSc in Climate Technology', 'MSc in Waste Valorisation & Circular Economy'] },
    ],
  },
  {
    name: 'School of Agriculture',
    shortName: 'SoA',
    description: 'Planned school for agricultural sciences, environmental science and soil science.',
    departments: [
      { name: 'Department of Agricultural Sciences', phase1: ['Diploma in Agriculture'], phase2: ['BSc in Agricultural Sciences', 'MSc in AI Applications in Agriculture'] },
      { name: 'Department of Environmental Science', phase1: [], phase2: ['BSc in Environmental Science', 'MSc in Environmental Science'] },
      { name: 'Department of Soil Science', phase1: [], phase2: ['BSc in Soil Science', 'MSc in Soil Science'] },
    ],
  },
];

type Level = 'UNDERGRADUATE' | 'POSTGRADUATE' | 'POSTGRADUATE_DIPLOMA' | 'DIPLOMA';

/** Derives the degree type and level from the program title, e.g. "MSc in Physics" → MSc, POSTGRADUATE. */
export function degreeOf(name: string): { degreeType: string; level: Level } {
  const degreeType = name.split(' ')[0];
  const level: Level =
    degreeType === 'PGD' ? 'POSTGRADUATE_DIPLOMA'
    : degreeType === 'Diploma' ? 'DIPLOMA'
    : /^(M|LLM)/.test(degreeType) ? 'POSTGRADUATE'
    : 'UNDERGRADUATE';
  return { degreeType, level };
}

export const PROGRAM_COUNT = SCHOOLS.reduce((n, s) => n + s.departments.reduce((m, d) => m + d.phase1.length + d.phase2.length, 0), 0);
