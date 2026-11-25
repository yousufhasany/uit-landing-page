import { Navigate, useParams, type RouteObject } from 'react-router';
import { adminRoutes } from './admin/routes';
import { PublicLayout } from './components/layout/PublicLayout';
import { DepartmentsPage, FacultiesPage, ProgramDetailPage, ProgramsPage } from './pages/public/AcademicsPages';
import { CenterDetailPage, CentersPage } from './pages/public/CentersPages';
import CmsPage from './pages/public/CmsPage';
import { GalleryAlbumPage, GalleryPage, PublicationsPage, ResearchProjectsPage } from './pages/public/GalleryResearchPages';
import HomePage from './pages/public/HomePage';
import { EventDetailPage, EventsListPage, NewsDetailPage, NewsListPage } from './pages/public/NewsEventsPages';
import { HomepagePreview, PagePreview } from './pages/public/Previews';

function Alias({ to }: { to: string }) {
  const { slug } = useParams();
  return <Navigate to={slug ? `${to}/${slug}` : to} replace />;
}

/** Short URLs that point at the canonical nested paths. */
const ALIASES: Record<string, string> = {
  'vision-mission': '/about/vision-mission',
  philosophy: '/about/philosophy',
  history: '/about/history',
  leadership: '/about/leadership',
  programs: '/academics/programs',
  'programs/:slug': '/academics/programs',
  faculties: '/academics/faculties',
  departments: '/academics/departments',
  innovation: '/research/innovation',
  projects: '/research/projects',
  publications: '/research/publications',
  'temporary-campus': '/campus/temporary-campus',
  development: '/campus/development',
  'knowledge-city': '/campus/knowledge-city',
  gallery: '/campus/gallery',
  'gallery/:slug': '/campus/gallery',
};

export const routes: RouteObject[] = [
  adminRoutes,
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'academics/programs', element: <ProgramsPage /> },
      { path: 'academics/programs/:slug', element: <ProgramDetailPage /> },
      { path: 'academics/faculties', element: <FacultiesPage /> },
      { path: 'academics/departments', element: <DepartmentsPage /> },
      { path: 'centers', element: <CentersPage /> },
      { path: 'centers/:slug', element: <CenterDetailPage /> },
      { path: 'research/projects', element: <ResearchProjectsPage /> },
      { path: 'research/publications', element: <PublicationsPage /> },
      { path: 'campus/gallery', element: <GalleryPage /> },
      { path: 'campus/gallery/:slug', element: <GalleryAlbumPage /> },
      { path: 'news', element: <NewsListPage /> },
      { path: 'news/:slug', element: <NewsDetailPage /> },
      { path: 'events', element: <EventsListPage /> },
      { path: 'events/:slug', element: <EventDetailPage /> },
      { path: 'admin/preview/homepage', element: <HomepagePreview /> },
      { path: 'admin/preview/page/:id', element: <PagePreview /> },
      ...Object.entries(ALIASES).map(([path, to]) => ({ path, element: <Alias to={to} /> })),
      // Every other path (about, campus, admissions, legal…) is a CMS page; unknown slugs render 404.
      { path: '*', element: <CmsPage /> },
    ],
  },
];
