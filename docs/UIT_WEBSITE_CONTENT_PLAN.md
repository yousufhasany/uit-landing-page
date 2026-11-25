# UIT Website — Content Plan

All content is editable in the CMS (`/admin`). This plan records what each page contains at launch, where the facts come from (see `UIT_SOURCE_ANALYSIS.md`), and what must be verified by the university before it is relied on.

## 1. Editorial principles

1. **Only documented facts.** Nothing about accreditation, rankings, approvals, statistics, programs, partnerships, facilities, achievements, admission dates or contacts is stated unless it appears in the supplied source materials.
2. **Plans are labelled as plans.** Programs are shown as *Proposed* with their launch phase. The permanent campus and Knowledge City are described as planned or in progress, never as built. Admissions are described as *not yet open*.
3. **Conflicting sources are flagged.** When documents disagree, the site uses the more authoritative or more recent source and the record is marked **Verify** with a note explaining the conflict.
4. **Missing information becomes a placeholder, not an invention.** Leadership and academic network pages exist as unpublished drafts until confirmed.
5. **Real photographs only.** Images come from the supplied UIT photographs and design documents, with descriptive alt text.

## 2. Site map

| URL | Content | Source | Launch state |
|---|---|---|---|
| `/` | Homepage builder: announcement, hero, introduction, key facts, vision, mission, philosophy, academics, centers, research, campus, news, events (hidden when none), milestones, gallery, call to action | Bulletin, Concept Paper, Academic Master Plan, Temporary Campus, Progress report | Published |
| `/about` | Introduction and current stage | Bulletin, Concept Paper | Published |
| `/about/vision-mission` | Vision and mission statements | Concept Paper | Published |
| `/about/philosophy` | Integrated education model | Concept Paper, Major Features, CRI | Published · **Verify** (60/40 vs 50/50 teaching/research balance) |
| `/about/history` | Dated milestones timeline | Progress report, Temporary Campus doc, UNIW visit | Published |
| `/about/leadership` | Board and academic management | Board meeting photos, Concept Paper | **Draft** · Verify names, titles and photos; hidden from the menu |
| `/about/academic-network` | Institutions listed under "Academic Partnerships" | Major Features | **Draft** · no formal agreements documented |
| `/academics` | Academic Master Plan overview | Academic Master Plan | Published · **Verify** school names |
| `/academics/programs`, `/academics/programs/:slug` | 64 proposed programs, filterable by school, level and phase | Academic Master Plan | Published as *Proposed*; no admission details |
| `/academics/faculties`, `/academics/departments` | Six planned schools and their departments | Academic Master Plan | Published |
| `/research`, `/research/innovation` | Research strategy, priority areas by phase | CRI concept note | Published |
| `/research/projects`, `/research/publications` | Lists from the CMS | none yet | Empty state until content is added |
| `/centers`, `/centers/:slug` | Five centers with objectives and activities | Center concept notes 10.1–10.5 | Published (two centers flagged for verification) |
| `/campus` | Temporary campus today and the planned permanent campus | Temporary Campus doc, Design Plan | Published |
| `/campus/temporary-campus` | Seven-storey, 25,000 sq ft building at Duara, Rupganj | Temporary Campus doc, photos | Published |
| `/campus/development` | Land, phases, layout plans | Design Plan, R15 drawings, Progress report | Published · **Verify** land figures |
| `/campus/knowledge-city` | Education Valley / Knowledge City concept | Knowledge City concept paper, master plan drawing | Published (as concept) |
| `/campus/gallery`, `/campus/gallery/:slug` | Photo albums | Supplied photographs | Published |
| `/news`, `/news/:slug` | Dated milestones (Ministry approval, UGC inspection, delegations…) | Progress report, Temporary Campus doc, UNIW bulletin | Dated items published; undated items drafts |
| `/events`, `/events/:slug` | Upcoming and past events | none | **No events seeded**; the page shows an empty state |
| `/admissions` | Admissions status: not yet open; how to get updates | Ministry approval news | Published |
| `/contact` | Corporate office, temporary and proposed campus addresses, phone, email | Concept Paper, Temporary Campus doc | Published · **Verify** phone and email (they belong to BIIT Trust) |
| `/privacy-policy`, `/terms` | Generic policies describing the site's real behaviour | none | Published · **Verify** with legal adviser |

Short aliases such as `/programs`, `/gallery`, `/vision-mission`, `/temporary-campus` and `/knowledge-city` redirect to the canonical URLs above.

## 3. Navigation

- **Header:** About (About UIT, Vision & Mission, Philosophy, History & Milestones, Leadership [hidden]), Academics, Research, Centers, Campus, News & Events, Contact.
- **Footer:** Explore, Resources and Legal menus, social links, contact details and site identity. All of these are managed under *Navigation*, *Social links*, *Contact details* and *Settings*.

## 4. Items requiring verification before wider publicity

These appear with a **Verify** badge in the CMS and are counted on the dashboard:

1. Leadership names, titles and spellings (the sources spell several names differently).
2. Academic network or partner institutions (no formal agreements documented).
3. School names (Master Plan vs Concept Paper and campus signage).
4. Teaching/research balance (60/40 vs 50/50).
5. Permanent campus land figures (14 bigha acquired vs 3.30 acres initial site; phase acreage 5/20/50 vs 5/50/150).
6. Official contact phone and email (currently BIIT Trust contacts).
7. Two center descriptions whose source notes are incomplete.
8. Privacy policy and terms (legal review).

When an item is confirmed, edit the content, clear *Needs verification* and publish.

## 5. Ongoing editorial workflow

- **Contributors** draft pages, news and events. **Editors and Media Managers** review and publish.
- Use **Schedule** for announcements and news that should go live later. Scheduled content appears automatically at the set time.
- Add an **announcement** for admissions only once admissions are officially open, with the confirmed dates.
- When a program is actually approved or offered, change its academic status. Admission information appears publicly only for programs marked *Currently offered*.
- Every image needs meaningful alt text. New uploads default it to the file name, so replace that with a real description in the media library.
