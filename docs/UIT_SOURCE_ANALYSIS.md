# UIT Source Analysis

This document records what the official UIT source materials say, how reliable each statement is, and where each fact is used on the website. It is the reference for anyone editing content in the CMS.

## 1. Inventory

All originals stay untouched in the repository root. Extracted text, rendered PDF pages, embedded images and the unzipped campus archive live in `source-materials/_extracted/` (regenerate with `python source-materials/extract_sources.py`).

| # | Source | Type | Content |
|---|--------|------|---------|
| 1 | UIT - Bulletin | PDF, 8 pp | Vision, mission, cognitive-learning concept, "Expected Features", BIIT strengths, proposed schools, action plan 2022-2030, location map, masterplan, 2022-2025 events, site visits, contacts |
| 2 | UIT - Design Plan | PDF, 4 pp (image only) | "About UIT" statement, campus renders, building floor plans, location map, 3-phase boundary map, academic building cost, Phase 1/2/3 descriptions |
| 3 | UIT - Concept Paper (.docx) / V1.1 (.pdf) | 18 pp | The most complete narrative: UIT at a glance, gaps in Bangladesh HE, philosophy, vision & mission, integrated curriculum / pedagogy (IPCT) / assessment, evaluation weights, distinctive features, schools & departments, campus, delivery phases, governance, funding packages, risk management, legal status, advisers, Board of Directors |
| 4 | Major Features of UIT | DOCX | Unique programs, mixed faculty, Bridge Institute, research-led teaching, academic partnerships, permanent campus phases, leadership, "Why integrated university" |
| 5 | Academic Master Plan - Academic Programs | DOCX table | 64 planned programs by school, department and launch phase (Phase I 2027-28, Phase II 2029-30, Phase III 2031+) |
| 6 | Temporary Campus of UIT | DOCX, 54 images | Regulatory progress, temporary campus facilities with photos, dated milestones Oct 2025 - Mar 2026 |
| 7 | Different Stages of Progress of UIT | DOCX | Board of Trustees (RJSC), land, temporary campus, master plan, IIIT visit, academic management team, regulatory submission, UGC inspection & recommendation, Ministry approval 19 Apr 2026 |
| 8 | Visit of UNIW Delegations in Bangladesh | PDF bulletin | UNIW delegation of 7 July 2025, consultation at Radisson Blu, Social Business Summit 5 July 2025, related meetings |
| 9 / 9.1 | UIT_R15 15 BIGHA / 150 BIGHA | PDF drawings | Phase I layout plan (15 bigha) and Knowledge City master plan (Phases II & III) with building schedule |
| 10.1-10.5 | Center documents | DOCX | CRI, CCCE, CPD (+ Foundation Skills content), CTP, Center/School of Foundational Studies |
| 11 | Concept paper of Knowledge City | DOCX | Knowledge City / Education Valley vision, mission and its planned institutes |
| ZIP | Site Office and Permanent Campus | 10 photos | Land signboards, site visits, Knowledge City banner, community gathering |
| Photos | Root folder | 13 photos | 2nd Board of Trustees meeting, Malaysian High Commission visit, UGC inspection (9 Feb 2026), Education Minister meeting, Dhaka University VC meeting |

## 2. Institutional identity

- **Official name:** University of Integrated Thought (UIT). Several older materials use "University of Integrated Thought**s**"; one paragraph says "University of Islamic Thought". The concept paper V1.1, the logo and the progress report use *Integrated Thought*, so the site uses that.
- **Tagline (logo cover, campus signage):** "Producing well-rounded graduate with knowledge, skills and values".
- **CPD document slogan:** "learning to teach and teaching to learn" (proposed slogan, not used as primary tagline).
- **Founding bodies:** a joint initiative of BIIT Trust (registered 2007 under the Trust Act 1882, Reg. No. 11839/95-IV) and UIT Trust (registered 2025 under the Trust Act 1882, Reg. No. 10692/IV-2/25). UIT Board of Trustees approved by RJSC (No. S-14449/2026).
- **BIIT:** Bangladesh Institute of Islamic Thought, a government-registered think tank with an academic record since 1989.
- **Logo:** teal-and-orange shield mark extracted from the Temporary Campus document cover (`server/prisma/seed-assets/uit-logo*.png`).

## 3. Introduction, vision, mission and philosophy

**Introduction (Design Plan, "About UIT")** — "The University of Integrated Thought (UIT) is committed to transforming higher education in Bangladesh through an ethical, interdisciplinary, and research-driven approach. By addressing the shortcomings of conventional, rote-based, and Eurocentric models, UIT seeks to develop well-rounded graduates equipped with strong moral values, critical thinking abilities, and a deep commitment to social equity and sustainable development."

