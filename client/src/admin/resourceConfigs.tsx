import { formatDateTime, LEVEL_LABELS, PHASE_LABELS } from '@/lib/format';
import { ResourceManager, type ResourceConfig } from './ResourceManager';
import type { FieldDef } from './SchemaForm';

const STATUS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];
const PHASES = Object.entries(PHASE_LABELS).map(([value, label]) => ({ value, label }));
const statusField: FieldDef = { key: 'status', label: 'Visibility', kind: 'select', options: STATUS, hint: 'Only published items appear on the website.' };
const orderField: FieldDef = { key: 'displayOrder', label: 'Display order', kind: 'number', min: 0, hint: 'Lower numbers come first. You can also drag items in the list.' };
const verifyFields: FieldDef[] = [
  { key: 'needsVerification', label: 'Needs verification', kind: 'toggle', description: 'Flag for review until confirmed by the university.', wide: true },
];
const verifyWithNote: FieldDef[] = [
  ...verifyFields,
  { key: 'verificationNote', label: 'What needs checking?', kind: 'textarea', rows: 2, max: 500, when: (v) => v.needsVerification },
];
const seo: FieldDef[] = [
  { key: 'seoTitle', label: 'SEO title', kind: 'text', max: 70 },
  { key: 'seoDescription', label: 'SEO description', kind: 'text', max: 170 },
];
const pub = (r: Record<string, any>) => [{ status: r.status }];

export const PROGRAM_STATUS = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'UNDER_DEVELOPMENT', label: 'Under development' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ACTIVE', label: 'Currently offered' },
  { value: 'ARCHIVED', label: 'Archived' },
];
const LEVELS = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));

export const facultiesConfig: ResourceConfig = {
  title: 'Faculties & schools',
  singular: 'faculty',
  description: 'Academic schools. Programs and departments belong to a school.',
  endpoint: '/faculties',
  permission: 'academics.manage',
  reorderable: true,
  defaults: { name: '', shortName: '', slug: '', description: '', imageId: null, displayOrder: 0, status: 'DRAFT', needsVerification: false, verificationNote: '' },
  fields: [
    { key: 'name', label: 'Name', kind: 'text', max: 160, required: true, wide: true },
    { key: 'shortName', label: 'Short name', kind: 'text', max: 20, hint: 'e.g. SoCI' },
    { key: 'slug', label: 'URL slug', kind: 'text', max: 160, hint: 'Generated from the name if empty.' },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    { key: 'imageId', label: 'Image', kind: 'image' },
    statusField,
    orderField,
    ...verifyWithNote,
  ],
  titleOf: (r) => r.name,
  subtitleOf: (r) => [r.shortName, `${r._count?.departments ?? 0} departments`, `${r._count?.programs ?? 0} programs`].filter(Boolean).join(' · '),
  imageOf: (r) => r.image,
  statusOf: pub,
  publicUrl: (r) => (r.status === 'PUBLISHED' ? '/academics/faculties' : null),
  invalidate: [['faculties'], ['academics']],
};

export const departmentsConfig: ResourceConfig = {
  title: 'Departments',
  singular: 'department',
  endpoint: '/departments',
  permission: 'academics.manage',
  reorderable: true,
  relations: { faculties: '/faculties/admin' },
  filters: [{ key: 'facultyId', label: 'All schools', options: ({ relations }) => (relations.faculties ?? []).map((f) => ({ value: f.id, label: f.name })) }],
  defaults: { name: '', facultyId: null, slug: '', description: '', displayOrder: 0, status: 'DRAFT' },
  fields: [
    { key: 'name', label: 'Name', kind: 'text', max: 160, required: true, wide: true },
    { key: 'facultyId', label: 'School', kind: 'relation', endpoint: '/faculties/admin', required: true },
    { key: 'slug', label: 'URL slug', kind: 'text', max: 160 },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4 },
    statusField,
    orderField,
  ],
  titleOf: (r) => r.name,
  subtitleOf: (r) => [r.faculty?.shortName ?? r.faculty?.name, `${r._count?.programs ?? 0} programs`].filter(Boolean).join(' · '),
  statusOf: pub,
  invalidate: [['departments']],
};

