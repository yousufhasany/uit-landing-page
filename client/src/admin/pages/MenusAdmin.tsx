import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CornerDownRight, EyeOff, Indent, Outdent, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/format';
import { useAction } from '../hooks';
import { FormFields, type FieldDef } from '../SchemaForm';
import { AdminPage, Button, Card, Modal, Notice, Spinner, Tabs, useConfirm } from '../ui';

interface MenuSummary { id: string; key: string; name: string; location: string; _count: { items: number } }
interface Node { id: string; label: string; url: string; rawUrl: string | null; pageId: string | null; description: string | null; target: 'SELF' | 'BLANK'; isVisible: boolean; children: Node[] }
interface Menu { id: string; key: string; name: string; location: string; items: Node[] }

const flatten = (nodes: Node[]) => nodes.flatMap((n) => [{ id: n.id, parentId: null as string | null }, ...n.children.map((c) => ({ id: c.id, parentId: n.id }))]);

export default function MenusAdmin() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: menus, isLoading } = useQuery({ queryKey: ['admin-menus'], queryFn: () => api<MenuSummary[]>('/menus') });
  const [menuId, setMenuId] = useState('');
  useEffect(() => { if (!menuId && menus?.length) setMenuId(menus[0].id); }, [menus, menuId]);
  const key = ['admin-menu', menuId];
  const { data: menu } = useQuery({ queryKey: key, queryFn: () => api<Menu>(`/menus/${menuId}`), enabled: Boolean(menuId) });

  const [editing, setEditing] = useState<Partial<Node> & { parentId?: string | null } | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const done = (m: Menu) => { qc.setQueryData(key, m); qc.invalidateQueries({ queryKey: ['site'] }); qc.invalidateQueries({ queryKey: ['admin-menus'] }); };
  const saveTree = useAction((items: Node[]) => api<Menu>(`/menus/${menuId}/tree`, { method: 'PUT', body: { items: flatten(items) } }), { onSuccess: done });
  const saveItem = useAction(
    () => {
      const { linkType, ...rest } = values;
      const body = { ...rest, url: linkType === 'page' ? null : rest.url || null, pageId: linkType === 'page' ? rest.pageId : null, description: rest.description || null };
      return editing?.id ? api<Menu>(`/menus/${menuId}/items/${editing.id}`, { method: 'PUT', body }) : api<Menu>(`/menus/${menuId}/items`, { method: 'POST', body });
    },
    { success: 'Menu saved', onSuccess: (m) => { done(m); setEditing(null); }, onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}) },
  );
  const removeItem = useAction((id: string) => api<Menu>(`/menus/${menuId}/items/${id}`, { method: 'DELETE' }), { success: 'Item removed', onSuccess: done });

  if (isLoading) return <AdminPage title="Navigation"><Spinner /></AdminPage>;
  const items = menu?.items ?? [];
  const parents = items.map((n) => ({ value: n.id, label: n.label }));

  const fields: FieldDef[] = [
    { key: 'label', label: 'Label', kind: 'text', max: 60, required: true },
    { key: 'parentId', label: 'Position', kind: 'select', options: parents.filter((p) => p.value !== editing?.id), allowEmpty: 'Top level' },
    { key: 'linkType', label: 'Links to', kind: 'select', options: [{ value: 'url', label: 'A URL' }, { value: 'page', label: 'A CMS page' }] },
    { key: 'pageId', label: 'Page', kind: 'relation', endpoint: '/pages/admin?pageSize=100&sort=title&order=asc', labelKey: 'title', when: (v) => v.linkType === 'page' },
    { key: 'url', label: 'URL', kind: 'url', placeholder: '/academics/programs or https://…', hint: 'Top-level items with sub-items can be left without a link.', when: (v) => v.linkType !== 'page' },
    { key: 'description', label: 'Description', kind: 'text', max: 160, hint: 'Shown under the label in dropdown menus.', wide: true },
    { key: 'target', label: 'Open in', kind: 'select', options: [{ value: 'SELF', label: 'Same tab' }, { value: 'BLANK', label: 'New tab' }] },
    { key: 'isVisible', label: 'Visible', kind: 'toggle' },
  ];

  const open = (node: Partial<Node> | null, parentId: string | null = null) => {
    setErrors({});
    setEditing(node ? { ...node, parentId } : { parentId });
    setValues({
      label: node?.label ?? '', parentId, linkType: node?.pageId ? 'page' : 'url', pageId: node?.pageId ?? null, url: node?.rawUrl ?? '',
      description: node?.description ?? '', target: node?.target ?? 'SELF', isVisible: node?.isVisible ?? true,
    });
  };

  const move = (parentIdx: number | null, idx: number, dir: -1 | 1) => {
    const next = structuredClone(items);
    const list = parentIdx === null ? next : next[parentIdx].children;
    [list[idx], list[idx + dir]] = [list[idx + dir], list[idx]];
    saveTree.mutate(next);
  };
  const indent = (idx: number) => {
    const next = structuredClone(items);
    const [node] = next.splice(idx, 1);
    next[idx - 1].children.push(node, ...node.children);
    node.children = [];
    saveTree.mutate(next);
  };
  const outdent = (parentIdx: number, idx: number) => {
    const next = structuredClone(items);
    const [node] = next[parentIdx].children.splice(idx, 1);
    next.splice(parentIdx + 1, 0, node);
    saveTree.mutate(next);
  };

  const Row = ({ node, depth, parentIdx, idx, siblings }: { node: Node; depth: 0 | 1; parentIdx: number | null; idx: number; siblings: number }) => (
    <div className={cn('flex items-center gap-2 py-2 pr-2', depth ? 'pl-8' : 'pl-3', !node.isVisible && 'opacity-60')}>
      {depth === 1 && <CornerDownRight className="size-4 shrink-0 text-slate-300" />}
      <button type="button" onClick={() => open(node, parentIdx === null ? null : items[parentIdx].id)} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">{node.label}{!node.isVisible && <EyeOff className="size-3.5 text-slate-400" aria-label="Hidden" />}</span>
        <span className="block truncate font-mono text-xs text-slate-500">{node.pageId ? `Page: ${node.url}` : node.rawUrl ?? 'No link'}</span>
      </button>
      <span className="flex shrink-0 gap-0.5">
        <Button size="sm" variant="ghost" disabled={idx === 0 || saveTree.isPending} onClick={() => move(parentIdx, idx, -1)} aria-label={`Move ${node.label} up`}><ArrowUp className="size-3.5" /></Button>
        <Button size="sm" variant="ghost" disabled={idx === siblings - 1 || saveTree.isPending} onClick={() => move(parentIdx, idx, 1)} aria-label={`Move ${node.label} down`}><ArrowDown className="size-3.5" /></Button>
        {depth === 0 ? (
          <Button size="sm" variant="ghost" disabled={idx === 0 || saveTree.isPending} onClick={() => indent(idx)} aria-label={`Make ${node.label} a sub-item`} title="Make sub-item of the item above"><Indent className="size-3.5" /></Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={saveTree.isPending} onClick={() => outdent(parentIdx!, idx)} aria-label={`Move ${node.label} to top level`} title="Move to top level"><Outdent className="size-3.5" /></Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => open(node, parentIdx === null ? null : items[parentIdx].id)} aria-label={`Edit ${node.label}`}><Pencil className="size-3.5" /></Button>
        <Button size="sm" variant="danger-ghost" aria-label={`Remove ${node.label}`} onClick={async () => (await confirm({ title: `Remove “${node.label}”?`, message: node.children.length ? 'Its sub-items are removed too.' : undefined, confirmLabel: 'Remove', danger: true })) && removeItem.mutate(node.id)}><Trash2 className="size-3.5" /></Button>
      </span>
    </div>
  );

  return (
    <AdminPage title="Navigation" description="Menus in the website header and footer. Changes are live immediately. Links to unpublished pages are hidden automatically.">
      {menus && menus.length > 1 && <div className="mb-4"><Tabs value={menuId} onChange={setMenuId} items={menus.map((m) => ({ value: m.id, label: m.name }))} /></div>}
      {menu && (
        <Card title={menu.name} description={menu.location === 'HEADER' ? 'Main navigation in the website header' : 'Links in the website footer'} actions={<Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => open(null)}>Add item</Button>} padded={false}>
          {!items.length ? <div className="p-5"><Notice>This menu is empty.</Notice></div> : (
            <ul className="divide-y divide-slate-100">
              {items.map((n, i) => (
                <li key={n.id}>
                  <Row node={n} depth={0} parentIdx={null} idx={i} siblings={items.length} />
                  {n.children.length > 0 && (
                    <ul className="divide-y divide-slate-50 border-t border-slate-50 bg-slate-50/50">
                      {n.children.map((c, j) => <li key={c.id}><Row node={c} depth={1} parentIdx={i} idx={j} siblings={n.children.length} /></li>)}
                    </ul>
                  )}
                  {menu.location === 'HEADER' && <div className="pb-2 pl-8"><Button size="sm" variant="ghost" icon={<Plus className="size-3" />} onClick={() => open(null, n.id)}>Add sub-item</Button></div>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit menu item' : 'Add menu item'}
        footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" loading={saveItem.isPending} onClick={() => saveItem.mutate()}>Save</Button></>}
      >
        <FormFields fields={fields} values={values} onChange={setValues} errors={errors} columns={2} />
      </Modal>
    </AdminPage>
  );
}