**Vision (Concept Paper V1.1)**
1. To revive and accelerate the intellectual heritage of Muslims. *(Bulletin and Design Plan: "To revive the intellectual heritage of Ummah")*
2. To become a leading center of excellence across all branches of higher education.
3. To produce well-rounded graduates and global citizens.

**Mission**
1. To serve humanity by building a knowledge and value-based society.
2. To serve society by producing good human beings.
3. To serve the Creator through education.

**Philosophy** — Modern secular education treats reason and social norms but stays "arrested at surface", failing to reach value, purpose and the divine root. UIT's curriculum joins secular and faith dimensions to bring together *spiritual intuition, reason, intellection and sensory knowledge*. Concretely: intellectual depth, moral integrity and civic responsibility, supported by dynamic teaching, research-intensive study and academia-industry ties.

**Cognitive learning (Bulletin)** — "Developing the Human Potential: engaging the 86 billion neurons allotted to each created human being", as opposed to rote learning.

**The UIT Model: an integrated education system** — curriculum, teaching, assessment and evaluation designed as one system:
- *Integrated curriculum* (Islamic Integrated University Curriculum, IIUC model) with four domains: professional & disciplinary knowledge; interdisciplinary & multidisciplinary learning; generic graduate capabilities; Islamic revealed knowledge.
- *Integrated teaching pedagogy*: Integrated Pedagogy of Critical Thinking (IPCT, Aziz 2021) built on the teacher, the lesson and the students.
- *Integrated assessment*: moral checklists, implicit association tests, volunteering and group projects, observed conduct.
- *Evaluation weights*: core disciplinary knowledge 50%, specialized knowledge 20%, internship & practical skills 10%, campus life values & attitudes 10%, community engagement & volunteerism 10%.

**Why "integrated university"** — Integrated Knowledge + Generic Skills + Human Values = Well-rounded Graduates.

## 4. Distinctive features (planned design choices, not yet outcomes)

- Diverse student body: 25% international, 25% marginalized local students on full IIIT scholarships, 50% meritorious (equal women/men).
- Diverse faculty: 10% international, 40% non-resident Bangladeshi, 50% local; visiting professors and professors emeritus.
- Research and teaching balance: **conflict** — Concept Paper V1.1, Bulletin and CRI say 60% teaching / 40% research; Major Features says 50/50. The site uses 60/40 (majority of sources) and flags it for verification.
- Double majors; foundation / pre-bridging courses; interfaith education; culture of inquiry; service built in; open to all creeds and cultures; partnerships with government, NGOs and industry.
- Bridge Institute (industry-academia-national policy): Foundation Year → Professional Development Year → Full-time Industry Internship → Industry Problem Solving Year → Reskilling/Upskilling.
- Governance: "Moderate-Islamic-Academic-Philanthropic", strictly non-political, led by academics and scholars rather than a profit-driven owner.

## 5. Academic structure and program status

The Concept Paper lists schools and departments; the Academic Master Plan lists 64 programs scheduled by phase. **No program is currently offered.** All are seeded with status `PROPOSED` and the CMS forbids presenting them as admissions offerings until an administrator changes the status.

Schools in the Academic Master Plan (used for the CMS):
- School of Education (SoE) — Teaching & Learning; Educational Management & Leadership; Psychology & Counselling; Technical and Vocational Education.
- School of Humanities and Social Sciences (SHSS) — Policy & Governance; Economics & Development; Law & Human Rights.
- School of Business and Entrepreneurship (SBE) — Business & Entrepreneurship; Business & Technology Management.
- School of Science and Engineering (SSE) — CSE; EEE; AI & Robotics Engineering; AI Methods & Application; Cyber Security Analysis & Operations; Quantum Computing; Mathematics; Physics; Chemistry.
- School of Health and Life Sciences (SHLS) — Public Health; Nursing & Midwifery; Pharmacy; Biotechnology and Bio-Economy; Health Technology; Halal & Organic Food Sciences; Sustainable Technology.
- School of Agriculture — Agricultural Sciences; Environmental Science; Soil Science.

Naming differences to verify: the Concept Paper groups humanities under "School of Theology, Arts, Humanities and Social Sciences" and lists a "School of Fiqh and Legal Studies" (departments "to be finalized"); temporary campus signage says "School of Social Business & Entrepreneurship (SSBE)" and "School of Science, Engineering & Technology (SSET)". The Master Plan names are used and the differences are flagged.