export const programsConfig: ResourceConfig = {
  title: 'Academic programs',
  singular: 'program',
  description: 'Programs listed in UIT planning documents. Keep the status accurate: only mark a program “Currently offered” once it is approved and enrolling.',
  notice: 'Admission details for a program are shown on the website only when its status is “Currently offered”.',
  endpoint: '/programs',
  permission: 'academics.manage',
  reorderable: true,
  relations: { faculties: '/faculties/admin' },
  filters: [
    { key: 'facultyId', label: 'All schools', options: ({ relations }) => (relations.faculties ?? []).map((f) => ({ value: f.id, label: f.name })) },
    { key: 'programStatus', label: 'Any status', options: PROGRAM_STATUS },
    { key: 'level', label: 'Any level', options: LEVELS },
    { key: 'launchPhase', label: 'Any phase', options: PHASES },
  ],
  editorSize: 'xl',
  defaults: {
    name: '', slug: '', facultyId: null, departmentId: null, degreeType: '', level: 'UNDERGRADUATE', description: '', overview: '', duration: '', credits: null,
    curriculum: '', admissionInfo: '', featuredImageId: null, programStatus: 'PROPOSED', launchPhase: null, isVisible: true, displayOrder: 0, seoTitle: '', seoDescription: '', needsVerification: false,
  },
  fields: [
    { key: 'name', label: 'Program name', kind: 'text', max: 200, required: true, wide: true },
    { key: 'degreeType', label: 'Degree', kind: 'text', max: 40, required: true, hint: 'e.g. BSc, BBA, MA' },
    { key: 'level', label: 'Level', kind: 'select', options: LEVELS },
    { key: 'facultyId', label: 'School', kind: 'relation', endpoint: '/faculties/admin', required: true },
    { key: 'departmentId', label: 'Department', kind: 'relation', endpoint: '/departments/admin?pageSize=200', allowEmpty: 'None', filter: (d, v) => !v.facultyId || d.facultyId === v.facultyId },
    { key: 'programStatus', label: 'Approval status', kind: 'select', options: PROGRAM_STATUS },
    { key: 'launchPhase', label: 'Launch phase', kind: 'select', options: PHASES, allowEmpty: 'Not set' },
    { key: 'duration', label: 'Duration', kind: 'text', max: 60, hint: 'Leave empty until officially confirmed.' },
    { key: 'credits', label: 'Credits', kind: 'number', min: 0, max: 400, hint: 'Leave empty until officially confirmed.' },
    { key: 'slug', label: 'URL slug', kind: 'text', max: 160 },
    orderField,
    { key: 'description', label: 'Short description', kind: 'textarea', rows: 2, max: 1000 },
    { key: 'overview', label: 'Overview', kind: 'richtext' },
    { key: 'curriculum', label: 'Curriculum', kind: 'richtext' },
    { key: 'admissionInfo', label: 'Admission information', kind: 'richtext' },
    { key: 'featuredImageId', label: 'Image', kind: 'image' },
    { key: 'isVisible', label: 'Show on website', kind: 'toggle' },
    ...seo,
    ...verifyFields,
  ],
  titleOf: (r) => `${r.name}`,
  subtitleOf: (r) => [r.degreeType, r.faculty?.shortName ?? r.faculty?.name, r.launchPhase ? PHASE_LABELS[r.launchPhase] : null].filter(Boolean).join(' · '),
  statusOf: (r) => [{ status: r.programStatus, label: PROGRAM_STATUS.find((s) => s.value === r.programStatus)?.label }, ...(r.isVisible ? [] : [{ status: 'HIDDEN', label: 'Hidden' }])],
  publicUrl: (r) => (r.isVisible && r.programStatus !== 'ARCHIVED' ? `/academics/programs/${r.slug}` : null),
  invalidate: [['programs'], ['academics']],
};

