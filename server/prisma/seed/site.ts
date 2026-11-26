import { PROGRAM_COUNT } from './academics.js';

/** Homepage sections in display order. "@file" values are resolved to media ids. */
export const HOMEPAGE_SECTIONS: { type: string; label: string; variant?: string; data: Record<string, unknown> }[] = [
  { type: 'ANNOUNCEMENT', label: 'Announcement bar', data: { limit: 1 } },
  {
    type: 'HERO',
    label: 'Hero',
    data: {
      eyebrow: 'University of Integrated Thought',
      title: 'Where human inquiry and revealed knowledge are taught as one',
      description:
        'UIT is committed to transforming higher education in Bangladesh through an ethical, interdisciplinary and research-driven approach, producing well-rounded graduates with knowledge, skills and values.',
      imageId: '@temporary-campus-entrance.jpg',
      focalX: 50,
      focalY: 45,
      overlay: 60,
      align: 'left',
      caption: 'UIT temporary campus, Duara, Daudpur, Rupganj',
      slides: [
        { imageId: '@temporary-campus-entrance.jpg', caption: 'UIT temporary campus, Duara, Daudpur, Rupganj' },
        { imageId: '@education-minister-meeting.jpg', caption: 'Meeting with the Honorable Education Minister of Bangladesh' },
        { imageId: '@malaysia-high-commission-meeting.jpg', caption: 'Courtesy visit to the High Commission of Malaysia in Dhaka' },
        { imageId: '@malaysia-high-commission-visit.jpg', caption: 'Courtesy visit to the High Commission of Malaysia in Dhaka' },
        { imageId: '@malaysia-high-commission-group.jpg', caption: 'UIT delegation at the High Commission of Malaysia in Dhaka' },
        { imageId: '@ugc-inspection-meeting.jpg', caption: 'UGC formal inspection at UIT' },
      ],
      buttons: [
        { label: 'Discover UIT', url: '/about', style: 'primary' },
        { label: 'Planned programs', url: '/academics/programs', style: 'secondary' },
      ],
    },
  },
  {
    type: 'ABOUT',
    label: 'Introduction',
    data: {
      eyebrow: 'About UIT',
      title: 'An education that brings faith, science and professional skill together',
      description: '',
      body:
        'UIT is an initiative of BIIT, a government-registered think tank with an academic record stretching back to 1989, and is a joint initiative of BIIT Trust and UIT Trust. Its promise is simple to state and hard to deliver: graduates who are competent in their field, grounded in values, and committed to the society around them.',
      imageId: '@temporary-campus-corridor.jpg',
      highlights: [
        { title: 'Establishment approved', text: 'Approved by the Ministry of Education on 19 April 2026; Final Approval Certificate pending.' },
        { title: 'Temporary campus', text: 'A seven-storey, 25,000 sq ft building in Rupganj, close to the permanent campus land.' },
        { title: 'Integrated model', text: 'Curriculum, teaching and assessment designed as one connected system.' },
      ],
      buttons: [{ label: 'About UIT', url: '/about', style: 'link' }],
    },
  },
  {
    type: 'STATISTICS',
    label: 'Key facts',
    variant: 'dark',
    data: {
      eyebrow: 'UIT at a glance',
      title: 'Planned from the ground up',
      items: [
        { value: '6', label: 'Planned schools', note: 'Academic Master Plan' },
        { value: String(PROGRAM_COUNT), label: 'Proposed programs', note: 'Phase I and Phase II' },
        { value: '5', label: 'Specialist centers', note: 'Research, engagement, development, publication, foundations' },
        { value: '25,000', label: 'Sq ft temporary campus', note: 'Seven storeys, Rupganj' },
      ],
      sourceNote: 'Figures from UIT\'s Academic Master Plan and progress reports. All programs are proposed and not yet offered.',
    },
  },
  {
    type: 'VISION',
    label: 'Vision',
    data: {
      eyebrow: 'Our vision',
      title: 'What UIT aims to become',
      items: [
        { text: 'To revive and accelerate the intellectual heritage of Muslims.' },
        { text: 'To become a leading center of excellence across all branches of higher education.' },
        { text: 'To produce well-rounded graduates and global citizens.' },
      ],
    },
  },
  {
    type: 'MISSION',
    label: 'Mission',
    variant: 'dark',
    data: {
      eyebrow: 'Our mission',
      title: 'Whom UIT serves',
      items: [
        { text: 'To serve humanity by building a knowledge and value-based society.' },
        { text: 'To serve society by producing good human beings.' },
        { text: 'To serve the Creator through education.' },
      ],
    },
  },
  {
    type: 'PHILOSOPHY',
    label: 'Philosophy',
    data: {
      eyebrow: 'The UIT model',
      title: 'An integrated education system',
      description: 'Spiritual intuition, reason, intellection and sensory knowledge, brought together in one curriculum.',
      pillars: [
        { title: 'Integrated curriculum', text: 'Professional knowledge, interdisciplinary learning, generic graduate capabilities and Islamic revealed knowledge, following the IIUC model.' },
        { title: 'Integrated pedagogy', text: 'The Integrated Pedagogy of Critical Thinking: interactive classrooms where students analyse, debate and form their own judgments.' },
        { title: 'Integrated assessment', text: 'Knowledge, skills, values and community contribution all count, beyond exams that reward memory alone.' },
      ],
      outcomeTitle: 'Well-rounded graduates',
      outcomeText: 'Integrated knowledge + generic skills + human values.',
      buttons: [{ label: 'Our philosophy', url: '/about/philosophy', style: 'link' }],
    },
  },
  {
    type: 'ACADEMICS',
    label: 'Academics',
    data: {
      eyebrow: 'Academics',
      title: 'Six planned schools',
      description: 'Undergraduate, master\'s and doctoral education planned across education, humanities and social sciences, business, science and engineering, health and life sciences, and agriculture.',
      statusNote: 'All programs are proposed under the Academic Master Plan. None is currently offered or open for admission.',
      buttons: [
        { label: 'Planned programs', url: '/academics/programs', style: 'primary' },
        { label: 'Schools', url: '/academics/faculties', style: 'secondary' },
      ],
    },
  },
  {
    type: 'CENTERS',
    label: 'Centers',
    data: {
      eyebrow: 'Specialist centers',
      title: 'Centers that support every school',
      description: 'Five centers are planned to drive research, co-curricular engagement, professional development, publication and foundational studies.',
      buttons: [{ label: 'All centers', url: '/centers', style: 'link' }],
    },
  },
  {
    type: 'RESEARCH',
    label: 'Research',
    variant: 'dark',
    data: {
      eyebrow: 'Research & innovation',
      title: 'A research-led university in the making',
      description: 'The Center for Research & Innovation plans to link academia, industry and government, so that research becomes products, services and policy.',
      imageId: '@uit-library-shelves.jpg',
      areasLimit: 8,
      buttons: [{ label: 'Research at UIT', url: '/research', style: 'primary' }],
    },
  },
  {
    type: 'CAMPUS',
    label: 'Campus',
    data: {
      eyebrow: 'Campus',
      title: 'Today\'s campus, tomorrow\'s vision',
      currentTitle: 'Temporary campus: operational',
      currentText: 'A seven-storey building of about 25,000 sq ft at Duara, Daudpur, Rupganj, with offices, a conference hall and the UIT Library. Inspected by the UGC on 9 February 2026.',
      currentImageId: '@temporary-campus-building.jpg',
      futureTitle: 'Permanent campus: proposed',
      futureText: 'A three-phase campus planned at Rohila Mouza, Rupganj, near Purbachal. The master plan is finalized; construction has not yet started. Image: architectural visualization.',
      futureImageId: '@campus-visualization-panorama.jpg',
      buttons: [
        { label: 'Temporary campus', url: '/campus/temporary-campus', style: 'secondary' },
        { label: 'Campus development', url: '/campus/development', style: 'secondary' },
      ],
    },
  },
  {
    type: 'NEWS',
    label: 'Latest news',
    data: { eyebrow: 'News', title: 'Latest from UIT', limit: 4, buttons: [{ label: 'All news', url: '/news', style: 'link' }] },
  },
  {
    type: 'EVENTS',
    label: 'Upcoming events',
    data: { eyebrow: 'Events', title: 'Upcoming events', limit: 3, hideWhenEmpty: true, emptyMessage: 'No upcoming events have been announced.', buttons: [{ label: 'All events', url: '/events', style: 'link' }] },
  },
  {
    type: 'PARTNERSHIPS',
    label: 'Milestones & engagement',
    data: {
      eyebrow: 'Milestones & engagement',
      title: 'Building UIT with regulators and partners',
      description: 'Documented steps in UIT\'s establishment and its engagement with institutions at home and abroad.',
      items: [
        { title: 'UGC formal inspection', date: '9 Feb 2026', text: 'A four-member University Grants Commission committee inspected UIT\'s readiness.', imageId: '@ugc-inspection-group.jpg' },
        { title: 'High Commission of Malaysia', date: '1 Feb 2026', text: 'Courtesy visit to explore academic collaboration with Malaysian institutions.', imageId: '@malaysia-high-commission-group.jpg' },
        { title: 'First Board of Trustees meeting', date: '17 Oct 2025', text: 'The Deed of Trust was signed and academic leadership provisionally appointed.', imageId: '@board-of-trustees-first-meeting.jpg' },
        { title: 'UNIW delegation', date: '7 Jul 2025', text: 'The Union of NGOs of the Islamic World reviewed the UIT campus master plan in Rupganj.', imageId: '@uniw-social-business-summit.jpg' },
      ],
      buttons: [{ label: 'History & milestones', url: '/about/history', style: 'link' }],
    },
  },
  {
    type: 'GALLERY',
    label: 'Gallery',
    data: { eyebrow: 'Gallery', title: 'Inside the temporary campus', galleryId: '#temporary-campus', limit: 8, buttons: [{ label: 'View gallery', url: '/campus/gallery', style: 'link' }] },
  },
  {
    type: 'CTA',
    label: 'Call to action',
    variant: 'image',
    data: {
      eyebrow: 'Stay informed',
      title: 'Follow UIT\'s journey',
      description: 'Admissions have not opened yet. Official announcements will be published here first.',
      imageId: '@land-visit-panorama.jpg',
      buttons: [
        { label: 'Admissions status', url: '/admissions', style: 'primary' },
        { label: 'Contact UIT', url: '/contact', style: 'secondary' },
      ],
    },
  },
];

