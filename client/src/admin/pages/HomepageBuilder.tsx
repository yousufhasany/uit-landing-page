import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, GripVertical, History, Plus, RotateCcw, Trash2, Undo2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/format';
import { useAuth } from '../auth';
import { useAction } from '../hooks';
import { FormFields } from '../SchemaForm';
import { SECTION_FIELDS, SECTION_LABELS, SECTION_SOURCES } from '../sectionFields';
import { AdminPage, Button, Card, Field, Input, Modal, Notice, Select, Spinner, Toggle, useConfirm } from '../ui';

interface BuilderSection {
  id: string;
  type: string;
  label: string;
  variant: string;
  variants: string[];
  enabled: boolean;
  order: number;
  data: Record<string, any>;
  removed: boolean;
  isPublished: boolean;
  hasDraftChanges: boolean;
}
interface Builder {
  publishedAt: string | null;
  publishedBy: string | null;
  hasUnpublishedChanges: boolean;
  sections: BuilderSection[];
  sectionTypes: { type: string; variants: string[] }[];
  revisions: { id: string; version: number; note: string; createdAt: string; createdBy: { name: string } | null }[];
}

const KEY = ['homepage-builder'];

function SortableRow({ s, active, onSelect, onToggle, canEdit }: { s: BuilderSection; active: boolean; onSelect: () => void; onToggle: (v: boolean) => void; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id, disabled: !canEdit });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('flex items-center gap-2 rounded-lg border bg-white px-2 py-2', active ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200', isDragging && 'z-10 shadow-lg')}>
      {canEdit && (
        <button type="button" className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing" aria-label={`Reorder ${s.label}`} {...attributes} {...listeners}>
          <GripVertical className="size-4" />
        </button>
      )}
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate text-sm font-medium', s.enabled ? 'text-slate-800' : 'text-slate-400 line-through')}>{s.label}</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          {SECTION_LABELS[s.type] ?? s.type}
          {!s.isPublished && <span className="rounded bg-sky-50 px-1 text-sky-700">new</span>}
          {s.isPublished && s.hasDraftChanges && <span className="rounded bg-amber-50 px-1 text-amber-700">edited</span>}
        </span>
      </button>
      {canEdit && (
        <button type="button" onClick={() => onToggle(!s.enabled)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label={s.enabled ? `Hide ${s.label}` : `Show ${s.label}`} title={s.enabled ? 'Visible: click to hide' : 'Hidden: click to show'}>
          {s.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      )}
    </li>
  );
}

function SectionEditor({ section, canEdit, onRemoved }: { section: BuilderSection; canEdit: boolean; onRemoved: () => void }) {
  const confirm = useConfirm();
  const [label, setLabel] = useState(section.label);
  const [variant, setVariant] = useState(section.variant);
  const [enabled, setEnabled] = useState(section.enabled);
  const [data, setData] = useState<Record<string, any>>(section.data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLabel(section.label); setVariant(section.variant); setEnabled(section.enabled); setData(section.data); setErrors({});
  }, [section]);

  const dirty = label !== section.label || variant !== section.variant || enabled !== section.enabled || JSON.stringify(data) !== JSON.stringify(section.data);

  const save = useAction(() => api(`/homepage/sections/${section.id}`, { method: 'PATCH', body: { label, variant, enabled, data } }), {
    success: 'Draft saved. Publish to make it live.',
    invalidate: [KEY, ['homepage', true]],
    onSuccess: () => setErrors({}),
    onError: (e) => e instanceof ApiError && setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k.replace(/^data\./, ''), v]))),
  });
  const remove = useAction(() => api(`/homepage/sections/${section.id}`, { method: 'DELETE' }), { success: 'Section removed from the draft', invalidate: [KEY], onSuccess: onRemoved });

  const fields = SECTION_FIELDS[section.type] ?? [];
  return (
    <Card
      title={`${SECTION_LABELS[section.type] ?? section.type} section`}
      description={SECTION_SOURCES[section.type]}
      actions={canEdit && (
        <Button size="sm" variant="danger-ghost" icon={<Trash2 className="size-3.5" />} onClick={async () => (await confirm({ title: `Remove “${section.label}”?`, message: section.isPublished ? 'The section stays live until you publish. You can restore it before then.' : 'This new section will be deleted.', confirmLabel: 'Remove', danger: true })) && remove.mutate()}>
          Remove
        </Button>
      )}
    >
      <fieldset disabled={!canEdit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name in the builder"><Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} /></Field>
          <Field label="Layout">
            <Select value={variant} onChange={(e) => setVariant(e.target.value)}>
              {section.variants.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1).replace('-', ' ')}</option>)}
            </Select>
          </Field>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} label="Show this section" description="Hidden sections stay in the builder but are not displayed." />
        <hr className="border-slate-100" />
        {fields.length ? <FormFields fields={fields} values={data} onChange={setData} errors={errors} /> : <p className="text-sm text-slate-500">This section has no settings.</p>}
        {canEdit && (
          <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur">
            {dirty && <span className="mr-auto text-xs text-amber-700">Unsaved changes</span>}
            <Button disabled={!dirty} onClick={() => { setLabel(section.label); setVariant(section.variant); setEnabled(section.enabled); setData(section.data); }}>Reset</Button>
            <Button variant="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>Save draft</Button>
          </div>
        )}
      </fieldset>
    </Card>
  );
}

