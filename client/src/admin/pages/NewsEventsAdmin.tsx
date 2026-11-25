import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ExternalLink, Pencil, Plus, Search, Star, Tags, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Media, Paged } from '@/lib/types';
import { useAuth } from '../auth';
import { useAction } from '../hooks';
import { MediaThumb } from '../media';
import { FormFields, type FieldDef } from '../SchemaForm';
import { AdminPage, Button, ButtonLinkAdmin, Card, Empty, Field, Input, Modal, Notice, Pager, Select, Spinner, StatusPill, Tabs, Textarea, useConfirm } from '../ui';

type Kind = 'news' | 'events';

interface Category { id: string; name: string; slug: string; description: string | null }
interface Row {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  isFeatured: boolean;
  startsAt?: string;
  category: Category | null;
  featuredImage: Media | null;
}

const CONFIG = {
  news: {
    title: 'News',
    singular: 'article',
    base: '/admin/news',
    publicBase: '/news',
    editPerm: 'news.edit',
    createPerm: 'news.create',
    publishPerm: 'news.publish',
    deletePerm: 'news.delete',
    categoryPerm: 'news.edit',
    description: 'Announcements and stories from UIT. Only publish news that has actually happened, with dates from official sources.',
  },
  events: {
    title: 'Events',
    singular: 'event',
    base: '/admin/events',
    publicBase: '/events',
    editPerm: 'events.manage',
    createPerm: 'events.manage',
    publishPerm: 'events.publish',
    deletePerm: 'events.manage',
    categoryPerm: 'events.manage',
    description: 'Scheduled university events. Only add events with confirmed dates. The website hides past events from the upcoming list automatically.',
  },
} as const;

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ARCHIVED', label: 'Archived' },
];

// ───────────────────────────── Categories ─────────────────────────────

function CategoryManager({ kind, open, onClose }: { kind: Kind; open: boolean; onClose: () => void }) {
  const confirm = useConfirm();
  const { data } = useQuery({ queryKey: [`${kind}-categories-admin`], queryFn: () => api<Category[]>(`/${kind}/categories`), enabled: open });
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const invalidate = [[`${kind}-categories-admin`], ['relation', `/${kind}/categories`], [`${kind}-categories`]];
  const reset = () => { setEditing(null); setName(''); setDescription(''); };
  const save = useAction(
    () => api(editing ? `/${kind}/categories/${editing.id}` : `/${kind}/categories`, { method: editing ? 'PUT' : 'POST', body: { name, description: description || null } }),
    { success: editing ? 'Category updated' : 'Category added', invalidate, onSuccess: reset },
  );
  const remove = useAction((id: string) => api(`/${kind}/categories/${id}`, { method: 'DELETE' }), { success: 'Category deleted', invalidate });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={`${CONFIG[kind].title} categories`}>
      <ul className="mb-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span><span className="font-medium text-slate-800">{c.name}</span>{c.description && <span className="block text-xs text-slate-500">{c.description}</span>}</span>
            <span className="flex gap-1">
              <Button size="sm" variant="ghost" aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c); setName(c.name); setDescription(c.description ?? ''); }}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="danger-ghost" aria-label={`Delete ${c.name}`} onClick={async () => (await confirm({ title: `Delete “${c.name}”?`, message: 'Items in this category become uncategorised.', confirmLabel: 'Delete', danger: true })) && remove.mutate(c.id)}><Trash2 className="size-3.5" /></Button>
            </span>
          </li>
        ))}
        {data && !data.length && <li className="px-3 py-4 text-center text-sm text-slate-500">No categories yet.</li>}
      </ul>
      <div className="space-y-3 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">{editing ? `Edit “${editing.name}”` : 'Add a category'}</p>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></Field>
        <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={2} /></Field>
        <div className="flex justify-end gap-2">
          {editing && <Button onClick={reset}>Cancel</Button>}
          <Button variant="primary" disabled={name.trim().length < 2} loading={save.isPending} onClick={() => save.mutate()}>{editing ? 'Save' : 'Add'}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ───────────────────────────── List ─────────────────────────────

