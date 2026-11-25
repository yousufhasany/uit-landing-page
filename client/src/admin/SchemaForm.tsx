import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/format';
import { MediaField } from './media';
import { RichTextEditor } from './RichTextEditor';
import { Button, Field, Input, Select, StringList, Textarea, Toggle, toLocalInput, fromLocalInput } from './ui';

type Option = { value: string; label: string };

export type FieldDef = {
  key: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  /** Spans both columns in two-column layouts. */
  wide?: boolean;
  /** Hides the field unless the predicate passes for the current values. */
  when?: (values: Record<string, any>) => boolean;
} & (
  | { kind: 'text' | 'url'; placeholder?: string; max?: number }
  | { kind: 'textarea'; rows?: number; max?: number }
  | { kind: 'richtext'; minimal?: boolean }
  | { kind: 'number'; min?: number; max?: number; step?: number }
  | { kind: 'toggle'; description?: string }
  | { kind: 'image'; mediaType?: string }
  | { kind: 'select'; options: Option[]; allowEmpty?: string; numeric?: boolean }
  | { kind: 'relation'; endpoint: string; labelKey?: string; allowEmpty?: string; filter?: (item: any, values: Record<string, any>) => boolean }
  | { kind: 'datetime' }
  | { kind: 'strings'; placeholder?: string; max?: number }
  | { kind: 'buttons' }
  | { kind: 'list'; fields: FieldDef[]; max?: number; itemLabel?: string; titleKey?: string }
);

const BUTTON_FIELDS: FieldDef[] = [
  { key: 'label', label: 'Label', kind: 'text', max: 60 },
  { key: 'url', label: 'Link', kind: 'url', placeholder: '/about or https://…' },
  { key: 'style', label: 'Style', kind: 'select', options: [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'link', label: 'Text link' }] },
];

function emptyItem(fields: FieldDef[]) {
  return Object.fromEntries(fields.map((f) => [f.key, f.kind === 'toggle' ? false : f.kind === 'strings' || f.kind === 'list' || f.kind === 'buttons' ? [] : f.kind === 'number' ? 0 : f.kind === 'image' || f.kind === 'relation' ? null : f.kind === 'select' ? (f.numeric ? Number(f.options[0]?.value) : f.options[0]?.value ?? '') : '']));
}

function RelationSelect({ def, value, onChange, values }: { def: Extract<FieldDef, { kind: 'relation' }>; value: string | null; onChange: (v: string | null) => void; values: Record<string, any> }) {
  const { data } = useQuery({
    queryKey: ['relation', def.endpoint],
    queryFn: async () => {
      const res = await api<any>(def.endpoint);
      return (Array.isArray(res) ? res : res.items) as any[];
    },
    staleTime: 30_000,
  });
  const items = (data ?? []).filter((i) => (def.filter ? def.filter(i, values) : true));
  return (
    <Select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">{def.allowEmpty ?? 'Select…'}</option>
      {items.map((i) => <option key={i.id} value={i.id}>{i[def.labelKey ?? 'name'] ?? i.title}</option>)}
    </Select>
  );
}

function ListEditor({ def, value, onChange, errors, path }: { def: Extract<FieldDef, { kind: 'list' }>; value: any[]; onChange: (v: any[]) => void; errors: Record<string, string>; path: string }) {
  const items = value ?? [];
  const move = (i: number, d: number) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-slate-600">{def.itemLabel ?? 'Item'} {i + 1}{def.titleKey && item[def.titleKey] ? `: ${String(item[def.titleKey]).slice(0, 50)}` : ''}</span>
            <span className="flex shrink-0 gap-0.5">
              <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="size-3.5" /></Button>
              <Button size="sm" variant="danger-ghost" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="size-3.5" /></Button>
            </span>
          </div>
          <FormFields fields={def.fields} values={item} onChange={(next) => onChange(items.map((x, j) => (j === i ? next : x)))} errors={errors} path={`${path}.${i}`} />
        </div>
      ))}
      <Button size="sm" icon={<Plus className="size-3.5" />} disabled={def.max !== undefined && items.length >= def.max} onClick={() => onChange([...items, emptyItem(def.fields)])}>
        Add {(def.itemLabel ?? 'item').toLowerCase()}
      </Button>
    </div>
  );
}

