import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';
import type {
  CampusItem, Center, Department, EventCard, EventDetail, Faculty, GalleryAlbum, GalleryAlbumDetail,
  HomeSection, NewsArticle, NewsCard, PageData, Paged, Program, ResearchItem, SiteData, ContactItem,
} from './types';

const STALE = 60_000;
type Q = Record<string, string | number | undefined>;

export const useSite = () => useQuery({ queryKey: ['site'], queryFn: () => api<SiteData>('/site'), staleTime: 5 * STALE });

export const useHomepage = (preview = false) =>
  useQuery({
    queryKey: ['homepage', preview],
    queryFn: () => api<{ publishedAt: string | null; sections: HomeSection[] }>(preview ? '/homepage/preview' : '/homepage'),
    staleTime: preview ? 0 : STALE,
  });

export const usePage = (slug: string) =>
  useQuery({ queryKey: ['page', slug], queryFn: () => api<PageData>('/pages/public', { query: { slug } }), staleTime: STALE, retry: false });

export const usePagePreview = (id: string) =>
  useQuery({ queryKey: ['page-preview', id], queryFn: () => api<PageData>(`/pages/admin/${id}/preview`), retry: false });

export const useNews = (query: Q = {}) =>
  useQuery({ queryKey: ['news', query], queryFn: () => api<Paged<NewsCard>>('/news', { query }), staleTime: STALE, placeholderData: keepPreviousData });
export const useNewsArticle = (slug: string) =>
  useQuery({ queryKey: ['news', 'item', slug], queryFn: () => api<NewsArticle>(`/news/${slug}`), retry: false });
export const useNewsCategories = () => useQuery({ queryKey: ['news-categories'], queryFn: () => api<{ id: string; name: string; slug: string }[]>('/news/categories'), staleTime: 5 * STALE });

export const useEvents = (query: Q = {}) =>
  useQuery({ queryKey: ['events', query], queryFn: () => api<Paged<EventCard>>('/events', { query }), staleTime: STALE, placeholderData: keepPreviousData });
export const useEvent = (slug: string) => useQuery({ queryKey: ['events', 'item', slug], queryFn: () => api<EventDetail>(`/events/${slug}`), retry: false });

export const useFaculties = () => useQuery({ queryKey: ['faculties'], queryFn: () => api<Paged<Faculty>>('/faculties', { query: { pageSize: 50 } }), staleTime: STALE });
export const useDepartments = () => useQuery({ queryKey: ['departments'], queryFn: () => api<Paged<Department>>('/departments', { query: { pageSize: 200 } }), staleTime: STALE });
export const usePrograms = (query: Q = {}) =>
  useQuery({ queryKey: ['programs', query], queryFn: () => api<Paged<Program>>('/programs', { query: { pageSize: 200, ...query } }), staleTime: STALE, placeholderData: keepPreviousData });
export const useProgram = (slug: string) => useQuery({ queryKey: ['programs', 'item', slug], queryFn: () => api<Program>(`/programs/${slug}`), retry: false });

export const useCenters = () => useQuery({ queryKey: ['centers'], queryFn: () => api<Paged<Center>>('/centers', { query: { pageSize: 50 } }), staleTime: STALE });
export const useCenter = (slug: string) => useQuery({ queryKey: ['centers', slug], queryFn: () => api<Center>(`/centers/${slug}`), retry: false });

export const useResearch = (query: Q = {}) =>
  useQuery({ queryKey: ['research', query], queryFn: () => api<Paged<ResearchItem>>('/research', { query: { pageSize: 100, ...query } }), staleTime: STALE });

export const useCampus = (category?: string) =>
  useQuery({ queryKey: ['campus', category], queryFn: () => api<Paged<CampusItem>>('/campus', { query: { pageSize: 100, category } }), staleTime: STALE });

export const useGalleries = () => useQuery({ queryKey: ['galleries'], queryFn: () => api<GalleryAlbum[]>('/gallery'), staleTime: STALE });
export const useGallery = (slug: string) => useQuery({ queryKey: ['gallery', slug], queryFn: () => api<GalleryAlbumDetail>(`/gallery/${slug}`), retry: false });

export const useContacts = () => useQuery({ queryKey: ['contacts'], queryFn: () => api<Paged<ContactItem>>('/contacts'), staleTime: STALE });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => api<{ q: string; results: { type: string; title: string; url: string; excerpt: string | null }[] }>('/search', { query: { q } }),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
