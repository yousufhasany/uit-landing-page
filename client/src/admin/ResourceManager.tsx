import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { keepPreviousData, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ExternalLink, GripVertical, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/format';
import type { Media, Paged } from '@/lib/types';
import { useAuth } from './auth';
import { useAction } from './hooks';
import { MediaThumb } from './media';
import { FormFields, type FieldDef } from './SchemaForm';
import { AdminPage, Button, Card, Empty, Input, Modal, Notice, Pager, Select, Spinner, StatusPill, VerifyFlag, useConfirm } from './ui';

type Rec = Record<string, any>;

export interface ResourceFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[] | ((ctx: { relations: Record<string, Rec[]> }) => { value: string; label: string }[]);
}

export interface ResourceConfig {
  title: string;
  singular: string;
  description?: ReactNode;
  endpoint: string;
  permission: string;
  fields: FieldDef[];
  defaults: Rec;
  /** Keys accepted by the API; everything else from the admin record is dropped before saving. */
  inputKeys?: string[];
  titleOf: (r: Rec) => string;
  subtitleOf?: (r: Rec) => ReactNode;
  imageOf?: (r: Rec) => Media | null | undefined;
  statusOf?: (r: Rec) => { status: string; label?: string }[];
  publicUrl?: (r: Rec) => string | null;
  filters?: ResourceFilter[];
  /** Relations loaded once and used by filters (e.g. faculties for the programs filter). */
  relations?: Record<string, string>;
  reorderable?: boolean;
  searchable?: boolean;
  pageSize?: number;
  notice?: ReactNode;
  invalidate?: QueryKey[];
  editorSize?: 'md' | 'lg' | 'xl';
}

function SortableItem({ id, enabled, children }: { id: string; enabled: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !enabled });
  const handle = enabled ? (
    <button type="button" className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Drag to reorder" {...attributes} {...listeners}>
      <GripVertical className="size-4" />
    </button>
  ) : null;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('bg-white', isDragging && 'relative z-10 shadow-lg')}>
      {children(handle)}
    </li>
  );
}

function pickInput(config: ResourceConfig, record: Rec) {
  const keys = config.inputKeys ?? Object.keys(config.defaults);
  return Object.fromEntries(keys.map((k) => [k, record[k] ?? config.defaults[k] ?? null]));
}
const clean = (v: Rec) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' ? null : x]));

