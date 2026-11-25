import { Info, Search, X } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ProgramCard } from '@/components/cards';
import { PageBody, PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/ui/Seo';
import { Badge, ButtonLink, EmptyState, RichText, Skeleton, StatusBadge } from '@/components/ui/primitives';
import { ApiError } from '@/lib/api';
import { LEVEL_LABELS, PHASE_LABELS } from '@/lib/format';
import { useDepartments, useFaculties, useProgram, usePrograms } from '@/lib/queries';
import type { Program } from '@/lib/types';
import { PageSkeleton } from './CmsPage';
import NotFound from './NotFound';

const STATUS_NOTE = 'All programs below are proposed under UIT’s Academic Master Plan. None is currently offered or open for admission; details will be confirmed when each program receives approval.';

function StatusNotice({ text = STATUS_NOTE }: { text?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-ember-50 p-4 text-sm leading-relaxed text-ember-700 ring-1 ring-ember-100">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{text}</p>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-800">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border border-stone-line bg-white px-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none">
        <option value="">All</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function ProgramsPage() {
  const [params, setParams] = useSearchParams();
  const filters = { faculty: params.get('faculty') ?? '', level: params.get('level') ?? '', launchPhase: params.get('phase') ?? '', q: params.get('q') ?? '' };
  const { data: faculties } = useFaculties();
  const { data, isLoading, isFetching } = usePrograms({
    faculty: filters.faculty || undefined,
    level: filters.level || undefined,
    launchPhase: filters.launchPhase || undefined,
    q: filters.q || undefined,
  });

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const active = Object.values(filters).some(Boolean);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: Program[] }>();
    for (const p of data?.items ?? []) {
      const g = map.get(p.faculty.id) ?? { name: p.faculty.name, items: [] };
      g.items.push(p);
      map.set(p.faculty.id, g);
    }
    return [...map.values()];
  }, [data]);

  return (
    <>
      <Seo title="Planned academic programs" description="Undergraduate, postgraduate and doctoral programs proposed under the UIT Academic Master Plan." />
      <PageHeader
        eyebrow="Academics"
        title="Planned academic programs"
        summary="Programs proposed across UIT’s six planned schools, in two launch phases."
        crumbs={[{ label: 'Academics', to: '/academics' }, { label: 'Programs' }]}
      />
      <PageBody>
        <StatusNotice />
        <div className="mt-8 grid gap-4 rounded-2xl border border-stone-line bg-white p-5 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] md:items-end">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink-800">Search</span>
            <span className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-700/50" aria-hidden />
              <input
                type="search"
                defaultValue={filters.q}
                onChange={(e) => set('q', e.target.value.trim())}
                placeholder="e.g. Computer Science"
                className="h-11 w-full rounded-xl border border-stone-line bg-white pr-3 pl-9 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none"
              />
            </span>
          </label>
          <Select label="School" value={filters.faculty} onChange={(v) => set('faculty', v)} options={(faculties?.items ?? []).map((f) => ({ value: f.slug, label: f.name }))} />
          <Select label="Level" value={filters.level} onChange={(v) => set('level', v)} options={Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))} />
          <Select label="Launch phase" value={filters.launchPhase} onChange={(v) => set('phase', v)} options={['PHASE_I', 'PHASE_II'].map((v) => ({ value: v, label: PHASE_LABELS[v] }))} />
          <button
            type="button"
            disabled={!active}
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium text-ink-700 hover:bg-sand disabled:opacity-40"
          >
            <X className="size-4" aria-hidden /> Clear
          </button>
        </div>

        <p className="mt-6 text-sm text-ink-700/70" aria-live="polite">
          {isLoading ? 'Loading programs…' : `${data?.total ?? 0} program${data?.total === 1 ? '' : 's'}${isFetching ? ' · updating' : ''}`}
        </p>

        {isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : grouped.length === 0 ? (
          <div className="mt-6"><EmptyState title="No programs match these filters" text="Try a different school, level or phase." /></div>
        ) : (
          <div className="mt-6 space-y-14">
            {grouped.map((g) => (
              <section key={g.name} aria-labelledby={`g-${g.name}`}>
                <h2 id={`g-${g.name}`} className="flex items-baseline gap-3 text-2xl">
                  {g.name} <span className="text-sm font-sans text-ink-700/60">{g.items.length}</span>
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((p) => <li key={p.id}><ProgramCard program={p} /></li>)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}

export function ProgramDetailPage() {
  const { slug = '' } = useParams();
  const { data: p, isLoading, error } = useProgram(slug);
  if (isLoading) return <PageSkeleton />;
  if ((error instanceof ApiError && error.status === 404) || (!p && !isLoading)) return <NotFound />;
  if (!p) return null;

  const facts = [
    { label: 'Status', value: <StatusBadge status={p.programStatus} label={p.statusLabel} /> },
    { label: 'Level', value: LEVEL_LABELS[p.level] ?? p.level },
    { label: 'School', value: p.faculty.name },
    p.department && { label: 'Department', value: p.department.name },
    p.launchPhase && { label: 'Planned launch', value: PHASE_LABELS[p.launchPhase] },
    p.duration && { label: 'Duration', value: p.duration },
    p.credits && { label: 'Credits', value: String(p.credits) },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  return (
    <>
      <Seo title={p.seoTitle || p.name} description={p.seoDescription || p.description || `${p.name}, a program proposed at the University of Integrated Thought.`} />
      <PageHeader
        eyebrow={p.faculty.name}
        title={p.name}
        summary={p.description}
        crumbs={[{ label: 'Academics', to: '/academics' }, { label: 'Programs', to: '/academics/programs' }, { label: p.name }]}
      />
      <PageBody className="grid gap-12 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          {!p.isOffered && <StatusNotice text={`This program is ${p.statusLabel.toLowerCase()} and not yet offered. Curriculum, duration and admission requirements will be published once the program is approved.`} />}
          {p.overview && <section><h2 className="text-2xl">Overview</h2><RichText html={p.overview} className="mt-4" /></section>}
          {p.curriculum && <section><h2 className="text-2xl">Curriculum</h2><RichText html={p.curriculum} className="mt-4" /></section>}
          {p.admissionInfo && <section><h2 className="text-2xl">Admission</h2><RichText html={p.admissionInfo} className="mt-4" /></section>}
          {!p.overview && !p.curriculum && (
            <p className="text-ink-700/75">
              Detailed program information has not been published yet. See the <Link to="/about/philosophy" className="text-teal-700 underline underline-offset-4">UIT education model</Link> for the integrated curriculum every program will follow.
            </p>
          )}
        </div>
        <aside className="lg:col-span-4">
          <dl className="divide-y divide-stone-line rounded-2xl border border-stone-line bg-white">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start justify-between gap-4 px-5 py-4 text-sm">
                <dt className="text-ink-700/65">{f.label}</dt>
                <dd className="text-right font-medium text-ink-900">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-col gap-3">
            <ButtonLink to={`/academics/programs?faculty=${p.faculty.slug}`} style="secondary" className="justify-center">More from this school</ButtonLink>
            <ButtonLink to="/admissions" style="link" className="justify-center">Admissions status</ButtonLink>
          </div>
        </aside>
      </PageBody>
    </>
  );
}

export function FacultiesPage() {
  const { data, isLoading } = useFaculties();
  return (
    <>
      <Seo title="Planned schools" description="The six schools planned under UIT’s Academic Master Plan." />
      <PageHeader eyebrow="Academics" title="Planned schools" summary="UIT’s Academic Master Plan organizes teaching and research into six schools." crumbs={[{ label: 'Academics', to: '/academics' }, { label: 'Schools' }]} />
      <PageBody>
        <StatusNotice text="These schools are planned under the Academic Master Plan and are not yet operational." />
        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>
        ) : (
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {(data?.items ?? []).map((f) => (
              <li key={f.id} className="flex flex-col rounded-3xl border border-stone-line bg-white p-7">
                <div className="flex items-center justify-between text-xs text-ink-700/60">
                  <Badge className="bg-teal-50! font-semibold text-teal-800!">{f.shortName}</Badge>
                  <span>{f.programCount} proposed programs</span>
                </div>
                <h2 className="mt-5 text-2xl">{f.name}</h2>
                {f.description && <p className="mt-3 leading-relaxed text-ink-700/80">{f.description}</p>}
                <h3 className="mt-6 text-xs font-semibold tracking-[0.16em] text-ink-700/60 uppercase">Planned departments</h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {f.departments.map((d) => <li key={d.id}>{d.name}</li>)}
                </ul>
                <ButtonLink to={`/academics/programs?faculty=${f.slug}`} style="link" className="mt-6 self-start">View programs</ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}

export function DepartmentsPage() {
  const { data, isLoading } = useDepartments();
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; items: NonNullable<typeof data>['items'] }>();
    for (const d of data?.items ?? []) {
      const g = map.get(d.faculty.id) ?? { name: d.faculty.name, items: [] };
      g.items.push(d);
      map.set(d.faculty.id, g);
    }
    return [...map.values()];
  }, [data]);

  return (
    <>
      <Seo title="Planned departments" description="Departments planned within UIT’s six schools." />
      <PageHeader eyebrow="Academics" title="Planned departments" summary="Departments planned within each of UIT’s schools." crumbs={[{ label: 'Academics', to: '/academics' }, { label: 'Departments' }]} />
      <PageBody>
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            {groups.map((g) => (
              <section key={g.name}>
                <h2 className="text-2xl">{g.name}</h2>
                <ul className="mt-4 divide-y divide-stone-line rounded-2xl border border-stone-line bg-white">
                  {g.items.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <span>{d.name}</span>
                      {d._count && <span className="text-xs text-ink-700/60">{d._count.programs} programs</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