export const centersConfig: ResourceConfig = {
  title: 'Centers',
  singular: 'center',
  description: 'Research and outreach centers, each with its own page.',
  endpoint: '/centers',
  permission: 'centers.manage',
  reorderable: true,
  editorSize: 'xl',
  defaults: {
    name: '', acronym: '', slug: '', tagline: '', overview: '', objectives: [], description: '', sections: [], imageId: null, ctaLabel: '', ctaUrl: '',
    displayOrder: 0, status: 'DRAFT', seoTitle: '', seoDescription: '', needsVerification: false, verificationNote: '',
  },
  fields: [
    { key: 'name', label: 'Name', kind: 'text', max: 200, required: true, wide: true },
    { key: 'acronym', label: 'Acronym', kind: 'text', max: 20 },
    { key: 'slug', label: 'URL slug', kind: 'text', max: 160 },
    { key: 'tagline', label: 'Tagline', kind: 'text', max: 300, wide: true },
    { key: 'overview', label: 'Overview', kind: 'textarea', rows: 4, max: 4000, required: true },
    { key: 'objectives', label: 'Objectives', kind: 'strings', placeholder: 'Add an objective', max: 20 },
    { key: 'description', label: 'Additional description', kind: 'richtext' },
    {
      key: 'sections', label: 'Page sections', kind: 'list', max: 20, itemLabel: 'Section', titleKey: 'title',
      fields: [
        { key: 'title', label: 'Title', kind: 'text', max: 160 },
        { key: 'body', label: 'Text', kind: 'textarea', rows: 3, max: 4000 },
        { key: 'items', label: 'Bullet points', kind: 'strings', max: 60 },
      ],
    },
    { key: 'imageId', label: 'Image', kind: 'image' },
    { key: 'ctaLabel', label: 'Button label', kind: 'text', max: 60 },
    { key: 'ctaUrl', label: 'Button link', kind: 'url' },
    statusField,
    orderField,
    ...seo,
    ...verifyWithNote,
  ],
  titleOf: (r) => r.name,
  subtitleOf: (r) => r.acronym ?? r.tagline,
  imageOf: (r) => r.image,
  statusOf: pub,
  publicUrl: (r) => (r.status === 'PUBLISHED' ? `/centers/${r.slug}` : null),
  invalidate: [['centers']],
};

const RESEARCH_TYPES = [
  { value: 'AREA', label: 'Research area' },
  { value: 'INITIATIVE', label: 'Initiative' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'PUBLICATION', label: 'Publication' },
  { value: 'OPPORTUNITY', label: 'Opportunity' },
  { value: 'COLLABORATION', label: 'Collaboration' },
];

export const researchConfig: ResourceConfig = {
  title: 'Research',
  singular: 'research item',
  description: 'Research areas, projects and publications. The projects and publications pages stay hidden from search engines until they have published items.',
  endpoint: '/research',
  permission: 'research.manage',
  reorderable: true,
  filters: [
    { key: 'type', label: 'All types', options: RESEARCH_TYPES },
    { key: 'status', label: 'Any visibility', options: STATUS },
  ],
  defaults: { title: '', slug: '', type: 'AREA', summary: '', description: '', phase: null, imageId: null, centerId: null, externalUrl: '', displayOrder: 0, status: 'DRAFT', publishedAt: null },
  fields: [
    { key: 'title', label: 'Title', kind: 'text', max: 200, required: true, wide: true },
    { key: 'type', label: 'Type', kind: 'select', options: RESEARCH_TYPES },
    { key: 'phase', label: 'Phase', kind: 'select', options: PHASES, allowEmpty: 'Not set' },
    { key: 'summary', label: 'Summary', kind: 'textarea', rows: 3, max: 1000, required: true },
    { key: 'description', label: 'Description', kind: 'richtext' },
    { key: 'centerId', label: 'Center', kind: 'relation', endpoint: '/centers/admin', allowEmpty: 'None' },
    { key: 'externalUrl', label: 'External link', kind: 'url', hint: 'e.g. the publication DOI or project site.' },
    { key: 'imageId', label: 'Image', kind: 'image' },
    { key: 'slug', label: 'URL slug', kind: 'text', max: 160 },
    statusField,
    orderField,
  ],
  titleOf: (r) => r.title,
  subtitleOf: (r) => [RESEARCH_TYPES.find((t) => t.value === r.type)?.label, r.center?.acronym ?? r.center?.name, r.phase ? PHASE_LABELS[r.phase] : null].filter(Boolean).join(' · '),
  imageOf: (r) => r.image,
  statusOf: pub,
  invalidate: [['research']],
};

