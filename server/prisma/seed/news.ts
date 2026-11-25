/**
 * News articles reporting dated milestones documented in "6. Temporary Campus of UIT", "7. Different Stages of
 * Progress of UIT" and the UNIW bulletin. Items without a documented date are seeded as drafts.
 */
export interface SeedArticle {
  title: string;
  date: string | null;
  category: 'Regulatory Milestones' | 'Institutional Updates' | 'Delegations & Visits';
  image?: string;
  featured?: boolean;
  summary: string;
  paragraphs: string[];
}

export const NEWS_CATEGORIES = [
  { name: 'Regulatory Milestones', description: 'Steps in UIT\'s approval under the Private University Act, 2010.' },
  { name: 'Institutional Updates', description: 'Governance, campus and academic planning.' },
  { name: 'Delegations & Visits', description: 'Meetings and visits with partners and stakeholders.' },
];

export const ARTICLES: SeedArticle[] = [
  {
    title: 'Ministry of Education approves the establishment of UIT',
    date: '2026-04-19',
    category: 'Regulatory Milestones',
    image: 'temporary-campus-entrance.jpg',
    featured: true,
    summary: 'The Ministry of Education approved the establishment of the University of Integrated Thought on 19 April 2026. UIT is now in the final phase of obtaining its Final Approval Certificate.',
    paragraphs: [
      'The Honorable Education Minister of Bangladesh, Dr. A. N. M. Ehsanul Haque Milon, approved the establishment of the University of Integrated Thought (UIT) on 19 April 2026.',
      'The approval follows the University Grants Commission\'s formal inspection of the proposed university on 9 February 2026 and its positive recommendation, forwarded to the Ministry of Education on 10 March 2026.',
      'With this endorsement, UIT is now in the final phase of obtaining its Final Approval Certificate. UIT is expected to begin its administrative and academic activities at its temporary campus in Rupganj. Admissions have not yet opened.',
    ],
  },
  {
    title: 'Strategic meeting on UIT\'s academic launch',
    date: '2026-03-25',
    category: 'Institutional Updates',
    summary: 'The Chairman of UIT Trust held a follow-up meeting at the Ministry of Education to discuss UIT\'s academic roadmap.',
    paragraphs: [
      'Professor Dr. M. Abdul Aziz, Chairman of the UIT Trust, held a follow-up meeting at the Ministry of Education on 25 March 2026 to discuss the academic roadmap of the proposed university.',
      'The meeting was attended by the prospective Vice-Chancellor and Pro-Vice-Chancellor. Discussions focused on initiating academic activities, outlining strategic priorities and ensuring that UIT\'s programs meet national and international standards.',
    ],
  },
  {
    title: 'UIT Trust Chairman meets the Education Minister on final approval',
    date: '2026-03-12',
    category: 'Regulatory Milestones',
    summary: 'Professor Dr. M. Abdul Aziz briefed the Education Minister on UIT\'s academic infrastructure and integrated curriculum.',
    paragraphs: [
      'On 12 March 2026, Professor Dr. M. Abdul Aziz, Chairman of the UIT Trust, met the Honorable Education Minister, Dr. A. N. M. Ehsanul Haque Milon, to accelerate the final approval process for the University of Integrated Thought.',
      'Professor Aziz briefed the Minister on the university\'s academic infrastructure and its integrated curriculum, and emphasized its readiness to meet the quality standards of the University Grants Commission.',
      'The Minister engaged in a constructive dialogue on UIT\'s potential to produce skilled graduates, and assured that the Final Approval Certificate would be issued as soon as possible.',
    ],
  },
  {
    title: 'UGC submits inspection report recommending approval of UIT',
    date: '2026-03-10',
    category: 'Regulatory Milestones',
    summary: 'The University Grants Commission formally recommended that the Government grant approval for UIT\'s establishment.',
    paragraphs: [
      'On 10 March 2026, the University Grants Commission (UGC) issued an official memorandum confirming the submission of its committee\'s inspection report on the University of Integrated Thought, following the site visit of 9 February 2026.',
      'Based on the findings, the UGC formally recommended that the Government of Bangladesh grant approval for the university\'s establishment and operation. The report was forwarded to the Secondary and Higher Education Division of the Ministry of Education for final review.',
    ],
  },
  {
    title: 'UIT Trust Chairman congratulates the new Education Minister',
    date: '2026-02-19',
    category: 'Delegations & Visits',
    summary: 'Professor Dr. M. Abdul Aziz met the newly appointed Education Minister at the Secretariat.',
    paragraphs: [
      'Professor Dr. M. Abdul Aziz, Chairman of UIT Trust, met the newly appointed Education Minister, Dr. A. N. M. Ehsanul Haque Milon, at the Secretariat on 19 February 2026.',
      'The discussion covered curriculum development, quality assurance and the importance of integrating ethical values into the education system. Professor Aziz reaffirmed UIT\'s commitment to supporting the Ministry\'s efforts to advance quality education.',
    ],
  },
  {
    title: 'UGC conducts formal inspection at UIT',
    date: '2026-02-09',
    category: 'Regulatory Milestones',
    image: 'ugc-inspection-group.jpg',
    summary: 'A four-member UGC committee reviewed the academic, administrative and infrastructural readiness of the proposed university.',
    paragraphs: [
      'On 9 February 2026, the University Grants Commission (UGC) of Bangladesh conducted a formal inspection at the proposed site of the University of Integrated Thought in Rupganj, Narayanganj.',
      'The committee, formed by the UGC on 5 February 2026, was led by Professor Dr. Muhammad Anawar Hossain, Director of the Private University Division, as Convener. It reviewed the academic, administrative and infrastructural standards of the proposed university, assessing its physical facilities, land and overall preparedness in accordance with the Private University Act, 2010.',
    ],
  },
  {
    title: 'Meeting with expected faculty members of UIT',
    date: '2026-02-07',
    category: 'Institutional Updates',
    summary: 'Prospective faculty members met at the BIIT office to discuss UIT\'s vision, academic planning and curriculum development.',
    paragraphs: [
      'A meeting with prospective faculty members of the University of Integrated Thought was held on 7 February 2026 at the BIIT office.',
      'Discussions focused on the vision of UIT, academic planning, curriculum development and the role of faculty in shaping an institution that integrates ethical values with modern knowledge systems.',
    ],
  },
  {
    title: 'UGC forms inspection committee for UIT',
    date: '2026-02-05',
    category: 'Regulatory Milestones',
    summary: 'The University Grants Commission formed a four-member committee to inspect the proposed university.',
    paragraphs: [
      'On 5 February 2026, the University Grants Commission of Bangladesh issued an official memorandum forming a four-member committee to inspect the proposed site of the University of Integrated Thought in Rupganj, Narayanganj.',
      'The committee was tasked with a physical inspection of the proposed campus and a report with recommendations, in accordance with the Private University Act, 2010.',
    ],
  },
  {
    title: 'UIT delegation visits the High Commission of Malaysia',
    date: '2026-02-01',
    category: 'Delegations & Visits',
    image: 'malaysia-high-commission-visit.jpg',
    summary: 'A delegation led by Professor Dr. M. Abdul Aziz met the High Commissioner of Malaysia in Dhaka.',
    paragraphs: [
      'On 1 February 2026, a delegation led by Professor Dr. M. Abdul Aziz paid a courtesy visit to the High Commission of Malaysia in Dhaka and met His Excellency Mohd Shuhada Othman, High Commissioner of Malaysia.',
      'Discussions focused on exploring academic collaboration and strengthening ties between UIT and Malaysian institutions of higher learning.',
    ],
  },
  {
    title: 'Meeting with the UGC Member (Private University)',
    date: '2026-01-12',
    category: 'Regulatory Milestones',
    summary: 'A UIT Trust delegation presented the vision and progress of the proposed university to the University Grants Commission.',
    paragraphs: [
      'On 12 January 2026, a delegation from the UIT Trust met the Honorable Member (Private University) of the University Grants Commission of Bangladesh.',
      'The meeting provided an opportunity to present the vision and progress of the proposed university and to seek guidance on the regulatory process.',
    ],
  },
  {
    title: 'Saudi delegate assesses feasibility of a mosque on the UIT campus',
    date: '2026-01-09',
    category: 'Delegations & Visits',
    summary: 'A visiting delegate from Saudi Arabia toured the proposed campus land to assess the feasibility of a campus mosque.',
    paragraphs: [
      'On 9 January 2026, Sheikh Fahad Al-Fayaz, a visiting delegate from Saudi Arabia, toured the land and buildings of the proposed UIT campus in Rupganj, Narayanganj, to assess the feasibility of constructing a mosque within the university premises.',
      'The visit was conducted under the guidance of UIT Founder Trustee Sheikh Abdus Subhan Azhari.',
    ],
  },
  {
    title: 'UIT application submitted to the Ministry of Education',
    date: '2025-12-09',
    category: 'Regulatory Milestones',
    image: 'ministry-of-education-submission.jpg',
    summary: 'The UIT Trust formally applied to establish the University of Integrated Thought under the Private University Act, 2010.',
    paragraphs: [
      'On 9 December 2025, the UIT Trust formally initiated the process of establishing the University of Integrated Thought by submitting its application to the Ministry of Education, Government of the People\'s Republic of Bangladesh.',
      'The application was hand-delivered to the Bangladesh Secretariat in Dhaka in compliance with the Private University Act, 2010, together with the complete set of documents prescribed by the Ministry of Education and the University Grants Commission.',
    ],
  },
  {
    title: 'UIT Board of Trustees holds its first meeting',
    date: '2025-10-17',
    category: 'Institutional Updates',
    image: 'board-of-trustees-first-meeting.jpg',
    summary: 'The Board signed the Deed of Trust and approved provisional appointments of UIT\'s academic leadership.',
    paragraphs: [
      'On 17 October 2025, the Board of Trustees of the University of Integrated Thought held its first official meeting at the Hotel Lakeshore Grand, Dhaka, bringing together founding members to lay the legal and financial groundwork for the university.',
      'The Board signed the Deed of Trust, appointed Professor Dr. M. Abdul Aziz as Chairman, and approved provisional appointments of the Vice-Chancellor, Pro-Vice-Chancellor and Treasurer.',
    ],
  },
  {
    title: 'UNIW delegation visits the Knowledge City site in Rupganj',
    date: '2025-07-07',
    category: 'Delegations & Visits',
    image: 'uniw-social-business-summit.jpg',
    summary: 'A delegation of the Union of NGOs of the Islamic World reviewed the UIT campus master plan; a consultation on UIT was held the same day in Dhaka.',
    paragraphs: [
      'On 7 July 2025, a UNIW delegation led by Mr. Ayup Akbal, Secretary General of the Union of NGOs of the Islamic World, visited the proposed site of the Knowledge City, including UIT, in Rupganj, Narayanganj, accompanied by Prof. Dr. M. Abdul Aziz, Director General of BIIT.',
      'The delegation reviewed the master plan of the UIT campus. The same day, a consultation on UIT jointly organized by BIIT Trust and UIT Foundation was held at the Radisson Blu Water Garden Hotel, Dhaka, with Bangladeshi academics, focusing on curriculum frameworks and international partnerships.',
      'The visit followed the International Social Business Summit organized by UNIW with BIIT and the SAWAB Foundation in Dhaka on 5 July 2025 (pictured).',
    ],
  },
  {
    title: 'UIT Trust delegation meets the Vice-Chancellor of Dhaka University',
    date: null,
    category: 'Delegations & Visits',
    image: 'dhaka-university-vc-meeting.jpg',
    summary: 'A UIT Trust delegation sought guidance on the university proposal from the Vice-Chancellor of the University of Dhaka.',
    paragraphs: [
      'A delegation from the UIT Trust met the Vice-Chancellor of Dhaka University to seek guidance and support for the university proposal. Discussions centred on academic collaboration, regulatory insights and strategies to strengthen the application to establish UIT.',
    ],
  },
];
