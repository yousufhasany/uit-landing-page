import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, FileText, Film, ImagePlus, RefreshCw, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { api, uploadWithProgress } from '@/lib/api';
import { cn, fileSize, formatDateTime } from '@/lib/format';
import type { Media, Paged } from '@/lib/types';
import { useAuth } from './auth';
import { useAction } from './hooks';
import { Button, Field, Input, Modal, Pager, Select, Spinner, StringList, Textarea, useConfirm } from './ui';

export interface MediaItem extends Media {
  originalFilename: string;
  provider: 'LOCAL' | 'CLOUDINARY';
  fileSize: number;
  altText: string;
  description: string | null;
  category: string | null;
  folder: { id: string; name: string } | null;
  folderId: string | null;
  tags: string[];
  uploadedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFacets {
  categories: { value: string; count: number }[];
  folders: { id: string; name: string; parentId: string | null; count: number }[];
  tags: { name: string; slug: string; count: number }[];
}

export const MEDIA_CATEGORIES = ['BRAND', 'CAMPUS', 'FACILITY', 'EVENT', 'DELEGATION', 'BOARD', 'ACADEMIC', 'CAMPUS_VISION', 'DOCUMENT', 'OTHER'];
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,video/mp4,video/webm';

export interface MediaFilters {
  q?: string;
  type?: string;
  category?: string;
  folderId?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export const useMediaList = (filters: MediaFilters) =>
  useQuery({ queryKey: ['media', filters], queryFn: () => api<Paged<MediaItem>>('/media', { query: { ...filters } }), placeholderData: keepPreviousData });
export const useMediaFacets = () => useQuery({ queryKey: ['media', 'facets'], queryFn: () => api<MediaFacets>('/media/facets') });

// ───────────────────────────── Uploads ─────────────────────────────

interface QueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  state: 'uploading' | 'done' | 'error';
  error?: string;
}

/** Uploads files one at a time so each shows its own progress and failure reason. */
export function useUploader(onUploaded?: (items: MediaItem[]) => void) {
  const qc = useQueryClient();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const busy = queue.some((q) => q.state === 'uploading');

  const upload = useCallback(async (files: File[], fields: { folderId?: string; category?: string } = {}) => {
    const entries = files.map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size, progress: 0, state: 'uploading' as const }));
    setQueue((q) => [...entries, ...q].slice(0, 30));
    const uploaded: MediaItem[] = [];
    for (const [i, file] of files.entries()) {
      const entry = entries[i];
      const form = new FormData();
      form.append('files', file);
      form.append('altText', file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
      if (fields.folderId) form.append('folderId', fields.folderId);
      if (fields.category) form.append('category', fields.category);
      try {
        const res = await uploadWithProgress<{ items: MediaItem[]; errors: { file: string; message: string }[] }>('/media', form, (p) =>
          setQueue((q) => q.map((x) => (x.id === entry.id ? { ...x, progress: p } : x))),
        );
        if (res.errors?.length) throw new Error(res.errors[0].message);
        uploaded.push(...res.items);
        setQueue((q) => q.map((x) => (x.id === entry.id ? { ...x, progress: 100, state: 'done' } : x)));
      } catch (e) {
        setQueue((q) => q.map((x) => (x.id === entry.id ? { ...x, state: 'error', error: (e as Error).message } : x)));
      }
    }
    await qc.invalidateQueries({ queryKey: ['media'] });
    if (uploaded.length) {
      toast.success(`${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded`);
      onUploaded?.(uploaded);
    }
  }, [qc, onUploaded]);

  return { queue, busy, upload, clear: () => setQueue((q) => q.filter((x) => x.state === 'uploading')) };
}

export function Dropzone({ onFiles, disabled, compact = false }: { onFiles: (files: File[]) => void; disabled?: boolean; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled && e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]);
      }}
      className={cn('flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition', compact ? 'px-4 py-5' : 'px-6 py-10', over ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-white')}
    >
      <UploadCloud className="size-7 text-slate-400" aria-hidden />
      <p className="mt-2 text-sm text-slate-700">
        Drag files here, or{' '}
        <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="font-semibold text-teal-700 hover:underline disabled:opacity-50">browse</button>
      </p>
      <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, GIF, AVIF, PDF, MP4 or WebM. Images are optimized automatically.</p>
      <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { if (e.target.files?.length) onFiles([...e.target.files]); e.target.value = ''; }} />
    </div>
  );
}

