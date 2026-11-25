import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAction } from '../hooks';
import { FormFields, type FieldDef } from '../SchemaForm';
import { AdminPage, Button, Card, Spinner } from '../ui';

const GROUPS: { key: string; title: string; description: string; fields: FieldDef[] }[] = [
  {
    key: 'site.identity',
    title: 'University identity',
    description: 'Name and logos used across the website.',
    fields: [
      { key: 'name', label: 'Full name', kind: 'text', max: 120, required: true, wide: true },
      { key: 'shortName', label: 'Short name', kind: 'text', max: 20, required: true },
      { key: 'tagline', label: 'Tagline', kind: 'text', max: 200 },
      { key: 'description', label: 'Short description', kind: 'textarea', rows: 3, max: 600 },
      { key: 'statusNote', label: 'Status note', kind: 'textarea', rows: 2, max: 400, hint: 'An official statement about the university’s approval status, if needed.' },
      { key: 'logoId', label: 'Logo', kind: 'image' },
      { key: 'logoOnDarkId', label: 'Logo for dark backgrounds', kind: 'image' },
    ],
  },
  {
    key: 'site.header',
    title: 'Header',
    description: 'The call-to-action button and search in the top navigation.',
    fields: [
      { key: 'ctaLabel', label: 'Button label', kind: 'text', max: 40, hint: 'Leave empty to hide the button.' },
      { key: 'ctaUrl', label: 'Button link', kind: 'url' },
      { key: 'showSearch', label: 'Show site search', kind: 'toggle' },
    ],
  },
  {
    key: 'site.footer',
    title: 'Footer',
    description: 'Text in the website footer. Links are managed under Navigation, contacts under Contact details.',
    fields: [
      { key: 'description', label: 'Footer text', kind: 'textarea', rows: 3, max: 600 },
      { key: 'copyright', label: 'Copyright line', kind: 'text', max: 200, hint: 'Shown after “© current year”.' },
      { key: 'note', label: 'Small print', kind: 'text', max: 400 },
    ],
  },
  {
    key: 'site.seo',
    title: 'Search engines & sharing',
    description: 'Defaults for page titles, descriptions and social sharing previews.',
    fields: [
      { key: 'titleTemplate', label: 'Title template', kind: 'text', max: 80, hint: '%s is replaced with the page title.' },
      { key: 'defaultTitle', label: 'Homepage title', kind: 'text', max: 80 },
      { key: 'defaultDescription', label: 'Default description', kind: 'textarea', rows: 2, max: 170 },
      { key: 'siteUrl', label: 'Public website address', kind: 'url', placeholder: 'https://…', hint: 'Used for the sitemap and sharing links.' },
      { key: 'ogImageId', label: 'Default sharing image', kind: 'image', hint: '1200 × 630 px works best.' },
    ],
  },
];

function SettingsGroup({ group, initial }: { group: (typeof GROUPS)[number]; initial: Record<string, any> }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setValues(initial), [initial]);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const save = useAction(() => api(`/settings/${group.key}`, { method: 'PUT', body: values }), {
    success: `${group.title} saved`,
    invalidate: [['settings'], ['site']],
    onSuccess: () => setErrors({}),
    onError: (e) => setErrors(e instanceof ApiError ? e.fields : {}),
  });
  return (
    <Card title={group.title} description={group.description}>
      <FormFields fields={group.fields} values={values} onChange={setValues} errors={errors} columns={2} />
      <div className="mt-5 flex justify-end gap-2">
        {dirty && <Button onClick={() => setValues(initial)}>Reset</Button>}
        <Button variant="primary" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => api<Record<string, Record<string, any>>>('/settings') });
  return (
    <AdminPage title="Site settings" description="Website-wide content settings. Security settings and secrets are configured on the server, not here.">
      {isLoading || !data ? <Spinner /> : <div className="space-y-6">{GROUPS.map((g) => <SettingsGroup key={g.key} group={g} initial={data[g.key] ?? {}} />)}</div>}
    </AdminPage>
  );
}
