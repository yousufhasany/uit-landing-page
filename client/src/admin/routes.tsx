import type { ComponentType } from 'react';
import { Navigate, Outlet, type RouteObject } from 'react-router';
import { AuthProvider, RequireAuth } from './auth';

type Loader = () => Promise<ComponentType>;

/** Code-split admin screen behind a (UX-only) permission check; the API enforces the same permission. */
const screen = (load: Loader, permission?: string | string[]): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => {
    const Screen = await load();
    return { Component: () => <RequireAuth permission={permission}><Screen /></RequireAuth> };
  },
});
const d = <T extends { default: ComponentType }>(p: Promise<T>) => p.then((m) => m.default);
const resources = () => import('./resourceConfigs');
const content = () => import('./pages/NewsEventsAdmin');
const gallery = () => import('./pages/GalleryAdmin');
const administration = () => import('./pages/AdministrationPages');

function AdminShell() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminShell />,
  children: [
    { path: 'login', lazy: async () => ({ Component: await d(import('./pages/LoginPage')) }) },
    {
      lazy: async () => {
        const { AdminLayout } = await import('./AdminLayout');
        return { Component: () => <RequireAuth><AdminLayout /></RequireAuth> };
      },
      children: [
        { index: true, ...screen(() => d(import('./pages/DashboardPage')), 'dashboard.view') },
        { path: 'dashboard', element: <Navigate to="/admin" replace /> },
        { path: 'account', ...screen(() => d(import('./pages/AccountPage'))) },
        { path: 'homepage', ...screen(() => d(import('./pages/HomepageBuilder')), 'homepage.view') },
        { path: 'pages', ...screen(() => d(import('./pages/PagesList')), 'pages.view') },
        { path: 'pages/:id', ...screen(() => d(import('./pages/PageEditor')), 'pages.view') },
        { path: 'menus', ...screen(() => d(import('./pages/MenusAdmin')), 'menus.manage') },
        { path: 'announcements', ...screen(() => resources().then((m) => m.AnnouncementsAdmin), 'announcements.manage') },
        { path: 'news', ...screen(() => content().then((m) => m.NewsList), 'news.view') },
        { path: 'news/:id', ...screen(() => content().then((m) => m.NewsEditor), 'news.view') },
        { path: 'events', ...screen(() => content().then((m) => m.EventsList), ['events.view', 'events.manage']) },
        { path: 'events/:id', ...screen(() => content().then((m) => m.EventEditor), ['events.view', 'events.manage']) },
        { path: 'media', ...screen(() => d(import('./pages/MediaLibraryPage')), 'media.view') },
        { path: 'gallery', ...screen(() => gallery().then((m) => m.GalleryList), 'gallery.manage') },
        { path: 'gallery/:id', ...screen(() => gallery().then((m) => m.GalleryAlbumEditor), 'gallery.manage') },
        { path: 'faculties', ...screen(() => resources().then((m) => m.FacultiesAdmin), ['academics.view', 'academics.manage']) },
        { path: 'departments', ...screen(() => resources().then((m) => m.DepartmentsAdmin), ['academics.view', 'academics.manage']) },
        { path: 'programs', ...screen(() => resources().then((m) => m.ProgramsAdmin), ['academics.view', 'academics.manage']) },
        { path: 'centers', ...screen(() => resources().then((m) => m.CentersAdmin), 'centers.manage') },
        { path: 'research', ...screen(() => resources().then((m) => m.ResearchAdmin), 'research.manage') },
        { path: 'campus', ...screen(() => resources().then((m) => m.CampusAdmin), 'campus.manage') },
        { path: 'contacts', ...screen(() => resources().then((m) => m.ContactsAdmin), 'contact.manage') },
        { path: 'social', ...screen(() => resources().then((m) => m.SocialAdmin), 'social.manage') },
        { path: 'settings', ...screen(() => d(import('./pages/SettingsPage')), 'settings.manage') },
        { path: 'users', ...screen(() => administration().then((m) => m.UsersPage), 'users.manage') },
        { path: 'roles', ...screen(() => administration().then((m) => m.RolesPage), ['roles.manage', 'users.manage']) },
        { path: 'activity', ...screen(() => administration().then((m) => m.ActivityPage), 'logs.view') },
        { path: '*', ...screen(() => import('./ui').then((m) => () => <m.AdminPage title="Not found"><m.Notice>This admin page does not exist.</m.Notice></m.AdminPage>)) },
      ],
    },
  ],
};