function FieldControl({ def, value, set, values, errors, path }: { def: FieldDef; value: any; set: (v: any) => void; values: Record<string, any>; errors: Record<string, string>; path: string }) {
  switch (def.kind) {
    case 'text':
    case 'url':
      return <Input value={value ?? ''} onChange={(e) => set(e.target.value)} placeholder={def.placeholder} maxLength={def.max} aria-invalid={Boolean(errors[path])} />;
    case 'textarea':
      return <Textarea value={value ?? ''} onChange={(e) => set(e.target.value)} rows={def.rows ?? 3} maxLength={def.max} aria-invalid={Boolean(errors[path])} />;
    case 'richtext':
      return <RichTextEditor value={value ?? ''} onChange={set} minimal={def.minimal} />;
    case 'number':
      return <Input type="number" value={value ?? ''} min={def.min} max={def.max} step={def.step ?? 1} onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))} />;
    case 'select':
      return (
        <Select value={value ?? ''} onChange={(e) => set(def.numeric ? Number(e.target.value) : e.target.value || (def.allowEmpty !== undefined ? null : ''))}>
          {def.allowEmpty !== undefined && <option value="">{def.allowEmpty}</option>}
          {def.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      );
    case 'relation':
      return <RelationSelect def={def} value={value ?? null} onChange={set} values={values} />;
    case 'datetime':
      return <Input type="datetime-local" value={toLocalInput(value)} onChange={(e) => set(fromLocalInput(e.target.value))} />;
    case 'strings':
      return <StringList value={value ?? []} onChange={set} placeholder={def.placeholder} max={def.max} />;
    case 'buttons':
      return <ListEditor def={{ ...def, kind: 'list', fields: BUTTON_FIELDS, max: 3, itemLabel: 'Button', titleKey: 'label' }} value={value ?? []} onChange={set} errors={errors} path={path} />;
    case 'list':
      return <ListEditor def={def} value={value ?? []} onChange={set} errors={errors} path={path} />;
    default:
      return null;
  }
}

export function FormFields({ fields, values, onChange, errors = {}, path = '', columns = 1 }: { fields: FieldDef[]; values: Record<string, any>; onChange: (v: Record<string, any>) => void; errors?: Record<string, string>; path?: string; columns?: 1 | 2 }) {
  return (
    <div className={cn('grid gap-4', columns === 2 && 'sm:grid-cols-2')}>
      {fields.filter((f) => !f.when || f.when(values)).map((def) => {
        const p = path ? `${path}.${def.key}` : def.key;
        const set = (v: any) => onChange({ ...values, [def.key]: v });
        const wide = def.wide || ['richtext', 'list', 'buttons', 'strings', 'textarea'].includes(def.kind);
        if (def.kind === 'toggle') {
          return (
            <div key={def.key} className={cn(columns === 2 && wide && 'sm:col-span-2')}>
              <Toggle checked={Boolean(values[def.key])} onChange={set} label={def.label} description={def.description} />
            </div>
          );
        }
        if (def.kind === 'image') {
          return (
            <div key={def.key} className={cn(columns === 2 && def.wide && 'sm:col-span-2')}>
              <MediaField label={def.label} hint={errors[p] ?? def.hint} value={values[def.key]} type={def.mediaType ?? 'IMAGE'} onChange={(id) => set(id)} />
            </div>
          );
        }
        return (
          <Field key={def.key} label={def.label} required={def.required} hint={def.hint} error={errors[p]} className={cn(columns === 2 && wide && 'sm:col-span-2')}>
            <FieldControl def={def} value={values[def.key]} set={set} values={values} errors={errors} path={p} />
          </Field>
        );
      })}
    </div>
  );
}
