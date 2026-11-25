import type { FieldDef } from './SchemaForm';

export const BLOCK_TYPES = ['HEADING', 'RICH_TEXT', 'IMAGE', 'CARD_GRID', 'TIMELINE', 'STATS', 'QUOTE', 'CTA', 'DYNAMIC'] as const;

export const BLOCK_LABELS: Record<string, string> = {
  HEADING: 'Heading', RICH_TEXT: 'Text', IMAGE: 'Image', CTA: 'Call to action', QUOTE: 'Quote',
  CARD_GRID: 'Cards', TIMELINE: 'Timeline', STATS: 'Statistics', DYNAMIC: 'Module listing',
};

export const DYNAMIC_MODULES = [
  { value: 'programs', label: 'Academic programs' },
  { value: 'faculties', label: 'Schools / faculties' },
  { value: 'centers', label: 'Centers' },
  { value: 'research-areas', label: 'Research areas' },
  { value: 'research-projects', label: 'Research projects' },
  { value: 'publications', label: 'Publications' },
  { value: 'news', label: 'News' },
  { value: 'timeline-milestones', label: 'News as a milestone timeline' },
  { value: 'events', label: 'Upcoming events' },
  { value: 'campus', label: 'Campus items' },
  { value: 'gallery-albums', label: 'Gallery albums' },
  { value: 'contact', label: 'Contact details' },
];

export const BLOCK_DEFAULTS: Record<string, Record<string, unknown>> = {
  HEADING: { eyebrow: '', text: 'New heading', level: 2 },
  RICH_TEXT: { html: '' },
  IMAGE: { mediaId: null, caption: '', size: 'wide' },
  CTA: { title: '', text: '', buttons: [] },
  QUOTE: { text: '', attribution: '' },
  CARD_GRID: { title: '', intro: '', columns: 3, cards: [] },
  TIMELINE: { title: '', items: [] },
  STATS: { items: [], sourceNote: '' },
  DYNAMIC: { module: 'news', title: '', intro: '', category: '', limit: 12 },
};

export const BLOCK_FIELDS: Record<string, FieldDef[]> = {
  HEADING: [
    { key: 'eyebrow', label: 'Eyebrow', kind: 'text', max: 80 },
    { key: 'text', label: 'Heading', kind: 'text', max: 200, required: true },
    { key: 'level', label: 'Size', kind: 'select', numeric: true, options: [{ value: '2', label: 'Section heading' }, { value: '3', label: 'Subheading' }] },
  ],
  RICH_TEXT: [{ key: 'html', label: 'Text', kind: 'richtext' }],
  IMAGE: [
    { key: 'mediaId', label: 'Image', kind: 'image' },
    { key: 'caption', label: 'Caption', kind: 'text', max: 300, hint: 'Leave empty to use the media library caption.' },
    { key: 'size', label: 'Width', kind: 'select', options: [{ value: 'inline', label: 'Text width' }, { value: 'wide', label: 'Wide' }, { value: 'full', label: 'Full width' }] },
  ],
  CTA: [
    { key: 'title', label: 'Title', kind: 'text', max: 200 },
    { key: 'text', label: 'Text', kind: 'textarea', rows: 2, max: 600 },
    { key: 'buttons', label: 'Buttons', kind: 'buttons' },
  ],
  QUOTE: [
    { key: 'text', label: 'Quote', kind: 'textarea', rows: 3, max: 800 },
    { key: 'attribution', label: 'Attribution', kind: 'text', max: 160 },
  ],
  CARD_GRID: [
    { key: 'title', label: 'Title', kind: 'text', max: 200 },
    { key: 'intro', label: 'Intro', kind: 'textarea', rows: 2, max: 800 },
    { key: 'columns', label: 'Columns', kind: 'select', numeric: true, options: [{ value: '2', label: '2 columns' }, { value: '3', label: '3 columns' }, { value: '4', label: '4 columns' }] },
    {
      key: 'cards', label: 'Cards', kind: 'list', max: 24, itemLabel: 'Card', titleKey: 'title',
      fields: [
        { key: 'title', label: 'Title', kind: 'text', max: 160 },
        { key: 'text', label: 'Text', kind: 'textarea', rows: 3, max: 1200 },
        { key: 'badge', label: 'Badge', kind: 'text', max: 40, hint: 'e.g. Proposed, Operational' },
        { key: 'url', label: 'Link', kind: 'url', placeholder: '/campus or https://…' },
        { key: 'imageId', label: 'Image', kind: 'image' },
      ],
    },
  ],
  TIMELINE: [
    { key: 'title', label: 'Title', kind: 'text', max: 200 },
    {
      key: 'items', label: 'Entries', kind: 'list', max: 40, itemLabel: 'Entry', titleKey: 'title',
      fields: [
        { key: 'date', label: 'Date', kind: 'text', max: 60, hint: 'Only documented dates.' },
        { key: 'title', label: 'Title', kind: 'text', max: 200 },
        { key: 'text', label: 'Text', kind: 'textarea', rows: 2, max: 1200 },
      ],
    },
  ],
  STATS: [
    {
      key: 'items', label: 'Figures', kind: 'list', max: 8, itemLabel: 'Figure', titleKey: 'label',
      fields: [
        { key: 'value', label: 'Value', kind: 'text', max: 30 },
        { key: 'label', label: 'Label', kind: 'text', max: 120 },
        { key: 'note', label: 'Note', kind: 'text', max: 200 },
      ],
    },
    { key: 'sourceNote', label: 'Source note', kind: 'text', max: 300 },
  ],
  DYNAMIC: [
    { key: 'module', label: 'Module', kind: 'select', options: DYNAMIC_MODULES },
    { key: 'title', label: 'Title', kind: 'text', max: 200 },
    { key: 'intro', label: 'Intro', kind: 'textarea', rows: 2, max: 800 },
    {
      key: 'category', label: 'Filter', kind: 'text', max: 60,
      hint: 'News: category slug (e.g. regulatory-milestones). Campus: TEMPORARY_CAMPUS, PERMANENT_CAMPUS, CAMPUS_DEVELOPMENT or KNOWLEDGE_CITY (comma-separated).',
      when: (v) => ['news', 'timeline-milestones', 'campus'].includes(v.module),
    },
    { key: 'limit', label: 'Maximum items', kind: 'number', min: 1, max: 100 },
  ],
};