export const CAMPUS_ITEMS: { title: string; description: string; image?: string; category: string; developmentStatus: string; needsVerification?: boolean }[] = [
  { title: 'Temporary campus building', category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', image: 'temporary-campus-building.jpg', description: 'A seven-storey building of about 25,000 sq ft at Duara, Daudpur, Rupganj, within one kilometre of the permanent campus land.' },
  { title: 'Vice-Chancellor and Pro-Vice-Chancellor offices', category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', image: 'vice-chancellor-office.jpg', description: 'Offices of the university\'s academic leadership, along with the Registrar and Project Coordinator office.' },
  { title: 'Conference Hall', category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', image: 'conference-hall.jpg', description: 'Where ideas meet, debate, and evolve.' },
  { title: 'Offices of schools and centers', category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', image: 'schools-signage.jpg', description: 'Different disciplines, one integrated vision.' },
  { title: 'UIT Library', category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', image: 'uit-library.jpg', description: 'Where revealed knowledge meets acquired knowledge.' },
  { title: 'Resource Center and Teachers\' Room', category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', image: 'meeting-room.jpg', description: 'Tools that activate minds beyond memorization, and space for faculty.' },
  { title: 'Site office', category: 'PERMANENT_CAMPUS', developmentStatus: 'CURRENT', image: 'site-office.jpg', description: 'Every brick here is laid with a dream of integrated thought.' },
  { title: 'Permanent campus land', category: 'PERMANENT_CAMPUS', developmentStatus: 'IN_PROGRESS', image: 'land-signboard-field.jpg', needsVerification: true, description: 'Land for the first phase has been acquired at Rohila Mouza, Daudpur, Rupganj (14 bigha according to the latest progress report). Land development is in progress.' },
  { title: 'Campus master plan', category: 'CAMPUS_DEVELOPMENT', developmentStatus: 'IN_PROGRESS', image: 'phase-1-3d-layout.jpg', description: 'Comprehensive architectural and infrastructural master planning has been completed. Construction has not yet started.' },
  { title: 'Phase 1 campus (15 bigha)', category: 'CAMPUS_DEVELOPMENT', developmentStatus: 'PROPOSED', image: 'campus-visualization-aerial.jpg', description: 'Academic and administrative buildings, student housing, central library, mosque, convention centre, playground and support facilities. Architectural visualization.' },
  { title: 'Phase 2 campus (60 bigha)', category: 'CAMPUS_DEVELOPMENT', developmentStatus: 'PROPOSED', image: 'three-phase-boundary-map.jpg', description: 'Expansion of the campus to about 20 acres.' },
  { title: 'Phase 3 campus (150 bigha)', category: 'CAMPUS_DEVELOPMENT', developmentStatus: 'PROPOSED', image: 'campus-visualization-canal.jpg', description: 'Full campus of about 50 acres with residential facilities for students, faculty and staff. Architectural visualization.' },
  { title: 'Institute of Teacher Education', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned institute to train teachers in pedagogy and integrated education, building on BIIT\'s teacher training experience.' },
  { title: 'Institute of Technical and Vocational Education', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned institute offering vocational programs and diplomas under the Bangladesh Technical Education Board.' },
  { title: 'Institute of Islamic Finance and Banking', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned research and training institute for professionals in Islamic banking and finance.' },
  { title: 'Institute of Agricultural Education', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned agriculture institute offering a Diploma in Agriculture for the region.' },
  { title: 'Nursing Institute and College', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned institute offering diplomas in nursing and midwifery.' },
  { title: 'Center for Civilizational Dialogue', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned hub for research, dialogue and exchange among cultures and civilizations.' },
  { title: 'Center for Medical Ethics & Professionalism', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned center integrating bioethics and professionalism into medical education.' },
  { title: 'Center for Professional Studies', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned platform for integrated professional training, certificates and diplomas.' },
  { title: 'Al-Hikmah Library', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned library and cultural center inspired by the historic House of Wisdom in Baghdad.' },
  { title: 'Academia Publishing House and BIIT Publication', category: 'KNOWLEDGE_CITY', developmentStatus: 'CONCEPT', description: 'Planned home for academic and translated publishing within the Knowledge City.' },
];

export const RESEARCH_AREAS = {
  PHASE_I: [
    'Emerging & Cutting-Edge Technologies', 'Artificial Intelligence & Society', 'Digital Governance', 'Renewable Energy',
    'Smart City & Urban Analytics', 'Disaster Intelligence & Climate Resilience', 'Poverty & Development Innovation', 'Innovative Agricultural Technologies',
  ],
  PHASE_II: [
    'Sustainable & Smart Manufacturing', 'Advanced Manufacturing & Material Processing', 'Advanced & Low-Dimensional Materials', 'Image & Signal Processing',
    'Intelligent Systems for Emerging Technologies', 'Energy Sciences & Power Systems', 'Innovation in Medical Engineering', 'Printable Electronics & Photonics',
  ],
};

export const RESEARCH_INITIATIVES = [
  { title: 'Research policy framework', summary: 'A university research policy setting goals, ethics and reporting.' },
  { title: 'Seed grants and faculty incentives', summary: 'Internal research grants funded from 5% of revenue, rising to 10% within a decade.' },
  { title: 'Thematic research clusters', summary: 'Cross-disciplinary clusters around the priority research areas.' },
  { title: 'Research ethics committee', summary: 'Ethical review of research involving people, data and communities.' },
  { title: 'Undergraduate research program', summary: 'Research projects, credits and stipends for undergraduate students.' },
];

export const GALLERIES: { slug: string; title: string; description: string; category: string; cover: string; files: string[] }[] = [
  {
    slug: 'temporary-campus',
    title: 'Temporary Campus',
    description: 'The UIT temporary campus at Duara, Daudpur, Rupganj.',
    category: 'Campus',
    cover: 'temporary-campus-entrance.jpg',
    files: ['temporary-campus-entrance.jpg', 'temporary-campus-building.jpg', 'temporary-campus-corridor.jpg', 'conference-hall-signage.jpg', 'conference-hall.jpg', 'meeting-room.jpg', 'vice-chancellor-office.jpg', 'schools-signage.jpg', 'shss-signage.jpg', 'centers-signage.jpg', 'uit-library.jpg', 'uit-library-shelves.jpg'],
  },
  {
    slug: 'permanent-campus-site',
    title: 'Permanent Campus Site',
    description: 'The site office, land and site visits at Rohila Mouza, Rupganj.',
    category: 'Campus',
    cover: 'land-visit-panorama.jpg',
    files: ['site-office.jpg', 'land-signboard-field.jpg', 'land-signboard-group.jpg', 'land-visit-panorama.jpg', 'site-plan-review.jpg', 'site-map-review.jpg', 'site-visit-group.jpg', 'site-visit-trio.jpg', 'community-gathering-site.jpg', 'knowledge-city-banner-group.jpg', 'education-valley-banner.jpg', 'consultation-meeting-2024.jpg'],
  },
  {
    slug: 'campus-vision',
    title: 'Campus Vision',
    description: 'Architectural visualizations and plans of the proposed permanent campus. Not yet constructed.',
    category: 'Campus Development',
    cover: 'campus-visualization-panorama.jpg',
    files: ['campus-visualization-panorama.jpg', 'campus-visualization-aerial.jpg', 'campus-visualization-canal.jpg', 'phase-1-3d-layout.jpg', 'phase-1-layout-plan.jpg', 'three-phase-boundary-map.jpg', 'knowledge-city-master-plan.jpg', 'campus-location-map.jpg'],
  },
  {
    slug: 'institutional-milestones',
    title: 'Institutional Milestones',
    description: 'Regulatory inspection, Board of Trustees meetings and institutional visits.',
    category: 'Institutional',
    cover: 'ugc-inspection-group.jpg',
    files: ['ugc-inspection-group.jpg', 'ugc-inspection-group-2.jpg', 'ugc-inspection-group-3.jpg', 'ugc-inspection-meeting.jpg', 'board-of-trustees-first-meeting.jpg', 'board-of-trustees-2nd-meeting.jpg', 'board-of-trustees-2nd-meeting-group.jpg', 'ministry-of-education-submission.jpg', 'education-minister-meeting.jpg', 'malaysia-high-commission-visit.jpg', 'malaysia-high-commission-meeting.jpg', 'malaysia-high-commission-group.jpg', 'dhaka-university-vc-meeting.jpg', 'uniw-social-business-summit.jpg'],
  },
];

type MenuSeed = { label: string; url: string; description?: string; visible?: boolean; children?: MenuSeed[] };
export const MENUS: { key: string; name: string; location: 'HEADER' | 'FOOTER'; items: MenuSeed[] }[] = [
  {
    key: 'header',
    name: 'Main navigation',
    location: 'HEADER',
    items: [
      { label: 'About', url: '/about', children: [
        { label: 'About UIT', url: '/about', description: 'Who we are and where we stand' },
        { label: 'Vision & Mission', url: '/about/vision-mission', description: 'What UIT aims to become' },
        { label: 'Philosophy', url: '/about/philosophy', description: 'The integrated education model' },
        { label: 'History & Milestones', url: '/about/history', description: 'The road to establishment' },
        { label: 'Leadership', url: '/about/leadership', description: 'Board, advisers and academic officers' },
      ] },
      { label: 'Academics', url: '/academics', children: [
        { label: 'Overview', url: '/academics', description: 'The Academic Master Plan' },
        { label: 'Planned Programs', url: '/academics/programs', description: 'Programs by school and phase' },
        { label: 'Schools', url: '/academics/faculties', description: 'Six planned schools' },
        { label: 'Departments', url: '/academics/departments', description: 'Departments by school' },
      ] },
      { label: 'Research', url: '/research', children: [
        { label: 'Research at UIT', url: '/research', description: 'Strategy and priority areas' },
        { label: 'Innovation', url: '/research/innovation', description: 'From research to real-world value' },
        { label: 'Projects', url: '/research/projects', description: 'Research projects' },
      ] },
      { label: 'Centers', url: '/centers' },
      { label: 'Campus', url: '/campus', children: [
        { label: 'Campus Overview', url: '/campus', description: 'Today and tomorrow' },
        { label: 'Temporary Campus', url: '/campus/temporary-campus', description: 'Operational in Rupganj' },
        { label: 'Campus Development', url: '/campus/development', description: 'The planned permanent campus' },
        { label: 'Knowledge City', url: '/campus/knowledge-city', description: 'The Education Valley concept' },
        { label: 'Gallery', url: '/campus/gallery', description: 'Photographs' },
      ] },
      { label: 'News & Events', url: '/news', children: [
        { label: 'News', url: '/news', description: 'Updates and milestones' },
        { label: 'Events', url: '/events', description: 'Upcoming and past events' },
      ] },
      { label: 'Contact', url: '/contact' },
    ],
  },
  {
    key: 'footer-explore',
    name: 'Footer: Explore',
    location: 'FOOTER',
    items: [
      { label: 'About UIT', url: '/about' }, { label: 'Vision & Mission', url: '/about/vision-mission' }, { label: 'Leadership', url: '/about/leadership' }, { label: 'Academics', url: '/academics' },
      { label: 'Research', url: '/research' }, { label: 'Centers', url: '/centers' }, { label: 'Campus', url: '/campus' },
    ],
  },
  {
    key: 'footer-resources',
    name: 'Footer: Resources',
    location: 'FOOTER',
    items: [
      { label: 'News', url: '/news' }, { label: 'Events', url: '/events' }, { label: 'Admissions', url: '/admissions' },
      { label: 'Gallery', url: '/campus/gallery' }, { label: 'Contact', url: '/contact' },
    ],
  },
  {
    key: 'footer-legal',
    name: 'Footer: Legal',
    location: 'FOOTER',
    items: [{ label: 'Privacy Policy', url: '/privacy-policy' }, { label: 'Terms of Use', url: '/terms' }],
  },
];

export const CONTACTS = [
  { label: 'Corporate office', type: 'ADDRESS', value: 'UIT Trust, House 4, Road 2, Sector 9, Uttara Model Town, Dhaka-1230, Bangladesh', description: 'UIT Trust and BIIT Trust', needsVerification: true },
  { label: 'Temporary campus', type: 'ADDRESS', value: 'Duara, Daudpur, Rupganj, Narayanganj, Bangladesh', description: null, needsVerification: false },
  { label: 'Permanent campus (proposed)', type: 'ADDRESS', value: 'Rohila Mouza, Daudpur, Rupganj, Narayanganj, Bangladesh', description: null, needsVerification: false },
  { label: 'Telephone', type: 'PHONE', value: '+88 02 8917509', description: 'BIIT Trust', needsVerification: true },
  { label: 'Mobile', type: 'PHONE', value: '+880 1712-757556', description: 'BIIT Trust', needsVerification: true },
  { label: 'Email', type: 'EMAIL', value: 'uit.edu.bd@gmail.com', description: 'UIT', needsVerification: false },
];

export const SETTINGS = {
  'site.identity': {
    name: 'University of Integrated Thought',
    shortName: 'UIT',
    tagline: 'Producing well-rounded graduates with knowledge, skills and values',
    description: 'A joint initiative of BIIT Trust and UIT Trust, committed to an ethical, interdisciplinary and research-driven higher education in Bangladesh.',
    statusNote: 'Establishment approved by the Ministry of Education on 19 April 2026. Final Approval Certificate pending. Admissions have not opened.',
    logoId: '@uit-logo-light-bg.png',
    logoOnDarkId: '@uit-logo.png',
  },
  'site.header': { ctaLabel: 'Admissions', ctaUrl: '/admissions', showSearch: true },
  'site.footer': {
    description: 'The University of Integrated Thought is a joint initiative of BIIT Trust and UIT Trust in Rupganj, Narayanganj, Bangladesh.',
    copyright: 'University of Integrated Thought. All rights reserved.',
    note: 'Campus visualizations show proposed developments. All academic programs are proposed and not yet offered.',
  },
  'site.seo': {
    titleTemplate: '%s | University of Integrated Thought',
    defaultTitle: 'University of Integrated Thought (UIT), Bangladesh',
    defaultDescription: 'Official website of the University of Integrated Thought (UIT), a university in Rupganj, Narayanganj that integrates knowledge, skills and values.',
    ogImageId: '@temporary-campus-entrance.jpg',
    siteUrl: '',
  },
};
