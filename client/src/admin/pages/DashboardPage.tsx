import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, FileText, GraduationCap, Home, Image, Newspaper, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { api } from '@/lib/api';
import { useAuth } from '../auth';
import { AdminPage, ButtonLinkAdmin, Card, relativeTime, Spinner, StatusPill } from '../ui';

interface Dashboard {
  content: { published: number; draft: number; scheduled: number; archived: number };
  news: number;
  upcomingEvents: number;
  programs: number;
  programsOffered: number;
  media: number;
  centers: number;
  pendingChanges: number;
  homepageHasDraft: boolean;
  needsVerification: number;
  recentActivity: { id: string; action: string; entityType: string; summary: string; createdAt: string; user: { name: string } | null }[];
  recentlyEdited: { id: string; title: string; status: string; updatedAt: string; kind: 'news' | 'page' }[];
}

function Stat({ label, value, sub, icon, to }: { label: string; value: ReactNode; sub?: ReactNode; icon: ReactNode; to?: string }) {
  const body = (
    <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      <span className="rounded-lg bg-teal-50 p-2 text-teal-700">{icon}</span>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') });

  return (
    <AdminPage
      title={`Welcome, ${user?.name.split(' ')[0] ?? ''}`}
      description="An overview of the website content, drafts and recent activity."
      actions={
        <>
          {can('news.create') && <ButtonLinkAdmin to="/admin/news/new" icon={<Plus className="size-4" />}>New article</ButtonLinkAdmin>}
          {can('media.upload') && <ButtonLinkAdmin to="/admin/media" variant="primary" icon={<Image className="size-4" />}>Upload media</ButtonLinkAdmin>}
        </>
      }
    >
      {isLoading || !data ? <Spinner /> : (
        <div className="space-y-6">
          {(data.homepageHasDraft || data.pendingChanges > 0 || data.needsVerification > 0) && (
            <div className="grid gap-3 md:grid-cols-3">
              {data.homepageHasDraft && (
                <Link to="/admin/homepage" className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                  <Home className="size-5 shrink-0" aria-hidden /> The homepage has unpublished draft changes.
                </Link>
              )}
              {data.pendingChanges > 0 && (
                <Link to="/admin/pages" className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                  <FileText className="size-5 shrink-0" aria-hidden /> {data.pendingChanges} published page{data.pendingChanges === 1 ? ' has' : 's have'} unpublished edits.
                </Link>
              )}
              {data.needsVerification > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle className="size-5 shrink-0" aria-hidden /> {data.needsVerification} items are marked for fact verification. Look for the “Verify” badge in each module.
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Published content" value={data.content.published} sub={`${data.content.draft} drafts · ${data.content.scheduled} scheduled`} icon={<FileText className="size-5" />} to={can('pages.view') ? '/admin/pages' : undefined} />
            <Stat label="News articles" value={data.news} icon={<Newspaper className="size-5" />} to={can('news.view') ? '/admin/news' : undefined} />
            <Stat label="Upcoming events" value={data.upcomingEvents} icon={<CalendarDays className="size-5" />} to={can('events.view', 'events.manage') ? '/admin/events' : undefined} />
            <Stat label="Programs" value={data.programs} sub={`${data.programsOffered} currently offered`} icon={<GraduationCap className="size-5" />} to={can('academics.view', 'academics.manage') ? '/admin/programs' : undefined} />
            <Stat label="Media files" value={data.media} icon={<Image className="size-5" />} to={can('media.view') ? '/admin/media' : undefined} />
            <Stat label="Centers" value={data.centers} icon={<GraduationCap className="size-5" />} to={can('centers.manage') ? '/admin/centers' : undefined} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Recently edited" padded={false}>
              {data.recentlyEdited.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.recentlyEdited.map((r) => (
                    <li key={`${r.kind}-${r.id}`}>
                      <Link to={r.kind === 'news' ? `/admin/news/${r.id}` : `/admin/pages/${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">{r.title}</span>
                          <span className="text-xs text-slate-500">{r.kind === 'news' ? 'News' : 'Page'} · {relativeTime(r.updatedAt)}</span>
                        </span>
                        <StatusPill status={r.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="p-5 text-sm text-slate-500">Nothing edited yet.</p>}
            </Card>
            <Card title="Recent activity" padded={false} actions={can('logs.view') ? <Link to="/admin/activity" className="text-xs font-medium text-teal-700 hover:underline">View all</Link> : undefined}>
              {data.recentActivity.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="px-5 py-3">
                      <p className="text-sm text-slate-800">{a.summary}</p>
                      <p className="text-xs text-slate-500">{a.user?.name ?? 'System'} · {relativeTime(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="p-5 text-sm text-slate-500">No activity recorded yet.</p>}
            </Card>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
