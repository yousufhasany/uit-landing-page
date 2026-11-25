import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError, errorMessage } from '@/lib/api';

interface ActionOptions<TRes, TVars> {
  success?: string | ((res: TRes, vars: TVars) => string);
  invalidate?: QueryKey[];
  onSuccess?: (res: TRes, vars: TVars) => void;
  onError?: (e: unknown) => void;
}

/** Mutation with toasts and cache invalidation; server validation errors are surfaced, never swallowed. */
export function useAction<TVars = void, TRes = unknown>(fn: (vars: TVars) => Promise<TRes>, opts: ActionOptions<TRes, TVars> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (res, vars) => {
      await Promise.all((opts.invalidate ?? []).map((queryKey) => qc.invalidateQueries({ queryKey })));
      if (opts.success) toast.success(typeof opts.success === 'function' ? opts.success(res, vars) : opts.success);
      opts.onSuccess?.(res, vars);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      opts.onError?.(e);
    },
  });
}

/** Maps `{ fields: { "blocks.0.data.text": "…" } }` from the API onto react-hook-form fields. */
export function applyFieldErrors<T extends FieldValues>(e: unknown, setError: UseFormSetError<T>) {
  if (!(e instanceof ApiError)) return;
  for (const [path, message] of Object.entries(e.fields)) setError(path as Path<T>, { type: 'server', message });
}

/** Turns empty strings into null so optional server fields are cleared rather than rejected. */
export function nullifyEmpty<T extends Record<string, unknown>>(values: T): T {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])) as T;
}
