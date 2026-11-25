import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { api, ApiError } from '@/lib/api';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

interface AuthValue {
  user: SessionUser | null;
  loading: boolean;
  can: (...perms: string[]) => boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api<{ user: SessionUser }>('/auth/me')).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // The access token may simply have expired; try the refresh cookie once.
          const refreshed = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then((r) => r.ok).catch(() => false);
          if (refreshed) return (await api<{ user: SessionUser }>('/auth/me')).user;
          return null;
        }
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const user = data ?? null;
  const can = useCallback((...perms: string[]) => Boolean(user && perms.some((p) => user.permissions.includes(p))), [user]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: SessionUser }>('/auth/login', { method: 'POST', body: { email, password } });
    qc.setQueryData(['me'], res.user);
    return res.user;
  }, [qc]);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    qc.setQueryData(['me'], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' && q.queryKey[0] !== 'site' });
  }, [qc]);

  const value = useMemo(() => ({ user, loading: isLoading, can, login, logout }), [user, isLoading, can, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Client-side guard for UX only; every endpoint enforces the same permission on the server. */
export function RequireAuth({ children, permission }: { children: ReactNode; permission?: string | string[] }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">Checking your session…</div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  const perms = permission ? (Array.isArray(permission) ? permission : [permission]) : [];
  if (perms.length && !can(...perms)) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="text-lg font-semibold text-slate-900">You don’t have access to this module</p>
        <p className="mt-2 text-sm text-slate-500">Ask a Super Admin to grant the required permission to your role.</p>
      </div>
    );
  }
  return <>{children}</>;
}