export function UploadQueue({ queue, onClear }: { queue: QueueItem[]; onClear: () => void }) {
  if (!queue.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
        Uploads
        <button type="button" onClick={onClear} className="text-slate-500 hover:text-slate-800">Clear finished</button>
      </div>
      <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto">
        {queue.map((q) => (
          <li key={q.id} className="px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-slate-700">{q.name} <span className="text-slate-400">· {fileSize(q.size)}</span></span>
              {q.state === 'done' && <Check className="size-4 text-emerald-600" aria-label="Uploaded" />}
              {q.state === 'error' && <span className="shrink-0 text-red-600">Failed</span>}
              {q.state === 'uploading' && <span className="shrink-0 text-slate-500">{q.progress}%</span>}
            </div>
            {q.state === 'uploading' && <div className="mt-1.5 h-1 overflow-hidden rounded bg-slate-100"><div className="h-full bg-teal-500 transition-all" style={{ width: `${q.progress}%` }} /></div>}
            {q.error && <p className="mt-1 text-red-600">{q.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────────────────────────── Grid ─────────────────────────────

export function MediaThumb({ media, className }: { media: Pick<Media, 'type' | 'thumbUrl' | 'url' | 'alt' | 'mimeType'>; className?: string }) {
  if (media.type === 'IMAGE') return <img src={media.thumbUrl || media.url} alt={media.alt} loading="lazy" className={cn('object-cover', className)} />;
  const Icon = media.type === 'VIDEO' ? Film : FileText;
  return <div className={cn('flex items-center justify-center bg-slate-100 text-slate-400', className)}><Icon className="size-8" aria-hidden /></div>;
}

export function MediaGrid({ items, selected, onSelect, multi = false }: { items: MediaItem[]; selected: string[]; onSelect: (m: MediaItem) => void; multi?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {items.map((m) => {
        const isSel = selected.includes(m.id);
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onSelect(m)}
              aria-pressed={isSel}
              className={cn('group relative block w-full overflow-hidden rounded-lg border bg-white text-left transition', isSel ? 'border-teal-500 ring-2 ring-teal-500/40' : 'border-slate-200 hover:border-slate-400')}
            >
              <MediaThumb media={m} className="aspect-square w-full" />
              {isSel && <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-teal-600 text-white"><Check className="size-4" aria-hidden /></span>}
              {multi && !isSel && <span className="absolute top-2 right-2 size-6 rounded-full border-2 border-white bg-black/20 opacity-0 group-hover:opacity-100" aria-hidden />}
              <span className="block truncate px-2 py-1.5 text-xs text-slate-600">{m.originalFilename}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function MediaToolbar({ filters, onChange, facets }: { filters: MediaFilters; onChange: (f: MediaFilters) => void; facets?: MediaFacets }) {
  const [q, setQ] = useState(filters.q ?? '');
  useEffect(() => {
    const t = setTimeout(() => q !== (filters.q ?? '') && onChange({ ...filters, q: q || undefined, page: 1 }), 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof MediaFilters, v: string) => onChange({ ...filters, [k]: v || undefined, page: 1 });
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filename, alt text, caption" className="pl-8" aria-label="Search media" />
      </div>
      <Select value={filters.type ?? ''} onChange={(e) => set('type', e.target.value)} aria-label="Type">
        <option value="">All types</option>
        <option value="IMAGE">Images</option>
        <option value="VIDEO">Videos</option>
        <option value="DOCUMENT">Documents</option>
      </Select>
      <Select value={filters.category ?? ''} onChange={(e) => set('category', e.target.value)} aria-label="Category">
        <option value="">All categories</option>
        {facets?.categories.map((c) => <option key={c.value} value={c.value}>{c.value.replace(/_/g, ' ').toLowerCase()} ({c.count})</option>)}
      </Select>
      <Select value={filters.folderId ?? ''} onChange={(e) => set('folderId', e.target.value)} aria-label="Folder">
        <option value="">All folders</option>
        {facets?.folders.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.count})</option>)}
      </Select>
      <Select value={filters.tag ?? ''} onChange={(e) => set('tag', e.target.value)} aria-label="Tag">
        <option value="">All tags</option>
        {facets?.tags.map((t) => <option key={t.slug} value={t.slug}>{t.name} ({t.count})</option>)}
      </Select>
    </div>
  );
}

// ───────────────────────────── Details panel ─────────────────────────────

export function MediaDetails({ media, facets, onClose, onDeleted }: { media: MediaItem; facets?: MediaFacets; onClose?: () => void; onDeleted?: () => void }) {
  const { can } = useAuth();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [form, setForm] = useState({ altText: media.altText ?? '', caption: media.caption ?? '', description: media.description ?? '', category: media.category ?? '', folderId: media.folderId ?? '', tags: media.tags });
  const [replacing, setReplacing] = useState(false);
  const replaceInput = useRef<HTMLInputElement>(null);
  const editable = can('media.edit');

  useEffect(() => {
    setForm({ altText: media.altText ?? '', caption: media.caption ?? '', description: media.description ?? '', category: media.category ?? '', folderId: media.folderId ?? '', tags: media.tags });
  }, [media]);

  const save = useAction(
    () => api<MediaItem>(`/media/${media.id}`, { method: 'PATCH', body: { ...form, caption: form.caption || null, description: form.description || null, category: form.category || null, folderId: form.folderId || null } }),
    { success: 'Media details saved', invalidate: [['media']] },
  );
  const remove = useAction(() => api(`/media/${media.id}`, { method: 'DELETE' }), { success: 'File deleted', invalidate: [['media']], onSuccess: () => onDeleted?.() });

  const replace = async (file: File) => {
    setReplacing(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await uploadWithProgress(`/media/${media.id}/replace`, form, () => undefined);
      await qc.invalidateQueries({ queryKey: ['media'] });
      toast.success('File replaced. Every page using it now shows the new version.');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {media.type === 'IMAGE' ? <img src={media.url} alt={media.alt} className="max-h-72 w-full object-contain" /> : media.type === 'VIDEO' ? <video src={media.url} controls className="max-h-72 w-full" /> : <MediaThumb media={media} className="h-40 w-full" />}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
        <dt>File</dt><dd className="truncate text-slate-700" title={media.originalFilename}>{media.originalFilename}</dd>
        <dt>Size</dt><dd className="text-slate-700">{fileSize(media.fileSize)}{media.width ? ` · ${media.width}×${media.height}` : ''}</dd>
        <dt>Storage</dt><dd className="text-slate-700">{media.provider === 'CLOUDINARY' ? 'Cloudinary' : 'Local server'}</dd>
        <dt>Uploaded</dt><dd className="text-slate-700">{formatDateTime(media.createdAt)}{media.uploadedBy ? ` by ${media.uploadedBy.name}` : ''}</dd>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={<Copy className="size-3.5" />} onClick={() => navigator.clipboard.writeText(media.url).then(() => toast.success('URL copied'))}>Copy URL</Button>
        {can('media.upload') && editable && (
          <>
            <Button size="sm" loading={replacing} icon={<RefreshCw className="size-3.5" />} onClick={() => replaceInput.current?.click()}>Replace file</Button>
            <input ref={replaceInput} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) replace(f); e.target.value = ''; }} />
          </>
        )}
        {can('media.delete') && (
          <Button
            size="sm"
            variant="danger-ghost"
            loading={remove.isPending}
            icon={<Trash2 className="size-3.5" />}
            onClick={async () => (await confirm({ title: 'Delete this file?', message: 'Files still used by pages, news or galleries cannot be deleted. This cannot be undone.', confirmLabel: 'Delete', danger: true })) && remove.mutate()}
          >
            Delete
          </Button>
        )}
      </div>
      <fieldset disabled={!editable} className="space-y-3">
        <Field label="Alt text" hint="Describe the image for screen readers. Required for accessibility.">
          <Input value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} maxLength={300} />
        </Field>
        <Field label="Caption"><Textarea rows={2} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} maxLength={500} /></Field>
        <Field label="Description / source"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">None</option>
              {[...new Set([...MEDIA_CATEGORIES, ...(facets?.categories.map((c) => c.value) ?? []), ...(media.category ? [media.category] : [])])].map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ').toLowerCase()}</option>
              ))}
            </Select>
          </Field>
          <Field label="Folder">
            <Select value={form.folderId} onChange={(e) => setForm({ ...form, folderId: e.target.value })}>
              <option value="">No folder</option>
              {facets?.folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Tags"><StringList value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="Add tag" max={20} /></Field>
        {editable && (
          <div className="flex justify-end gap-2">
            {onClose && <Button onClick={onClose}>Close</Button>}
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save details</Button>
          </div>
        )}
      </fieldset>
    </div>
  );
}

// ───────────────────────────── Picker ─────────────────────────────

export function MediaPicker({ open, onClose, onPick, multi = false, type = 'IMAGE', title }: { open: boolean; onClose: () => void; onPick: (items: MediaItem[]) => void; multi?: boolean; type?: string; title?: string }) {
  const { can } = useAuth();
  const [filters, setFilters] = useState<MediaFilters>({ type, page: 1, pageSize: 24 });
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const { data, isLoading } = useMediaList(filters);
  const { data: facets } = useMediaFacets();
  const uploader = useUploader(useCallback((items: MediaItem[]) => setSelected((s) => (multi ? [...items, ...s] : items.slice(0, 1))), [multi]));

  useEffect(() => { if (open) setSelected([]); }, [open]);

  const toggle = (m: MediaItem) => setSelected((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : multi ? [...s, m] : [m]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={title ?? (multi ? 'Choose media' : 'Choose an image')}
      footer={
        <>
          <span className="mr-auto self-center text-sm text-slate-500">{selected.length ? `${selected.length} selected` : 'Nothing selected'}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!selected.length} onClick={() => { onPick(selected); onClose(); }}>Use {multi ? 'selected' : 'image'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {can('media.upload') && (
          <>
            <Dropzone compact onFiles={(f) => uploader.upload(f, { folderId: filters.folderId })} disabled={uploader.busy} />
            <UploadQueue queue={uploader.queue} onClear={uploader.clear} />
          </>
        )}
        <MediaToolbar filters={filters} onChange={setFilters} facets={facets} />
        {isLoading ? <Spinner /> : data?.items.length ? (
          <>
            <MediaGrid items={data.items} selected={selected.map((s) => s.id)} onSelect={toggle} multi={multi} />
            <Pager page={data.page} totalPages={data.totalPages} onChange={(page) => setFilters({ ...filters, page })} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">No media match these filters.</p>
        )}
      </div>
    </Modal>
  );
}

/** Form control holding a single media id, with preview, choose and remove. */
export function MediaField({ value, onChange, preview, label = 'Image', type = 'IMAGE', hint }: { value: string | null | undefined; onChange: (id: string | null, media?: MediaItem) => void; preview?: Media | null; label?: ReactNode; type?: string; hint?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<Media | null>(preview ?? null);
  const { data } = useQuery({ queryKey: ['media', 'one', value], queryFn: () => api<MediaItem>(`/media/${value}`), enabled: Boolean(value) && (!local || local.id !== value), retry: false });
  const shown = value ? (local?.id === value ? local : data ?? null) : null;

  useEffect(() => { if (preview) setLocal(preview); }, [preview]);

  return (
    <Field label={label} hint={hint}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {shown ? <MediaThumb media={shown} className="size-full" /> : <div className="flex size-full items-center justify-center text-slate-300"><ImagePlus className="size-6" aria-hidden /></div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {shown && <span className="line-clamp-2 text-xs text-slate-500">{shown.alt || 'No alt text'}</span>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>{value ? 'Change' : 'Choose'}</Button>
            {value && <Button size="sm" variant="ghost" icon={<X className="size-3.5" />} onClick={() => onChange(null)}>Remove</Button>}
          </div>
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} type={type} onPick={([m]) => { setLocal(m); onChange(m.id, m); }} />
    </Field>
  );
}