export function ResourceManager({ config }: { config: ResourceConfig }) {
  const { can } = useAuth();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const canManage = can(config.permission);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Rec | null>(null);
  const [values, setValues] = useState<Rec>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const pageSize = config.pageSize ?? 200;
  const listKey = ['resource', config.endpoint, debounced, filters, page];
  const { data, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => api<Paged<Rec>>(`${config.endpoint}/admin`, { query: { q: debounced || undefined, page, pageSize, ...filters } }),
    placeholderData: keepPreviousData,
  });
  const relations = useQuery({
    queryKey: ['resource-relations', config.endpoint],
    enabled: Boolean(config.relations),
    queryFn: async () => Object.fromEntries(await Promise.all(Object.entries(config.relations!).map(async ([k, ep]) => [k, (await api<Paged<Rec>>(ep, { query: { pageSize: 200 } })).items] as const))),
  });

  const filtered = Boolean(debounced) || Object.values(filters).some(Boolean);
  const canReorder = Boolean(config.reorderable) && canManage && !filtered && (data?.totalPages ?? 1) <= 1;
  const invalidate: QueryKey[] = [['resource', config.endpoint], ['relation', `${config.endpoint}/admin`], ['site'], ['dashboard'], ...(config.invalidate ?? [])];

  const open = (record: Rec | null) => {
    setErrors({});
    setEditing(record ?? {});
    setValues(record ? pickInput(config, record) : { ...config.defaults });
  };
  const close = () => setEditing(null);

  const save = useAction(
    () => (editing?.id ? api<Rec>(`${config.endpoint}/${editing.id}`, { method: 'PUT', body: clean(values) }) : api<Rec>(config.endpoint, { method: 'POST', body: clean(values) })),
    { success: editing?.id ? 'Saved' : `${config.singular.charAt(0).toUpperCase() + config.singular.slice(1)} added`, invalidate, onSuccess: close, onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}) },
  );
  const remove = useAction((id: string) => api(`${config.endpoint}/${id}`, { method: 'DELETE' }), { success: 'Deleted', invalidate, onSuccess: close });
  const reorder = useAction((ids: string[]) => api(`${config.endpoint}/order`, { method: 'PUT', body: { ids } }), { invalidate });

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id || !data) return;
    const ids = data.items.map((i) => i.id as string);
    const next = arrayMove(data.items, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    qc.setQueryData(listKey, { ...data, items: next });
    reorder.mutate(next.map((i) => i.id));
  };

  const items = data?.items ?? [];
  return (
    <AdminPage
      title={config.title}
      description={config.description}
      actions={canManage && <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => open(null)}>Add {config.singular}</Button>}
    >
      {config.notice && <div className="mb-4"><Notice>{config.notice}</Notice></div>}
      <Card padded={false}>
        {(config.searchable !== false || config.filters?.length) && (
          <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            {config.searchable !== false && (
              <div className="relative min-w-56 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} className="pl-9" aria-label={`Search ${config.title.toLowerCase()}`} />
              </div>
            )}
            {config.filters?.map((f) => {
              const options = typeof f.options === 'function' ? f.options({ relations: relations.data ?? {} }) : f.options;
              return (
                <Select key={f.key} value={filters[f.key] ?? ''} onChange={(e) => { setFilters({ ...filters, [f.key]: e.target.value }); setPage(1); }} className="w-auto min-w-40" aria-label={f.label}>
                  <option value="">{f.label}</option>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              );
            })}
          </div>
        )}
        {config.reorderable && canManage && filtered && <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">Clear the search and filters to reorder.</p>}
        {isLoading ? <Spinner /> : !items.length ? (
          <div className="p-4"><Empty title={filtered ? 'Nothing matches' : `No ${config.title.toLowerCase()} yet`} action={canManage && !filtered && <Button icon={<Plus className="size-4" />} onClick={() => open(null)}>Add {config.singular}</Button>} /></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-slate-100">
                {items.map((r) => {
                  const image = config.imageOf?.(r);
                  const url = config.publicUrl?.(r);
                  return (
                    <SortableItem key={r.id} id={r.id} enabled={canReorder}>
                      {(handle) => (
                        <div className="flex items-center gap-3 px-4 py-3">
                          {handle}
                          {config.imageOf && <div className="hidden size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:block">{image && <MediaThumb media={image} className="size-full" />}</div>}
                          <button type="button" onClick={() => open(r)} className="min-w-0 flex-1 text-left">
                            <span className="line-clamp-1 font-medium text-slate-900 hover:text-teal-700">{config.titleOf(r)}</span>
                            {config.subtitleOf && <span className="line-clamp-1 text-xs text-slate-500">{config.subtitleOf(r)}</span>}
                          </button>
                          <span className="hidden flex-wrap items-center justify-end gap-1.5 md:flex">
                            {config.statusOf?.(r).map((s) => <StatusPill key={s.status + (s.label ?? '')} status={s.status} label={s.label} />)}
                            {r.needsVerification && <VerifyFlag note={r.verificationNote} />}
                          </span>
                          {url && <a href={url} target="_blank" rel="noopener" className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="View on website"><ExternalLink className="size-4" /></a>}
                        </div>
                      )}
                    </SortableItem>
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {data && data.totalPages > 1 && <div className="border-t border-slate-100 p-3"><Pager page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
      </Card>

      <Modal
        open={editing !== null}
        onClose={close}
        size={config.editorSize ?? 'lg'}
        title={editing?.id ? `Edit ${config.singular}` : `Add ${config.singular}`}
        footer={
          <>
            {editing?.id && canManage && (
              <Button variant="danger-ghost" className="mr-auto" icon={<Trash2 className="size-4" />} loading={remove.isPending} onClick={async () => (await confirm({ title: `Delete “${config.titleOf(editing)}”?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) && remove.mutate(editing.id)}>
                Delete
              </Button>
            )}
            <Button onClick={close}>{canManage ? 'Cancel' : 'Close'}</Button>
            {canManage && <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>}
          </>
        }
      >
        {Object.keys(errors).length > 0 && <div className="mb-4"><Notice tone="danger">Some fields need attention.</Notice></div>}
        <fieldset disabled={!canManage}>
          <FormFields fields={config.fields} values={values} onChange={setValues} errors={errors} columns={2} />
        </fieldset>
      </Modal>
    </AdminPage>
  );
}