export default function HomepageBuilder() {
  const { can } = useAuth();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const canEdit = can('homepage.edit');
  const canPublish = can('homepage.publish');
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => api<Builder>('/homepage/builder') });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState('HERO');
  const [historyOpen, setHistoryOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const live = useMemo(() => (data?.sections ?? []).filter((s) => !s.removed), [data]);
  const removed = useMemo(() => (data?.sections ?? []).filter((s) => s.removed), [data]);
  const selected = live.find((s) => s.id === selectedId) ?? null;
  useEffect(() => { if (!selectedId && live.length) setSelectedId(live[0].id); }, [live, selectedId]);

  const invalidate = [KEY, ['homepage', true]];
  const reorder = useAction((ids: string[]) => api('/homepage/order', { method: 'PUT', body: { ids } }), { invalidate });
  const toggle = useAction(({ id, enabled }: { id: string; enabled: boolean }) => api(`/homepage/sections/${id}`, { method: 'PATCH', body: { enabled } }), { invalidate });
  const add = useAction(() => api<BuilderSection>('/homepage/sections', { method: 'POST', body: { type: newType, label: SECTION_LABELS[newType] } }), {
    success: 'Section added to the draft', invalidate, onSuccess: (s) => { setAdding(false); setSelectedId(s.id); },
  });
  const restore = useAction((id: string) => api(`/homepage/sections/${id}/restore`, { method: 'POST' }), { success: 'Section restored', invalidate });
  const publish = useAction(() => api('/homepage/publish', { method: 'POST' }), { success: 'Homepage published', invalidate: [...invalidate, ['homepage', false], ['dashboard']] });
  const discard = useAction(() => api('/homepage/discard', { method: 'POST' }), { success: 'Draft changes discarded', invalidate, onSuccess: () => setSelectedId(null) });
  const restoreRevision = useAction((id: string) => api(`/homepage/revisions/${id}/restore`, { method: 'POST' }), {
    success: 'Version loaded into the draft. Review it, then publish.', invalidate, onSuccess: () => { setHistoryOpen(false); setSelectedId(null); },
  });

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id || !data) return;
    const ids = live.map((s) => s.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    qc.setQueryData<Builder>(KEY, { ...data, sections: [...next.map((id) => live.find((s) => s.id === id)!), ...removed] });
    reorder.mutate(next);
  };

  if (isLoading || !data) return <AdminPage title="Homepage builder"><Spinner /></AdminPage>;

  return (
    <AdminPage
      title="Homepage builder"
      description={
        <>
          {data.publishedAt ? `Last published ${formatDateTime(data.publishedAt)}${data.publishedBy ? ` by ${data.publishedBy}` : ''}.` : 'Not published yet.'}{' '}
          Changes are saved as a draft until you publish.
        </>
      }
      actions={
        <>
          <Button icon={<History className="size-4" />} onClick={() => setHistoryOpen(true)}>History</Button>
          <a href="/admin/preview/homepage" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-medium text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50">
            <Eye className="size-4" /> Preview draft
          </a>
          {canEdit && (
            <Button
              icon={<Undo2 className="size-4" />}
              disabled={!data.hasUnpublishedChanges}
              loading={discard.isPending}
              onClick={async () => (await confirm({ title: 'Discard all draft changes?', message: 'The draft will be reset to the live homepage. New sections are deleted.', confirmLabel: 'Discard', danger: true })) && discard.mutate()}
            >
              Discard
            </Button>
          )}
          {canPublish && (
            <Button
              variant="publish"
              icon={<Upload className="size-4" />}
              disabled={!data.hasUnpublishedChanges}
              loading={publish.isPending}
              onClick={async () => (await confirm({ title: 'Publish the homepage?', message: 'All draft changes will go live immediately. A version is saved so you can restore it later.', confirmLabel: 'Publish' })) && publish.mutate()}
            >
              Publish
            </Button>
          )}
        </>
      }
    >
      {data.hasUnpublishedChanges && <div className="mb-4"><Notice tone="warning">The draft has unpublished changes. {canPublish ? 'Preview them, then publish.' : 'Ask a user with publish permission to publish them.'}</Notice></div>}
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Card title="Sections" description={canEdit ? 'Drag to reorder. Use the eye to show or hide.' : undefined} actions={canEdit && <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>Add</Button>}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={live.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1.5">
                  {live.map((s) => (
                    <SortableRow key={s.id} s={s} canEdit={canEdit} active={s.id === selectedId} onSelect={() => setSelectedId(s.id)} onToggle={(enabled) => toggle.mutate({ id: s.id, enabled })} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </Card>
          {removed.length > 0 && (
            <Card title="Removed (until publish)">
              <ul className="space-y-2">
                {removed.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-500 line-through">{s.label}</span>
                    {canEdit && <Button size="sm" icon={<RotateCcw className="size-3.5" />} onClick={() => restore.mutate(s.id)}>Restore</Button>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <div className="min-w-0">
          {selected ? <SectionEditor key={selected.id} section={selected} canEdit={canEdit} onRemoved={() => setSelectedId(null)} /> : <Card><p className="text-sm text-slate-500">Select a section to edit it.</p></Card>}
        </div>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a section" size="sm" footer={<><Button onClick={() => setAdding(false)}>Cancel</Button><Button variant="primary" loading={add.isPending} onClick={() => add.mutate()}>Add section</Button></>}>
        <Field label="Section type" hint={SECTION_SOURCES[newType]}>
          <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
            {data.sectionTypes.map((t) => <option key={t.type} value={t.type}>{SECTION_LABELS[t.type] ?? t.type}</option>)}
          </Select>
        </Field>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Published versions">
        {data.revisions.length ? (
          <ul className="divide-y divide-slate-100">
            {data.revisions.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>
                  <span className="font-medium text-slate-800">Version {r.version}</span>
                  <span className="block text-xs text-slate-500">{formatDateTime(r.createdAt)}{r.createdBy ? ` · ${r.createdBy.name}` : ''}</span>
                </span>
                {canPublish && <Button size="sm" loading={restoreRevision.isPending} onClick={async () => (await confirm({ title: `Load version ${r.version}?`, message: 'The current draft is replaced by this version. Nothing goes live until you publish.', confirmLabel: 'Load into draft' })) && restoreRevision.mutate(r.id)}>Load into draft</Button>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-500">No versions yet. A version is saved each time the homepage is published.</p>}
      </Modal>
    </AdminPage>
  );
}
