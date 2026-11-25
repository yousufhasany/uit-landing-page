import {
  Activity, BookOpen, Building2, CalendarDays, ExternalLink, FileText, FlaskConical, GalleryHorizontalEnd, GraduationCap, Home, Image, KeyRound,
  LayoutDashboard, LogOut, Megaphone, Menu, MapPinned, Navigation, Newspaper, Phone, Settings, Share2, Shield, Users, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/format';
import { useAuth } from './auth';
import { ConfirmProvider } from './ui';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  perms: string[];
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, perms: ['dashboard.view'] }] },
  {
    label: 'Website',
    items: [
      { to: '/admin/homepage', label: 'Homepage builder', icon: Home, perms: ['homepage.view'] },
      { to: '/admin/pages', label: 'Pages', icon: FileText, perms: ['pages.view'] },
      { to: '/admin/menus', label: 'Navigation', icon: Navigation, perms: ['menus.manage'] },
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, perms: ['announcements.manage'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/news', label: 'News', icon: Newspaper, perms: ['news.view'] },
      { to: '/admin/events', label: 'Events', icon: CalendarDays, perms: ['events.view', 'events.manage'] },
      { to: '/admin/media', label: 'Media library', icon: Image, perms: ['media.view'] },
      { to: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontalEnd, perms: ['gallery.manage'] },
    ],
  },
  {
    label: 'University',
    items: [
      { to: '/admin/faculties', label: 'Faculties / schools', icon: GraduationCap, perms: ['academics.view', 'academics.manage'] },
      { to: '/admin/departments', label: 'Departments', icon: BookOpen, perms: ['academics.view', 'academics.manage'] },
      { to: '/admin/programs', label: 'Programs', icon: GraduationCap, perms: ['academics.view', 'academics.manage'] },
      { to: '/admin/centers', label: 'Centers', icon: Building2, perms: ['centers.manage'] },
      { to: '/admin/research', label: 'Research', icon: FlaskConical, perms: ['research.manage'] },
      { to: '/admin/campus', label: 'Campus', icon: MapPinned, perms: ['campus.manage'] },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/contacts', label: 'Contact details', icon: Phone, perms: ['contact.manage'] },
      { to: '/admin/social', label: 'Social links', icon: Share2, perms: ['social.manage'] },
      { to: '/admin/settings', label: 'Settings', icon: Settings, perms: ['settings.manage'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users, perms: ['users.manage'] },
      { to: '/admin/roles', label: 'Roles & permissions', icon: Shield, perms: ['roles.manage'] },
      { to: '/admin/activity', label: 'Activity log', icon: Activity, perms: ['logs.view'] },
    ],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth();
  return (
    <nav aria-label="CMS" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((i) => can(...i.perms));
        if (!items.length) return null;
        return (
          <div key={g.label}>
            <p className="px-3 text-[0.68rem] font-semibold tracking-wider text-slate-400 uppercase">{g.label}</p>
            <ul className="mt-2 space-y-0.5">
              {items.map((i) => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.to === '/admin'}
                    onClick={onNavigate}
                    className={({ isActive }) => cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors', isActive ? 'bg-white/10 font-medium text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white')}
                  >
                    <i.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {i.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  const signOut = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const brand = (
    <div className="flex items-center gap-3 px-5 py-4">
      <img src="/uit-logo.png" alt="" className="h-9 w-auto rounded bg-white p-0.5" />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">UIT CMS</p>
        <p className="text-xs text-slate-400">Website management</p>
      </div>
    </div>
  );

  const account = (
    <div className="border-t border-white/10 p-3">
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate text-xs text-slate-400">{user?.email}</p>
      </div>
      <div className="mt-1 grid gap-0.5">
        <NavLink to="/admin/account" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"><KeyRound className="size-4" aria-hidden />Account & password</NavLink>
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"><ExternalLink className="size-4" aria-hidden />View website</a>
        <button type="button" onClick={signOut} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"><LogOut className="size-4" aria-hidden />Sign out</button>
      </div>
    </div>
  );

  return (
    <ConfirmProvider>
      <div className="admin-root min-h-screen lg:pl-64">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-900 lg:flex">
          {brand}
          <Sidebar />
          {account}
        </aside>

        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Open CMS menu"><Menu className="size-5" /></button>
          <span className="text-sm font-semibold">UIT CMS</span>
        </header>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-900">
              <div className="flex items-center justify-between pr-3">{brand}<button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-2 text-slate-300 hover:bg-white/10" aria-label="Close menu"><X className="size-5" /></button></div>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
              {account}
            </aside>
          </div>
        )}

        <main id="admin-main">
          <Outlet />
        </main>
      </div>
    </ConfirmProvider>
  );
}