Phase I (2027-2028) programs are marked with `launchPhase = PHASE_I`, others PHASE_II. Phase III is "continuation + new UG/Masters/MPhil/PhD programs" with no named programs.

## 6. Research direction (CRI)

Center for Research & Innovation, subtitle "Towards a Research Based University Integrating the Academia-Industry-Government Nexus". Strategies: leadership commitment, internal research grant (5% of revenue, rising to 10% within a decade), research culture, student research, infrastructure, dedicated research-publication office, faculty development, partnerships, centers of excellence, research-informed teaching.

Priority research areas (Phase I 2026-2028): emerging & cutting-edge technologies; AI & society; digital governance; renewable energy; smart city & urban analytics; disaster intelligence & climate resilience; poverty & development innovation; innovative agricultural technologies. Phase II and III areas are listed in the seed. **No research projects or publications exist yet** — the `/research/publications` page shows an empty state until content is added.

## 7. Centers (official names)

| Center | Acronym | Source subtitle |
|--------|---------|-----------------|
| Center for Research & Innovation | CRI | Towards a Research Based University Integrating the Academia-Industry-Government Nexus |
| Center for Co-curricular & Community Engagement | CCCE | Dedicated to holistic education through credited co-curricular excellence and community service |
| Center for Professional Development | CPD | Dedicated to train the academic & administrative staff |
| Center for Translation & Publication | CTP | Advancing knowledge through quality translation, publication, and scholarly excellence |
| Center for Foundational Studies | — | Dedicated to Conduct University Required Courses (document title "Center/School of Foundational Studies"; body text says "School of General Education") |

The CPD document also contains a Foundation Skills Certificate section (literacy, numeracy and thinking skills) which reads like Foundational Studies content; it is kept within CPD as in the source and flagged.

## 8. Campus

**Temporary campus (operational):** seven-storey building of about 25,000 sq ft at Duara, Daudpur, Rupganj, Narayanganj, within 1 km of the permanent campus land. Photographed facilities: VC and Pro-VC offices, Registrar/Project Coordinator office, Conference Hall, offices of schools and centers, UIT Library, Resource Center, Teachers' Room, site office. Inspected by UGC on 9 Feb 2026.

**Permanent campus (planned):** Rohila Mouza, Daudpur, Rupganj, Narayanganj, near Purbachal, about 20 km from Dhaka airport.
- Land: **conflict** — "14 bighas acquired out of 50 bigha" (Progress, Knowledge City paper), "initial site 3.30 acres" (Concept Paper), "about 3 acres" (Bulletin). 14 bigha ≈ 4.6 acres. The site states "land acquisition for the first phase has been completed" and quotes 14 bigha from the most recent document, flagged for verification.
- Phases: Phase 1 5 acres / 15 bigha; Phase 2 20 acres / 60 bigha; Phase 3 50 acres / 150 bigha (Design Plan). Major Features shows 5 → 50 → 150 acres; the site uses the Design Plan figures.
- Phase 1 programme: academic buildings, administrative building, male & female student housing, playground, bus depot, central mosque, convention centre, technical support & staff quarter, central library, common areas.
- Status: master plan finalized; land development in progress; construction not yet started. Everything except the land and the site office is shown as *proposed*.

**Knowledge City / Education Valley (concept):** BIIT Trust initiative at Rohila Mouja, Daudpur. Vision, mission and planned components: UIT, Institute of Teacher Education, Institute of Technical and Vocational Education, Institute of Islamic Finance and Banking, Institute of Agricultural Education, Nursing Institute and College, Center for Civilizational Dialogue, Center for Medical Ethics & Professionalism, Center for Professional Studies, Al-Hikmah Library, Academia Publishing House, BIIT Publication. All shown as *concept*.

## 9. Verified milestones (used for the History timeline)

| Date | Milestone | Source |
|------|-----------|--------|
| 1989 | BIIT begins its academic work on integration of knowledge | Concept Paper |
| 2 Feb 2022 | MoU signed by the Acting President and DG of BIIT (site selection & agreement) | Bulletin |
| 2022-2025 | Promotional and consultation meetings in Bangladesh, UK, USA, Malaysia; site visits | Bulletin |
| 7 Jul 2025 | UNIW delegation visits the Knowledge City site; consultation at Radisson Blu | UNIW bulletin |
| 17 Oct 2025 | First UIT Board of Trustees meeting; Deed of Trust signed; provisional VC, Pro-VC, Treasurer appointed | Temporary Campus doc |
| 9 Dec 2025 | Application under the Private University Act 2010 submitted to the Ministry of Education | Progress, Temporary Campus |
| 12 Jan 2026 | Meeting with UGC Member (Private University) | Temporary Campus |
| 1 Feb 2026 | Courtesy visit to the High Commission of Malaysia | Temporary Campus, photos |
| 5 Feb 2026 | UGC forms four-member inspection committee | Temporary Campus |
| 7 Feb 2026 | Meeting with expected faculty members | Temporary Campus |
| 9 Feb 2026 | UGC formal inspection at UIT | Progress, photos |
| 10 Mar 2026 | UGC submits report recommending approval to the Ministry of Education | Progress |
| 19 Apr 2026 | Ministry of Education approves establishment of UIT; final approval certificate pending | Progress |