const CAMPUS_CATEGORIES = [
  { value: 'TEMPORARY_CAMPUS', label: 'Temporary campus' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'ACTIVITY', label: 'Campus activity' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'PERMANENT_CAMPUS', label: 'Permanent campus' },
  { value: 'CAMPUS_DEVELOPMENT', label: 'Campus development' },
  { value: 'KNOWLEDGE_CITY', label: 'Knowledge City' },
];
const DEV_STATUS = [
  { value: 'CURRENT', label: 'Operational' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'CONCEPT', label: 'Concept' },
];

export const campusConfig: ResourceConfig = {
  title: 'Campus',
  singular: 'campus item',
  description: 'Temporary campus facilities and permanent campus plans.',
  notice: 'Mark plans as “Proposed” or “Concept” until they are built. The website labels each item with its development status.',
  endpoint: '/campus',
  permission: 'campus.manage',
  reorderable: true,
  filters: [
    { key: 'category', label: 'All categories', options: CAMPUS_CATEGORIES },
    { key: 'developmentStatus', label: 'Any stage', options: DEV_STATUS },
  ],
  defaults: { title: '', slug: '', description: '', imageId: null, category: 'TEMPORARY_CAMPUS', developmentStatus: 'CURRENT', displayOrder: 0, status: 'DRAFT', needsVerification: false },
  fields: [
    { key: 'title', label: 'Title', kind: 'text', max: 200, required: true, wide: true },
    { key: 'category', label: 'Category', kind: 'select', options: CAMPUS_CATEGORIES },
    { key: 'developmentStatus', label: 'Development stage', kind: 'select', options: DEV_STATUS },
    { key: 'description', label: 'Description', kind: 'textarea', rows: 4, max: 4000, required: true },
    { key: 'imageId', label: 'Image', kind: 'image' },
    { key: 'slug', label: 'URL slug', kind: 'text', max: 160 },
    statusField,
    orderField,
    ...verifyFields,
  ],
  titleOf: (r) => r.title,
  subtitleOf: (r) => CAMPUS_CATEGORIES.find((c) => c.value === r.category)?.label,
  imageOf: (r) => r.image,
  statusOf: (r) => [{ status: r.developmentStatus === 'CURRENT' ? 'ACTIVE' : 'PROPOSED', label: DEV_STATUS.find((d) => d.value === r.developmentStatus)?.label }, { status: r.status }],
  invalidate: [['campus']],
};

const ANNOUNCEMENT_TYPES = ['GENERAL', 'IMPORTANT', 'ADMISSION', 'EVENT', 'NOTICE'].map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

export const announcementsConfig: ResourceConfig = {
  title: 'Announcements',
  singular: 'announcement',
  description: 'Short notices shown in the bar at the top of the website. The highest-priority live announcement is shown.',
  endpoint: '/announcements',
  permission: 'announcements.manage',
  filters: [{ key: 'status', label: 'Any status', options: STATUS }],
  defaults: { title: '', message: '', url: '', linkLabel: '', type: 'GENERAL', style: 'INFO', startsAt: null, endsAt: null, priority: 0, isVisible: true, autoHideExpired: true, status: 'DRAFT' },
  fields: [
    { key: 'title', label: 'Internal title', kind: 'text', max: 160, required: true },
    { key: 'type', label: 'Type', kind: 'select', options: ANNOUNCEMENT_TYPES },
    { key: 'message', label: 'Message', kind: 'textarea', rows: 2, max: 400, required: true },
    { key: 'linkLabel', label: 'Link label', kind: 'text', max: 40 },
    { key: 'url', label: 'Link', kind: 'url' },
    { key: 'style', label: 'Style', kind: 'select', options: [{ value: 'INFO', label: 'Standard' }, { value: 'HIGHLIGHT', label: 'Highlight' }, { value: 'URGENT', label: 'Urgent' }] },
    { key: 'priority', label: 'Priority', kind: 'number', min: 0, max: 100, hint: 'Higher shows first.' },
    { key: 'startsAt', label: 'Show from', kind: 'datetime' },
    { key: 'endsAt', label: 'Show until', kind: 'datetime' },
    { key: 'autoHideExpired', label: 'Hide automatically after the end date', kind: 'toggle' },
    { key: 'isVisible', label: 'Visible', kind: 'toggle' },
    statusField,
  ],
  titleOf: (r) => r.title,
  subtitleOf: (r) => [r.message, r.endsAt ? `until ${formatDateTime(r.endsAt)}` : null].filter(Boolean).join(' · '),
  statusOf: (r) => [{ status: r.status }, ...(r.endsAt && new Date(r.endsAt) < new Date() ? [{ status: 'EXPIRED', label: 'Expired' }] : []), ...(r.isVisible ? [] : [{ status: 'HIDDEN', label: 'Hidden' }])],
  invalidate: [['site'], ['homepage']],
};

