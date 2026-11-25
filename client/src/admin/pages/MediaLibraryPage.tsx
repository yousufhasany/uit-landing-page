import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '../auth';
import { useAction } from '../hooks';
import {
  Dropzone, MediaDetails, MediaGrid, MediaToolbar, UploadQueue, useMediaFacets, useMediaList, useUploader, type MediaFilters, type MediaItem,
} from '../media';
import { AdminPage, Button, Card, Field, Input, Modal, Pager, Spinner, useConfirm } from '../ui';

function FolderManager() {
  const { can } = useAuth();
  const confirm = useConfirm();
  const { data: facets } = useMediaFacets();
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null);
  const save = useAction(
    (f: { id?: string; name: string }) => (f.id ? api(`/media/folders/${f.id}`, { method: 'PATCH', body: { name: f.name } }) : api('/media/folders', { method: 'POST', body: { name: f.name } })),
    { success: 'Folder saved', invalidate: [['media']], onSuccess: () => setEditing(null) },
  );
  const remove = useAction((id: string) => api(`/media/folders/${id}`, { method: 'DELETE' }), { success: 'Folder deleted. Its files were kept.', invalidate: [['media']] });

  return (
    <Card title="Folders" actions={can('media.edit') && <Button size="sm" icon={<FolderPlus className="size-3.5" />} onClick={() => setEditing({ name: '' })}>New folder</Button>} padded={false}>
      <ul className="divide-y divide-slate-100 text-sm">
        {facets?.folders.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2 px-5 py-2">
            <span className="truncate">{f.name} <span className="text-xs text-slate-400">{f.count}</span></span>
            <span className="flex shrink-0">
              {can('media.edit') && <Button size="sm" variant="ghost" aria-label={`Rename ${f.name}`} onClick={() => setEditing({ id: f.id, name: f.name })}><Pencil className="size-3.5" /></Button>}
              {can('media.delete') && (
                <Button size="sm" variant="danger-ghost" aria-label={`Delete ${f.name}`} onClick={async () => (await confirm({ title: `Delete folder “${f.name}”?`, message: 'Files in the folder are kept and become unfiled.', confirmLabel: 'Delete folder', danger: true })) && remove.mutate(f.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </span>
          </li>
        ))}
        {!facets?.folders.length && <li className="px-5 py-3 text-slate-500">No folders yet.</li>}
      </ul>
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Rename folder' : 'New folder'}
        size="sm"
        footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" loading={save.isPending} disabled={!editing?.name.trim()} onClick={() => editing && save.mutate(editing)}>Save</Button></>}
      >
        <Field label="Folder name"><Input value={editing?.name ?? ''} onChange={(e) => setEditing((s) => s && { ...s, name: e.target.value })} maxLength={80} /></Field>
      </Modal>
    </Card>
  );
}

export default function MediaLibraryPage() {
  const { can } = useAuth();
  const [filters, setFilters] = useState<MediaFilters>({ page: 1, pageSize: 30 });
  const [active, setActive] = useState<MediaItem | null>(null);
  const { data, isLoading, isFetching } = useMediaList(filters);
  const { data: facets } = useMediaFacets();
  const uploader = useUploader();
  const current = active ? data?.items.find((m) => m.id === active.id) ?? active : null;

  return (
    <AdminPage title="Media library" description={`${data?.total ?? '…'} files. Responsive image sizes are generated automatically on upload.`}>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-4">
          {can('media.upload') && (
            <div>
              <Dropzone onFiles={(files) => uploader.upload(files, { folderId: filters.folderId })} disabled={uploader.busy} />
              <UploadQueue queue={uploader.queue} onClear={uploader.clear} />
            </div>
          )}
          <MediaToolbar filters={filters} onChange={setFilters} facets={facets} />
          {isLoading ? <Spinner /> : data?.items.length ? (
            <div className={isFetching ? 'opacity-70 transition-opacity' : undefined}>
              <MediaGrid items={data.items} selected={current ? [current.id] : []} onSelect={(m) => setActive(m)} />
              <Pager page={data.page} totalPages={data.totalPages} onChange={(page) => setFilters({ ...filters, page })} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">No files match these filters.</p>
          )}
        </div>
        <div className="space-y-6">
          <Card title={current ? 'File details' : 'Details'}>
            {current ? <MediaDetails key={current.id} media={current} facets={facets} onDeleted={() => setActive(null)} /> : <p className="text-sm text-slate-500">Select a file to view and edit its details.</p>}
          </Card>
          <FolderManager />
        </div>
      </div>
    </AdminPage>
  );
}
