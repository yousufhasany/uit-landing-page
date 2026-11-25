import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, GripVertical, ImagePlus, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/format';
import type { Media } from '@/lib/types';
import { useAction } from '../hooks';
import { MediaPicker, MediaThumb } from '../media';
import { FormFields, type FieldDef } from '../SchemaForm';
import { AdminPage, Button, Card, Empty, Field, Input, Modal, Notice, Spinner, StatusPill, Textarea, useConfirm } from '../ui';

interface AlbumCard { id: string; title: string; slug: string; status: string; category: string | null; itemCount: number; cover: Media | null }
interface AlbumItem { id: string; mediaId: string; caption: string | null; alt: string; media: Media; displayOrder: number }
interface Album {
  id: string; title: string; slug: string; description: string | null; category: string | null; coverImageId: string | null; coverImage: Media | null;
  displayOrder: number; status: string; publishedAt: string | null; items: AlbumItem[];
}

const albumFields: FieldDef[] = [
  { key: 'title', label: 'Album title', kind: 'text', max: 160, required: true, wide: true },
  { key: 'category', label: 'Category', kind: 'text', max: 60, hint: 'e.g. Campus, Events, Delegations' },
  { key: 'slug', label: 'URL slug', kind: 'text', max: 160 },
  { key: 'description', label: 'Description', kind: 'textarea', rows: 2, max: 1000 },
  { key: 'coverImageId', label: 'Cover image', kind: 'image', hint: 'Defaults to the first photo.' },
  { key: 'status', label: 'Visibility', kind: 'select', options: [{ value: 'DRAFT', label: 'Draft' }, { value: 'PUBLISHED', label: 'Published' }, { value: 'ARCHIVED', label: 'Archived' }] },
  { key: 'displayOrder', label: 'Display order', kind: 'number', min: 0 },
];
const albumInput = (a: Partial<Album>) => ({
  title: a.title ?? '', slug: a.slug ?? '', description: a.description ?? '', category: a.category ?? '', coverImageId: a.coverImageId ?? null,
  displayOrder: a.displayOrder ?? 0, status: a.status ?? 'DRAFT', publishedAt: a.publishedAt ?? null,
});
const clean = (v: Record<string, any>) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' ? null : x]));

export function GalleryList() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['admin-gallery'], queryFn: () => api<AlbumCard[]>('/gallery/admin') });
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const create = useAction(() => api<Album>('/gallery', { method: 'POST', body: { title, status: 'DRAFT' } }), {
    success: 'Album created', invalidate: [['admin-gallery']], onSuccess: (a) => navigate(`/admin/gallery/${a.id}`),
  });

  return (
    <AdminPage title="Gallery" description="Photo albums shown on the campus gallery page and the homepage. Photos come from the media library." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New album</Button>}>
      {isLoading ? <Spinner /> : !data?.length ? <Empty title="No albums yet" action={<Button onClick={() => setCreating(true)}>Create an album</Button>} /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((a) => (
            <li key={a.id}>
              <Link to={`/admin/gallery/${a.id}`} className="group block overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-teal-400">
                <div className="aspect-[4/3] bg-slate-100">
                  {a.cover ? <MediaThumb media={a.cover} className="size-full transition-transform group-hover:scale-[1.02]" /> : <Images className="m-auto mt-[22%] size-10 text-slate-300" />}
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 font-medium text-slate-900">{a.title}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-500"><StatusPill status={a.status} />{a.itemCount} photos{a.category ? ` · ${a.category}` : ''}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="New album" size="sm" footer={<><Button onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" disabled={title.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>Create</Button></>}>
        <Field label="Album title"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} /></Field>
      </Modal>
    </AdminPage>
  );
}

function SortablePhoto({ item, onEdit, onRemove }: { item: AlbumItem; onEdit: () => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('group relative overflow-hidden rounded-lg border border-slate-200 bg-white', isDragging && 'z-10 shadow-xl')}>
      <div className="aspect-square bg-slate-100"><MediaThumb media={item.media} className="size-full" /></div>
      <p className="line-clamp-2 min-h-10 px-2 py-1.5 text-xs text-slate-600">{item.caption || <span className="text-slate-400">No caption</span>}</p>
      <div className="absolute inset-x-0 top-0 flex justify-between p-1.5 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button type="button" className="cursor-grab rounded bg-white/90 p-1 text-slate-600 shadow" aria-label="Drag to reorder" {...attributes} {...listeners}><GripVertical className="size-4" /></button>
        <span className="flex gap-1">
          <button type="button" onClick={onEdit} className="rounded bg-white/90 p-1 text-slate-600 shadow hover:text-teal-700" aria-label="Edit caption"><Pencil className="size-4" /></button>
          <button type="button" onClick={onRemove} className="rounded bg-white/90 p-1 text-red-600 shadow" aria-label="Remove from album"><Trash2 className="size-4" /></button>
        </span>
      </div>
    </li>
  );
}