function ContentList({ kind }: { kind: Kind }) {
  const cfg = CONFIG[kind];
  const { can } = useAuth();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [when, setWhen] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [page, setPage] = useState(1);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const key = [`admin-${kind}`, debounced, status, when, page];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api<Paged<Row>>(`/${kind}/admin`, { query: { q: debounced || undefined, status: status || undefined, page, pageSize: 20, ...(kind === 'events' ? { when, order: when === 'past' ? 'desc' : 'asc' } : { sort: 'updatedAt', order: 'desc' }) } }),
    placeholderData: keepPreviousData,
  });
  const invalidate = [[`admin-${kind}`], [kind], ['dashboard']];
  const setItemStatus = useAction(({ id, status }: { id: string; status: string }) => api(`/${kind}/${id}/status`, { method: 'POST', body: { status } }), { success: (_r, v) => (v.status === 'PUBLISHED' ? 'Published' : 'Moved to drafts'), invalidate });
  const remove = useAction((id: string) => api(`/${kind}/${id}`, { method: 'DELETE' }), { success: 'Deleted', invalidate });

  return (
    <AdminPage
      title={cfg.title}
      description={cfg.description}
      actions={
        <>
          {can(cfg.categoryPerm) && <Button icon={<Tags className="size-4" />} onClick={() => setCategoriesOpen(true)}>Categories</Button>}
          {can(cfg.createPerm) && <ButtonLinkAdmin to={`${cfg.base}/new`} variant="primary" icon={<Plus className="size-4" />}>New {cfg.singular}</ButtonLinkAdmin>}
        </>
      }
    >
      {kind === 'events' && (
        <div className="mb-4">
          <Tabs value={when} onChange={(v) => { setWhen(v); setPage(1); }} items={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'all', label: 'All' }]} />
        </div>
      )}
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.title.toLowerCase()}`} className="pl-9" aria-label={`Search ${cfg.title.toLowerCase()}`} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44" aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        {isLoading ? <Spinner /> : !data?.items.length ? (
          <div className="p-4">
            <Empty
              title={kind === 'events' && when === 'upcoming' ? 'No upcoming events' : `No ${cfg.title.toLowerCase()} found`}
              text={kind === 'events' ? 'Add an event once its date is confirmed. The website shows a clear message while there are none.' : 'Publish news once it has been confirmed by the university.'}
              action={can(cfg.createPerm) && <ButtonLinkAdmin to={`${cfg.base}/new`} icon={<Plus className="size-4" />}>New {cfg.singular}</ButtonLinkAdmin>}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="hidden size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:block">
                  {r.featuredImage && <MediaThumb media={r.featuredImage} className="size-full" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`${cfg.base}/${r.id}`} className="line-clamp-1 font-medium text-slate-900 hover:text-teal-700">
                    {r.isFeatured && <Star className="mr-1 inline size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />}
                    {r.title}
                  </Link>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <StatusPill status={r.status} />
                    {r.category && <span>{r.category.name}</span>}
                    {kind === 'events' && r.startsAt ? <span>{formatDateTime(r.startsAt)}</span> : r.publishedAt ? <span>{r.status === 'SCHEDULED' ? 'Goes live ' : ''}{formatDate(r.publishedAt)}</span> : <span>Edited {formatDate(r.updatedAt)}</span>}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.status === 'PUBLISHED' && <a href={`${cfg.publicBase}/${r.slug}`} target="_blank" rel="noopener" className="rounded p-2 text-slate-500 hover:bg-slate-100" aria-label="View on website"><ExternalLink className="size-4" /></a>}
                  {can(cfg.publishPerm) && (r.status === 'DRAFT' || r.status === 'ARCHIVED') && <Button size="sm" onClick={() => setItemStatus.mutate({ id: r.id, status: 'PUBLISHED' })}>Publish</Button>}
                  {can(cfg.publishPerm) && r.status === 'PUBLISHED' && <Button size="sm" variant="ghost" onClick={() => setItemStatus.mutate({ id: r.id, status: 'DRAFT' })}>Unpublish</Button>}
                  {can(cfg.deletePerm) && (r.status === 'DRAFT' || can(cfg.publishPerm)) && (
                    <Button size="sm" variant="danger-ghost" aria-label={`Delete ${r.title}`} onClick={async () => (await confirm({ title: `Delete “${r.title}”?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) && remove.mutate(r.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {data && <div className="border-t border-slate-100 p-3"><Pager page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
      </Card>
      <CategoryManager kind={kind} open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </AdminPage>
  );
}

// ───────────────────────────── Editor ─────────────────────────────

const mainFields = (kind: Kind): FieldDef[] => [
  { key: 'title', label: 'Title', kind: 'text', max: 200, required: true, wide: true },
  { key: 'slug', label: 'URL slug', kind: 'text', max: 160, hint: 'Generated from the title if empty.', wide: true },
  { key: 'summary', label: 'Summary', kind: 'textarea', rows: 2, max: 600, required: true, hint: 'Shown on cards and in search results.' },
  ...(kind === 'events'
    ? ([
        { key: 'startsAt', label: 'Starts', kind: 'datetime', required: true },
        { key: 'endsAt', label: 'Ends', kind: 'datetime' },
        { key: 'isAllDay', label: 'All-day event', kind: 'toggle', description: 'Hides the time on the website.' },
        { key: 'venue', label: 'Venue', kind: 'text', max: 200 },
        { key: 'registrationUrl', label: 'Registration link', kind: 'url', placeholder: 'https://…', wide: true },
      ] satisfies FieldDef[])
    : []),
  { key: kind === 'news' ? 'content' : 'description', label: kind === 'news' ? 'Article' : 'Description', kind: 'richtext' },
];

