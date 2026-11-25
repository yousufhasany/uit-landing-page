import type { FieldDef } from './SchemaForm';

const header: FieldDef[] = [
  { key: 'eyebrow', label: 'Eyebrow', kind: 'text', max: 80, hint: 'Small label above the title.' },
  { key: 'title', label: 'Title', kind: 'text', max: 200 },
  { key: 'description', label: 'Intro text', kind: 'textarea', max: 1200 },
];
const buttons: FieldDef = { key: 'buttons', label: 'Buttons', kind: 'buttons' };
const titledText: FieldDef[] = [
  { key: 'title', label: 'Title', kind: 'text', max: 120 },
  { key: 'text', label: 'Text', kind: 'textarea', rows: 2, max: 800 },
];

export const SECTION_LABELS: Record<string, string> = {
  ANNOUNCEMENT: 'Announcement bar', HERO: 'Hero banner', ABOUT: 'About', VISION: 'Vision', MISSION: 'Mission', PHILOSOPHY: 'Philosophy / education model',
  STATISTICS: 'Statistics', ACADEMICS: 'Academics', RESEARCH: 'Research', CENTERS: 'Centers', NEWS: 'Latest news', EVENTS: 'Upcoming events',
  CAMPUS: 'Campus', GALLERY: 'Gallery', PARTNERSHIPS: 'Milestones / partnerships', CTA: 'Call to action', FOOTER: 'Footer note',
};

/** Where each dynamic section gets its live content from, shown to editors. */
export const SECTION_SOURCES: Record<string, string> = {
  ANNOUNCEMENT: 'Shows the highest-priority live announcement from the Announcements module.',
  ACADEMICS: 'Lists published schools and program counts from the Academics module.',
  RESEARCH: 'Lists published research areas from the Research module.',
  CENTERS: 'Lists published centers from the Centers module.',
  NEWS: 'Shows the latest published news articles.',
  EVENTS: 'Shows upcoming published events. Hidden automatically when none exist (if enabled).',
  GALLERY: 'Shows photos from the selected gallery album.',
};

