/** Specialist centers, condensed from source documents 10.1-10.5. */
export interface SeedCenter {
  name: string;
  acronym: string | null;
  tagline: string;
  overview: string;
  objectives: string[];
  sections: { title: string; body?: string; items?: string[] }[];
  image?: string;
  needsVerification?: boolean;
  verificationNote?: string;
}

const phases = (p1: string[], p2: string[], p3: string[]) => [
  { title: 'Phase I (2026-2028)', items: p1 },
  { title: 'Phase II (2029-2030): expansion and specialization', items: p2 },
  { title: 'Phase III (2031 onward): consolidation and global integration', items: p3 },
];

export const CENTERS: SeedCenter[] = [
  {
    name: 'Center for Research & Innovation',
    acronym: 'CRI',
    tagline: 'Towards a research-based university integrating the academia-industry-government nexus',
    image: 'uit-library-shelves.jpg',
    overview:
      'Much of the research produced in Bangladesh stays in academic publications and rarely becomes products, services or policy. The Center for Research & Innovation is planned as UIT\'s platform for closing that gap: identifying promising research, supporting pilot-scale studies and helping transfer results to entrepreneurs, start-ups and small and medium enterprises, while building a research culture across the university.',
    objectives: [
      'Set explicit institutional goals for research output, funding, collaboration, commercialization and social impact, with measurable indicators and annual reporting.',
      'Dedicate 5% of revenue to competitive internal research grants, rising gradually to 10% within a decade, awarded through transparent merit-based review.',
      'Involve undergraduate and graduate students in research through curricula, credits, stipends and research assistantships.',
      'Provide research infrastructure, access to international databases and a dedicated research and publication office with ethics review and intellectual property support.',
      'Build partnerships with universities, research institutions, industry and government for joint research, exchanges and technology transfer.',
      'Establish centers of excellence in priority areas aligned with national development goals.',
    ],
    sections: [
      {
        title: 'Core strategies',
        items: [
          'Leadership commitment and strategic research planning',
          'Stable and adequate research funding, including an internal research grant',
          'A research culture that values inquiry, experimentation and dissemination',
          'Research infrastructure and a dedicated research-publication office',
          'Recruitment and development of research-active faculty, with performance recognition and capacity building',
          'Research partnerships, collaboration and stakeholder engagement',
          'Centers of excellence and innovation',
          'Research input into teaching and learning',
        ],
      },
      {
        title: 'Teaching and research balance',
        body: 'The center\'s strategy document plans for faculty to operate on a 60% teaching and 40% research orientation, so that teaching is continuously refreshed by scholarly inquiry.',
      },
      ...phases(
        ['Priority research areas (see Research)', 'Research policy framework', 'Seed grants and faculty incentives', 'Thematic research clusters', 'Research ethics committee', 'Undergraduate research program'],
        ['Advanced research areas', 'Industry-sponsored research', 'Specialized laboratories', 'Patent and IP support unit', 'National competitive grants'],
        ['Industry-academic collaboration centre', 'National and international research collaborations', 'International research funding acquisition', 'Technology transfer and innovation lab', 'Postdoctoral research programs', 'Research commercialization and start-up incubation', 'Policy research and advisory unit'],
      ),
    ],
  },
  {
    name: 'Center for Co-curricular & Community Engagement',
    acronym: 'CCCE',
    tagline: 'Dedicated to holistic education through credited co-curricular excellence and community service',
    image: 'centers-signage.jpg',
    overview:
      'The Center for Co-curricular & Community Engagement is planned as an academic unit that makes credited co-curricular programmes and structured community engagement part of graduation requirements. It starts from the view that education is not confined to lecture halls and examinations but shapes intellect, character, spirituality, leadership and social responsibility.',
    objectives: [
      'Cultivate specific, identifiable skills that suit the needs and demands of students.',
      'Offer courses that support the development of a well-rounded personality.',
      'Institutionalize credited co-curricular programmes as part of graduation requirements.',
      'Provide a training ground for students to continuously develop leadership skills and talents.',
      'Equip students with the integration of Iman, Ilm and Amal (faith, knowledge and action).',
    ],
    sections: [
      {
        title: 'Philosophical foundation',
        items: [
          'Holistic education: nurturing the intellectual, moral, spiritual, physical and social dimensions of the individual',
          'Integration of knowledge and values: academic excellence accompanied by ethical responsibility',
          'Structured and inclusive participation so that all students benefit',
          'Community-centered learning that prepares graduates for contemporary needs',
        ],
      },
      {
        title: 'Seven core soft-skill thrusts',
        body: 'The planned catalogue of more than 43 credited modules (26 general skill areas and 5 niche specializations) is organized around seven soft skills.',
        items: [
          'Communication skills',
          'Critical thinking and problem-solving',
          'Teamwork',
          'Lifelong learning and information management',
          'Entrepreneurship',
          'Ethics and moral professionalism',
          'Leadership',
        ],
      },
      ...phases(
        ['Academic clubs (debate, research, culture, mathematics, higher studies, career, volunteerism)', 'Winter and summer intellectual schools', 'Community literacy and outreach programs', 'Annual seminar and lecture series', 'Service-learning initiatives'],
        ['Structured community-based research', 'Internship and field engagement programs', 'Leadership development camps', 'Regional outreach partnerships', 'Career development support'],
        ['National civic engagement model', 'Social impact assessment unit', 'International student exchange and volunteer programs', 'Sustainable community innovation hubs', 'Academic networking, partnerships and summits'],
      ),
    ],
  },
  {
    name: 'Center for Professional Development',
    acronym: 'CPD',
    tagline: 'Dedicated to training academic and administrative staff',
    image: 'conference-hall.jpg',
    overview:
      'Bangladesh\'s tertiary sector faces a shortage of teachers trained in subject-specific pedagogy. The Center for Professional Development is planned to prepare subject-based teachers using best-practice pedagogy and andragogy, and to deliver short courses, certificates and diplomas for teachers, professionals and young people, including a Foundation Skills Certificate in literacy, numeracy and thinking skills.',
    objectives: [
      'Design and develop an integrated foundational skills curriculum covering essential competencies.',
      'Promote problem-based learning through community-focused research and projects.',
      'Develop a social entrepreneurship mindset through applied projects.',
      'Enhance learners\' communication, numeracy and digital fluency.',
      'Evaluate the impact of skill-based learning on employability and community engagement.',
    ],
    sections: [
      {
        title: 'Planned programs',
        items: [
          'Short courses (3-5 days): pedagogy training for school, madrasha and university teachers; curriculum development; professional development for finance professionals; skill development for youth and women; Arabic and Qur\'anic language; parenting and family management; summer and winter schools; vocational training for underprivileged youth',
          'Certificate courses: CIFTS (communication, mathematics, programming, IT, personal development, problem solving), ICC programs and STEAM programs',
          'College and university preparatory course',
          'Diploma in Integrated Cognitive Teaching (DICT)',
        ],
      },
      ...phases(
        ['Design and development of the Foundation Skills Certificate (FSC)', 'Structured 12-lesson modules for each course', 'Al-Qur\'an guided teaching methodology', 'Pedagogy and instructional design training', 'Educational leadership programs', 'Short courses in teacher education', 'Language proficiency programs', 'Soft skills and employability training', 'Industry linkage initiation', 'Course material development team and quality monitoring'],
        ['Expansion of certificate programs (CIFTS, ICC, STEAM)', 'Executive education and certification programs', 'Corporate training partnerships', 'Career placement and incubation support', 'Alumni mentorship network', 'Structured college and university preparatory course', 'Applied social entrepreneurship projects'],
        ['Continuing professional education programs', 'International certification collaborations', 'Leadership academy', 'Professional consultancy and advisory services', 'Expansion of diploma and international collaboration initiatives', 'National and global professional development networks'],
      ),
    ],
    needsVerification: true,
    verificationNote: 'The source document combines CPD strategy notes with Foundation Skills Certificate content. Confirm which center owns the Foundation Skills Certificate.',
  },
  {
    name: 'Center for Translation & Publication',
    acronym: 'CTP',
    tagline: 'Advancing knowledge through quality translation, publication and scholarly excellence',
    image: 'uit-library.jpg',
    overview:
      'The Center for Translation & Publication is planned to support high-quality translation, publication and scholarly dissemination, guided by academic excellence, integrity, authenticity, professionalism and collaboration. Its vision is to become a leading regional and global centre for academic translation and publishing that bridges languages, civilizations and intellectual traditions.',
    objectives: [
      'Coordinate the university\'s translation, publication and research dissemination.',
      'Translate foundational academic texts and classical and modern Islamic scholarly resources across key languages.',
      'Develop and enforce editorial, peer-review and publication ethics guidelines.',
      'Establish a university press, indexed academic journals and a digital scholarly repository.',
      'Facilitate national and international publishing partnerships and open-access dissemination.',
      'Train researchers in academic writing and translation methodology.',
    ],
    sections: [
      {
        title: 'Key functions',
        items: [
          'Policy and governance on translation, publication ethics, intellectual property and research coordination',
          'Editorial and peer-review boards for manuscripts, journals and monographs',
          'Publication of working papers, edited volumes and journals',
          'A digital repository and e-library',
          'Workshops and mentoring on academic writing and publication standards',
        ],
      },
      ...phases(
        ['Translation of foundational academic texts (English, Bangla, Arabic)', 'Classical and modern Islamic scholarly resources', 'Editorial and peer-review board', 'Working paper series', 'Academic writing and publication guidelines'],
        ['University press', 'Indexed academic journal', 'Digital repository and e-library', 'Scholarly monographs and edited volumes'],
        ['International publishing partnerships', 'High-impact journal indexing (Scopus/WoS target)', 'Multilingual global dissemination', 'Open-access publishing platform'],
      ),
    ],
  },
  {
    name: 'Center for Foundational Studies',
    acronym: null,
    tagline: 'Dedicated to conducting university required courses',
    image: 'schools-signage.jpg',
    overview:
      'The Center for Foundational Studies is planned to provide the general education core for every undergraduate: writing and communication, quantitative, data and digital literacy, science and environment, Bangladesh studies and citizenship, civilisations and ethics, and practice-for-impact courses. Placement-based, non-credit support in English and mathematics is planned so that all learners can succeed in credit-bearing work.',
    objectives: [
      'Written and oral communication in English and Bangla across academic and professional genres.',
      'Quantitative, data and digital fluency, including spreadsheets and basic programming.',
      'Civic and Bangladesh studies with an orientation to constructive citizenship.',
      'Comparison of ethical traditions and civilisational narratives.',
      'Project planning, teamwork and small interventions with community partners.',
      'Wellbeing, resilience and reflective habits that support lifelong learning.',
    ],
    sections: [
      {
        title: 'Planned structure',
        body: 'The planned general education requirement is 42 credits (14 courses) across the first six tri-semesters, organized in six baskets.',
        items: [
          'Writing & Communication (WRC)',
          'Quantitative, Data & Digital (QDD)',
          'Science, Technology & Environment (STE)',
          'Bangladesh, Society & Governance (BSG)',
          'Civilisations, Ethics & Worldview (CEW)',
          'Practice for Impact (PFI)',
        ],
      },
      {
        title: 'Associated centres',
        items: ['Centre for Academic Writing & Communication (CAWC)', 'Centre for Wellbeing, Mental Health & Resilience (CWMHR)'],
      },
    ],
    needsVerification: true,
    verificationNote: 'The source is titled "Center/School of Foundational Studies" and also refers to a "School of General Education". Confirm the official name, and the credit total (the document mentions both 42 and 36 credits).',
  },
];
