import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ExternalLink, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '@/lib/api';
import type { Paged } from '@/lib/types';
import { useAuth } from '../auth';
import { useAction } from '../hooks';
import { AdminPage, Button, Card, Empty, Field, Input, Modal, Pager, relativeTime, Select, Spinner, StatusPill, VerifyFlag } from '../ui';

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  hasDraftChanges: boolean;
  needsVerification: boolean;
  updatedAt: string;
  updatedBy: { name: string } | null;
}

export default function PagesList() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pages', debounced, status, page],
    queryFn: () => api<Paged<PageRow>>('/pages/admin', { query: { q: debounced || undefined, status: status || undefined, page, pageSize: 25, sort: 'title', order: 'asc' } }),
    placeholderData: keepPreviousData,
  });

  const create = useAction(() => api<{ id: string }>('/pages', { method: 'POST', body: { title, slug: slug || undefined, blocks: [] } }), {
    success: 'Page created as a draft',
    invalidate: [['admin-pages']],
    onSuccess: (p) => navigate(`/admin/pages/${p.id}`),
  });

  return (
    <AdminPage
      title="Pages"
      description="Content pages such as About, Admissions and Campus. Live pages keep showing their published version while you edit."
      actions={can('pages.create') && <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New page</Button>}
    >
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or URL" className="pl-9" aria-label="Search pages" />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>
        {isLoading ? <Spinner /> : !data?.items.length ? (
          <div className="p-4"><Empty title="No pages found" text="Try a different search or status." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr><th className="px-4 py-2.5">Title</th><th className="px-4 py-2.5">Status</th><th className="hidden px-4 py-2.5 md:table-cell">Last edited</th><th className="px-4 py-2.5"><span className="sr-only">View</span></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/pages/${p.id}`} className="font-medium text-slate-900 hover:text-teal-700">{p.title}</Link>
                      <span className="block font-mono text-xs text-slate-500">/{p.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <StatusPill status={p.status} />
                        {p.hasDraftChanges && <StatusPill status="CHANGES" label="Unpublished changes" />}
                        {p.needsVerification && <VerifyFlag />}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{relativeTime(p.updatedAt)}{p.updatedBy ? ` · ${p.updatedBy.name}` : ''}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'PUBLISHED' && (
                        <a href={`/${p.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700" aria-label={`View ${p.title} on the website`}>
                          <ExternalLink className="size-3.5" /> View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="border-t border-slate-100 p-3"><Pager page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New page"
        size="sm"
        footer={<><Button onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" disabled={title.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>Create draft</Button></>}
      >
        <div className="space-y-4">
          <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></Field>
          <Field label="URL" hint="Optional. Generated from the title if empty. Use / for sub-pages, e.g. about/history."><Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="about/new-page" /></Field>
        </div>
      </Modal>
    </AdminPage>
  );
}
