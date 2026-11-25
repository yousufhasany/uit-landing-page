/**
 * Source-based pages. Media references use "@<seed file name>" and are resolved to asset ids by the seed.
 * Pages whose facts need confirmation are seeded as DRAFT or flagged with needsVerification.
 */
type Block = { type: string; data: Record<string, unknown> };
export interface SeedPage {
  slug: string;
  title: string;
  eyebrow?: string;
  summary: string;
  featuredImage?: string;
  template?: 'standard' | 'landing' | 'listing';
  status: 'PUBLISHED' | 'DRAFT';
  seoDescription?: string;
  needsVerification?: boolean;
  verificationNote?: string;
  blocks: Block[];
}

const html = (...parts: string[]) => ({ type: 'RICH_TEXT', data: { html: parts.join('') } });
const heading = (text: string, eyebrow = '') => ({ type: 'HEADING', data: { text, eyebrow, level: 2 } });
const image = (file: string, caption: string, size: 'inline' | 'wide' | 'full' = 'wide') => ({ type: 'IMAGE', data: { mediaId: `@${file}`, caption, size } });
const cards = (title: string, list: { title: string; text?: string; url?: string; badge?: string; image?: string }[], columns = 3, intro = '') => ({
  type: 'CARD_GRID',
  data: { title, intro, columns, cards: list.map(({ image: img, ...c }) => ({ ...c, imageId: img ? `@${img}` : null })) },
});
const dynamic = (module: string, title = '', intro = '', category = '', limit = 12) => ({ type: 'DYNAMIC', data: { module, title, intro, category, limit } });
const cta = (title: string, text: string, buttons: { label: string; url: string; style?: string }[]) => ({ type: 'CTA', data: { title, text, buttons } });

export const MILESTONES = [
  { date: '1989', title: 'BIIT begins its work on the integration of knowledge', text: 'The Bangladesh Institute of Islamic Thought (BIIT), the think tank behind UIT, starts its academic work on integrating knowledge, skills and values.' },
  { date: '2 February 2022', title: 'Site selection agreement signed', text: 'A memorandum of understanding on the university site is signed by the Acting President and the Director General of BIIT.' },
  { date: '2022-2025', title: 'Consultations and site visits', text: 'Promotional and consultation meetings are held in Bangladesh, the UK, the USA and Malaysia, alongside visits to the proposed campus land.' },
  { date: '7 July 2025', title: 'UNIW delegation visits the Knowledge City site', text: 'A delegation of the Union of NGOs of the Islamic World reviews the campus master plan in Rupganj; a consultation on UIT is held the same day at the Radisson Blu Water Garden Hotel, Dhaka.' },
  { date: '17 October 2025', title: 'First meeting of the UIT Board of Trustees', text: 'The Board signs the Deed of Trust and approves provisional appointments of the Vice-Chancellor, Pro-Vice-Chancellor and Treasurer.' },
  { date: '9 December 2025', title: 'Application submitted to the Ministry of Education', text: 'The UIT Trust submits its application to establish the university under the Private University Act, 2010.' },
  { date: '5 February 2026', title: 'UGC forms an inspection committee', text: 'The University Grants Commission forms a four-member committee to inspect the proposed university.' },
  { date: '9 February 2026', title: 'UGC conducts a formal inspection', text: 'The committee reviews UIT\'s academic, administrative and infrastructural readiness, including land and physical facilities.' },
  { date: '10 March 2026', title: 'UGC recommends approval', text: 'The UGC submits its inspection report with a positive recommendation to the Ministry of Education.' },
  { date: '19 April 2026', title: 'Ministry of Education approves the establishment of UIT', text: 'UIT enters the final phase of obtaining its Final Approval Certificate.' },
];

