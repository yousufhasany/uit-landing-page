export type Status = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
export type ProgramStatus = 'PROPOSED' | 'UNDER_DEVELOPMENT' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  url: string;
  thumbUrl: string;
  srcSet: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string | null;
  mimeType: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Button {
  label: string;
  url: string;
  style: 'primary' | 'secondary' | 'link';
}

export interface MenuNode {
  id: string;
  label: string;
  url: string;
  description: string | null;
  target: 'SELF' | 'BLANK';
  children: MenuNode[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  url: string | null;
  linkLabel: string | null;
  type: string;
  style: 'INFO' | 'HIGHLIGHT' | 'URGENT';
}

export interface ContactItem {
  id: string;
  label: string;
  type: 'ADDRESS' | 'PHONE' | 'EMAIL' | 'WEBSITE' | 'HOURS';
  value: string;
  description: string | null;
}

export interface SiteData {
  identity: {
    name: string;
    shortName: string;
    tagline: string;
    description: string;
    statusNote: string;
    logo: Media | null;
    logoOnDark: Media | null;
  };
  header: { ctaLabel: string; ctaUrl: string; showSearch: boolean };
  footer: { description: string; copyright: string; note: string };
  seo: { titleTemplate: string; defaultTitle: string; defaultDescription: string; ogImage: Media | null; siteUrl: string };
  menus: Record<string, { name: string; location: 'HEADER' | 'FOOTER'; items: MenuNode[] }>;
  social: { id: string; platform: string; label: string; url: string }[];
  contacts: ContactItem[];
  announcements: Announcement[];
}

export interface HomeSection {
  id: string;
  type: string;
  variant: string;
  data: Record<string, any>;
  dynamic: any;
  media: Record<string, Media | null>;
}

export interface PageBlock {
  id: string;
  type: 'HEADING' | 'RICH_TEXT' | 'IMAGE' | 'CTA' | 'QUOTE' | 'CARD_GRID' | 'TIMELINE' | 'STATS' | 'DYNAMIC';
  data: Record<string, any>;
}

export interface PageData {
  id: string;
  status: Status;
  title: string;
  slug: string;
  eyebrow: string | null;
  summary: string | null;
  template: 'standard' | 'landing' | 'listing';
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImage: Media | null;
  blocks: PageBlock[];
  media: Record<string, Media | null>;
  updatedAt: string;
}

export interface NewsCard {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string | null;
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
  image: Media | null;
}
export interface NewsArticle extends NewsCard {
  content: string;
  tags: string[];
  updatedAt: string;
  author: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  related: NewsCard[];
}

export interface EventCard {
  id: string;
  title: string;
  slug: string;
  summary: string;
  startsAt: string;
  endsAt: string | null;
  isAllDay: boolean;
  venue: string | null;
  registrationUrl: string | null;
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
  image: Media | null;
}
export interface EventDetail extends EventCard {
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface Faculty {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  description: string | null;
  image: Media | null;
  departments: { id: string; name: string; slug: string }[];
  programCount: number;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  faculty: { id: string; name: string; shortName: string | null };
  _count?: { programs: number };
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  degreeType: string;
  level: string;
  description: string | null;
  overview: string | null;
  duration: string | null;
  credits: number | null;
  curriculum: string | null;
  admissionInfo: string | null;
  programStatus: ProgramStatus;
  statusLabel: string;
  isOffered: boolean;
  launchPhase: 'PHASE_I' | 'PHASE_II' | 'PHASE_III' | null;
  faculty: { id: string; name: string; shortName: string | null; slug: string };
  department: { id: string; name: string; slug: string } | null;
  image: Media | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface Center {
  id: string;
  name: string;
  acronym: string | null;
  slug: string;
  tagline: string | null;
  overview: string;
  objectives: string[];
  description: string | null;
  sections: { title: string; body?: string; items?: string[] }[];
  image: Media | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface ResearchItem {
  id: string;
  title: string;
  slug: string;
  type: 'AREA' | 'INITIATIVE' | 'PROJECT' | 'PUBLICATION' | 'OPPORTUNITY' | 'COLLABORATION';
  summary: string;
  description: string | null;
  phase: string | null;
  externalUrl: string | null;
  center: { id: string; name: string; acronym: string | null; slug: string } | null;
  image: Media | null;
}

export interface CampusItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  developmentStatus: 'CURRENT' | 'IN_PROGRESS' | 'PROPOSED' | 'CONCEPT';
  statusLabel: string;
  image: Media | null;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  publishedAt: string | null;
  cover: Media | null;
  itemCount: number;
}
export interface GalleryItem {
  id: string;
  mediaId: string;
  caption: string | null;
  alt: string;
  media: Media;
  displayOrder: number;
}
export interface GalleryAlbumDetail extends Omit<GalleryAlbum, 'itemCount' | 'cover' | 'publishedAt'> {
  items: GalleryItem[];
}
