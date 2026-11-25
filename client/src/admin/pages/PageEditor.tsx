import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Copy, Eye, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { api, ApiError } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/format';
import type { Media } from '@/lib/types';
import { useAuth } from '../auth';
import { BLOCK_DEFAULTS, BLOCK_FIELDS, BLOCK_LABELS, BLOCK_TYPES } from '../blockFields';
import { useAction } from '../hooks';
import { MediaField } from '../media';
import { FormFields } from '../SchemaForm';
import { AdminPage, Button, Card, Field, Input, Modal, Notice, Select, Spinner, StatusPill, Textarea, Toggle, fromLocalInput, toLocalInput, useConfirm } from '../ui';

interface Block { id?: string; type: string; data: Record<string, any> }
interface PageContent {
  title: string;
  slug: string;
  eyebrow: string | null;
  summary: string | null;
  featuredImageId: string | null;
  template: string;
  seoTitle: string | null;
  seoDescription: string | null;
  needsVerification: boolean;
  verificationNote: string | null;
  blocks: Block[];
}
interface PageAdmin {
  id: string;
  status: string;
  publishedAt: string | null;
  hasDraftChanges: boolean;
  updatedAt: string;
  updatedBy: { name: string } | null;
  content: PageContent;
  featuredImage: Media | null;
  revisions: { id: string; version: number; note: string | null; createdAt: string; createdBy: { name: string } | null }[];
}

type EditorBlock = Block & { uid: string };
type Editable = Omit<PageContent, 'blocks'> & { blocks: EditorBlock[] };

let uidCounter = 0;
const uid = () => `blk-${++uidCounter}`;
const toEditable = (c: PageContent): Editable => ({ ...c, blocks: c.blocks.map((b) => ({ ...b, uid: uid() })) });
const toContent = (e: Editable): PageContent => ({ ...e, blocks: e.blocks.map(({ uid: _uid, ...b }) => b) });
const LIVE = ['PUBLISHED', 'SCHEDULED'];

function blockSummary(b: Block) {
  const d = b.data;
  const text = d.text || d.title || d.caption || (d.html ? String(d.html).replace(/<[^>]+>/g, ' ') : '') || d.module || '';
  return String(text).replace(/\s+/g, ' ').trim().slice(0, 70);
}

function BlockCard({ block, index, total, open, onToggle, onChange, onRemove, onDuplicate, errors, canEdit }: {
  block: EditorBlock; index: number; total: number; open: boolean; onToggle: () => void; onChange: (d: Record<string, any>) => void;
  onRemove: () => void; onDuplicate: () => void; errors: Record<string, string>; canEdit: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.uid, disabled: !canEdit });
  const hasError = Object.keys(errors).some((k) => k.startsWith(`blocks.${index}.`));
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('rounded-xl border bg-white', hasError ? 'border-red-300' : 'border-slate-200', isDragging && 'z-10 shadow-lg')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {canEdit && (
          <button type="button" className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100" aria-label={`Reorder block ${index + 1}`} {...attributes} {...listeners}>
            <GripVertical className="size-4" />
          </button>
        )}
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">{BLOCK_LABELS[block.type] ?? block.type}</span>
          <span className="truncate text-sm text-slate-700">{blockSummary(block) || <span className="text-slate-400">Empty</span>}</span>
          <ChevronDown className={cn('ml-auto size-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        {canEdit && (
          <span className="flex shrink-0 gap-0.5">
            <Button size="sm" variant="ghost" onClick={onDuplicate} aria-label={`Duplicate block ${index + 1}`} title="Duplicate"><Copy className="size-3.5" /></Button>
            <Button size="sm" variant="danger-ghost" onClick={onRemove} aria-label={`Remove block ${index + 1}`} title="Remove"><Trash2 className="size-3.5" /></Button>
          </span>
        )}
      </div>
      {open && (
        <fieldset disabled={!canEdit} className="border-t border-slate-100 p-4">
          <FormFields fields={BLOCK_FIELDS[block.type] ?? []} values={block.data} onChange={onChange} errors={errors} path={`blocks.${index}.data`} columns={block.type === 'RICH_TEXT' ? 1 : 2} />
          {total > 0 && hasError && <p className="mt-3 text-xs text-red-600">This block has errors.</p>}
        </fieldset>
      )}
    </li>
  );
}