export const SECTION_FIELDS: Record<string, FieldDef[]> = {
  ANNOUNCEMENT: [{ key: 'limit', label: 'Announcements to show', kind: 'number', min: 1, max: 5 }],
  HERO: [
    ...header,
    { key: 'subtitle', label: 'Subtitle', kind: 'text', max: 300 },
    { key: 'imageId', label: 'Background image', kind: 'image', hint: 'Shown on its own, or as the first photo when banner photos are added below.' },
    { key: 'caption', label: 'Image caption', kind: 'text', max: 200 },
    {
      key: 'slides',
      label: 'Banner photos',
      kind: 'list',
      max: 8,
      itemLabel: 'Photo',
      titleKey: 'caption',
      hint: 'Each photo stays for 3 seconds, then the banner changes. Include the background image above if you want it in the rotation.',
      fields: [
        { key: 'imageId', label: 'Photo', kind: 'image' },
        { key: 'caption', label: 'Caption', kind: 'text', max: 200 },
      ],
    },
    { key: 'videoUrl', label: 'Background video URL (optional)', kind: 'url', hint: 'MP4 link from the media library. The image is used as the poster.' },
    { key: 'focalX', label: 'Image focus, horizontal (%)', kind: 'number', min: 0, max: 100 },
    { key: 'focalY', label: 'Image focus, vertical (%)', kind: 'number', min: 0, max: 100 },
    { key: 'overlay', label: 'Overlay darkness (%)', kind: 'number', min: 0, max: 90, hint: 'Keeps text readable over the photo.' },
    { key: 'align', label: 'Text alignment', kind: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centered' }] },
    buttons,
  ],
  ABOUT: [
    ...header,
    { key: 'body', label: 'Body text', kind: 'textarea', rows: 5, max: 6000 },
    { key: 'imageId', label: 'Image', kind: 'image' },
    { key: 'highlights', label: 'Highlights', kind: 'list', fields: titledText, max: 6, itemLabel: 'Highlight', titleKey: 'title' },
    buttons,
  ],
  VISION: [...header, { key: 'items', label: 'Vision statements', kind: 'list', fields: [{ key: 'text', label: 'Statement', kind: 'textarea', rows: 2, max: 400 }], max: 6, itemLabel: 'Statement', titleKey: 'text' }],
  MISSION: [...header, { key: 'items', label: 'Mission statements', kind: 'list', fields: [{ key: 'text', label: 'Statement', kind: 'textarea', rows: 2, max: 400 }], max: 6, itemLabel: 'Statement', titleKey: 'text' }],
  PHILOSOPHY: [
    ...header,
    { key: 'pillars', label: 'Pillars', kind: 'list', fields: titledText, max: 6, itemLabel: 'Pillar', titleKey: 'title' },
    { key: 'outcomeTitle', label: 'Outcome title', kind: 'text', max: 120 },
    { key: 'outcomeText', label: 'Outcome text', kind: 'textarea', rows: 2, max: 600 },
    buttons,
  ],
  STATISTICS: [
    ...header,
    {
      key: 'items', label: 'Figures', kind: 'list', max: 8, itemLabel: 'Figure', titleKey: 'label',
      hint: 'Only publish figures from official UIT documents.',
      fields: [
        { key: 'value', label: 'Value', kind: 'text', max: 30 },
        { key: 'label', label: 'Label', kind: 'text', max: 120 },
        { key: 'note', label: 'Note', kind: 'text', max: 200 },
      ],
    },
    { key: 'sourceNote', label: 'Source note', kind: 'text', max: 300, hint: 'Where the figures come from.' },
  ],
  ACADEMICS: [...header, { key: 'statusNote', label: 'Status note', kind: 'textarea', rows: 2, max: 400, hint: 'Clarifies the approval status of programs.' }, buttons],
  RESEARCH: [...header, { key: 'imageId', label: 'Image', kind: 'image' }, { key: 'areasLimit', label: 'Research areas to show', kind: 'number', min: 0, max: 12 }, buttons],
  CENTERS: [...header, buttons],
  NEWS: [...header, { key: 'limit', label: 'Articles to show', kind: 'number', min: 1, max: 12 }, buttons],
  EVENTS: [
    ...header,
    { key: 'limit', label: 'Events to show', kind: 'number', min: 1, max: 12 },
    { key: 'hideWhenEmpty', label: 'Hide when there are no upcoming events', kind: 'toggle' },
    { key: 'emptyMessage', label: 'Message when empty', kind: 'text', max: 300, when: (v) => !v.hideWhenEmpty },
    buttons,
  ],
  CAMPUS: [
    ...header,
    { key: 'currentTitle', label: 'Current campus title', kind: 'text', max: 120 },
    { key: 'currentText', label: 'Current campus text', kind: 'textarea', rows: 3, max: 1000 },
    { key: 'currentImageId', label: 'Current campus image', kind: 'image' },
    { key: 'futureTitle', label: 'Future campus title', kind: 'text', max: 120 },
    { key: 'futureText', label: 'Future campus text', kind: 'textarea', rows: 3, max: 1000, hint: 'Make clear that plans are proposed, not built.' },
    { key: 'futureImageId', label: 'Future campus image', kind: 'image' },
    buttons,
  ],
  GALLERY: [
    ...header,
    { key: 'galleryId', label: 'Album', kind: 'relation', endpoint: '/gallery/admin', labelKey: 'title', allowEmpty: 'Latest photos from all albums' },
    { key: 'limit', label: 'Photos to show', kind: 'number', min: 3, max: 24 },
    buttons,
  ],
  PARTNERSHIPS: [
    ...header,
    {
      key: 'items', label: 'Items', kind: 'list', max: 8, itemLabel: 'Item', titleKey: 'title',
      fields: [
        { key: 'title', label: 'Title', kind: 'text', max: 160 },
        { key: 'date', label: 'Date label', kind: 'text', max: 40, hint: 'e.g. 9 Feb 2026' },
        { key: 'text', label: 'Text', kind: 'textarea', rows: 2, max: 600 },
        { key: 'imageId', label: 'Image', kind: 'image' },
      ],
    },
    buttons,
  ],
  CTA: [...header, { key: 'imageId', label: 'Background image', kind: 'image', hint: 'Used by the “image” layout.' }, buttons],
  FOOTER: [{ key: 'note', label: 'Note', kind: 'text', max: 300 }],
};
