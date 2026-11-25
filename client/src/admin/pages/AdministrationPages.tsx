import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { KeyRound, Lock, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Paged } from '@/lib/types';
import { useAuth } from '../auth';
import { useAction } from '../hooks';
import { AdminPage, Button, Card, Empty, Field, Input, Modal, Notice, Pager, relativeTime, Select, Spinner, StatusPill, Textarea, Toggle, useConfirm } from '../ui';
import { passwordRule } from './AccountPage';

interface Role { id: string; key: string; name: string; description: string | null; isSystem: boolean; userCount: number; permissions: string[] }
interface Permission { key: string; description: string; group: string }
interface UserRow { id: string; name: string; email: string; isActive: boolean; lastLoginAt: string | null; createdAt: string; roles: { id: string; key: string; name: string }[] }

const SUPER = 'super_admin';
const useRoles = () => useQuery({ queryKey: ['roles'], queryFn: () => api<Role[]>('/roles') });
const passwordError = (p: string) => { const r = passwordRule.safeParse(p); return r.success ? undefined : r.error.issues[0]?.message; };

// ───────────────────────────── Users ─────────────────────────────

export function UsersPage() {
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const roles = useRoles();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, isLoading } = useQuery({ queryKey: ['users', debounced, page], queryFn: () => api<Paged<UserRow>>('/users', { query: { q: debounced || undefined, page, pageSize: 25 } }), placeholderData: keepPreviousData });

  const [editing, setEditing] = useState<UserRow | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleIds: [] as string[], isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const assignable = (roles.data ?? []).filter((r) => r.key !== SUPER || me?.isSuperAdmin);
  const open = (u: UserRow | 'new') => {
    setErrors({});
    setEditing(u);
    setForm(u === 'new' ? { name: '', email: '', password: '', roleIds: [], isActive: true } : { name: u.name, email: u.email, password: '', roleIds: u.roles.map((r) => r.id), isActive: u.isActive });
  };
  const isNew = editing === 'new';
  const save = useAction(
    () => {
      if (isNew) {
        const pe = passwordError(form.password);
        if (pe) { setErrors({ password: pe }); return Promise.reject(new ApiError(422, 'Choose a stronger password', { password: pe })); }
        return api('/users', { method: 'POST', body: form });
      }
      const { password: _p, ...rest } = form;
      return api(`/users/${(editing as UserRow).id}`, { method: 'PUT', body: rest });
    },
    { success: isNew ? 'User created' : 'User updated', invalidate: [['users'], ['roles']], onSuccess: () => setEditing(null), onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}) },
  );
  const reset = useAction(() => api(`/users/${resetting!.id}/password`, { method: 'POST', body: { password: newPassword } }), {
    success: 'Password reset. The user has been signed out everywhere.', onSuccess: () => { setResetting(null); setNewPassword(''); },
  });
  const remove = useAction((id: string) => api(`/users/${id}`, { method: 'DELETE' }), { success: 'User deleted', invalidate: [['users'], ['roles']] });

  const editingSuper = editing && editing !== 'new' && editing.roles.some((r) => r.key === SUPER);
  const locked = Boolean(editingSuper && !me?.isSuperAdmin);

  return (
    <AdminPage title="Users" description="People who can sign in to the CMS. What each person can do is set by their roles." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => open('new')}>Add user</Button>}>
      <Card padded={false}>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="pl-9" aria-label="Search users" />
          </div>
        </div>
        {isLoading ? <Spinner /> : !data?.items.length ? <div className="p-4"><Empty title="No users found" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Roles</th><th className="hidden px-4 py-2.5 md:table-cell">Last sign-in</th><th className="px-4 py-2.5"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((u) => {
                  const isSuper = u.roles.some((r) => r.key === SUPER);
                  const protectedRow = isSuper && !me?.isSuperAdmin;
                  return (
                    <tr key={u.id} className={u.isActive ? '' : 'bg-slate-50/70 text-slate-500'}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => open(u)} className="text-left font-medium text-slate-900 hover:text-teal-700">{u.name}{u.id === me?.id && <span className="ml-1.5 text-xs font-normal text-slate-500">(you)</span>}</button>
                        <span className="block text-xs text-slate-500">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap gap-1">
                          {u.roles.map((r) => <StatusPill key={r.id} status={r.key === SUPER ? 'PUBLISHED' : 'DRAFT'} label={r.name} />)}
                          {!u.isActive && <StatusPill status="ARCHIVED" label="Deactivated" />}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{u.lastLoginAt ? relativeTime(u.lastLoginAt) : 'Never'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {protectedRow ? <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock className="size-3.5" /> Protected</span> : (
                          <>
                            <Button size="sm" variant="ghost" icon={<KeyRound className="size-3.5" />} onClick={() => { setResetting(u); setNewPassword(''); }}>Reset password</Button>
                            {u.id !== me?.id && (
                              <Button size="sm" variant="danger-ghost" aria-label={`Delete ${u.name}`} onClick={async () => (await confirm({ title: `Delete ${u.name}?`, message: 'Their content stays, but they can no longer sign in. Consider deactivating instead.', confirmLabel: 'Delete user', danger: true })) && remove.mutate(u.id)}>
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <div className="border-t border-slate-100 p-3"><Pager page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add user' : 'Edit user'}
        footer={<><Button onClick={() => setEditing(null)}>Cancel</Button>{!locked && <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>{isNew ? 'Create user' : 'Save'}</Button>}</>}
      >
        {locked && <div className="mb-4"><Notice tone="warning">Only a Super Admin can change a Super Admin account.</Notice></div>}
        <fieldset disabled={locked} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></Field>
            <Field label="Email" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} autoComplete="off" /></Field>
          </div>
          {isNew && (
            <Field label="Temporary password" required error={errors.password} hint="At least 10 characters with upper and lower case letters and a number. Share it securely and ask them to change it.">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
            </Field>
          )}
          <Field label="Roles" required error={errors.roleIds}>
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              {assignable.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input type="checkbox" className="mt-0.5 size-4 rounded border-slate-300 accent-teal-700" checked={form.roleIds.includes(r.id)} onChange={(e) => setForm({ ...form, roleIds: e.target.checked ? [...form.roleIds, r.id] : form.roleIds.filter((x) => x !== r.id) })} />
                  <span><span className="font-medium text-slate-800">{r.name}</span>{r.description && <span className="block text-xs text-slate-500">{r.description}</span>}</span>
                </label>
              ))}
            </div>
          </Field>
          {editing && editing !== 'new' && editing.id !== me?.id && <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Account active" description="Deactivated users cannot sign in and are signed out immediately." />}
        </fieldset>
      </Modal>

      <Modal
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title={`Reset password for ${resetting?.name ?? ''}`}
        size="sm"
        footer={<><Button onClick={() => setResetting(null)}>Cancel</Button><Button variant="danger" disabled={Boolean(passwordError(newPassword))} loading={reset.isPending} onClick={() => reset.mutate()}>Reset password</Button></>}
      >
        <Field label="New password" error={newPassword ? passwordError(newPassword) : undefined} hint="The user is signed out of all devices.">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </Field>
      </Modal>
    </AdminPage>
  );
}

// ───────────────────────────── Roles ─────────────────────────────

export function RolesPage() {
  const { can, user } = useAuth();
  const confirm = useConfirm();
  const roles = useRoles();
  const perms = useQuery({ queryKey: ['permissions'], queryFn: () => api<Permission[]>('/permissions') });
  const canManage = can('roles.manage');
  const [editing, setEditing] = useState<Role | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    const m = new Map<string, Permission[]>();
    for (const p of perms.data ?? []) m.set(p.group, [...(m.get(p.group) ?? []), p]);
    return [...m.entries()];
  }, [perms.data]);
  const held = new Set(user?.permissions ?? []);
  const isNew = editing === 'new';
  const readOnly = !canManage || (editing !== null && editing !== 'new' && editing.key === SUPER);

  const open = (r: Role | 'new') => {
    setErrors({});
    setEditing(r);
    setForm(r === 'new' ? { name: '', description: '', permissions: [] } : { name: r.name, description: r.description ?? '', permissions: r.permissions });
  };
  const save = useAction(() => (isNew ? api('/roles', { method: 'POST', body: form }) : api(`/roles/${(editing as Role).id}`, { method: 'PUT', body: form })), {
    success: isNew ? 'Role created' : 'Role updated', invalidate: [['roles'], ['me']], onSuccess: () => setEditing(null), onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}),
  });
  const remove = useAction((id: string) => api(`/roles/${id}`, { method: 'DELETE' }), { success: 'Role deleted', invalidate: [['roles']], onSuccess: () => setEditing(null) });
  const toggle = (key: string, on: boolean) => setForm((f) => ({ ...f, permissions: on ? [...f.permissions, key] : f.permissions.filter((k) => k !== key) }));

  return (
    <AdminPage title="Roles & permissions" description="Each role is a set of permissions. Permissions are enforced by the server on every request." actions={canManage && <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => open('new')}>New role</Button>}>
      {roles.isLoading ? <Spinner /> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(roles.data ?? []).map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => open(r)} className="flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-teal-400">
                <span className="flex items-center gap-2 font-semibold text-slate-900">{r.key === SUPER && <ShieldCheck className="size-4 text-teal-700" />}{r.name}</span>
                {r.description && <span className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</span>}
                <span className="mt-auto flex gap-3 pt-4 text-xs text-slate-500">
                  <span>{r.key === SUPER ? 'All permissions' : `${r.permissions.length} permissions`}</span>
                  <span>{r.userCount} user{r.userCount === 1 ? '' : 's'}</span>
                  {r.isSystem && <span>Built-in</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="xl"
        title={isNew ? 'New role' : (editing as Role | null)?.name ?? ''}
        footer={
          <>
            {!isNew && editing && !editing.isSystem && canManage && (
              <Button variant="danger-ghost" className="mr-auto" icon={<Trash2 className="size-4" />} onClick={async () => (await confirm({ title: `Delete the ${editing.name} role?`, message: editing.userCount ? 'Reassign its users first.' : undefined, confirmLabel: 'Delete role', danger: true })) && remove.mutate(editing.id)}>Delete</Button>
            )}
            <Button onClick={() => setEditing(null)}>{readOnly ? 'Close' : 'Cancel'}</Button>
            {!readOnly && <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save role</Button>}
          </>
        }
      >
        {editing !== null && editing !== 'new' && editing.key === SUPER && <div className="mb-4"><Notice>The Super Admin role always has every permission and cannot be changed.</Notice></div>}
        <fieldset disabled={readOnly} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></Field>
            <Field label="Description" error={errors.description}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} rows={1} /></Field>
          </div>
          {canManage && !readOnly && !user?.isSuperAdmin && <Notice>You can only grant permissions that you hold yourself.</Notice>}
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map(([group, list]) => (
              <div key={group} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{group}</p>
                <div className="space-y-1.5">
                  {list.map((p) => {
                    const checked = editing !== 'new' && editing?.key === SUPER ? true : form.permissions.includes(p.key);
                    const cannotGrant = !held.has(p.key) && !checked;
                    return (
                      <label key={p.key} className="flex cursor-pointer items-start gap-2.5 text-sm" title={cannotGrant ? 'You do not hold this permission' : undefined}>
                        <input type="checkbox" className="mt-0.5 size-4 rounded border-slate-300 accent-teal-700" checked={checked} disabled={cannotGrant} onChange={(e) => toggle(p.key, e.target.checked)} />
                        <span><span className="text-slate-800">{p.description}</span><span className="block font-mono text-[11px] text-slate-400">{p.key}</span></span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      </Modal>
    </AdminPage>
  );
}

// ───────────────────────────── Activity ─────────────────────────────

interface LogRow { id: string; action: string; entityType: string; entityId: string | null; summary: string; ip: string | null; createdAt: string; user: { id: string; name: string; email: string } | null }

const ENTITY_TYPES = ['page', 'homepage', 'news', 'event', 'media', 'gallery', 'menu', 'faculty', 'department', 'program', 'center', 'research item', 'campus item', 'announcement', 'contact detail', 'social link', 'settings', 'user', 'role', 'auth'];

export function ActivityPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, isLoading } = useQuery({
    queryKey: ['activity', debounced, entityType, page],
    queryFn: () => api<Paged<LogRow>>('/activity-logs', { query: { q: debounced || undefined, entityType: entityType || undefined, page, pageSize: 30 } }),
    placeholderData: keepPreviousData,
  });
  return (
    <AdminPage title="Activity log" description="A record of every change made in the CMS, newest first.">
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity" className="pl-9" aria-label="Search activity" />
          </div>
          <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="w-48" aria-label="Filter by type">
            <option value="">All types</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
        </div>
        {isLoading ? <Spinner /> : !data?.items.length ? <div className="p-4"><Empty title="No activity found" /></div> : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="text-slate-800">{l.summary}</span>
                  <span className="block text-xs text-slate-500">{l.user ? `${l.user.name} (${l.user.email})` : 'System'} · {l.action.toLowerCase().replace(/_/g, ' ')} · {l.entityType}</span>
                </span>
                <time dateTime={l.createdAt} className="shrink-0 text-xs text-slate-500" title={formatDateTime(l.createdAt)}>{relativeTime(l.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
        {data && <div className="border-t border-slate-100 p-3"><Pager page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
      </Card>
    </AdminPage>
  );
}
