import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '../auth';
import { AdminPage, Button, Card, Field, Input } from '../ui';

export const passwordRule = z
  .string()
  .min(10, 'Use at least 10 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number');

const schema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: passwordRule, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function AccountPage() {
  const { user } = useAuth();
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
      toast.success('Password changed');
      reset();
    } catch (e) {
      setError('currentPassword', { message: errorMessage(e) });
    }
  });

  return (
    <AdminPage title="Account" description="Your profile and password.">
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{user?.name}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900">{user?.email}</dd></div>
            <div><dt className="text-slate-500">Roles</dt><dd className="font-medium text-slate-900">{user?.roles.join(', ').replace(/_/g, ' ')}</dd></div>
            <div><dt className="text-slate-500">Permissions</dt><dd className="text-slate-700">{user?.permissions.length} granted</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">Name, email and roles are managed by a Super Admin.</p>
        </Card>
        <Card title="Change password">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Field label="Current password" htmlFor="cur" error={errors.currentPassword?.message}><Input id="cur" type="password" autoComplete="current-password" {...register('currentPassword')} /></Field>
            <Field label="New password" htmlFor="new" error={errors.newPassword?.message} hint="At least 10 characters with upper and lowercase letters and a number."><Input id="new" type="password" autoComplete="new-password" {...register('newPassword')} /></Field>
            <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}><Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} /></Field>
            <Button type="submit" variant="primary" loading={isSubmitting}>Update password</Button>
          </form>
        </Card>
      </div>
    </AdminPage>
  );
}