export default function PageEditor() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { can } = useAuth();
  const canEdit = can('pages.edit');
  const canPublish = can('pages.publish');
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-page', id], queryFn: () => api<PageAdmin>(`/pages/admin/${id}`), retry: false });

  const [form, setForm] = useState<Editable | null>(null);
  const [baseline, setBaseline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [newType, setNewType] = useState<string>('RICH_TEXT');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const load = (p: PageAdmin) => {
    setForm(toEditable(p.content));
    setBaseline(JSON.stringify(p.content));
    setErrors({});
  };
  useEffect(() => { if (data) load(data); }, [data?.updatedAt, data?.status, data?.hasDraftChanges]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => Boolean(form) && JSON.stringify(toContent(form!)) !== baseline, [form, baseline]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    confirm({ title: 'Leave without saving?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Leave', danger: true }).then((ok) => (ok ? blocker.proceed() : blocker.reset()));
  }, [blocker, confirm]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const onError = (e: unknown) => setErrors(e instanceof ApiError ? e.fields : {});
  const invalidate = [['admin-page', id], ['admin-pages'], ['page'], ['page-preview', id]];
  const after = { invalidate, onError, onSuccess: (p: PageAdmin) => load(p) };

  const save = useAction(() => api<PageAdmin>(`/pages/${id}`, { method: 'PUT', body: toContent(form!) }), { ...after, success: data && LIVE.includes(data.status) ? 'Draft saved. The live page is unchanged until you publish.' : 'Saved' });
  const publish = useAction((publishedAt: string | null) => api<PageAdmin>(`/pages/${id}/publish`, { method: 'POST', body: { content: toContent(form!), publishedAt } }), {
    ...after, success: (_r, at) => (at ? `Scheduled for ${formatDateTime(at)}` : 'Page published'), onSuccess: (p) => { load(p); setScheduleOpen(false); },
  });
  const unpublish = useAction((archive: boolean) => api<PageAdmin>(`/pages/${id}/${archive ? 'archive' : 'unpublish'}`, { method: 'POST' }), { ...after, success: (_r, a) => (a ? 'Page archived' : 'Page unpublished') });
  const discard = useAction(() => api<PageAdmin>(`/pages/${id}/discard`, { method: 'POST' }), { ...after, success: 'Unpublished changes discarded' });
  const restore = useAction((revisionId: string) => api<PageAdmin>(`/pages/${id}/revisions/${revisionId}/restore`, { method: 'POST' }), { ...after, success: 'Version loaded into the draft' });
  const remove = useAction(() => api(`/pages/${id}`, { method: 'DELETE' }), { success: 'Page deleted', invalidate: [['admin-pages']], onSuccess: () => { setBaseline(JSON.stringify(toContent(form!))); setTimeout(() => navigate('/admin/pages'), 0); } });

  if (isLoading) return <AdminPage title="Page" back={{ to: '/admin/pages', label: 'Pages' }}><Spinner /></AdminPage>;
  if (error || !data || !form) return <AdminPage title="Page not found" back={{ to: '/admin/pages', label: 'Pages' }}><Notice tone="danger">This page could not be loaded.</Notice></AdminPage>;

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const setBlocks = (fn: (b: EditorBlock[]) => EditorBlock[]) => setForm((f) => (f ? { ...f, blocks: fn(f.blocks) } : f));
  const addBlock = () => {
    const b: EditorBlock = { uid: uid(), type: newType, data: structuredClone(BLOCK_DEFAULTS[newType]) };
    setBlocks((bs) => [...bs, b]);
    setOpen((o) => new Set(o).add(b.uid));
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setBlocks((bs) => arrayMove(bs, bs.findIndex((b) => b.uid === e.active.id), bs.findIndex((b) => b.uid === e.over!.id)));
  };
  const preview = async () => {
    const w = window.open('about:blank', '_blank');
    try {
      if (dirty) await save.mutateAsync();
      if (w) w.location.href = `/admin/preview/page/${id}`;
    } catch {
      w?.close();
    }
  };

  const live = LIVE.includes(data.status);
  const busy = save.isPending || publish.isPending;

  return (
    <AdminPage
      title={form.title || 'Untitled page'}
      back={{ to: '/admin/pages', label: 'Pages' }}
      description={<span className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs">/{form.slug}</span><StatusPill status={data.status} />{data.hasDraftChanges && <StatusPill status="CHANGES" label="Unpublished changes" />}</span>}
      actions={
        <>
          <Button icon={<Eye className="size-4" />} onClick={preview} disabled={!canEdit && dirty}>{dirty ? 'Save & preview' : 'Preview'}</Button>
          {canEdit && <Button variant={canPublish ? 'secondary' : 'primary'} disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>{live ? 'Save draft' : 'Save'}</Button>}
          {canPublish && <Button variant="publish" loading={publish.isPending} disabled={busy || (!dirty && data.status === 'PUBLISHED' && !data.hasDraftChanges)} onClick={() => publish.mutate(null)}>{live ? 'Publish changes' : 'Publish'}</Button>}
        </>
      }
    >
      {Object.keys(errors).length > 0 && <div className="mb-4"><Notice tone="danger">Some fields need attention. Check the highlighted fields and blocks.</Notice></div>}
      {live && data.hasDraftChanges && !dirty && <div className="mb-4"><Notice tone="warning">This page has saved changes that are not live yet.{canPublish ? ' Publish them to update the website.' : ''}</Notice></div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <fieldset disabled={!canEdit} className="min-w-0 space-y-6">
          <Card title="Page details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" required error={errors.title} className="sm:col-span-2"><Input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={200} /></Field>
              <Field label="URL" error={errors.slug} hint={data.status === 'PUBLISHED' ? 'Changing the URL of a live page breaks existing links and menu items.' : 'Use / for sub-pages, e.g. about/history.'}>
                <Input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} className="font-mono" />
              </Field>
              <Field label="Eyebrow" error={errors.eyebrow} hint="Small label above the title."><Input value={form.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.target.value || null)} maxLength={80} /></Field>
              <Field label="Summary" error={errors.summary} className="sm:col-span-2" hint="Shown under the page title and used as the default search description."><Textarea value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value || null)} maxLength={600} rows={2} /></Field>
            </div>
          </Card>

          <Card title="Content blocks" description="Drag to reorder. Click a block to edit it." actions={form.blocks.length > 1 && <Button size="sm" variant="ghost" onClick={() => setOpen((o) => (o.size ? new Set() : new Set(form.blocks.map((b) => b.uid))))}>{open.size ? 'Collapse all' : 'Expand all'}</Button>}>
            {form.blocks.length === 0 && <p className="mb-4 text-sm text-slate-500">This page has no content yet. Add a block below.</p>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={form.blocks.map((b) => b.uid)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {form.blocks.map((b, i) => (
                    <BlockCard
                      key={b.uid}
                      block={b}
                      index={i}
                      total={form.blocks.length}
                      canEdit={canEdit}
                      errors={errors}
                      open={open.has(b.uid) || Object.keys(errors).some((k) => k.startsWith(`blocks.${i}.`))}
                      onToggle={() => setOpen((o) => { const n = new Set(o); if (n.has(b.uid)) n.delete(b.uid); else n.add(b.uid); return n; })}
                      onChange={(d) => setBlocks((bs) => bs.map((x) => (x.uid === b.uid ? { ...x, data: d } : x)))}
                      onDuplicate={() => setBlocks((bs) => { const n = [...bs]; n.splice(i + 1, 0, { type: b.type, data: structuredClone(b.data), uid: uid() }); return n; })}
                      onRemove={async () => (await confirm({ title: `Remove this ${BLOCK_LABELS[b.type]?.toLowerCase() ?? ''} block?`, confirmLabel: 'Remove', danger: true })) && setBlocks((bs) => bs.filter((x) => x.uid !== b.uid))}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
            {canEdit && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3">
                <Select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-52" aria-label="Block type">
                  {BLOCK_TYPES.map((t) => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
                </Select>
                <Button icon={<Plus className="size-4" />} onClick={addBlock}>Add block</Button>
              </div>
            )}
          </Card>
        </fieldset>

        <div className="min-w-0 space-y-6">
          <Card title="Publishing">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Status</dt><dd><StatusPill status={data.status} /></dd></div>
              {data.publishedAt && <div className="flex justify-between gap-2"><dt className="text-slate-500">{data.status === 'SCHEDULED' ? 'Goes live' : 'Published'}</dt><dd className="text-right text-slate-700">{formatDateTime(data.publishedAt)}</dd></div>}
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Last edited</dt><dd className="text-right text-slate-700">{formatDateTime(data.updatedAt)}{data.updatedBy ? <span className="block text-xs text-slate-500">{data.updatedBy.name}</span> : null}</dd></div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              {canPublish && <Button onClick={() => { setScheduleAt(data.status === 'SCHEDULED' ? data.publishedAt : null); setScheduleOpen(true); }}>Schedule…</Button>}
              {canEdit && live && data.hasDraftChanges && (
                <Button variant="ghost" loading={discard.isPending} onClick={async () => (await confirm({ title: 'Discard unpublished changes?', message: 'The editor goes back to the live version of this page.', confirmLabel: 'Discard', danger: true })) && discard.mutate()}>Discard unpublished changes</Button>
              )}
              {canPublish && live && <Button variant="ghost" loading={unpublish.isPending} onClick={async () => (await confirm({ title: 'Unpublish this page?', message: 'It is removed from the website and becomes a draft.', confirmLabel: 'Unpublish', danger: true })) && unpublish.mutate(false)}>Unpublish</Button>}
              {canPublish && data.status !== 'ARCHIVED' && <Button variant="ghost" onClick={async () => (await confirm({ title: 'Archive this page?', message: 'It is removed from the website and kept for reference.', confirmLabel: 'Archive', danger: true })) && unpublish.mutate(true)}>Archive</Button>}
              {can('pages.delete') && (!live || canPublish) && (
                <Button variant="danger-ghost" icon={<Trash2 className="size-4" />} loading={remove.isPending} onClick={async () => (await confirm({ title: `Delete “${data.content.title}”?`, message: 'This cannot be undone. Menu links to this page will stop working.', confirmLabel: 'Delete page', danger: true })) && remove.mutate()}>Delete page</Button>
              )}
            </div>
          </Card>

          <fieldset disabled={!canEdit} className="space-y-6">
            <Card title="Settings">
              <div className="space-y-4">
                <MediaField label="Header image" value={form.featuredImageId} preview={data.featuredImage} onChange={(v) => set('featuredImageId', v)} hint="Optional photo behind the page title." />
                <Field label="Layout" error={errors.template}>
                  <Select value={form.template} onChange={(e) => set('template', e.target.value)}>
                    <option value="standard">Standard (text width)</option>
                    <option value="landing">Landing (wide sections)</option>
                    <option value="listing">Listing (module pages)</option>
                  </Select>
                </Field>
              </div>
            </Card>
            <Card title="Search engines">
              <div className="space-y-4">
                <Field label="SEO title" error={errors.seoTitle} hint={`${(form.seoTitle ?? '').length}/70. Defaults to the page title.`}><Input value={form.seoTitle ?? ''} onChange={(e) => set('seoTitle', e.target.value || null)} maxLength={70} /></Field>
                <Field label="SEO description" error={errors.seoDescription} hint={`${(form.seoDescription ?? '').length}/170. Defaults to the summary.`}><Textarea value={form.seoDescription ?? ''} onChange={(e) => set('seoDescription', e.target.value || null)} maxLength={170} rows={3} /></Field>
              </div>
            </Card>
            <Card title="Fact check">
              <div className="space-y-4">
                <Toggle checked={form.needsVerification} onChange={(v) => set('needsVerification', v)} label="Needs verification" description="Flags this page on the dashboard until the content is confirmed by the university." />
                {form.needsVerification && <Field label="What needs checking?" error={errors.verificationNote}><Textarea value={form.verificationNote ?? ''} onChange={(e) => set('verificationNote', e.target.value || null)} maxLength={500} rows={2} /></Field>}
              </div>
            </Card>
          </fieldset>

          <Card title="Published versions">
            {data.revisions.length ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {data.revisions.slice(0, 10).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                    <span><span className="font-medium text-slate-700">v{r.version}</span> <span className="text-xs text-slate-500">{formatDateTime(r.createdAt)}{r.createdBy ? ` · ${r.createdBy.name}` : ''}</span></span>
                    {canEdit && <Button size="sm" variant="ghost" onClick={async () => (await confirm({ title: `Load version ${r.version}?`, message: 'It replaces the current draft. The live page changes only when you publish.', confirmLabel: 'Load' })) && restore.mutate(r.id)}>Load</Button>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">A version is saved every time the page is published.</p>}
          </Card>
        </div>
      </div>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule publishing"
        size="sm"
        footer={<><Button onClick={() => setScheduleOpen(false)}>Cancel</Button><Button variant="publish" disabled={!scheduleAt || new Date(scheduleAt) <= new Date()} loading={publish.isPending} onClick={() => publish.mutate(scheduleAt)}>Schedule</Button></>}
      >
        <Field label="Go live at" hint="The current content is saved and appears on the website automatically at this time.">
          <Input type="datetime-local" value={toLocalInput(scheduleAt)} onChange={(e) => setScheduleAt(fromLocalInput(e.target.value))} />
        </Field>
      </Modal>
    </AdminPage>
  );
}