export const PAGES: SeedPage[] = [
  {
    slug: 'about',
    title: 'About UIT',
    eyebrow: 'About the University',
    template: 'landing',
    status: 'PUBLISHED',
    featuredImage: 'temporary-campus-building.jpg',
    summary:
      'The University of Integrated Thought is committed to transforming higher education in Bangladesh through an ethical, interdisciplinary and research-driven approach.',
    seoDescription: 'About the University of Integrated Thought (UIT), a joint initiative of BIIT Trust and UIT Trust in Rupganj, Narayanganj, Bangladesh.',
    blocks: [
      html(
        '<p>The University of Integrated Thought (UIT) is committed to transforming higher education in Bangladesh through an ethical, interdisciplinary, and research-driven approach. By addressing the shortcomings of conventional, rote-based, and Eurocentric models, UIT seeks to develop well-rounded graduates equipped with strong moral values, critical thinking abilities, and a deep commitment to social equity and sustainable development.</p>',
        '<p>Bangladesh has many universities. What it still lacks, in the words of UIT\'s concept paper, is one that treats faith, science and professional skill as parts of a single education rather than rival ones. UIT is being built to fill that gap, and plans to offer undergraduate, master\'s and PhD programs.</p>',
      ),
      { type: 'QUOTE', data: { text: 'Great institutions are not built by walls, but by vision.', attribution: 'UIT temporary campus' } },
      heading('Founding bodies'),
      html(
        '<p>UIT is a joint initiative of <strong>BIIT Trust</strong> and <strong>UIT Trust</strong>. It grows out of the work of the Bangladesh Institute of Islamic Thought (BIIT), a government-registered think tank with an academic record stretching back to 1989.</p>',
        '<ul><li>BIIT Trust: registered in 2007 under the Trust Act, 1882 (Registry No. 11839/95-IV).</li><li>UIT Trust: registered in 2025 under the Trust Act, 1882 (Registry No. 10692/IV-2/25).</li><li>UIT Board of Trustees: approved by the Registrar of Joint Stock Companies and Firms (RJSC No. S-14449/2026).</li></ul>',
      ),
      heading('Where UIT stands today'),
      html(
        '<p>The application to establish UIT under the Private University Act, 2010 was submitted on 9 December 2025. Following the University Grants Commission\'s inspection on 9 February 2026 and its positive recommendation on 10 March 2026, the Ministry of Education approved the establishment of UIT on 19 April 2026. UIT is now in the final phase of obtaining its Final Approval Certificate. Admissions have not yet opened.</p>',
      ),
      cards('Learn more', [
        { title: 'Vision & Mission', text: 'What UIT aims to become and whom it serves.', url: '/about/vision-mission' },
        { title: 'Philosophy', text: 'The integrated model of curriculum, teaching and assessment.', url: '/about/philosophy' },
        { title: 'History & Milestones', text: 'From BIIT\'s founding work to the Ministry approval.', url: '/about/history' },
        { title: 'Campus', text: 'The temporary campus today and the planned permanent campus.', url: '/campus' },
      ], 4),
    ],
  },
  {
    slug: 'about/vision-mission',
    title: 'Vision & Mission',
    eyebrow: 'About UIT',
    status: 'PUBLISHED',
    featuredImage: 'temporary-campus-corridor.jpg',
    summary: 'UIT aims to revive and accelerate the intellectual heritage of Muslims and to produce well-rounded graduates who serve humanity, society and the Creator.',
    blocks: [
      heading('Our vision', 'Vision'),
      cards('', [
        { title: 'Revive and accelerate the intellectual heritage of Muslims', badge: '01' },
        { title: 'Become a leading center of excellence across all branches of higher education', badge: '02' },
        { title: 'Produce well-rounded graduates and global citizens', badge: '03' },
      ]),
      heading('Our mission', 'Mission'),
      cards('', [
        { title: 'Serve humanity by building a knowledge and value-based society', badge: '01' },
        { title: 'Serve society by producing good human beings', badge: '02' },
        { title: 'Serve the Creator through education', badge: '03' },
      ]),
      heading('Why an "integrated university"?'),
      html(
        '<p><strong>Integrated knowledge + generic skills + human values = well-rounded graduates.</strong></p>',
        '<p>Spiritual insight, reason, intellect and practical experience work together across the curriculum, teaching, assessment and management. UIT graduates are meant to be both competent professionals and good human beings.</p>',
      ),
    ],
  },
  {
    slug: 'about/philosophy',
    title: 'Philosophy & the UIT Model',
    eyebrow: 'About UIT',
    status: 'PUBLISHED',
    featuredImage: 'uit-library.jpg',
    summary: 'Curriculum, teaching, assessment and evaluation designed as one connected system.',
    verificationNote: 'The teaching/research balance is 60/40 in the Concept Paper, Bulletin and CRI document but 50/50 in "Major Features". 60/40 is shown.',
    needsVerification: true,
    blocks: [
      heading('The conviction behind UIT'),
      html(
        '<p>Every system of education carries a view of human nature and of how we come to know things. Modern secular education tends to treat reason and social norms but often stays at the surface, without reaching the questions of value, purpose and the divine root of knowledge. Within a curriculum that joins secular and faith dimensions, UIT seeks to bring together <strong>spiritual intuition, reason, intellection and sensory knowledge</strong>.</p>',
        '<p>In practical terms, UIT questions a model of higher education that prizes job-oriented rote learning and pays little attention to ethics. In its place it offers intellectual depth, moral integrity and civic responsibility, supported by dynamic teaching methods, research-intensive study and close ties between academia and industry.</p>',
      ),
      cards('An integrated education system', [
        { title: 'Integrated curriculum', text: 'Following the Islamic Integrated University Curriculum (IIUC) model, the curriculum brings together professional and disciplinary knowledge, interdisciplinary learning, generic graduate capabilities and Islamic revealed knowledge.' },
        { title: 'Integrated teaching pedagogy', text: 'The Integrated Pedagogy of Critical Thinking (IPCT) rests on the teacher, the lesson and the students: interactive, student-centred classrooms where learners analyse, debate and form their own judgments.' },
        { title: 'Integrated assessment', text: 'Beyond memory-based exams: moral reflection with checklists, cognitive psychology tools, volunteering and group projects, and observed ethics and conduct.' },
      ], 3, 'UIT designs curriculum, teaching, assessment and evaluation as one connected system rather than four separate departments of thought.'),
      heading('How students are evaluated'),
      { type: 'STATS', data: {
        items: [
          { value: '50%', label: 'Core disciplinary knowledge', note: 'Foundational concepts of the main field of study' },
          { value: '20%', label: 'Specialized knowledge and expertise', note: 'Advanced topics and deeper expertise' },
          { value: '10%', label: 'Internship and practical skills', note: 'Laboratory, industry and hands-on work' },
          { value: '10%', label: 'Campus life: values and attitudes', note: 'Behaviour, ethics and engagement' },
          { value: '10%', label: 'Community engagement and volunteerism', note: 'Contribution to society and rural areas' },
        ],
        sourceNote: 'Planned evaluation weights, UIT Project Concept Paper V1.1.',
      } },
      cards('What sets UIT apart', [
        { title: 'A diverse student body', text: 'Planned intake: 25% international students, 25% marginalized local students on full scholarships and 50% merit-based students, split equally between women and men.' },
        { title: 'A diverse faculty', text: 'Planned faculty: 10% international, 40% non-resident Bangladeshi and 50% local, with visiting professor and professor emeritus positions.' },
        { title: 'Research and teaching in balance', text: 'A planned 60% teaching and 40% research orientation, supported by the Center for Research & Innovation.' },
        { title: 'Double majors', text: 'Students will be able to specialize in two fields.' },
        { title: 'A soft landing', text: 'Foundation and pre-bridging courses to prepare incoming students for university study.' },
        { title: 'Interfaith education', text: 'Courses on world religions and interfaith dialogue running through the conventional disciplines.' },
        { title: 'Service built in', text: 'Volunteering and community service as part of the student experience.' },
        { title: 'Open to all', text: 'An inclusive atmosphere with access for people of all creeds and cultures.' },
        { title: 'Non-political governance', text: 'A Moderate-Islamic-Academic-Philanthropic approach, led by academics and scholars rather than a profit-driven owner.' },
      ], 3, 'These are design commitments set out in UIT\'s planning documents.'),
    ],
  },
  {
    slug: 'about/history',
    title: 'History & Milestones',
    eyebrow: 'About UIT',
    status: 'PUBLISHED',
    featuredImage: 'ugc-inspection-group.jpg',
    summary: 'From BIIT\'s work on the integration of knowledge to the Ministry of Education\'s approval of UIT\'s establishment.',
    blocks: [
      html(
        '<p>UIT is the outcome of more than three decades of work by the Bangladesh Institute of Islamic Thought on integrating knowledge, skills and values in higher education. BIIT has redesigned university curricula, produced textbooks and trained university teachers. After a feasibility study and consultations with academics at home and abroad, the BIIT Board of Trustees decided to establish the University of Integrated Thought.</p>',
      ),
      { type: 'TIMELINE', data: { title: 'Milestones', items: MILESTONES } },
      image('ugc-inspection-group-2.jpg', 'University Grants Commission inspection at UIT, 9 February 2026.'),
      dynamic('news', 'Latest updates', '', '', 3),
    ],
  },
  {
    slug: 'about/leadership',
    title: 'Leadership & Governance',
    eyebrow: 'About UIT',
    status: 'DRAFT',
    needsVerification: true,
    verificationNote: 'Names and titles are taken from source documents whose spellings differ (e.g. "Fazli Ilahi" / "Fazle Elahi", "Mozammel Hoq" / "Mozammel Hoque Khan", "Safiullah" / "Shafiullah"). Confirm official names, titles and photos before publishing.',
    summary: 'UIT is governed by its Board of Trustees and led by academics and scholars.',
    blocks: [
      html(
        '<p>The UIT Board of Trustees, approved by the RJSC (No. S-14449/2026), comprises senior academics, jurists, business leaders and professionals. Prof. Dr. M. Abdul Aziz, Director General of BIIT and Country Representative of IIIT (USA) in Bangladesh, is Chairman of the Board.</p>',
        '<p>At its first meeting on 17 October 2025, the Board approved the provisional appointments of the university\'s academic management team:</p>',
        '<ul><li>Prof. Dr. Muhammad Fazli Ilahi, Vice-Chancellor (former Vice-Chancellor of the Islamic University of Technology)</li><li>Prof. Dr. Md. Mozammel Hoq, Pro-Vice-Chancellor (retired Professor, Department of Microbiology, University of Dhaka)</li><li>Md. Safiullah, Treasurer (Senior Secretary, retired, Government of Bangladesh)</li></ul>',
        '<p>Day-to-day management is planned to involve academicians, industrialists and religious scholars, with strategic direction from an International Board of Governors. The university commits to a strictly non-political stance.</p>',
      ),
    ],
  },
  {
    slug: 'about/academic-network',
    title: 'Academic Network',
    eyebrow: 'About UIT',
    status: 'DRAFT',
    needsVerification: true,
    verificationNote: 'The "Major Features" document lists these institutions under "Academic Partnerships", but no formal agreements are documented. Do not publish until each relationship is confirmed in writing.',
    summary: 'Institutions UIT intends to work with through a global academic network.',
    blocks: [
      html(
        '<p>UIT\'s planning documents describe a Global Academic Network with the following institutions:</p>',
        '<ul><li>Johns Hopkins University (USA)</li><li>The Fairfax Institute (USA)</li><li>International Islamic University Malaysia (IIUM)</li><li>Istanbul Sabahattin Zaim University (Türkiye)</li></ul>',
        '<p>Expected development partners named in the same document: Islamic Development Bank (IsDB), ICESCO-OIC and Fuzul Group (Türkiye).</p>',
      ),
    ],
  },
  {
    slug: 'academics',
    title: 'Academics',
    eyebrow: 'Academic Master Plan',
    template: 'landing',
    status: 'PUBLISHED',
    featuredImage: 'schools-signage.jpg',
    summary: 'Six planned schools and five specialist centers will offer undergraduate, master\'s and doctoral education through an integrated curriculum.',
    needsVerification: true,
    verificationNote: 'School names follow the Academic Master Plan. The Concept Paper and campus signage use some different names (e.g. School of Science, Engineering & Technology).',
    blocks: [
      html(
        '<p>UIT\'s Academic Master Plan sets out programs by school and department across three phases: <strong>Phase I (2027-2028)</strong>, <strong>Phase II (2029-2030)</strong> for expansion and specialization, and <strong>Phase III (2031 onward)</strong> for consolidation, new master\'s, MPhil and PhD programs and global integration.</p>',
        '<p><strong>Important:</strong> all programs listed on this website are proposed. None is currently offered or open for admission, and program details such as duration, credits and curricula will be published when they are approved.</p>',
      ),
      dynamic('faculties', 'Planned schools'),
      cta('Explore the planned programs', 'Browse all programs in the Academic Master Plan by school, level and launch phase.', [
        { label: 'View planned programs', url: '/academics/programs', style: 'primary' },
        { label: 'Departments', url: '/academics/departments', style: 'secondary' },
      ]),
    ],
  },
  {
    slug: 'research',
    title: 'Research',
    eyebrow: 'Center for Research & Innovation',
    template: 'landing',
    status: 'PUBLISHED',
    featuredImage: 'uit-library-shelves.jpg',
    summary: 'UIT aims to grow as a research-led university that turns research into real-world value through the academia-industry-government nexus.',
    blocks: [
      html(
        '<p>Research productivity at universities in Bangladesh remains low by international standards, held back by limited funding, little research mentoring, heavy teaching loads and weak links with industry. Much of the research that is produced never leads to practical application.</p>',
        '<p>UIT plans to prioritize knowledge creation through high-quality research, innovation and scholarly output, and to integrate research into teaching and community engagement. Its Center for Research & Innovation will coordinate this work.</p>',
      ),
      cards('Core strategies', [
        { title: 'Leadership commitment', text: 'Explicit research goals, measurable indicators and transparent annual reporting.' },
        { title: 'Stable funding', text: '5% of revenue planned for internal research grants, rising to 10% within a decade.' },
        { title: 'Research culture', text: 'Workshops, awards, sabbaticals and reduced teaching loads for active researchers.' },
        { title: 'Student research', text: 'Research projects in all curricula, with credits, stipends and assistantships.' },
        { title: 'Infrastructure', text: 'Laboratories, international databases, an open repository and a research-publication office.' },
        { title: 'Partnerships', text: 'Joint research, exchanges and co-supervision with universities, industry and government.' },
      ]),
      dynamic('research-areas', 'Priority research areas', 'Research areas planned by the Center for Research & Innovation, by phase.', '', 24),
      cta('From research to innovation', 'How UIT plans to move research results into products, services and policy.', [
        { label: 'Innovation', url: '/research/innovation', style: 'primary' },
        { label: 'Center for Research & Innovation', url: '/centers/center-for-research-and-innovation', style: 'secondary' },
      ]),
    ],
  },
  {
    slug: 'research/innovation',
    title: 'Innovation',
    eyebrow: 'Research',
    status: 'PUBLISHED',
    featuredImage: 'site-plan-review.jpg',
    summary: 'An innovation translation platform linking academia, industry and government.',
    blocks: [
      html(
        '<p>Bangladesh, with a population of nearly 200 million, has increased investment in research and development, yet much of the resulting research remains confined to academic publications, with limited translation into commercial applications, products or services.</p>',
        '<p>To bridge this gap, UIT aims to work as an innovation translation platform: identifying promising research innovations, supporting pilot-scale studies, and facilitating their transfer to entrepreneurs, start-ups and small and medium enterprises. This is intended to stimulate industrial growth, strengthen academia-industry collaboration and make research outcomes more visible and impactful.</p>',
      ),
      cards('Planned mechanisms', [
        { title: 'Joint research with industry', text: 'Research projects designed with companies around real problems and national priorities.' },
        { title: 'Consultancy', text: 'Faculty providing expert services to industry and public agencies.' },
        { title: 'Technology transfer', text: 'Patent and IP support, a technology transfer and innovation lab, and start-up incubation.' },
        { title: 'Centers of excellence', text: 'Cross-disciplinary centers in areas such as climate resilience, biotechnology, AI and energy.' },
      ], 2),
      dynamic('research-projects', 'Research projects', 'Research projects will be listed here once they begin.'),
    ],
  },
  {
    slug: 'campus',
    title: 'Campus',
    eyebrow: 'Campus & Location',
    template: 'landing',
    status: 'PUBLISHED',
    featuredImage: 'temporary-campus-entrance.jpg',
    summary: 'A temporary operational campus in Rupganj today, and a planned permanent campus nearby at Rohila Mouza.',
    blocks: [
      html(
        '<p>UIT will begin its administrative and academic activities at a <strong>temporary campus</strong>: a seven-storey building of about 25,000 square feet at Duara, Daudpur, Rupganj, Narayanganj, within one kilometre of the land acquired for the permanent campus.</p>',
        '<p>The <strong>permanent campus</strong> is planned at Rohila Mouza, Daudpur, Rupganj, close to Dhaka and the developing Purbachal area, about 20 km from Dhaka International Airport. Its master plan has been finalized; construction has not yet started. Images of the permanent campus on this website are architectural visualizations.</p>',
      ),
      cards('Explore', [
        { title: 'Temporary campus', text: 'Offices, conference hall, library and facilities in use today.', url: '/campus/temporary-campus', image: 'temporary-campus-building.jpg', badge: 'Operational' },
        { title: 'Campus development', text: 'The planned three-phase permanent campus.', url: '/campus/development', image: 'campus-visualization-aerial.jpg', badge: 'Proposed' },
        { title: 'Knowledge City', text: 'The wider Education Valley concept around UIT.', url: '/campus/knowledge-city', image: 'education-valley-banner.jpg', badge: 'Concept' },
        { title: 'Gallery', text: 'Photographs of the campus and institutional milestones.', url: '/campus/gallery', image: 'conference-hall.jpg' },
      ], 4),
    ],
  },
  {
    slug: 'campus/temporary-campus',
    title: 'Temporary Campus',
    eyebrow: 'Campus',
    status: 'PUBLISHED',
    featuredImage: 'temporary-campus-building.jpg',
    summary: 'A seven-storey, 25,000 sq ft building at Duara, Daudpur, Rupganj, serving as UIT\'s temporary operational campus.',
    blocks: [
      html(
        '<p>In preparation for academic operations, a seven-storey facility with approximately 25,000 square feet of space has been secured at Duara, Daudpur, Rupganj, Narayanganj, to serve as UIT\'s temporary operational campus. The location was chosen for its proximity to the land acquired for the permanent campus, ensuring continuity and an easy future transition.</p>',
        '<p>The premises were inspected by an evaluation team of the University Grants Commission on 9 February 2026 as part of the regulatory verification process.</p>',
      ),
      dynamic('campus', 'Facilities', '', 'TEMPORARY_CAMPUS', 24),
      image('conference-hall-signage.jpg', 'Conference Hall of UIT: where ideas meet, debate, and evolve.'),
    ],
  },
  {
    slug: 'campus/development',
    title: 'Campus Development',
    eyebrow: 'Campus',
    status: 'PUBLISHED',
    featuredImage: 'campus-visualization-panorama.jpg',
    summary: 'The planned permanent campus at Rohila Mouza, Rupganj, developed in three phases.',
    needsVerification: true,
    verificationNote: 'Land figures differ between sources (14 bigha acquired per the progress report; 3.30 acres initial site per the Concept Paper). Phase areas follow the Design Plan; "Major Features" gives 5 / 50 / 150 acres.',
    blocks: [
      html(
        '<p>The permanent campus is planned at Rohila Mouza, Daudpur, Rupganj, Narayanganj, near the developing Purbachal area and about 20 km from Dhaka International Airport, the Airport Railway Station and the Dhaka Elevated Expressway. The long-term plan is a campus designed with Islamic architectural elements, framed by the natural scenery of the Shitalakshya river, with residential facilities for students, faculty and staff.</p>',
        '<p><strong>Status:</strong> land acquisition for the first phase has been completed (14 bigha according to the latest progress report) and the master plan has been finalized. Construction has not yet started. All campus images on this page are architectural visualizations or plans.</p>',
      ),
      image('campus-visualization-panorama.jpg', 'Architectural visualization of the proposed permanent campus. Not yet constructed.', 'full'),
      { type: 'STATS', data: {
        items: [
          { value: '15 bigha', label: 'Phase 1', note: 'About 5 acres' },
          { value: '60 bigha', label: 'Phase 2', note: 'About 20 acres' },
          { value: '150 bigha', label: 'Phase 3', note: 'About 50 acres' },
        ],
        sourceNote: 'Planned campus area by phase, UIT Design Plan.',
      } },
      cards('Planned Phase 1 facilities', [
        { title: 'Academic buildings' }, { title: 'Administrative building' }, { title: 'Male and female student housing' },
        { title: 'Central library' }, { title: 'Central mosque' }, { title: 'Convention centre' },
        { title: 'Playground' }, { title: 'Bus depot' }, { title: 'Technical support and staff quarters' },
      ], 3, 'From the Phase 1 layout plan (15 bigha).'),
      image('phase-1-layout-plan.jpg', 'Layout plan of the proposed Phase 1 campus (5 acres / 15 bigha).'),
      image('three-phase-boundary-map.jpg', 'Boundary map of the three-phase campus expansion plan.'),
      dynamic('campus', 'Development status', '', 'PERMANENT_CAMPUS,CAMPUS_DEVELOPMENT', 24),
    ],
  },
  {
    slug: 'campus/knowledge-city',
    title: 'Knowledge City',
    eyebrow: 'Campus',
    status: 'PUBLISHED',
    featuredImage: 'education-valley-banner.jpg',
    summary: 'A BIIT Trust concept for an Education Valley at Rohila Mouza, Daudpur, with UIT at its centre.',
    blocks: [
      html(
        '<p>BIIT Trust intends to develop a Knowledge City, also called the Education Valley, at Rohila Mouza, Daudpur, Rupganj, near the International Trade Fair Center in Purbachal. The initiative aims to integrate education, research and professional development in one purpose-built setting. This is a concept: apart from the land acquired for UIT, the components below are planned.</p>',
        '<p><strong>Vision:</strong> to build a world-class hub for education and professional excellence that transforms Bangladesh into a knowledge-based society, producing globally competent teachers, value-driven professionals and enlightened citizens.</p>',
        '<p><strong>Mission:</strong> to nurture skilled and ethically grounded teachers from primary to higher education; to develop competent professionals who combine technical expertise with integrity and social responsibility; and to create a knowledge ecosystem that inspires intellectual, moral and socio-economic transformation.</p>',
      ),
      image('knowledge-city-master-plan.jpg', 'Proposed Knowledge City master plan, Phases II and III (150 bigha).'),
      dynamic('campus', 'Planned components', '', 'KNOWLEDGE_CITY', 24),
    ],
  },
  {
    slug: 'admissions',
    title: 'Admissions',
    eyebrow: 'Admissions',
    status: 'PUBLISHED',
    featuredImage: 'temporary-campus-entrance.jpg',
    summary: 'Admissions at UIT have not opened yet. This page will carry official admission information once it is announced.',
    blocks: [
      html(
        '<p>The Ministry of Education approved the establishment of the University of Integrated Thought on 19 April 2026, and UIT is in the final phase of obtaining its Final Approval Certificate.</p>',
        '<p><strong>Admissions have not opened.</strong> No admission dates, fees, eligibility requirements or application forms have been announced. Please rely only on information published on this website or by UIT\'s official channels.</p>',
        '<p>The programs in UIT\'s Academic Master Plan are proposed. Phase I programs are planned for 2027-2028, subject to regulatory approval.</p>',
      ),
      cta('Plan ahead', 'See which programs are planned, or contact UIT for information.', [
        { label: 'Planned programs', url: '/academics/programs', style: 'primary' },
        { label: 'Contact UIT', url: '/contact', style: 'secondary' },
      ]),
    ],
  },
  {
    slug: 'contact',
    title: 'Contact',
    eyebrow: 'Get in touch',
    status: 'PUBLISHED',
    summary: 'Contact details for UIT\'s corporate office and campuses.',
    blocks: [dynamic('contact', '', 'UIT is currently reached through the UIT Trust and BIIT Trust corporate office in Uttara, Dhaka.')],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    status: 'PUBLISHED',
    needsVerification: true,
    verificationNote: 'Generic policy describing this website\'s actual behaviour. Have it reviewed by the university\'s legal adviser.',
    summary: 'How this website handles information.',
    blocks: [
      html(
        '<p>This policy explains how the official website of the University of Integrated Thought ("UIT", "we") handles information when you visit it.</p>',
        '<h3>Information we collect</h3><p>The public website does not ask visitors to create accounts or submit personal information, and it does not use advertising or third-party tracking cookies. Our servers may record standard technical information such as IP address, browser type and the pages requested, which is used to keep the site secure and working.</p>',
        '<h3>Cookies</h3><p>Cookies are used only for signing in to the website\'s content management area by authorized staff. They are not used to track public visitors.</p>',
        '<h3>Contacting us</h3><p>If you contact UIT by email or telephone, we use the information you provide only to respond to you.</p>',
        '<h3>Changes</h3><p>We may update this policy from time to time. The current version is always available on this page.</p>',
      ),
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    status: 'PUBLISHED',
    needsVerification: true,
    verificationNote: 'Generic terms. Have them reviewed by the university\'s legal adviser.',
    summary: 'Terms that apply to the use of this website.',
    blocks: [
      html(
        '<p>By using this website you agree to these terms.</p>',
        '<h3>Information on this website</h3><p>UIT aims to keep the information on this website accurate and up to date. Plans, proposed programs and campus visualizations describe intentions and may change; they are not offers of admission or guarantees of future facilities.</p>',
        '<h3>Intellectual property</h3><p>Text, photographs, logos and other material on this website belong to UIT, UIT Trust or BIIT Trust unless stated otherwise, and may not be reused without permission, except for fair use with attribution.</p>',
        '<h3>External links</h3><p>Links to other websites are provided for convenience. UIT is not responsible for their content.</p>',
        '<h3>Changes</h3><p>These terms may be updated from time to time.</p>',
      ),
    ],
  },
];