const sideFields = (kind: Kind): FieldDef[] => [
  { key: 'categoryId', label: 'Category', kind: 'relation', endpoint: `/${kind}/categories`, labelKey: 'name', allowEmpty: 'No category' },
  ...(kind === 'news' ? ([{ key: 'tags', label: 'Tags', kind: 'strings', placeholder: 'Add a tag', max: 15 }] satisfies FieldDef[]) : []),
  { key: 'isFeatured', label: 'Featured', kind: 'toggle', description: kind === 'news' ? 'Shown first on the homepage and news page.' : 'Highlighted in event lists.' },
];
const imageFields: FieldDef[] = [
  { key: 'featuredImageId', label: 'Featured image', kind: 'image' },
  { key: 'imageAlt', label: 'Image description', kind: 'text', max: 300, hint: 'For screen readers. Defaults to the media library alt text.' },
];
const seoFields: FieldDef[] = [
  { key: 'seoTitle', label: 'SEO title', kind: 'text', max: 70 },
  { key: 'seoDescription', label: 'SEO description', kind: 'textarea', rows: 3, max: 170 },
];

const INPUT_KEYS = {
  news: ['title', 'slug', 'summary', 'content', 'featuredImageId', 'imageAlt', 'categoryId', 'tags', 'status', 'isFeatured', 'publishedAt', 'seoTitle', 'seoDescription'],
  events: ['title', 'slug', 'summary', 'description', 'featuredImageId', 'imageAlt', 'categoryId', 'startsAt', 'endsAt', 'isAllDay', 'venue', 'registrationUrl', 'status', 'isFeatured', 'publishedAt', 'seoTitle', 'seoDescription'],
};
const EMPTY = {
  news: { title: '', slug: '', summary: '', content: '', featuredImageId: null, imageAlt: '', categoryId: null, tags: [], status: 'DRAFT', isFeatured: false, publishedAt: null, seoTitle: '', seoDescription: '' },
  events: { title: '', slug: '', summary: '', description: '', featuredImageId: null, imageAlt: '', categoryId: null, startsAt: null, endsAt: null, isAllDay: false, venue: '', registrationUrl: '', status: 'DRAFT', isFeatured: false, publishedAt: null, seoTitle: '', seoDescription: '' },
};

function pick(kind: Kind, record: Record<string, any>) {
  return Object.fromEntries(INPUT_KEYS[kind].map((k) => [k, record[k] ?? (EMPTY[kind] as Record<string, unknown>)[k]]));
}
function payload(values: Record<string, any>) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' && k !== 'content' && k !== 'description' && k !== 'summary' && k !== 'title' ? null : v]));
}