export function GalleryAlbumEditor() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const key = ['admin-gallery', id];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api<Album>(`/gallery/admin/${id}`), retry: false });
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<AlbumItem | null>(null);
  const [caption, setCaption] = useState('');
  const [alt, setAlt] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { if (data) setValues(albumInput(data)); }, [data?.id, data?.title, data?.status, data?.slug, data?.coverImageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = [key, ['admin-gallery'], ['galleries'], ['gallery'], ['homepage']];
  const save = useAction(() => api<Album>(`/gallery/${id}`, { method: 'PUT', body: clean(values) }), {
    success: 'Album saved', invalidate, onSuccess: () => setErrors({}), onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}),
  });
  const remove = useAction(() => api(`/gallery/${id}`, { method: 'DELETE' }), { success: 'Album deleted. Photos remain in the media library.', invalidate: [['admin-gallery']], onSuccess: () => navigate('/admin/gallery') });
  const addItems = useAction((mediaIds: string[]) => api<Album>(`/gallery/${id}/items`, { method: 'POST', body: { mediaIds } }), { success: (_r, ids) => `Added ${ids.length} photo${ids.length === 1 ? '' : 's'}`, invalidate });
  const reorder = useAction((ids: string[]) => api(`/gallery/${id}/order`, { method: 'PUT', body: { ids } }), { invalidate });
  const updateItem = useAction(() => api(`/gallery/items/${editing!.id}`, { method: 'PATCH', body: { caption: caption || null, altText: alt || null } }), { success: 'Caption saved', invalidate, onSuccess: () => setEditing(null) });
  const removeItem = useAction((itemId: string) => api(`/gallery/items/${itemId}`, { method: 'DELETE' }), { success: 'Removed from album', invalidate });

  if (isLoading) return <AdminPage title="Album" back={{ to: '/admin/gallery', label: 'Gallery' }}><Spinner /></AdminPage>;
  if (error || !data) return <AdminPage title="Album not found" back={{ to: '/admin/gallery', label: 'Gallery' }}><Notice tone="danger">This album could not be loaded.</Notice></AdminPage>;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = data.items.map((i) => i.id);
    const items = arrayMove(data.items, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    qc.setQueryData<Album>(key, { ...data, items });
    reorder.mutate(items.map((i) => i.id));
  };
  const existing = new Set(data.items.map((i) => i.mediaId));

  return (
    <AdminPage
      title={data.title}
      back={{ to: '/admin/gallery', label: 'Gallery' }}
      description={<span className="flex items-center gap-2"><StatusPill status={data.status} />{data.items.length} photos</span>}
      actions={
        <>
          {data.status === 'PUBLISHED' && <a href={`/campus/gallery/${data.slug}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100"><ExternalLink className="size-4" /> View</a>}
          <Button variant="danger-ghost" icon={<Trash2 className="size-4" />} onClick={async () => (await confirm({ title: 'Delete this album?', message: 'The photos stay in the media library.', confirmLabel: 'Delete album', danger: true })) && remove.mutate()}>Delete</Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="min-w-0" title="Photos" description="Drag to reorder. Published albums with no photos are hidden from the website." actions={<Button size="sm" icon={<ImagePlus className="size-3.5" />} onClick={() => setPicking(true)}>Add photos</Button>}>
          {!data.items.length ? <Empty title="No photos in this album" text="Add photos from the media library, or upload new ones from the picker." action={<Button onClick={() => setPicking(true)}>Add photos</Button>} /> : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={data.items.map((i) => i.id)} strategy={rectSortingStrategy}>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.items.map((item) => (
                    <SortablePhoto
                      key={item.id}
                      item={item}
                      onEdit={() => { setEditing(item); setCaption(item.caption ?? ''); setAlt(item.alt ?? ''); }}
                      onRemove={async () => (await confirm({ title: 'Remove this photo from the album?', message: 'It stays in the media library.', confirmLabel: 'Remove', danger: true })) && removeItem.mutate(item.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </Card>
        <Card className="min-w-0" title="Album settings">
          <FormFields fields={albumFields} values={values} onChange={setValues} errors={errors} />
          <div className="mt-5 flex justify-end"><Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save album</Button></div>
        </Card>
      </div>

      <MediaPicker
        open={picking}
        multi
        title="Add photos to the album"
        onClose={() => setPicking(false)}
        onPick={(items) => {
          const ids = items.map((m) => m.id).filter((mid) => !existing.has(mid));
          if (ids.length) addItems.mutate(ids);
          setPicking(false);
        }}
      />
      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Photo details" footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" loading={updateItem.isPending} onClick={() => updateItem.mutate()}>Save</Button></>}>
        {editing && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg bg-slate-100"><MediaThumb media={editing.media} className="max-h-64 w-full object-contain" /></div>
            <Field label="Caption" hint="Overrides the media library caption for this album only."><Textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} rows={2} /></Field>
            <Field label="Alt text" hint="Describe the photo for screen readers."><Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} /></Field>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