**Current regulatory status (as stated in sources):** establishment approved by the Ministry of Education on 19 April 2026; UIT "is now in the final phase of obtaining its Final Approval Certificate". The website never claims that UIT is admitting students or that any program is UGC-approved.

## 10. Leadership (verification required before publishing)

Named in sources: Prof. Dr. M. Abdul Aziz — Chairman of the Board of Trustees (UIT Trust), Director General of BIIT. Provisional academic management: Prof. Dr. Muhammad Fazli Ilahi (Vice-Chancellor), Prof. Dr. Md. Mozammel Hoq (Pro-Vice-Chancellor), Md. Safiullah (Treasurer). Spelling differs across documents ("Fazle Elahi", "Mozammel Hoque Khan", "Shafiullah"). Board, advisers and Global Board of Advisers are listed in the Concept Paper and Major Features. **The leadership page is seeded as a draft** so an administrator verifies names and titles before publishing.

## 11. Partnerships

"Academic Partnerships" in Major Features lists Johns Hopkins University, The Fairfax Institute, IIUM and Istanbul Sabahattin Zaim University feeding a "Global Academic Network". The sources do not document formal agreements, and the Concept Paper says accreditation and collaborations are "under way". **These are not published as partnerships.** The public site shows only documented institutional activities (meetings, visits, delegations). The partnership list is stored as a draft page for verification.

Expected development partners (IsDB, ICESCO-OIC, Fuzul Group) are likewise described as *expected* and not published.

## 12. Contacts

- Permanent campus: University of Integrated Thought (Proposed), Rohila Mouza, Rupganj, Narayanganj, Bangladesh.
- Temporary campus: Duara, Daudpur, Rupganj, Narayanganj.
- Corporate office: UIT Trust / BIIT Trust, House 4, Road 2, Sector 9, Uttara Model Town, Dhaka-1230.
- BIIT Trust phone +88 02 8917509, cell +880 1712-757556, email trustbiit07@gmail.com (Design Plan footer).

Personal mobile numbers listed in the Bulletin are **not** published. The BIIT Trust contact details are seeded but the contact record is marked "needs verification" because they belong to BIIT Trust rather than a dedicated UIT office.

## 13. Content requiring verification (seeded as drafts or flagged)

1. Teaching/research split (60/40 vs 50/50).
2. Land acquired (14 bigha vs 3.30 acres) and phase acreages.
3. School names (Master Plan vs Concept Paper vs signage).
4. Leadership names, titles and spellings.
5. Academic partnerships and development partners.
6. Official UIT email, phone and website domain.
7. Admissions: no dates, fees or requirements exist; the Admissions page states that admissions have not opened.
8. Program durations, credits and curricula (not in sources; left blank).
9. Center for Foundational Studies naming.
10. Social media accounts (none in sources; none seeded).

## 14. Image-to-section map

| Section | Asset(s) |
|---------|----------|
| Brand | `uit-logo.png`, `uit-logo-light-bg.png` |
| Homepage hero | `temporary-campus-entrance.jpg` (real, current) |
| Introduction | `temporary-campus-corridor.jpg` |
| Campus — permanent vision | `campus-visualization-panorama.jpg`, `campus-visualization-aerial.jpg`, `phase-1-layout-plan.jpg`, `three-phase-boundary-map.jpg` (all captioned as proposed) |
| Campus — temporary | `temporary-campus-building.jpg`, `conference-hall*.jpg`, `uit-library*.jpg`, `vice-chancellor-office.jpg`, signage |
| Knowledge City | `knowledge-city-banner-group.jpg`, `education-valley-banner.jpg`, `knowledge-city-master-plan.jpg` |
| Milestones / activities | UGC inspection, Board of Trustees, Ministry of Education, Malaysia High Commission, Dhaka University VC, UNIW summit |
| Gallery albums | Temporary Campus; Permanent Campus Site; Regulatory Milestones; Institutional Activities |