function ContentEditor({ kind }: { kind: Kind }) {
  const cfg = CONFIG[kind];
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { can } = useAuth();
  const canEdit = can(isNew ? cfg.createPerm : cfg.editPerm);
  const canPublish = can(cfg.publishPerm);

  const { data, isLoading, error } = useQuery({ queryKey: [`admin-${kind}-item`, id], queryFn: () => api<Record<string, any>>(`/${kind}/admin/${id}`), enabled: !isNew, retry: false });
  const [values, setValues] = useState<Record<string, any>>(() => ({ ...EMPTY[kind] }));
  const [baseline, setBaseline] = useState(() => JSON.stringify(EMPTY[kind]));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = (r: Record<string, any>) => { const v = pick(kind, r); setValues(v); setBaseline(JSON.stringify(v)); setErrors({}); };
  useEffect(() => { if (data) load(data); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => JSON.stringify(values) !== baseline, [values, baseline]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({ title: 'Leave without saving?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Leave', danger: true }).then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker, confirm]);

  const save = useAction(
    (override: Record<string, any> | void) => {
      const body = payload({ ...values, ...(override ?? {}) });
      return isNew ? api<Record<string, any>>(`/${kind}`, { method: 'POST', body }) : api<Record<string, any>>(`/${kind}/${id}`, { method: 'PUT', body });
    },
    {
      success: (r) => (r.status === 'PUBLISHED' ? 'Saved and live' : r.status === 'SCHEDULED' ? `Scheduled for ${formatDateTime(r.publishedAt)}` : 'Saved'),
      invalidate: [[`admin-${kind}`], [kind], ['dashboard'], [`admin-${kind}-item`, id]],
      onSuccess: (r) => {
        load(r);
        if (isNew) setTimeout(() => navigate(`${cfg.base}/${r.id}`, { replace: true }), 0);
      },
      onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}),
    },
  );
  const remove = useAction(() => api(`/${kind}/${id}`, { method: 'DELETE' }), {
    success: 'Deleted', invalidate: [[`admin-${kind}`], [kind]], onSuccess: () => { setBaseline(JSON.stringify(values)); setTimeout(() => navigate(cfg.base), 0); },
  });

  if (!isNew && isLoading) return <AdminPage title={cfg.title} back={{ to: cfg.base, label: cfg.title }}><Spinner /></AdminPage>;
  if (!isNew && (error || !data)) return <AdminPage title="Not found" back={{ to: cfg.base, label: cfg.title }}><Notice tone="danger">This {cfg.singular} could not be loaded.</Notice></AdminPage>;

  const savedStatus = (data?.status as string | undefined) ?? 'DRAFT';
  const live = savedStatus === 'PUBLISHED' || savedStatus === 'SCHEDULED';
  const statusOptions = STATUS_OPTIONS.filter((o) => canPublish || o.value === 'DRAFT' || o.value === savedStatus);

  return (
    <AdminPage
      title={isNew ? `New ${cfg.singular}` : values.title || 'Untitled'}
      back={{ to: cfg.base, label: cfg.title }}
      description={!isNew && <span className="flex items-center gap-2"><StatusPill status={savedStatus} />{data?.publishedAt && <span>{savedStatus === 'SCHEDULED' ? 'Goes live' : 'Published'} {formatDateTime(data.publishedAt)}</span>}</span>}
      actions={
        <>
          {!isNew && savedStatus === 'PUBLISHED' && <a href={`${cfg.publicBase}/${data?.slug}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100"><ExternalLink className="size-4" /> View</a>}
          {canEdit && <Button variant={canPublish ? 'secondary' : 'primary'} disabled={!dirty && !isNew} loading={save.isPending} onClick={() => save.mutate()}>Save</Button>}
          {canEdit && canPublish && values.status !== 'PUBLISHED' && (
            <Button variant="publish" loading={save.isPending} onClick={() => save.mutate({ status: values.publishedAt && new Date(values.publishedAt) > new Date() ? 'SCHEDULED' : 'PUBLISHED' })}>
              {values.publishedAt && new Date(values.publishedAt) > new Date() ? 'Schedule' : 'Publish'}
            </Button>
          )}
        </>
      }
    >
      {Object.keys(errors).length > 0 && <div className="mb-4"><Notice tone="danger">Some fields need attention.</Notice></div>}
      {live && !canPublish && <div className="mb-4"><Notice tone="warning">This {cfg.singular} is live. Only users with publish permission can change it.</Notice></div>}
      <fieldset disabled={!canEdit || (live && !canPublish)} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="min-w-0"><FormFields fields={mainFields(kind)} values={values} onChange={setValues} errors={errors} columns={2} /></Card>
        <div className="min-w-0 space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              <Field label="Status" error={errors.status}>
                <Select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
              <FormFields fields={[{ key: 'publishedAt', label: 'Publish date', kind: 'datetime', hint: 'Leave empty to use the moment it is published. A future date schedules it.' }]} values={values} onChange={setValues} errors={errors} />
            </div>
          </Card>
          <Card title="Organisation"><FormFields fields={sideFields(kind)} values={values} onChange={setValues} errors={errors} /></Card>
          <Card title="Image"><FormFields fields={imageFields} values={values} onChange={setValues} errors={errors} /></Card>
          <Card title="Search engines"><FormFields fields={seoFields} values={values} onChange={setValues} errors={errors} /></Card>
          {!isNew && can(cfg.deletePerm) && (!live || canPublish) && (
            <Button variant="danger-ghost" icon={<Trash2 className="size-4" />} className="w-full" loading={remove.isPending} onClick={async () => (await confirm({ title: `Delete this ${cfg.singular}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}>
              Delete {cfg.singular}
            </Button>
          )}
        </div>
      </fieldset>
    </AdminPage>
  );
}

export const NewsList = () => <ContentList kind="news" />;
export const EventsList = () => <ContentList kind="events" />;
export const NewsEditor = () => <ContentEditor key="news" kind="news" />;
export const EventEditor = () => <ContentEditor key="events" kind="events" />;
