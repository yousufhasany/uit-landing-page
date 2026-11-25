import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { Seo } from '@/components/ui/Seo';
import { errorMessage } from '@/lib/api';
import { useAuth } from '../auth';
import { Button, Field, Input } from '../ui';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (!loading && user) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <div className="admin-root flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Seo title="Sign in" noindex />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/uit-logo.png" alt="University of Integrated Thought" className="h-16 w-auto" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Sign in to the UIT CMS</h1>
          <p className="mt-1 text-sm text-slate-500">For authorized university staff only.</p>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="username" aria-invalid={Boolean(errors.email)} {...register('email')} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
          </Field>
          <Button type="submit" variant="primary" className="w-full" loading={isSubmitting} icon={<Lock className="size-4" />}>Sign in</Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500"><a href="/" className="hover:text-slate-800">← Back to the website</a></p>
      </div>
    </div>
  );
}