export const contactsConfig: ResourceConfig = {
  title: 'Contact details',
  singular: 'contact detail',
  description: 'Addresses, phone numbers and emails shown in the footer and on the contact page. Only list official contacts.',
  endpoint: '/contacts',
  permission: 'contact.manage',
  reorderable: true,
  searchable: false,
  defaults: { label: '', type: 'EMAIL', value: '', description: '', displayOrder: 0, isVisible: true, needsVerification: false },
  fields: [
    { key: 'label', label: 'Label', kind: 'text', max: 120, required: true },
    { key: 'type', label: 'Type', kind: 'select', options: ['ADDRESS', 'PHONE', 'EMAIL', 'WEBSITE', 'HOURS'].map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() })) },
    { key: 'value', label: 'Value', kind: 'textarea', rows: 2, max: 500, required: true },
    { key: 'description', label: 'Note', kind: 'text', max: 300, wide: true },
    { key: 'isVisible', label: 'Show on website', kind: 'toggle' },
    ...verifyFields,
  ],
  titleOf: (r) => r.label,
  subtitleOf: (r) => r.value,
  statusOf: (r) => (r.isVisible ? [] : [{ status: 'HIDDEN', label: 'Hidden' }]),
  invalidate: [['contacts'], ['site']],
};

export const socialConfig: ResourceConfig = {
  title: 'Social links',
  singular: 'social link',
  description: 'Official UIT social media accounts shown in the footer.',
  endpoint: '/social-links',
  permission: 'social.manage',
  reorderable: true,
  searchable: false,
  defaults: { platform: 'facebook', label: '', url: '', displayOrder: 0, isVisible: true },
  fields: [
    { key: 'platform', label: 'Platform', kind: 'select', options: ['facebook', 'x', 'linkedin', 'youtube', 'instagram', 'website', 'other'].map((v) => ({ value: v, label: v === 'x' ? 'X (Twitter)' : v.charAt(0).toUpperCase() + v.slice(1) })) },
    { key: 'label', label: 'Label', kind: 'text', max: 60, required: true },
    { key: 'url', label: 'URL', kind: 'url', placeholder: 'https://…', required: true, wide: true },
    { key: 'isVisible', label: 'Show on website', kind: 'toggle' },
  ],
  titleOf: (r) => r.label,
  subtitleOf: (r) => r.url,
  statusOf: (r) => (r.isVisible ? [] : [{ status: 'HIDDEN', label: 'Hidden' }]),
  publicUrl: (r) => r.url,
  invalidate: [['site']],
};

export const FacultiesAdmin = () => <ResourceManager config={facultiesConfig} />;
export const DepartmentsAdmin = () => <ResourceManager config={departmentsConfig} />;
export const ProgramsAdmin = () => <ResourceManager config={programsConfig} />;
export const CentersAdmin = () => <ResourceManager config={centersConfig} />;
export const ResearchAdmin = () => <ResourceManager config={researchConfig} />;
export const CampusAdmin = () => <ResourceManager config={campusConfig} />;
export const AnnouncementsAdmin = () => <ResourceManager config={announcementsConfig} />;
export const ContactsAdmin = () => <ResourceManager config={contactsConfig} />;
export const SocialAdmin = () => <ResourceManager config={socialConfig} />;
